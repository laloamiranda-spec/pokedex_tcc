/**
 * Migración única: asigna user_id a todos los registros sin dueño en Supabase
 *
 * REQUISITOS:
 *  - Node.js 18+ (fetch nativo)
 *
 * CÓMO OBTENER LAS CREDENCIALES:
 *  - SUPABASE_URL  → Dashboard de tu proyecto → Settings → API → Project URL
 *  - SERVICE_KEY   → Dashboard → Settings → API → service_role key  (¡mantener privada!)
 *  - USER_EMAIL    → el correo del usuario al que se asignarán los registros
 *  - USER_PASSWORD → su contraseña (solo para obtener el user_id vía login)
 *
 * EJECUCIÓN:
 *  node scripts/assign-user-to-records.mjs
 */

// ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';   // ← cambia esto
const SERVICE_KEY   = 'eyJhbGc...TU_SERVICE_ROLE_KEY';     // ← cambia esto
const USER_EMAIL    = 'lalo.amiranda@gmail.com';
const USER_PASSWORD = 'TU_CONTRASEÑA';                     // ← cambia esto

const TABLAS = [
  'rpd_records',
  'vh_records',
  'rx_records',
  'expo_records',
  'ec_records',
];
// ─────────────────────────────────────────────────────────────────────────────

const headers = {
  'Content-Type': 'application/json',
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

async function obtenerUserId() {
  console.log(`🔐 Iniciando sesión como ${USER_EMAIL}...`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY },
    body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login fallido: ${data.error_description || data.msg || JSON.stringify(data)}`);
  }
  console.log(`✅ Login exitoso. user_id: ${data.user.id}`);
  return data.user.id;
}

async function contarSinUsuario(tabla) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${tabla}?user_id=is.null&select=id`,
    { headers: { ...headers, 'Prefer': 'count=exact' } }
  );
  const count = res.headers.get('content-range')?.split('/')[1] ?? '?';
  return count;
}

async function asignarUsuario(tabla, userId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${tabla}?user_id=is.null`,
    {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id: userId }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error actualizando ${tabla}: ${err}`);
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Migración: asignar user_id a registros Supabase');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const userId = await obtenerUserId();
  console.log('');
  console.log('📊 Registros sin usuario (user_id IS NULL):');

  for (const tabla of TABLAS) {
    const count = await contarSinUsuario(tabla);
    console.log(`   ${tabla}: ${count} registros`);
  }

  console.log('');
  console.log('🔄 Asignando user_id...');

  for (const tabla of TABLAS) {
    await asignarUsuario(tabla, userId);
    console.log(`   ✅ ${tabla}`);
  }

  console.log('');
  console.log('🎉 Listo. Todos los registros ahora están asociados a:');
  console.log(`   ${USER_EMAIL} (${userId})`);
  console.log('');
}

main().catch(err => {
  console.error('');
  console.error('❌ Error:', err.message);
  process.exit(1);
});

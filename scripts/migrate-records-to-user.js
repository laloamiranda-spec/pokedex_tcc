/**
 * Script de migración única — ejecutar en la consola del navegador
 *
 * INSTRUCCIONES:
 *  1. Abre la app en el navegador
 *  2. Inicia sesión con lalo.amiranda@gmail.com
 *  3. Abre DevTools (F12) → pestaña "Console"
 *  4. Pega todo este script y presiona Enter
 *
 * Qué hace:
 *  - Lee los registros guardados bajo las claves globales (sin usuario)
 *  - Los copia a las claves con el ID del usuario autenticado
 *  - No borra los originales (los puedes limpiar manualmente después)
 */
(function migrarRegistros() {
  const CLAVES = [
    'rpd_records',
    'vh_records',
    'rx_records',
    'expo_records',
    'ec_records',
  ];

  // 1. Leer sesión activa
  const rawUser = localStorage.getItem('auth_user');
  if (!rawUser) {
    console.error('❌ No hay sesión activa. Inicia sesión primero.');
    return;
  }

  let user;
  try { user = JSON.parse(rawUser); }
  catch { console.error('❌ auth_user corrupto en localStorage.'); return; }

  console.log(`👤 Usuario: ${user.email}`);
  console.log(`🔑 ID: ${user.id}`);
  console.log('─────────────────────────────────────────');

  let totalMigrados = 0;

  CLAVES.forEach(clave => {
    const raw = localStorage.getItem(clave);

    if (!raw) {
      console.log(`⬜ ${clave}: sin registros`);
      return;
    }

    let registros;
    try { registros = JSON.parse(raw); }
    catch { console.warn(`⚠️  ${clave}: JSON inválido, omitiendo`); return; }

    if (!Array.isArray(registros) || registros.length === 0) {
      console.log(`⬜ ${clave}: vacío`);
      return;
    }

    const claveUsuario = `${clave}_${user.id}`;
    const yaExiste = localStorage.getItem(claveUsuario);

    if (yaExiste) {
      const existentes = JSON.parse(yaExiste);
      if (existentes.length > 0) {
        console.warn(`⚠️  ${claveUsuario}: ya tiene ${existentes.length} registros, omitiendo para no sobreescribir`);
        return;
      }
    }

    localStorage.setItem(claveUsuario, raw);
    totalMigrados += registros.length;
    console.log(`✅ ${clave}: ${registros.length} registros → ${claveUsuario}`);
  });

  console.log('─────────────────────────────────────────');
  console.log(`🎉 Migración completada: ${totalMigrados} registros en total.`);
  console.log('');
  console.log('Recarga la página para que la app cargue los datos con el nuevo usuario.');
  console.log('');
  console.log('Cuando confirmes que todo está bien, puedes limpiar las claves globales con:');
  CLAVES.forEach(c => console.log(`  localStorage.removeItem('${c}')`));
})();

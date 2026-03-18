import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { StorageService } from './storage';

export interface AuthUser { id: string; email: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AuthUser | null>(null);
  loading = signal(false);

  constructor(private sb: SupabaseService, private storage: StorageService) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem('auth_token');
    const raw   = localStorage.getItem('auth_user');
    if (!token || !raw) return;
    try {
      const user: AuthUser = JSON.parse(raw);
      this.currentUser.set(user);
      this.sb.setUserContext(token, user.id);
      this.storage.loadForUser(user.id);
    } catch {
      this.clearSession();
    }
  }

  private saveSession(token: string, user: AuthUser): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.currentUser.set(user);
    this.sb.setUserContext(token, user.id);
    this.storage.loadForUser(user.id);
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.sb.setUserContext(null, null);
    this.storage.clearAll();
  }

  get isLoggedIn(): boolean { return !!this.currentUser(); }

  async register(email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> {
    if (!this.sb.configured) return { error: 'Supabase no configurado', needsConfirmation: false };
    this.loading.set(true);
    try {
      const res = await fetch(`${this.sb.currentUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': this.sb.currentKey },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.msg || data.error_description || 'Error al registrarse', needsConfirmation: false };
      if (data.access_token) {
        this.saveSession(data.access_token, { id: data.user.id, email: data.user.email });
        return { error: null, needsConfirmation: false };
      }
      return { error: null, needsConfirmation: true };
    } catch { return { error: 'Error de conexión', needsConfirmation: false }; }
    finally { this.loading.set(false); }
  }

  async login(email: string, password: string): Promise<string | null> {
    if (!this.sb.configured) return 'Supabase no configurado';
    this.loading.set(true);
    try {
      const res = await fetch(`${this.sb.currentUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': this.sb.currentKey },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return data.error_description || data.msg || 'Credenciales incorrectas';
      this.saveSession(data.access_token, { id: data.user.id, email: data.user.email });
      return null;
    } catch { return 'Error de conexión'; }
    finally { this.loading.set(false); }
  }

  async forgotPassword(email: string): Promise<string | null> {
    if (!this.sb.configured) return 'Supabase no configurado';
    this.loading.set(true);
    try {
      const res = await fetch(`${this.sb.currentUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': this.sb.currentKey },
        body: JSON.stringify({ email })
      });
      if (!res.ok) { const d = await res.json(); return d.msg || 'Error al enviar correo'; }
      return null;
    } catch { return 'Error de conexión'; }
    finally { this.loading.set(false); }
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token && this.sb.configured) {
      try {
        await fetch(`${this.sb.currentUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: { 'apikey': this.sb.currentKey, 'Authorization': `Bearer ${token}` }
        });
      } catch {}
    }
    this.clearSession();
  }
}

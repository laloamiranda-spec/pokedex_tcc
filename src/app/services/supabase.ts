import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export type SbStatus = 'ok' | 'err' | 'idle';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  status = signal<SbStatus>('idle');
  private url = '';
  private key = '';
  private userToken: string | null = null;
  private userId:   string | null = null;

  constructor() { this.loadCreds(); }

  private loadCreds(): void {
    this.url = environment.supabase.url || localStorage.getItem('sb_url') || '';
    this.key = environment.supabase.anonKey || localStorage.getItem('sb_key') || '';
    this.status.set(this.url && this.key ? 'ok' : 'idle');
  }

  saveCreds(url: string, key: string): void {
    this.url = url.replace(/\/$/, '');
    this.key = key;
    localStorage.setItem('sb_url', this.url);
    localStorage.setItem('sb_key', this.key);
    this.status.set(this.url && this.key ? 'ok' : 'idle');
  }

  /** Llamado por AuthService tras login/logout */
  setUserContext(token: string | null, userId: string | null): void {
    this.userToken = token;
    this.userId    = userId;
  }

  get configured(): boolean { return !!(this.url && this.key); }
  get currentUrl(): string  { return this.url; }
  get currentKey(): string  { return this.key; }
  get fromEnvironment(): boolean {
    return !!(environment.supabase.url && environment.supabase.anonKey);
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.userToken || this.key}`,
      'Prefer': 'return=minimal'
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      const res = await fetch(`${this.url}/rest/v1/rpd_records?limit=1`,
        { headers: { 'apikey': this.key, 'Authorization': `Bearer ${this.userToken || this.key}` } });
      this.status.set(res.ok ? 'ok' : 'err');
      return res.ok;
    } catch { this.status.set('err'); return false; }
  }

  async insert(table: string, data: object): Promise<void> {
    if (!this.configured) return;
    // Agrega user_id automáticamente cuando hay sesión activa
    const payload = this.userId ? { ...data, user_id: this.userId } : data;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}`,
        { method: 'POST', headers: this.headers(), body: JSON.stringify(payload) });
      this.status.set(res.ok ? 'ok' : 'err');
    } catch { this.status.set('err'); }
  }

  async fetchAll(table: string): Promise<any[] | null> {
    if (!this.configured) return null;
    // Filtra por user_id cuando hay sesión activa (requiere RLS o columna user_id)
    const filter = this.userId
      ? `?user_id=eq.${this.userId}&order=id.desc&limit=500`
      : '?order=id.desc&limit=500';
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}${filter}`,
        { headers: { 'apikey': this.key, 'Authorization': `Bearer ${this.userToken || this.key}` } });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }
}

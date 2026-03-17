import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export type SbStatus = 'ok' | 'err' | 'idle';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  status = signal<SbStatus>('idle');
  private url = '';
  private key = '';

  constructor() { this.loadCreds(); }

  private loadCreds(): void {
    // Prioridad: environment → localStorage (configuración manual)
    this.url = environment.supabase.url
      || localStorage.getItem('sb_url')
      || '';
    this.key = environment.supabase.anonKey
      || localStorage.getItem('sb_key')
      || '';
    this.status.set(this.url && this.key ? 'ok' : 'idle');
  }

  saveCreds(url: string, key: string): void {
    this.url = url.replace(/\/$/, '');
    this.key = key;
    localStorage.setItem('sb_url', this.url);
    localStorage.setItem('sb_key', this.key);
    this.status.set(this.url && this.key ? 'ok' : 'idle');
  }

  get configured(): boolean { return !!(this.url && this.key); }
  get currentUrl(): string { return this.url; }
  get currentKey(): string { return this.key; }
  /** True si las credenciales vienen del environment (no editables en UI) */
  get fromEnvironment(): boolean {
    return !!(environment.supabase.url && environment.supabase.anonKey);
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Prefer': 'return=minimal'
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      const res = await fetch(`${this.url}/rest/v1/rpd_records?limit=1`,
        { headers: { 'apikey': this.key, 'Authorization': `Bearer ${this.key}` } });
      const ok = res.ok;
      this.status.set(ok ? 'ok' : 'err');
      return ok;
    } catch {
      this.status.set('err');
      return false;
    }
  }

  async insert(table: string, data: object): Promise<void> {
    if (!this.configured) return;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}`,
        { method: 'POST', headers: this.headers(), body: JSON.stringify(data) });
      this.status.set(res.ok ? 'ok' : 'err');
    } catch { this.status.set('err'); }
  }

  async fetchAll(table: string): Promise<any[] | null> {
    if (!this.configured) return null;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}?order=id.desc&limit=500`,
        { headers: { 'apikey': this.key, 'Authorization': `Bearer ${this.key}` } });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }
}

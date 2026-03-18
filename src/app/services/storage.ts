import { Injectable, signal } from '@angular/core';
import { RpdRecord, VhRecord, ExpoRecord, EcRecord, RxRecord } from '../models/records';

const RPD_KEY  = 'rpd_records';
const VH_KEY   = 'vh_records';
const RX_KEY   = 'rx_records';
const EXPO_KEY = 'expo_records';
const EC_KEY   = 'ec_records';

@Injectable({ providedIn: 'root' })
export class StorageService {
  rpd  = signal<RpdRecord[]>([]);
  vh   = signal<VhRecord[]>([]);
  rx   = signal<RxRecord[]>([]);
  expo = signal<ExpoRecord[]>([]);
  ec   = signal<EcRecord[]>([]);

  private uid: string | null = null;

  // No carga en constructor — espera a que AuthService restaure sesión
  constructor() {}

  private key(base: string): string {
    return this.uid ? `${base}_${this.uid}` : base;
  }

  private load<T>(base: string): T[] {
    try {
      const raw = localStorage.getItem(this.key(base));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private save<T>(base: string, data: T[]): void {
    localStorage.setItem(this.key(base), JSON.stringify(data));
  }

  /** Carga los datos del usuario autenticado */
  loadForUser(userId: string): void {
    this.uid = userId;
    this.rpd.set(this.load<RpdRecord>(RPD_KEY));
    this.vh.set(this.load<VhRecord>(VH_KEY));
    this.rx.set(this.load<RxRecord>(RX_KEY));
    this.expo.set(this.load<ExpoRecord>(EXPO_KEY));
    this.ec.set(this.load<EcRecord>(EC_KEY));
  }

  /** Limpia signals al cerrar sesión */
  clearAll(): void {
    this.uid = null;
    this.rpd.set([]);
    this.vh.set([]);
    this.rx.set([]);
    this.expo.set([]);
    this.ec.set([]);
  }

  addRpd(r: RpdRecord):   void { const a = [r, ...this.rpd()];  this.rpd.set(a);  this.save(RPD_KEY,  a); }
  addVh(r: VhRecord):     void { const a = [r, ...this.vh()];   this.vh.set(a);   this.save(VH_KEY,   a); }
  addExpo(r: ExpoRecord): void { const a = [r, ...this.expo()]; this.expo.set(a); this.save(EXPO_KEY, a); }
  addEc(r: EcRecord):     void { const a = [r, ...this.ec()];   this.ec.set(a);   this.save(EC_KEY,   a); }
  addRx(r: RxRecord):     void { const a = [r, ...this.rx()];   this.rx.set(a);   this.save(RX_KEY,   a); }

  updateExpo(r: ExpoRecord): void {
    const a = this.expo().map(e => e.id === r.id ? r : e);
    this.expo.set(a); this.save(EXPO_KEY, a);
  }

  deleteRecord(type: 'rpd' | 'vh' | 'expo' | 'ec' | 'rx', id: number): void {
    switch (type) {
      case 'rpd':  { const a = this.rpd().filter(r => r.id !== id);  this.rpd.set(a);  this.save(RPD_KEY,  a); break; }
      case 'vh':   { const a = this.vh().filter(r => r.id !== id);   this.vh.set(a);   this.save(VH_KEY,   a); break; }
      case 'expo': { const a = this.expo().filter(r => r.id !== id); this.expo.set(a); this.save(EXPO_KEY, a); break; }
      case 'ec':   { const a = this.ec().filter(r => r.id !== id);   this.ec.set(a);   this.save(EC_KEY,   a); break; }
      case 'rx':   { const a = this.rx().filter(r => r.id !== id);   this.rx.set(a);   this.save(RX_KEY,   a); break; }
    }
  }

  importFromSupabase(data: { rpds?: any[]; vhs?: any[]; expos?: any[]; ecs?: any[]; rxs?: any[] }): void {
    if (data.rpds)  { this.rpd.set(data.rpds);   this.save(RPD_KEY,  data.rpds); }
    if (data.vhs)   { this.vh.set(data.vhs);      this.save(VH_KEY,   data.vhs); }
    if (data.expos) { this.expo.set(data.expos);  this.save(EXPO_KEY, data.expos); }
    if (data.ecs)   { this.ec.set(data.ecs);      this.save(EC_KEY,   data.ecs); }
    if (data.rxs)   { this.rx.set(data.rxs);      this.save(RX_KEY,   data.rxs); }
  }
}

import { Injectable, signal } from '@angular/core';
import { RpdRecord, VhRecord, ExpoRecord, EcRecord, RxRecord } from '../models/records';

const RPD_KEY = 'rpd_records';
const VH_KEY = 'vh_records';
const RX_KEY = 'rx_records';
const EXPO_KEY = 'expo_records';
const EC_KEY = 'ec_records';

@Injectable({ providedIn: 'root' })
export class StorageService {
  rpd = signal<RpdRecord[]>([]);
  vh = signal<VhRecord[]>([]);
  rx = signal<RxRecord[]>([]);
  expo = signal<ExpoRecord[]>([]);
  ec = signal<EcRecord[]>([]);

  constructor() { this.loadAll(); }

  private load<T>(key: string): T[] {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }

  private save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadAll(): void {
    this.rpd.set(this.load<RpdRecord>(RPD_KEY));
    this.vh.set(this.load<VhRecord>(VH_KEY));
    this.rx.set(this.load<RxRecord>(RX_KEY));
    this.expo.set(this.load<ExpoRecord>(EXPO_KEY));
    this.ec.set(this.load<EcRecord>(EC_KEY));
  }

  addRpd(record: RpdRecord): void { const a=[record,...this.rpd()]; this.rpd.set(a); this.save(RPD_KEY,a); }
  addVh(record: VhRecord): void { const a=[record,...this.vh()]; this.vh.set(a); this.save(VH_KEY,a); }
  addExpo(record: ExpoRecord): void { const a=[record,...this.expo()]; this.expo.set(a); this.save(EXPO_KEY,a); }
  updateExpo(record: ExpoRecord): void { const a=this.expo().map(r=>r.id===record.id?record:r); this.expo.set(a); this.save(EXPO_KEY,a); }
  addEc(record: EcRecord): void { const a=[record,...this.ec()]; this.ec.set(a); this.save(EC_KEY,a); }
  addRx(record: RxRecord): void { const a=[record,...this.rx()]; this.rx.set(a); this.save(RX_KEY,a); }

  deleteRecord(type: 'rpd'|'vh'|'expo'|'ec'|'rx', id: number): void {
    if(type==='rpd'){const a=this.rpd().filter(r=>r.id!==id);this.rpd.set(a);this.save(RPD_KEY,a);}
    else if(type==='vh'){const a=this.vh().filter(r=>r.id!==id);this.vh.set(a);this.save(VH_KEY,a);}
    else if(type==='expo'){const a=this.expo().filter(r=>r.id!==id);this.expo.set(a);this.save(EXPO_KEY,a);}
    else if(type==='ec'){const a=this.ec().filter(r=>r.id!==id);this.ec.set(a);this.save(EC_KEY,a);}
    else if(type==='rx'){const a=this.rx().filter(r=>r.id!==id);this.rx.set(a);this.save(RX_KEY,a);}
  }

  importFromSupabase(data: {rpds?:any[],vhs?:any[],expos?:any[],ecs?:any[],rxs?:any[]}): void {
    if(data.rpds){this.rpd.set(data.rpds);this.save(RPD_KEY,data.rpds);}
    if(data.vhs){this.vh.set(data.vhs);this.save(VH_KEY,data.vhs);}
    if(data.expos){this.expo.set(data.expos);this.save(EXPO_KEY,data.expos);}
    if(data.ecs){this.ec.set(data.ecs);this.save(EC_KEY,data.ecs);}
    if(data.rxs){this.rx.set(data.rxs);this.save(RX_KEY,data.rxs);}
  }
}

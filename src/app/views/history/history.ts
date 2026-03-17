import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage';
import { RpdRecord, VhRecord, ExpoRecord, EcRecord, RxRecord } from '../../models/records';

type TabId = 'rpd' | 'vh' | 'expo' | 'rx';
type DetailRecord = RpdRecord | VhRecord | ExpoRecord | EcRecord | RxRecord | null;

@Component({
  selector: 'app-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class HistoryComponent {
  activeTab = signal<TabId>('rpd');
  selectedRecord = signal<DetailRecord>(null);

  constructor(public storage: StorageService) {}

  setTab(tab: TabId): void { this.activeTab.set(tab); this.selectedRecord.set(null); }

  select(r: DetailRecord): void { this.selectedRecord.set(r); }
  back(): void { this.selectedRecord.set(null); }

  delete(type: 'rpd'|'vh'|'expo'|'ec'|'rx', id: number): void {
    if (confirm('¿Eliminar este registro?')) {
      this.storage.deleteRecord(type, id);
      this.selectedRecord.set(null);
    }
  }

  formatDate(str: string): string {
    try { return new Date(str).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return str; }
  }

  emotionLabels(r: RpdRecord): string {
    return r.emotions?.map(e => e.name.split(' ').slice(1).join(' ')).join(', ') || '';
  }

  get currentRpd(): RpdRecord[] { return this.storage.rpd(); }
  get currentVh(): VhRecord[] { return this.storage.vh(); }
  get currentExpo(): any[] { return [...this.storage.expo(), ...this.storage.ec()]; }
  get currentRx(): RxRecord[] { return this.storage.rx(); }

  isRpd(r: DetailRecord): r is RpdRecord { return (r as any)?.type === 'rpd'; }
  isVh(r: DetailRecord): r is VhRecord { return (r as any)?.type === 'vh'; }
  isExpo(r: DetailRecord): r is ExpoRecord { return (r as any)?.type === 'expo'; }
  isEc(r: DetailRecord): r is EcRecord { return (r as any)?.type === 'ec'; }
  isRx(r: DetailRecord): r is RxRecord { return (r as any)?.type === 'rx'; }
}

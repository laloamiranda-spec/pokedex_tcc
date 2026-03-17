import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage';
import { SupabaseService } from '../../services/supabase';
import { ExpoRecord, ExpoItem } from '../../models/records';

@Component({
  selector: 'app-expo',
  imports: [CommonModule, FormsModule],
  templateUrl: './expo.html',
  styleUrl: './expo.scss',
})
export class ExpoComponent {
  // Context
  expoName = '';
  fear = '';
  // Items
  items = signal<ExpoItem[]>([]);
  showAddForm = signal(false);
  newItemText = '';
  newItemSuds = signal(0);
  newItemType = 'in-vivo';
  // Attempt modal
  attemptItem = signal<ExpoItem|null>(null);
  attemptSudsAntes = signal(50);
  attemptSudsDespues = signal(30);
  attemptNotes = '';
  saved = signal(false);

  constructor(private storage: StorageService, private sb: SupabaseService) {
    // Load last expo from storage if exists
    const existing = this.storage.expo();
    if (existing.length > 0) {
      const last = existing[0];
      this.expoName = last.name;
      this.fear = last.fear;
      this.items.set(last.items || []);
    }
  }

  toggleAdd(): void { this.showAddForm.update(v => !v); }

  selectSuds(val: number): void { this.newItemSuds.set(val); }

  addItem(): void {
    if (!this.newItemText.trim() || !this.newItemSuds()) return;
    const item: ExpoItem = {
      id: Date.now(),
      text: this.newItemText.trim(),
      suds: this.newItemSuds(),
      type: this.newItemType,
      status: 'pending',
      attempts: []
    };
    const sorted = [...this.items(), item].sort((a,b) => a.suds - b.suds);
    this.items.set(sorted);
    this.newItemText = ''; this.newItemSuds.set(0); this.showAddForm.set(false);
  }

  deleteItem(id: number): void {
    this.items.set(this.items().filter(i => i.id !== id));
  }

  openAttempt(item: ExpoItem): void { this.attemptItem.set(item); }
  closeAttempt(): void { this.attemptItem.set(null); }

  addAttempt(): void {
    const item = this.attemptItem();
    if (!item) return;
    const attempt = {
      date: new Date().toLocaleDateString('es'),
      sudsAntes: this.attemptSudsAntes(),
      sudsDespues: this.attemptSudsDespues(),
      notes: this.attemptNotes
    };
    const updated: ExpoItem = {
      ...item,
      attempts: [...item.attempts, attempt],
      status: this.attemptSudsDespues() <= 30 ? 'done' : 'in-progress'
    };
    this.items.set(this.items().map(i => i.id === item.id ? updated : i));
    this.attemptNotes = '';
    this.closeAttempt();
  }

  async saveExpo(): Promise<void> {
    const existing = this.storage.expo();
    const record: ExpoRecord = {
      id: existing[0]?.id || Date.now(),
      type: 'expo',
      date: new Date().toISOString().split('T')[0],
      name: this.expoName,
      fear: this.fear,
      items: this.items()
    };
    if (existing.length > 0) this.storage.updateExpo(record);
    else this.storage.addExpo(record);
    await this.sb.insert('expo_records', { id: record.id, date: record.date, name: record.name, fear: record.fear, items: record.items });
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  itemClass(item: ExpoItem): string {
    if (item.status === 'done') return 'done';
    if (item.status === 'in-progress') return 'in-progress';
    return '';
  }

  statusBadge(item: ExpoItem): string {
    if (item.status === 'done') return 'lb-done';
    if (item.status === 'in-progress') return 'lb-progress';
    return 'lb-pending';
  }

  statusLabel(item: ExpoItem): string {
    if (item.status === 'done') return '✓ Completado';
    if (item.status === 'in-progress') return '↺ En progreso';
    return 'Pendiente';
  }
}

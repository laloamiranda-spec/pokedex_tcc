import { Component, computed, signal } from '@angular/core';
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
  // ── Modo ──────────────────────────────────────────────────────────────
  mode = signal<'list' | 'edit'>('list');

  // ── Lista ─────────────────────────────────────────────────────────────
  allExpos = computed(() => this.storage.expo());

  // ── Edición ───────────────────────────────────────────────────────────
  editingId = signal<number | null>(null);
  expoName = '';
  fear = '';
  items = signal<ExpoItem[]>([]);

  // Formulario agregar peldaño
  showAddForm = signal(false);
  newItemText = '';
  newItemSuds = signal(0);
  newItemType = 'in-vivo';
  addError = signal('');

  // Modal intento
  attemptItem = signal<ExpoItem | null>(null);
  attemptSudsAntes = signal(50);
  attemptSudsDespues = signal(30);
  attemptNotes = '';

  saved = signal(false);

  readonly sudsOptions = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

  constructor(private storage: StorageService, private sb: SupabaseService) {}

  // ── Navegación ────────────────────────────────────────────────────────
  newHierarchy(): void {
    this.editingId.set(null);
    this.expoName = '';
    this.fear = '';
    this.items.set([]);
    this.resetAddForm();
    this.mode.set('edit');
  }

  editHierarchy(record: ExpoRecord): void {
    this.editingId.set(record.id);
    this.expoName = record.name;
    this.fear = record.fear;
    this.items.set([...(record.items || [])]);
    this.resetAddForm();
    this.mode.set('edit');
  }

  backToList(): void {
    this.mode.set('list');
    this.attemptItem.set(null);
  }

  deleteHierarchy(id: number, event: Event): void {
    event.stopPropagation();
    this.storage.deleteRecord('expo', id);
  }

  // ── Agregar peldaño ───────────────────────────────────────────────────
  toggleAdd(): void {
    this.showAddForm.update(v => !v);
    this.addError.set('');
  }

  selectSuds(val: number): void {
    this.newItemSuds.set(val);
    this.addError.set('');
  }

  addItem(): void {
    if (!this.newItemText.trim()) {
      this.addError.set('Escribe una descripción para el peldaño.');
      return;
    }
    if (!this.newItemSuds()) {
      this.addError.set('Selecciona un nivel SUDS antes de agregar.');
      return;
    }
    const item: ExpoItem = {
      id: Date.now(),
      text: this.newItemText.trim(),
      suds: this.newItemSuds(),
      type: this.newItemType,
      status: 'pending',
      attempts: []
    };
    const sorted = [...this.items(), item].sort((a, b) => b.suds - a.suds);
    this.items.set(sorted);
    this.resetAddForm();
  }

  private resetAddForm(): void {
    this.newItemText = '';
    this.newItemSuds.set(0);
    this.addError.set('');
    this.showAddForm.set(false);
  }

  deleteItem(id: number): void {
    this.items.set(this.items().filter(i => i.id !== id));
  }

  // ── Intentos ──────────────────────────────────────────────────────────
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

  // ── Guardar ───────────────────────────────────────────────────────────
  async saveExpo(): Promise<void> {
    const id = this.editingId() ?? Date.now();
    const record: ExpoRecord = {
      id,
      type: 'expo',
      date: new Date().toISOString().split('T')[0],
      name: this.expoName,
      fear: this.fear,
      items: this.items()
    };
    if (this.editingId() !== null) {
      this.storage.updateExpo(record);
    } else {
      this.storage.addExpo(record);
      this.editingId.set(id);
    }
    await this.sb.insert('expo_records', {
      id: record.id, date: record.date,
      name: record.name, fear: record.fear, items: record.items
    });
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────
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

  progressLabel(record: ExpoRecord): string {
    const done = (record.items || []).filter(i => i.status === 'done').length;
    const total = (record.items || []).length;
    return total > 0 ? `${done}/${total} completados` : 'Sin peldaños';
  }
}

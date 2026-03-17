import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage';
import { SupabaseService } from '../../services/supabase';
import { VhRecord } from '../../models/records';

const VH_EMOTIONS = ['😢 Tristeza','😰 Ansiedad','😡 Enojo','😳 Vergüenza','😔 Culpa','😨 Miedo','😤 Frustración','😞 Decepción','💚 Celos','🫥 Soledad','🌑 Desesperanza','🤢 Asco'];

@Component({
  selector: 'app-verify',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
})
export class VerifyComponent {
  emotions = VH_EMOTIONS;
  openStep = signal(1);
  completedSteps = signal<number[]>([]);
  selectedEmotion = signal('');
  done = signal(false);
  // fields
  event = '';
  interpretations = '';
  threat = '';
  catastrophe = '';
  wiseMind = '';
  congruence = '';

  constructor(private storage: StorageService, private sb: SupabaseService) {}

  toggle(n: number): void { this.openStep.set(this.openStep() === n ? 0 : n); }
  isOpen(n: number): boolean { return this.openStep() === n; }
  isDone(n: number): boolean { return this.completedSteps().includes(n); }

  markDone(n: number): void {
    if (!this.completedSteps().includes(n)) {
      this.completedSteps.update(a => [...a, n]);
    }
    this.openStep.set(n < 6 ? n + 1 : 0);
  }

  toggleEmo(emo: string): void { this.selectedEmotion.set(this.selectedEmotion() === emo ? '' : emo); }
  isEmoSel(emo: string): boolean { return this.selectedEmotion() === emo; }

  async complete(): Promise<void> {
    this.markDone(6);
    const record: VhRecord = {
      id: Date.now(), type: 'vh',
      date: new Date().toISOString().split('T')[0],
      emotion: this.selectedEmotion(),
      event: this.event,
      interpretations: this.interpretations,
      threat: this.threat,
      catastrophe: this.catastrophe,
      wiseMind: this.wiseMind,
      congruence: this.congruence
    };
    this.storage.addVh(record);
    await this.sb.insert('vh_records', {
      id: record.id, date: record.date, emotion: record.emotion, event: record.event,
      interpretations: record.interpretations, threat: record.threat,
      catastrophe: record.catastrophe, wise_mind: record.wiseMind, congruence: record.congruence
    });
    this.done.set(true);
  }

  reset(): void {
    this.openStep.set(1);
    this.completedSteps.set([]);
    this.selectedEmotion.set('');
    this.done.set(false);
    this.event = ''; this.interpretations = ''; this.threat = '';
    this.catastrophe = ''; this.wiseMind = ''; this.congruence = '';
  }
}

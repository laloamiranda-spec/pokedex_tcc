import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage';
import { SupabaseService } from '../../services/supabase';
import { EcRecord } from '../../models/records';

@Component({
  selector: 'app-ec',
  imports: [CommonModule, FormsModule],
  templateUrl: './ec.html',
  styleUrl: './ec.scss',
})
export class EcComponent {
  activePhase = signal(1);
  donePhases = signal<number[]>([]);

  belief = '';
  context = '';
  prediction = '';
  behavior = '';
  observation = '';
  fulfilled = '';
  learning = '';
  reformulation = '';
  beliefPre = signal(80);
  beliefPost = signal(50);

  saved = signal(false);

  constructor(private storage: StorageService, private sb: SupabaseService) {}

  isActive(n: number): boolean { return this.activePhase() === n; }
  isDone(n: number): boolean { return this.donePhases().includes(n); }

  togglePhase(n: number): void {
    this.activePhase.set(this.activePhase() === n ? 0 : n);
  }

  markDone(n: number): void {
    if (!this.donePhases().includes(n)) this.donePhases.update(a => [...a, n]);
    this.activePhase.set(n < 4 ? n + 1 : 0);
  }

  async save(): Promise<void> {
    const record: EcRecord = {
      id: Date.now(), type: 'ec',
      date: new Date().toISOString().split('T')[0],
      belief: this.belief, context: this.context, prediction: this.prediction,
      behavior: this.behavior, observation: this.observation, fulfilled: this.fulfilled,
      learning: this.learning, reformulation: this.reformulation,
      beliefPre: this.beliefPre(), beliefPost: this.beliefPost()
    };
    this.storage.addEc(record);
    await this.sb.insert('ec_records', {
      id: record.id, date: record.date, belief: record.belief, context: record.context,
      prediction: record.prediction, behavior: record.behavior, observation: record.observation,
      fulfilled: record.fulfilled, learning: record.learning, reformulation: record.reformulation,
      belief_pre: record.beliefPre, belief_post: record.beliefPost
    });
    this.markDone(4);
    this.saved.set(true);
  }
}

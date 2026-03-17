import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  syncing = signal(false);
  syncMsg = signal('');

  constructor(public sb: SupabaseService, private storage: StorageService) {}

  get statusIcon(): string {
    const s = this.sb.status();
    return s === 'ok' ? '🟢' : s === 'err' ? '🔴' : '⚫';
  }

  async sync(): Promise<void> {
    if (!this.sb.configured) return;
    this.syncing.set(true);
    this.syncMsg.set('');
    try {
      const [rpds, vhs, expos, ecs, rxs] = await Promise.all([
        this.sb.fetchAll('rpd_records'), this.sb.fetchAll('vh_records'),
        this.sb.fetchAll('expo_records'), this.sb.fetchAll('ec_records'),
        this.sb.fetchAll('rx_records')
      ]);
      this.storage.importFromSupabase({
        rpds: rpds?.map((r: any) => ({
          id: r.id, type: 'rpd', datetime: r.datetime, context: r.context, situation: r.situation,
          emotions: r.emotions, thoughts: r.thoughts, belief: r.belief, distortions: r.distortions,
          evidenceFor: r.evidence_for, evidenceAgainst: r.evidence_against, alternative: r.alternative,
          altBelief: r.alt_belief, reflection: r.reflection, action: r.action
        })),
        vhs: vhs?.map((r: any) => ({
          id: r.id, type: 'vh', date: r.date, emotion: r.emotion, event: r.event,
          interpretations: r.interpretations, threat: r.threat, catastrophe: r.catastrophe,
          wiseMind: r.wise_mind, congruence: r.congruence
        })),
        expos: expos?.map((r: any) => ({ ...r, type: 'expo' })),
        ecs: ecs?.map((r: any) => ({
          id: r.id, type: 'ec', date: r.date, belief: r.belief, context: r.context,
          prediction: r.prediction, behavior: r.behavior, observation: r.observation,
          fulfilled: r.fulfilled, learning: r.learning, reformulation: r.reformulation,
          beliefPre: r.belief_pre, beliefPost: r.belief_post
        })),
        rxs: rxs?.map((r: any) => ({ ...r, type: 'rx' }))
      });
      const total = (rpds?.length||0)+(vhs?.length||0)+(expos?.length||0)+(ecs?.length||0)+(rxs?.length||0);
      this.syncMsg.set(`✅ ${total} registros`);
    } catch {
      this.syncMsg.set('❌ Error');
    } finally {
      this.syncing.set(false);
      setTimeout(() => this.syncMsg.set(''), 3000);
    }
  }
}

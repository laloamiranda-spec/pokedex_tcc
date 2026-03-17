import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage';
import { SupabaseService } from '../../services/supabase';
import { RpdRecord, EmotionIntensity } from '../../models/records';

const EMOTIONS = ['😢 Tristeza','😰 Ansiedad','😡 Enojo','😳 Vergüenza','😔 Culpa','😨 Miedo','😤 Frustración','🫥 Soledad','😵 Confusión','😞 Decepción','🌑 Desesperanza','😟 Inseguridad'];
const DISTORTIONS = [
  { name:'⬛ Todo-o-nada', def:'Ver en blanco y negro, sin matices.', key:'Pensamiento todo-o-nada' },
  { name:'🔁 Generalización', def:'Si ocurrió una vez, siempre ocurrirá.', key:'Generalización excesiva' },
  { name:'🔬 Filtro mental', def:'Solo enfocarse en lo negativo.', key:'Filtro mental' },
  { name:'❌ Descalificar lo positivo', def:'Desestimar experiencias positivas.', key:'Descalificación de lo positivo' },
  { name:'🧿 Lectura del pensamiento', def:'Asumir lo que otros piensan.', key:'Lectura del pensamiento' },
  { name:'🔮 Predicción del futuro', def:'Anticipar que las cosas saldrán mal.', key:'Predicción del futuro' },
  { name:'🔭 Magnificación', def:'Exagerar errores, minimizar logros.', key:'Magnificación' },
  { name:'💥 Razonamiento emocional', def:'Si lo siento, debe ser verdad.', key:'Razonamiento emocional' },
  { name:'📏 "Debería"', def:'Reglas rígidas de cómo ser.', key:'Afirmaciones debería' },
  { name:'🏷️ Etiquetado', def:'Etiqueta negativa global.', key:'Etiquetado' },
  { name:'🎯 Personalización', def:'Culparte por lo que no controlas.', key:'Personalización' },
  { name:'🌋 Catastrofización', def:'El peor escenario como el más probable.', key:'Catastrofización' },
];

@Component({
  selector: 'app-rpd',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rpd.html',
  styleUrl: './rpd.scss',
})
export class RpdComponent {
  readonly TOTAL = 7;
  readonly emotions = EMOTIONS;
  readonly distortions = DISTORTIONS;

  currentStep = signal(0);
  // Step 0
  datetime = '';
  context = '';
  situation = '';
  // Step 1
  selectedEmotions = signal<string[]>([]);
  intensities = signal<Record<string,number>>({});
  // Step 2
  thoughts = '';
  belief = signal(50);
  // Step 3
  selectedDistortions = signal<string[]>([]);
  // Step 4
  evidenceFor = '';
  evidenceAgainst = '';
  // Step 5
  alternative = '';
  altBelief = signal(70);
  // Step 6
  resultIntensities = signal<Record<string,number>>({});
  reflection = '';
  action = '';

  saved = signal(false);

  progressWidth = computed(() => {
    const n = this.currentStep();
    return n === 0 ? '0%' : `${(n / (this.TOTAL - 1)) * 100}%`;
  });

  constructor(private storage: StorageService, private sb: SupabaseService, private router: Router) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2,'0');
    this.datetime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  next(): void { if (this.currentStep() < this.TOTAL - 1) this.currentStep.update(n => n + 1); window.scrollTo({top:0,behavior:'smooth'}); }
  prev(): void { if (this.currentStep() > 0) this.currentStep.update(n => n - 1); window.scrollTo({top:0,behavior:'smooth'}); }
  goTo(n: number): void { if (n <= this.currentStep()) { this.currentStep.set(n); window.scrollTo({top:0,behavior:'smooth'}); } }

  isStepDone(i: number): boolean { return i < this.currentStep(); }
  isStepActive(i: number): boolean { return i === this.currentStep(); }
  stepDotLabel(i: number): string { return this.isStepDone(i) ? '✓' : String(i + 1); }

  toggleEmotion(emo: string): void {
    const cur = this.selectedEmotions();
    if (cur.includes(emo)) {
      this.selectedEmotions.set(cur.filter(e => e !== emo));
      const int = { ...this.intensities() };
      delete int[emo];
      this.intensities.set(int);
    } else {
      this.selectedEmotions.set([...cur, emo]);
      this.intensities.set({ ...this.intensities(), [emo]: 50 });
    }
  }

  isEmoSelected(emo: string): boolean { return this.selectedEmotions().includes(emo); }

  setIntensity(emo: string, val: number): void {
    this.intensities.set({ ...this.intensities(), [emo]: val });
  }

  getIntensity(emo: string): number { return this.intensities()[emo] ?? 50; }

  toggleDistortion(key: string): void {
    const cur = this.selectedDistortions();
    this.selectedDistortions.set(
      cur.includes(key) ? cur.filter(d => d !== key) : [...cur, key]
    );
  }

  isDistSelected(key: string): boolean { return this.selectedDistortions().includes(key); }

  setResultIntensity(emo: string, val: number): void {
    this.resultIntensities.set({ ...this.resultIntensities(), [emo]: val });
  }

  getResultIntensity(emo: string): number { return this.resultIntensities()[emo] ?? this.getIntensity(emo); }

  async save(): Promise<void> {
    const emotions: EmotionIntensity[] = this.selectedEmotions().map(name => ({
      name, value: this.intensities()[name] ?? 50
    }));
    const resultEmotions: EmotionIntensity[] = this.selectedEmotions().map(name => ({
      name, value: this.resultIntensities()[name] ?? this.intensities()[name] ?? 50
    }));

    const record: RpdRecord = {
      id: Date.now(), type: 'rpd',
      datetime: this.datetime, context: this.context, situation: this.situation,
      emotions, thoughts: this.thoughts, belief: this.belief(),
      distortions: this.selectedDistortions(),
      evidenceFor: this.evidenceFor, evidenceAgainst: this.evidenceAgainst,
      alternative: this.alternative, altBelief: this.altBelief(),
      reflection: this.reflection, action: this.action, resultEmotions
    };

    this.storage.addRpd(record);
    await this.sb.insert('rpd_records', {
      id: record.id, datetime: record.datetime, context: record.context, situation: record.situation,
      emotions: record.emotions, thoughts: record.thoughts, belief: String(record.belief),
      distortions: record.distortions, evidence_for: record.evidenceFor,
      evidence_against: record.evidenceAgainst, alternative: record.alternative,
      alt_belief: String(record.altBelief), reflection: record.reflection, action: record.action
    });

    this.saved.set(true);
    setTimeout(() => this.router.navigate(['/history']), 1200);
  }
}

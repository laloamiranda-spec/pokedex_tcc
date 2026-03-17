import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage';

type RxPanel = 'menu' | 'breath' | 'grounding' | 'pmr';
type BreathPattern = { name: string; inhale: number; hold1: number; exhale: number; hold2: number; };

const PATTERNS: BreathPattern[] = [
  { name:'Diafragmática', inhale:4, hold1:0, exhale:6, hold2:0 },
  { name:'4-7-8', inhale:4, hold1:7, exhale:8, hold2:0 },
  { name:'Coherente', inhale:5, hold1:0, exhale:5, hold2:0 },
  { name:'Box', inhale:4, hold1:4, exhale:4, hold2:4 },
];

const SENSES = [
  { num:5, icon:'👁️', title:'Cosas que VES', subtitle:'Mira a tu alrededor', count:5 },
  { num:4, icon:'🖐️', title:'Cosas que TOCAS', subtitle:'Nota texturas y temperaturas', count:4 },
  { num:3, icon:'👂', title:'Cosas que ESCUCHAS', subtitle:'Presta atención a los sonidos', count:3 },
  { num:2, icon:'👃', title:'Cosas que HUELES', subtitle:'Percibe aromas presentes', count:2 },
  { num:1, icon:'👅', title:'Cosa que SABOREAS', subtitle:'Nota el sabor presente', count:1 },
];

// Cada paso: qué partes del SVG se iluminan
const PMR_STEPS = [
  { name:'Manos y antebrazos',  instruction:'Aprieta los puños con fuerza y dobla las muñecas hacia arriba.',   parts:['pmr-lhand','pmr-rhand','pmr-larm','pmr-rarm'] },
  { name:'Bíceps',              instruction:'Dobla los codos y tensa los bíceps como si hicieras fuerza.',       parts:['pmr-larm','pmr-rarm'] },
  { name:'Hombros',             instruction:'Sube los hombros hacia las orejas y mantenlos allí.',              parts:['pmr-shoulders'] },
  { name:'Frente',              instruction:'Levanta las cejas lo más alto posible, frunciendo la frente.',     parts:['pmr-head'] },
  { name:'Ojos y nariz',        instruction:'Cierra los ojos con fuerza y arruga la nariz.',                   parts:['pmr-head'] },
  { name:'Mandíbula',           instruction:'Aprieta los dientes con fuerza sin hacerte daño.',                parts:['pmr-head','pmr-neck'] },
  { name:'Cuello',              instruction:'Empuja la cabeza hacia atrás suavemente contra la resistencia.',   parts:['pmr-neck'] },
  { name:'Pecho',               instruction:'Inhala profundo y aguanta el aire tensando el pecho.',            parts:['pmr-chest'] },
  { name:'Abdomen',             instruction:'Contrae el abdomen como si esperas un golpe.',                    parts:['pmr-abdomen'] },
  { name:'Glúteos y muslos',    instruction:'Aprieta glúteos y empuja los pies contra el suelo.',             parts:['pmr-hips','pmr-lthigh','pmr-rthigh'] },
  { name:'Pantorrillas',        instruction:'Dobla los dedos de los pies hacia arriba tensando las pantorrillas.', parts:['pmr-lcalf','pmr-rcalf'] },
  { name:'Pies',                instruction:'Curva los dedos hacia abajo y tuerce ligeramente los pies.',      parts:['pmr-feet'] },
];

// Todas las partes del SVG
const ALL_PARTS = ['pmr-head','pmr-neck','pmr-shoulders','pmr-chest','pmr-larm','pmr-rarm',
  'pmr-abdomen','pmr-lhand','pmr-rhand','pmr-hips','pmr-lthigh','pmr-rthigh','pmr-lcalf','pmr-rcalf','pmr-feet'];

@Component({
  selector: 'app-relax',
  imports: [CommonModule],
  templateUrl: './relax.html',
  styleUrl: './relax.scss',
})
export class RelaxComponent implements OnDestroy {
  panel = signal<RxPanel>('menu');
  senses = SENSES;
  readonly allParts = ALL_PARTS;

  // ── Breathing ──
  patterns = PATTERNS;
  selectedPattern = signal(0);
  isRunning = signal(false);
  phase = signal('Preparado');
  phaseSub = signal('');
  circleScale = signal(1);
  cycles = signal(0);
  elapsed = signal(0);
  private breathInterval: any;
  private startTime = 0;

  // ── Grounding ──
  groundingItems = signal<string[][]>(SENSES.map(s => Array.from({length: s.count}, () => '')));
  groundingChecked = signal<boolean[][]>(SENSES.map(s => Array.from({length: s.count}, () => false)));
  readonly makeArray = (n: number) => Array.from({length: n});

  // ── PMR ──
  readonly pmrSteps = PMR_STEPS;
  pmrRunning = signal(false);
  pmrStep = signal(0);
  pmrPhase = signal<'tension'|'release'|'rest'>('tension');
  pmrPhaseLabel = signal('Preparado para comenzar');
  pmrPhasePct = signal(0);
  pmrDone = signal(false);
  private pmrInterval: any;
  private pmrElapsed = 0;

  // Qué partes están activas (para el SVG)
  activeParts = computed(() => {
    if (this.pmrDone()) return { tension: [] as string[], release: [] as string[] };
    return {
      tension: this.pmrPhase() === 'tension' ? this.pmrSteps[this.pmrStep()].parts : [],
      release: this.pmrPhase() === 'release' ? this.pmrSteps[this.pmrStep()].parts : [],
    };
  });

  // Partes ya completadas (pasos anteriores)
  doneParts = computed(() => {
    const done = new Set<string>();
    for (let i = 0; i < this.pmrStep(); i++) {
      this.pmrSteps[i].parts.forEach(p => done.add(p));
    }
    return done;
  });

  partClass(partId: string): string {
    const active = this.activeParts();
    if (active.tension.includes(partId)) return 'tension';
    if (active.release.includes(partId)) return 'release';
    if (this.doneParts().has(partId)) return 'done';
    return '';
  }

  constructor(private storage: StorageService) {}

  ngOnDestroy(): void { this.stopBreath(); this.stopPmr(); }

  showPanel(p: RxPanel): void {
    this.stopBreath(); this.stopPmr();
    this.panel.set(p);
    if (p === 'pmr') this.resetPmr();
  }

  // ── Breathing ──
  get pattern(): BreathPattern { return this.patterns[this.selectedPattern()]; }
  selectPattern(i: number): void { if (!this.isRunning()) this.selectedPattern.set(i); }
  toggleBreath(): void { this.isRunning() ? this.stopBreath() : this.startBreath(); }

  private startBreath(): void {
    this.isRunning.set(true);
    this.cycles.set(0);
    this.startTime = Date.now();
    this.elapsed.set(0);
    const totalCycle = (this.pattern.inhale + this.pattern.hold1 + this.pattern.exhale + this.pattern.hold2) * 1000;
    this.runPhase(0);
    this.breathInterval = setInterval(() => {
      const t = (Date.now() - this.startTime) % totalCycle;
      this.elapsed.set(Math.floor((Date.now() - this.startTime) / 1000));
      this.cycles.set(Math.floor((Date.now() - this.startTime) / totalCycle));
      this.runPhase(t);
    }, 100);
  }

  private runPhase(t: number): void {
    const p = this.pattern;
    const i = p.inhale * 1000, h1 = p.hold1 * 1000, e = p.exhale * 1000;
    if (t < i) {
      this.phase.set('Inhala'); this.phaseSub.set(`${p.inhale}s`);
      this.circleScale.set(1 + (t / i) * 0.25);
    } else if (t < i + h1) {
      this.phase.set('Sostén'); this.phaseSub.set(`${p.hold1}s`); this.circleScale.set(1.25);
    } else if (t < i + h1 + e) {
      this.phase.set('Exhala'); this.phaseSub.set(`${p.exhale}s`);
      this.circleScale.set(1.25 - ((t - i - h1) / e) * 0.25);
    } else {
      this.phase.set('Sostén'); this.phaseSub.set(`${p.hold2}s`); this.circleScale.set(1);
    }
  }

  stopBreath(): void {
    if (this.breathInterval) { clearInterval(this.breathInterval); this.breathInterval = null; }
    if (this.isRunning()) {
      this.storage.addRx({
        id: Date.now(), type: 'rx',
        date: new Date().toISOString().split('T')[0],
        technique: `Respiración ${this.pattern.name}`,
        duration: this.elapsed(), cycles: this.cycles()
      });
    }
    this.isRunning.set(false);
    this.phase.set('Preparado'); this.phaseSub.set(''); this.circleScale.set(1);
  }

  // ── PMR ──
  private readonly TENSION_S = 7;
  private readonly RELEASE_S = 20;
  private readonly REST_S = 5;

  resetPmr(): void {
    this.pmrStep.set(0); this.pmrPhase.set('tension');
    this.pmrPhaseLabel.set('Preparado para comenzar');
    this.pmrPhasePct.set(0); this.pmrRunning.set(false); this.pmrDone.set(false);
    this.pmrElapsed = 0;
  }

  togglePmr(): void { this.pmrRunning() ? this.pausePmr() : this.startPmr(); }

  private startPmr(): void {
    this.pmrRunning.set(true);
    if (this.pmrPhase() === 'tension' && this.pmrPhasePct() === 0)
      this.pmrPhaseLabel.set(`⚡ TENSA — ${this.pmrSteps[this.pmrStep()].name}`);
    this.pmrInterval = setInterval(() => this.tickPmr(), 200);
  }

  private pausePmr(): void { clearInterval(this.pmrInterval); this.pmrRunning.set(false); }

  stopPmr(): void {
    if (this.pmrInterval) { clearInterval(this.pmrInterval); this.pmrInterval = null; }
    this.pmrRunning.set(false);
  }

  private tickPmr(): void {
    this.pmrElapsed += 0.2;
    const step = this.pmrStep();
    const phase = this.pmrPhase();

    if (phase === 'tension') {
      this.pmrPhasePct.set(Math.min((this.pmrElapsed / this.TENSION_S) * 100, 100));
      this.pmrPhaseLabel.set(`⚡ TENSA — ${this.pmrSteps[step].name} (${Math.max(0, this.TENSION_S - Math.floor(this.pmrElapsed))}s)`);
      if (this.pmrElapsed >= this.TENSION_S) {
        this.pmrElapsed = 0; this.pmrPhase.set('release'); this.pmrPhasePct.set(0);
        this.pmrPhaseLabel.set(`🌊 SUELTA — ${this.pmrSteps[step].name}`);
      }
    } else if (phase === 'release') {
      this.pmrPhasePct.set(Math.min((this.pmrElapsed / this.RELEASE_S) * 100, 100));
      this.pmrPhaseLabel.set(`🌊 SUELTA — ${this.pmrSteps[step].name} (${Math.max(0, this.RELEASE_S - Math.floor(this.pmrElapsed))}s)`);
      if (this.pmrElapsed >= this.RELEASE_S) {
        this.pmrElapsed = 0;
        if (step + 1 >= this.pmrSteps.length) {
          this.stopPmr(); this.pmrDone.set(true); this.pmrPhaseLabel.set('✅ ¡Completado!');
          this.storage.addRx({
            id: Date.now(), type: 'rx',
            date: new Date().toISOString().split('T')[0],
            technique: 'Relajación Muscular Progresiva',
            duration: this.pmrSteps.length * (this.TENSION_S + this.RELEASE_S + this.REST_S), cycles: 1
          });
        } else {
          this.pmrPhase.set('rest'); this.pmrPhasePct.set(0);
          this.pmrPhaseLabel.set('😮‍💨 Respira…');
        }
      }
    } else {
      this.pmrPhasePct.set(Math.min((this.pmrElapsed / this.REST_S) * 100, 100));
      this.pmrPhaseLabel.set(`😮‍💨 Respira… (${Math.max(0, this.REST_S - Math.floor(this.pmrElapsed))}s)`);
      if (this.pmrElapsed >= this.REST_S) {
        this.pmrElapsed = 0;
        this.pmrStep.update(n => n + 1); this.pmrPhase.set('tension'); this.pmrPhasePct.set(0);
        this.pmrPhaseLabel.set(`⚡ TENSA — ${this.pmrSteps[this.pmrStep()].name}`);
      }
    }
  }

  // ── Grounding ──
  setGroundingItem(si: number, ii: number, val: string): void {
    const arr = this.groundingItems().map(a => [...a]);
    arr[si][ii] = val; this.groundingItems.set(arr);
  }
  toggleGroundingCheck(si: number, ii: number): void {
    const arr = this.groundingChecked().map(a => [...a]);
    arr[si][ii] = !arr[si][ii]; this.groundingChecked.set(arr);
  }
  senseComplete(si: number): boolean { return this.groundingChecked()[si].every(v => v); }
  senseActive(si: number): boolean {
    if (si === 0) return !this.senseComplete(0);
    return this.senseComplete(si - 1) && !this.senseComplete(si);
  }
}

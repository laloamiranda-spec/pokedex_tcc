import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StorageService } from '../../services/storage';

export interface Mood {
  id:    string;
  emoji: string;
  label: string;
}

export interface Suggestion {
  title:   string;
  body:    string;
  emoji:   string;
  btnText: string;
  route:   string;
  color:   string; // CSS class suffix: sage | teal | lavender | gold | clay
}

const SUGGESTIONS: Record<string, Suggestion> = {
  anxious: {
    title:   'Técnicas de Calma',
    body:    'Cuando hay ansiedad, el primer paso es calmar el sistema nervioso antes de analizar pensamientos. Prueba la respiración guiada o la relajación muscular progresiva.',
    emoji:   '🫁',
    btnText: 'Ir a Calma →',
    route:   '/relax',
    color:   'teal',
  },
  sad: {
    title:   'Registro de Pensamientos',
    body:    'La tristeza suele ir acompañada de pensamientos automáticos negativos. Un RPD te ayuda a identificarlos, examinar su validez y construir una perspectiva más equilibrada.',
    emoji:   '🧠',
    btnText: 'Iniciar RPD →',
    route:   '/rpd',
    color:   'sage',
  },
  angry: {
    title:   'Verificar los Hechos',
    body:    'El enojo intenso a veces se basa en interpretaciones más que en hechos. Verificar los hechos te ayuda a examinar si tu emoción está justificada por la realidad objetiva.',
    emoji:   '🔎',
    btnText: 'Verificar →',
    route:   '/verify',
    color:   'lavender',
  },
  overwhelmed: {
    title:   'Técnicas de Calma',
    body:    'Cuando todo se siente demasiado, grounding y respiración pueden anclar tu sistema nervioso al presente y reducir la intensidad del momento.',
    emoji:   '🌱',
    btnText: 'Ir a Calma →',
    route:   '/relax',
    color:   'teal',
  },
  fearful: {
    title:   'Jerarquía de Exposición',
    body:    'El miedo se alimenta de la evitación. Construir una jerarquía de exposición gradual es la herramienta más efectiva para reducirlo de forma sostenida.',
    emoji:   '🪜',
    btnText: 'Construir escalera →',
    route:   '/expo',
    color:   'gold',
  },
  doubtful: {
    title:   'Experimento Conductual',
    body:    'Cuando una creencia te paraliza, la mejor forma de evaluarla no es debatirla, sino ponerla a prueba con evidencia real. Un experimento conductual hace exactamente eso.',
    emoji:   '🔬',
    btnText: 'Diseñar experimento →',
    route:   '/ec',
    color:   'clay',
  },
  tired: {
    title:   'Relajación Muscular',
    body:    'El cansancio mental acumulado responde muy bien a la relajación muscular progresiva (PMR). Unos minutos de tensión y liberación progresiva pueden renovar tu energía.',
    emoji:   '💪',
    btnText: 'Ir a Calma →',
    route:   '/relax',
    color:   'teal',
  },
  ok: {
    title:   'Registro de Pensamientos',
    body:    'Estar bien es el mejor momento para practicar. Un RPD en un momento neutro entrena el músculo cognitivo para cuando más lo necesites.',
    emoji:   '🧠',
    btnText: 'Practicar RPD →',
    route:   '/rpd',
    color:   'sage',
  },
};

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class WelcomeComponent {
  constructor(public storage: StorageService, private router: Router) {}

  countRpd  = computed(() => this.storage.rpd().length);
  countVh   = computed(() => this.storage.vh().length);
  countExpo = computed(() => this.storage.expo().length + this.storage.ec().length);
  countRx   = computed(() => this.storage.rx().length);

  moods: Mood[] = [
    { id: 'anxious',     emoji: '😰', label: 'Ansioso/a'    },
    { id: 'sad',         emoji: '😔', label: 'Triste'       },
    { id: 'angry',       emoji: '😤', label: 'Enojado/a'    },
    { id: 'overwhelmed', emoji: '😵', label: 'Agobiado/a'   },
    { id: 'fearful',     emoji: '😨', label: 'Con miedo'    },
    { id: 'doubtful',    emoji: '🤔', label: 'Con dudas'    },
    { id: 'tired',       emoji: '😴', label: 'Cansado/a'    },
    { id: 'ok',          emoji: '🙂', label: 'Bien'         },
  ];

  selectedMood = signal<string | null>(null);

  get suggestion(): Suggestion | null {
    const id = this.selectedMood();
    return id ? SUGGESTIONS[id] : null;
  }

  selectMood(id: string): void {
    this.selectedMood.set(this.selectedMood() === id ? null : id);
  }

  goToSuggestion(): void {
    const s = this.suggestion;
    if (s) this.router.navigate([s.route]);
  }
}

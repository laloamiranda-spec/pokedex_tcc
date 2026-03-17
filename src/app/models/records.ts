export interface EmotionIntensity {
  name: string;
  value: number;
}

export interface RpdRecord {
  id: number;
  type: 'rpd';
  datetime: string;
  context: string;
  situation: string;
  emotions: EmotionIntensity[];
  thoughts: string;
  belief: number;
  distortions: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  alternative: string;
  altBelief: number;
  reflection: string;
  action: string;
  resultEmotions?: EmotionIntensity[];
}

export interface VhRecord {
  id: number;
  type: 'vh';
  date: string;
  emotion: string;
  event: string;
  interpretations: string;
  threat: string;
  catastrophe: string;
  wiseMind: string;
  congruence: string;
}

export interface ExpoItem {
  id: number;
  text: string;
  suds: number;
  type: string;
  status: 'pending' | 'in-progress' | 'done';
  attempts: ExpoAttempt[];
}

export interface ExpoAttempt {
  date: string;
  sudsAntes: number;
  sudsDespues: number;
  notes: string;
}

export interface ExpoRecord {
  id: number;
  type: 'expo';
  date: string;
  name: string;
  fear: string;
  items: ExpoItem[];
}

export interface EcRecord {
  id: number;
  type: 'ec';
  date: string;
  belief: string;
  context: string;
  prediction: string;
  behavior: string;
  observation: string;
  fulfilled: string;
  learning: string;
  reformulation: string;
  beliefPre: number;
  beliefPost: number;
}

export interface RxRecord {
  id: number;
  type: 'rx';
  date: string;
  technique: string;
  duration: number;
  cycles: number;
}

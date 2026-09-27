export interface Student {
  id: string;
  name: string;
  imageUrl: string;
  hasBeenCalled?: boolean;
}

export interface QuestionItem {
  id: string;
  text: string;
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
  questions: QuestionItem[];
  customBackground?: string | null;
}

export type GamePhase = 'IDLE' | 'SPINNING' | 'DECELERATING' | 'SELECTED';

export interface SoundConfig {
  enabled: boolean;
  volume: number; // 0 to 1
  bgmEnabled: boolean;
  bgmVolume: number; // 0 to 1
}

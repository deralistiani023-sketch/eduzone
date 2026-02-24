
export type SubjectId = 'pola-bilangan' | 'rasio' | 'pecahan-desimal' | 'kubus-balok' | 'peluang';

export interface Subject {
  id: SubjectId;
  title: string;
  description: string;
  icon: string;
  color: string;
  material: string[];
  questions: Question[];
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface UserProgress {
  scores: Record<SubjectId, number>;
  completedMaterials: Record<SubjectId, boolean>;
  totalPoints: number;
  quizCorrectCount: number;
}

export type ViewState = 'home' | 'material' | 'game' | 'report' | 'teacher';

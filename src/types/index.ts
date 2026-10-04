export type NavigationTab = 
  | 'dashboard'
  | 'learn'
  | 'playground'
  | 'practice'
  | 'quiz'
  | 'progress'
  | 'cheat-sheet';

export interface ModuleItem {
  id: string;
  number: number;
  title: string;
  description: string;
  category: 'Fundamentals' | 'Daily Workflow' | 'Branching & Merging' | 'History & Recovery' | 'Advanced';
  durationMinutes: number;
  commands: string[];
  pdfSection: number;
  isCompleted?: boolean;
}

export interface UserProgressState {
  completedModules: string[];
  completedExercises: string[];
  quizScores: Record<string, number>;
  commandsPracticed: string[];
  learningStreakDays: number;
  lastActiveDate: string;
}

export interface CommandDoc {
  name: string;
  syntax: string;
  purpose: string;
  category: string;
  whenToUse: string;
  example: string;
  expectedOutput: string;
  commonMistakes: string[];
  relatedCommands: string[];
  riskLevel: 'safe' | 'caution' | 'destructive';
}

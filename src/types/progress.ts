export interface KnowledgeCheckScore {
  passed: boolean;
  bestScore: number; // 1 for correct, 0 for incorrect
  attempts: number;
  lastAttemptAt: string;
}

export interface LessonProgressEntry {
  completed: boolean;
  completedAt?: string;
  completedStepIds: string[];
  currentStepId?: string;
  knowledgeCheckScores: Record<string, KnowledgeCheckScore>; // keyed by question id
}

export interface UserProgressData {
  schemaVersion: 1;
  lastOpenedLessonId?: string;
  lastOpenedModuleId?: string;
  lessonProgress: Record<string, LessonProgressEntry>; // keyed by stable lessonId
  activityDates: string[]; // ISO YYYY-MM-DD format
  updatedAt: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  lastActiveDate: string | null;
}

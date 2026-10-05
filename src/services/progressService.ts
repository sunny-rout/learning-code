import { UserProgressData, LessonProgressEntry, StreakInfo, KnowledgeCheckScore } from '@/types/progress';
import { Lesson } from '@/types/lesson';

export const PROGRESS_STORAGE_KEY = 'gitmastery_progress_v1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * In-memory fallback storage in case window.localStorage is unavailable,
 * disabled by privacy policies, or throws quota errors.
 */
class MemoryStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const memoryStorageFallback = new MemoryStorage();

function getStorageBackend(): Storage | MemoryStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test storage availability
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // Falls back to in-memory store
  }
  return memoryStorageFallback;
}

export function createDefaultProgress(): UserProgressData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lessonProgress: {},
    activityDates: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates the parsed object against the required schema structure.
 */
export function isValidProgressData(data: unknown): data is UserProgressData {
  if (!data || typeof data !== 'object') return false;

  const candidate = data as Partial<UserProgressData>;

  if (candidate.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  if (!candidate.lessonProgress || typeof candidate.lessonProgress !== 'object') return false;
  if (!Array.isArray(candidate.activityDates)) return false;

  // Validate each lesson progress entry
  for (const [lessonId, entry] of Object.entries(candidate.lessonProgress)) {
    if (typeof lessonId !== 'string' || !lessonId.trim()) return false;
    if (!entry || typeof entry !== 'object') return false;
    if (typeof entry.completed !== 'boolean') return false;
    if (!Array.isArray(entry.completedStepIds)) return false;
    if (!entry.knowledgeCheckScores || typeof entry.knowledgeCheckScores !== 'object') return false;

    for (const [qId, score] of Object.entries(entry.knowledgeCheckScores)) {
      if (typeof qId !== 'string' || !qId.trim()) return false;
      if (!score || typeof score !== 'object') return false;
      if (typeof score.passed !== 'boolean') return false;
      if (typeof score.bestScore !== 'number') return false;
      if (typeof score.attempts !== 'number') return false;
    }
  }

  return true;
}

/**
 * Progress Service with resilient storage and derived calculations.
 */
export class ProgressService {
  private storage: Storage | MemoryStorage;
  private subscribers: Set<(data: UserProgressData) => void> = new Set();

  constructor(customStorage?: Storage | MemoryStorage) {
    this.storage = customStorage || getStorageBackend();
  }

  /**
   * Safe getter: retrieves and validates stored progress.
   * Gracefully returns defaults on corruption, missing keys, or errors.
   */
  public getProgress(): UserProgressData {
    try {
      const raw = this.storage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) {
        return createDefaultProgress();
      }

      const parsed = JSON.parse(raw);
      if (isValidProgressData(parsed)) {
        return parsed;
      }
      // If schema invalid or malformed, fallback safely
      return createDefaultProgress();
    } catch {
      return createDefaultProgress();
    }
  }

  /**
   * Persists progress data and notifies active subscribers.
   */
  public saveProgress(data: UserProgressData): void {
    try {
      const payload: UserProgressData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
      this.notifySubscribers(payload);
    } catch (err) {
      console.warn('Unable to persist progress to storage:', err);
    }
  }

  /**
   * Subscribe to progress updates. Returns unsubscribe callback.
   */
  public subscribe(callback: (data: UserProgressData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(data: UserProgressData): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Subscriber callback error in ProgressService:', err);
      }
    });
  }

  /**
   * Resets all progress data to clean state.
   */
  public resetProgress(): void {
    const fresh = createDefaultProgress();
    this.saveProgress(fresh);
  }

  /**
   * Registers activity date to maintain streak.
   */
  public recordActivity(referenceDate = new Date()): void {
    const data = this.getProgress();
    const dateStr = referenceDate.toISOString().split('T')[0];

    if (!data.activityDates.includes(dateStr)) {
      const updatedDates = [...data.activityDates, dateStr].sort();
      this.saveProgress({
        ...data,
        activityDates: updatedDates,
      });
    }
  }

  /**
   * Sets the last opened lesson & module identifiers.
   */
  public setLastOpened(lessonId: string, moduleId: string): void {
    const data = this.getProgress();
    this.recordActivity();
    this.saveProgress({
      ...data,
      lastOpenedLessonId: lessonId,
      lastOpenedModuleId: moduleId,
    });
  }

  /**
   * Updates or creates a lesson progress entry.
   */
  public getLessonProgress(lessonId: string): LessonProgressEntry {
    const data = this.getProgress();
    return (
      data.lessonProgress[lessonId] || {
        completed: false,
        completedStepIds: [],
        knowledgeCheckScores: {},
      }
    );
  }

  /**
   * Sets current active step position without marking the step completed.
   */
  public setCurrentStep(lessonId: string, stepId: string): void {
    const data = this.getProgress();
    const entry = this.getLessonProgress(lessonId);

    if (entry.currentStepId === stepId) return;

    const updatedEntry: LessonProgressEntry = {
      ...entry,
      currentStepId: stepId,
    };

    this.recordActivity();
    this.saveProgress({
      ...data,
      lessonProgress: {
        ...data.lessonProgress,
        [lessonId]: updatedEntry,
      },
    });
  }

  /**
   * Marks a specific step within a lesson as completed.
   */
  public markStepCompleted(lessonId: string, stepId: string): void {
    const data = this.getProgress();
    const entry = this.getLessonProgress(lessonId);

    const stepSet = new Set(entry.completedStepIds);
    stepSet.add(stepId);

    const updatedEntry: LessonProgressEntry = {
      ...entry,
      completedStepIds: Array.from(stepSet),
      currentStepId: stepId,
    };

    this.recordActivity();
    this.saveProgress({
      ...data,
      lessonProgress: {
        ...data.lessonProgress,
        [lessonId]: updatedEntry,
      },
    });
  }

  /**
   * Records a knowledge check question attempt.
   */
  public recordKnowledgeCheckAttempt(
    lessonId: string,
    questionId: string,
    isCorrect: boolean
  ): void {
    const data = this.getProgress();
    const entry = this.getLessonProgress(lessonId);
    const existing = entry.knowledgeCheckScores[questionId] || {
      passed: false,
      bestScore: 0,
      attempts: 0,
      lastAttemptAt: new Date().toISOString(),
    };

    const updatedScore: KnowledgeCheckScore = {
      passed: existing.passed || isCorrect,
      bestScore: isCorrect ? 1 : existing.bestScore,
      attempts: existing.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
    };

    const updatedEntry: LessonProgressEntry = {
      ...entry,
      knowledgeCheckScores: {
        ...entry.knowledgeCheckScores,
        [questionId]: updatedScore,
      },
    };

    this.recordActivity();
    this.saveProgress({
      ...data,
      lessonProgress: {
        ...data.lessonProgress,
        [lessonId]: updatedEntry,
      },
    });
  }

  /**
   * Checks whether a lesson meets all requirements to be completed.
   * - All required steps must be in completedStepIds.
   * - All knowledge check questions in required steps must have passed: true.
   */
  public canCompleteLesson(lesson: Lesson): { eligible: boolean; missingSteps: string[]; unpassedQuestions: string[] } {
    const entry = this.getLessonProgress(lesson.id);
    const missingSteps: string[] = [];
    const unpassedQuestions: string[] = [];

    for (const step of lesson.steps) {
      if (step.isRequiredForCompletion) {
        if (!entry.completedStepIds.includes(step.id)) {
          missingSteps.push(step.id);
        }
        if (step.knowledgeCheck) {
          const score = entry.knowledgeCheckScores[step.knowledgeCheck.id];
          if (!score || !score.passed) {
            unpassedQuestions.push(step.knowledgeCheck.id);
          }
        }
      }
    }

    return {
      eligible: missingSteps.length === 0 && unpassedQuestions.length === 0,
      missingSteps,
      unpassedQuestions,
    };
  }

  /**
   * Marks a lesson complete after verifying completion criteria.
   */
  public completeLesson(lesson: Lesson): boolean {
    const check = this.canCompleteLesson(lesson);
    if (!check.eligible) {
      return false;
    }

    const data = this.getProgress();
    const entry = this.getLessonProgress(lesson.id);

    const updatedEntry: LessonProgressEntry = {
      ...entry,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    this.recordActivity();
    this.saveProgress({
      ...data,
      lessonProgress: {
        ...data.lessonProgress,
        [lesson.id]: updatedEntry,
      },
    });

    return true;
  }

  /**
   * Derives module completion based on whether all required lessons for the module are completed.
   */
  public isModuleCompleted(_moduleId: string, requiredLessonIds: string[]): boolean {
    if (!requiredLessonIds || requiredLessonIds.length === 0) return false;
    const data = this.getProgress();
    return requiredLessonIds.every((lid) => data.lessonProgress[lid]?.completed === true);
  }

  /**
   * Derives active streak statistics from activity dates.
   */
  public getStreakInfo(referenceDate = new Date()): StreakInfo {
    const data = this.getProgress();
    const dates = Array.from(new Set(data.activityDates)).sort();

    if (dates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        activeToday: false,
        lastActiveDate: null,
      };
    }

    const todayStr = referenceDate.toISOString().split('T')[0];
    const activeToday = dates.includes(todayStr);
    const lastActiveDate = dates[dates.length - 1];

    // Calculate streaks by walking day differences
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Convert date strings to UTC epoch day numbers
    const epochDays = dates.map((d) => {
      const parts = d.split('-').map(Number);
      return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
    });

    for (let i = 0; i < epochDays.length; i++) {
      if (i === 0 || epochDays[i] === epochDays[i - 1] + 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Check if the current streak is unbroken relative to referenceDate
    const refDay = Math.floor(
      Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()) / 86400000
    );
    const latestActiveDay = epochDays[epochDays.length - 1];

    if (latestActiveDay === refDay || latestActiveDay === refDay - 1) {
      // Walk backwards from latest day
      currentStreak = 1;
      for (let i = epochDays.length - 1; i > 0; i--) {
        if (epochDays[i] === epochDays[i - 1] + 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      activeToday,
      lastActiveDate,
    };
  }
}

// Global default instance for the application
export const progressService = new ProgressService();

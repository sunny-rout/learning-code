import { useState, useEffect, useCallback } from 'react';
import { progressService } from '@/services/progressService';
import { UserProgressData, StreakInfo, LessonProgressEntry } from '@/types/progress';
import { Lesson } from '@/types/lesson';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgressData>(() => progressService.getProgress());
  const [streak, setStreak] = useState<StreakInfo>(() => progressService.getStreakInfo());

  useEffect(() => {
    // Initial sync
    setProgress(progressService.getProgress());
    setStreak(progressService.getStreakInfo());

    // Subscribe to updates
    const unsubscribe = progressService.subscribe((updated) => {
      setProgress(updated);
      setStreak(progressService.getStreakInfo());
    });

    return () => unsubscribe();
  }, []);

  const setCurrentStep = useCallback((lessonId: string, stepId: string) => {
    progressService.setCurrentStep(lessonId, stepId);
  }, []);

  const markStepCompleted = useCallback((lessonId: string, stepId: string) => {
    progressService.markStepCompleted(lessonId, stepId);
  }, []);

  const recordKnowledgeCheckAttempt = useCallback(
    (lessonId: string, questionId: string, isCorrect: boolean) => {
      progressService.recordKnowledgeCheckAttempt(lessonId, questionId, isCorrect);
    },
    []
  );

  const completeLesson = useCallback((lesson: Lesson) => {
    return progressService.completeLesson(lesson);
  }, []);

  const setLastOpened = useCallback((lessonId: string, moduleId: string) => {
    progressService.setLastOpened(lessonId, moduleId);
  }, []);

  const resetProgress = useCallback(() => {
    progressService.resetProgress();
  }, []);

  const getLessonProgress = useCallback((lessonId: string): LessonProgressEntry => {
    return progressService.getLessonProgress(lessonId);
  }, []);

  const isModuleCompleted = useCallback((moduleId: string, requiredLessonIds: string[]): boolean => {
    return progressService.isModuleCompleted(moduleId, requiredLessonIds);
  }, []);

  return {
    progress,
    streak,
    setCurrentStep,
    markStepCompleted,
    recordKnowledgeCheckAttempt,
    completeLesson,
    setLastOpened,
    resetProgress,
    getLessonProgress,
    isModuleCompleted,
    canCompleteLesson: progressService.canCompleteLesson.bind(progressService),
  };
}

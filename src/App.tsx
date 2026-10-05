import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Layout } from './app/components/layout/Layout';
import { NavigationTab } from './types';
import { DashboardView } from './app/features/dashboard/DashboardView';
import { ModulesView } from './app/features/modules/ModulesView';
import { PlaygroundView } from './app/features/playground/PlaygroundView';
import { PracticeView } from './app/features/practice/PracticeView';
import { QuizView } from './app/features/quiz/QuizView';
import { ProgressView } from './app/features/progress/ProgressView';
import { CheatSheetView } from './app/features/cheat-sheet/CheatSheetView';

const LessonView = lazy(() =>
  import('./app/features/lesson/LessonView').then((m) => ({ default: m.LessonView }))
);
import { 
  getLessonById, 
  loadLesson, 
  isLessonAvailable, 
  FOUNDATIONAL_LESSONS, 
  ALL_LESSON_METADATA 
} from './data/lessons';
import { Lesson } from './types/lesson';
import { useProgress } from './hooks/useProgress';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('module-01');
  const { progress, streak } = useProgress();

  // Track the element that triggered lesson launch for focus restoration
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Initialize activeLessonId from URL query param if present and valid
  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramLesson = params.get('lesson');
      if (paramLesson && isLessonAvailable(paramLesson)) {
        return paramLesson;
      }
    }
    return null;
  });

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    return activeLessonId ? getLessonById(activeLessonId) || null : null;
  });
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);

  useEffect(() => {
    if (!activeLessonId) {
      setActiveLesson(null);
      setIsLoadingLesson(false);
      return;
    }
    const sync = getLessonById(activeLessonId);
    if (sync) {
      setActiveLesson(sync);
      setIsLoadingLesson(false);
      return;
    }
    setIsLoadingLesson(true);
    let isCancelled = false;
    loadLesson(activeLessonId).then((l) => {
      if (!isCancelled) {
        setActiveLesson(l || null);
        setIsLoadingLesson(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [activeLessonId]);

  const prevActiveLessonIdRef = useRef<string | null>(activeLessonId);

  // Keep URL query param synced with activeLessonId for seamless refresh resilience and history navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get('lesson');
    if (activeLessonId) {
      if (currentParam !== activeLessonId) {
        url.searchParams.set('lesson', activeLessonId);
        window.history.pushState({ lesson: activeLessonId }, '', url.toString());
      }
    } else {
      if (currentParam) {
        url.searchParams.delete('lesson');
        window.history.pushState({}, '', url.toString());
      }
    }
  }, [activeLessonId]);

  // Listen to popstate for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const paramLesson = params.get('lesson');
      if (paramLesson && isLessonAvailable(paramLesson)) {
        setActiveLessonId(paramLesson);
      } else {
        setActiveLessonId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Restore focus to originating trigger or fallback to destination heading upon closing lesson
  useEffect(() => {
    if (prevActiveLessonIdRef.current && !activeLessonId) {
      const timer = setTimeout(() => {
        if (triggerElementRef.current && document.contains(triggerElementRef.current)) {
          triggerElementRef.current.focus();
        } else {
          // Documented fallback: Focus main content heading
          const fallbackHeading = document.querySelector('main h1, h1') as HTMLElement | null;
          if (fallbackHeading) {
            if (!fallbackHeading.hasAttribute('tabindex')) {
              fallbackHeading.setAttribute('tabindex', '-1');
            }
            fallbackHeading.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    prevActiveLessonIdRef.current = activeLessonId;
  }, [activeLessonId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('cheat-sheet');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartLesson = (lessonId: string) => {
    triggerElementRef.current = (document.activeElement as HTMLElement) || null;
    setActiveLessonId(lessonId);
  };

  const handleResumeLesson = () => {
    triggerElementRef.current = (document.activeElement as HTMLElement) || null;

    // 1. If there is an incomplete authored lesson, resume it
    const firstIncomplete = FOUNDATIONAL_LESSONS.find(
      (l) => !progress.lessonProgress[l.id]?.completed
    );
    if (firstIncomplete) {
      // If the last opened lesson is still incomplete, prefer resuming it
      if (
        progress.lastOpenedLessonId &&
        getLessonById(progress.lastOpenedLessonId) &&
        !progress.lessonProgress[progress.lastOpenedLessonId]?.completed
      ) {
        setActiveLessonId(progress.lastOpenedLessonId);
        return;
      }
      setActiveLessonId(firstIncomplete.id);
      return;
    }

    // 2. All authored lessons are completed!
    // Fallback to lastOpenedLessonId (if authored) or lesson-01 for review
    if (progress.lastOpenedLessonId && getLessonById(progress.lastOpenedLessonId)) {
      setActiveLessonId(progress.lastOpenedLessonId);
    } else {
      setActiveLessonId(FOUNDATIONAL_LESSONS[0].id);
    }
  };

  const handleSelectModuleAndNavigate = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveTab('learn');
  };

  // Determine next lesson for sequential navigation across all modules
  const currentLessonIndex = activeLessonId
    ? ALL_LESSON_METADATA.findIndex((m) => m.id === activeLessonId)
    : -1;
  const nextLessonMeta =
    currentLessonIndex !== -1 && currentLessonIndex < ALL_LESSON_METADATA.length - 1
      ? ALL_LESSON_METADATA[currentLessonIndex + 1]
      : null;

  const handleNextLesson = () => {
    if (nextLessonMeta) {
      setActiveLessonId(nextLessonMeta.id);
    }
  };

  const completedModulesCount = ALL_LESSON_METADATA.filter(
    (m) => progress.lessonProgress[m.id]?.completed
  ).length;

  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const handleLaunchScenario = (scenarioId: number) => {
    setSelectedScenarioId(scenarioId);
    setActiveTab('playground');
  };

  if (isLoadingLesson) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center p-6" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading interactive lesson...</p>
        </div>
      </div>
    );
  }

  if (activeLesson) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center p-6" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Loading lesson view...</p>
            </div>
          </div>
        }
      >
        <LessonView
          lesson={activeLesson}
          onBack={() => setActiveLessonId(null)}
          onNavigateToDashboard={() => {
            setActiveLessonId(null);
            setActiveTab('dashboard');
          }}
          onNextLesson={nextLessonMeta ? handleNextLesson : undefined}
          hasNextLesson={Boolean(nextLessonMeta)}
        />
      </Suspense>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      streakDays={streak.currentStreak}
      completedCount={completedModulesCount}
      totalModules={FOUNDATIONAL_LESSONS.length}
    >
      {activeTab === 'dashboard' && (
        <DashboardView 
          onNavigate={setActiveTab} 
          onSelectModule={handleSelectModuleAndNavigate}
          onStartLesson={handleStartLesson}
          onResumeLesson={handleResumeLesson}
        />
      )}
      {activeTab === 'learn' && (
        <ModulesView 
          selectedModuleId={selectedModuleId} 
          onSelectModuleId={setSelectedModuleId}
          onNavigate={setActiveTab}
          onStartLesson={handleStartLesson}
        />
      )}
      {activeTab === 'playground' && (
        <PlaygroundView
          initialScenarioId={selectedScenarioId}
          onExitScenario={() => setSelectedScenarioId(null)}
        />
      )}
      {activeTab === 'practice' && (
        <PracticeView
          onNavigate={setActiveTab}
          onLaunchScenario={handleLaunchScenario}
        />
      )}
      {activeTab === 'quiz' && <QuizView onNavigate={setActiveTab} />}
      {activeTab === 'progress' && <ProgressView onNavigate={setActiveTab} />}
      {activeTab === 'cheat-sheet' && <CheatSheetView />}
    </Layout>
  );
}

export default App;

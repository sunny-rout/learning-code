import React, { useState, useEffect, useRef } from 'react';
import { Lesson } from '@/types/lesson';
import { useProgress } from '@/hooks/useProgress';
import { useLessonKeyboard } from '@/hooks/useLessonKeyboard';
import { AriaLiveRegion } from '@/app/components/common/AriaLiveRegion';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { KnowledgeCheckCard } from './KnowledgeCheckCard';
import { LessonSummaryView } from './LessonSummaryView';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award,
  BookOpen,
} from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  onNavigateToDashboard?: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  onBack,
  onNavigateToDashboard,
  onNextLesson,
  hasNextLesson = false,
}) => {
  const {
    getLessonProgress,
    setCurrentStep,
    markStepCompleted,
    recordKnowledgeCheckAttempt,
    completeLesson,
    setLastOpened,
    canCompleteLesson,
  } = useProgress();

  const lessonProgress = getLessonProgress(lesson.id);

  // Restore current step if previously saved, else start at step 0
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (lessonProgress.currentStepId) {
      const idx = lesson.steps.findIndex((s) => s.id === lessonProgress.currentStepId);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [hasCompletedLesson, setHasCompletedLesson] = useState<boolean>(Boolean(lessonProgress.completed));
  const [isSummaryMode, setIsSummaryMode] = useState<boolean>(false);
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>('');

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef<boolean>(true);
  const currentStep = lesson.steps[currentStepIndex] || lesson.steps[0];
  const totalSteps = lesson.steps.length;

  // Track lesson as last opened
  useEffect(() => {
    setLastOpened(lesson.id, lesson.moduleId);
  }, [lesson.id, lesson.moduleId, setLastOpened]);

  // Track active step position in storage WITHOUT prematurely marking it complete
  useEffect(() => {
    if (currentStep) {
      setCurrentStep(lesson.id, currentStep.id);
    }
  }, [lesson.id, currentStep, setCurrentStep]);

  // Sync completion state if external progress changes
  useEffect(() => {
    setHasCompletedLesson(Boolean(lessonProgress.completed));
  }, [lessonProgress.completed]);

  // Shift focus to step heading on step changes, avoiding duplicate screen-reader announcements
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [currentStepIndex]);

  const handleStepJump = (idx: number) => {
    if (idx >= 0 && idx < totalSteps) {
      // Mark current step completed if it doesn't have an unpassed knowledge check
      const currentHasUnpassedQuiz = Boolean(
        currentStep.knowledgeCheck && 
        !lessonProgress.knowledgeCheckScores[currentStep.knowledgeCheck.id]?.passed
      );

      if (!currentHasUnpassedQuiz) {
        markStepCompleted(lesson.id, currentStep.id);
      }

      setCurrentStepIndex(idx);
      setCurrentStep(lesson.id, lesson.steps[idx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      // Mark current step completed if it doesn't have an unpassed knowledge check
      const currentHasUnpassedQuiz = Boolean(
        currentStep.knowledgeCheck && 
        !lessonProgress.knowledgeCheckScores[currentStep.knowledgeCheck.id]?.passed
      );

      if (!currentHasUnpassedQuiz) {
        markStepCompleted(lesson.id, currentStep.id);
      }

      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setCurrentStep(lesson.id, lesson.steps[nextIdx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setCurrentStep(lesson.id, lesson.steps[prevIdx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMarkCurrentStepComplete = () => {
    markStepCompleted(lesson.id, currentStep.id);
  };

  const handleFinishLesson = () => {
    if (hasCompletedLesson) return; // Prevent duplicate submission
    // Ensure final step is marked complete before finalizing lesson
    markStepCompleted(lesson.id, currentStep.id);
    const success = completeLesson(lesson);
    if (success) {
      setHasCompletedLesson(true);
      setAriaLiveMessage(`Unit Mastered! You have successfully completed ${lesson.title}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Connect lesson keyboard shortcuts
  useLessonKeyboard({
    currentStepIndex,
    totalSteps,
    onNextStep: handleNextStep,
    onPrevStep: handlePrevStep,
    onStepJump: handleStepJump,
    onExitLesson: isSummaryMode ? () => setIsSummaryMode(false) : onBack,
    hasActiveChildDialog: false,
    enabled: true,
  });

  const isCurrentStepCompleted = lessonProgress.completedStepIds.includes(currentStep.id);
  const completionEligibility = canCompleteLesson(lesson);
  const isFinalStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col animate-fadeIn">
      {/* Polite Screen-Reader Announcements (Non-focused events like quiz results and completion) */}
      <AriaLiveRegion message={ariaLiveMessage} role="status" aria-live="polite" />

      {/* Top Header & Breadcrumb Bar */}
      <header className="sticky top-0 z-30 bg-bg-surface/90 backdrop-blur-md border-b border-bg-border px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-border text-text-secondary hover:text-white text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Return to curriculum"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Curriculum</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="h-4 w-px bg-bg-border hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-accent">
                UNIT {String(lesson.number).padStart(2, '0')}
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-md">
                {lesson.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {/* Summary Mode Toggle for Completed Lessons */}
          {hasCompletedLesson && (
            <button
              type="button"
              onClick={() => setIsSummaryMode(!isSummaryMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary ${
                isSummaryMode
                  ? 'bg-brand-primary text-white border-brand-primary shadow-glow-primary'
                  : 'bg-bg-elevated hover:bg-bg-border border-bg-border text-text-secondary hover:text-white'
              }`}
              aria-pressed={isSummaryMode}
              aria-label={isSummaryMode ? 'Switch to interactive lesson view' : 'Switch to consolidated summary view'}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSummaryMode ? 'Interactive View' : 'Summary Guide'}</span>
              <span className="sm:hidden">{isSummaryMode ? 'Steps' : 'Summary'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{lesson.estimatedMinutes}m</span>
          </div>

          {hasCompletedLesson && !isSummaryMode && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-brand-secondary bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
        </div>
      </header>

      {/* If Summary Mode is active, render the consolidated read-only reference guide */}
      {isSummaryMode ? (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
          <LessonSummaryView
            lesson={lesson}
            onExitSummary={() => setIsSummaryMode(false)}
          />
        </main>
      ) : (
        <>
          {/* Progress & Stepper Bar */}
          <div className="bg-bg-surface/60 border-b border-bg-border px-4 sm:px-8 py-3">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
                <span className="font-semibold text-text-secondary">
                  Step {currentStepIndex + 1} of {totalSteps}:
                </span>
                <span className="font-bold text-white truncate max-w-xs">
                  {currentStep.title}
                </span>
              </div>

              {/* Stepper Pills */}
              <nav aria-label="Lesson steps" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {lesson.steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isStepDone = lessonProgress.completedStepIds.includes(step.id);

                  let pillStyle = 'bg-bg-elevated border-bg-border text-text-muted hover:text-white';
                  if (isCurrent) {
                    pillStyle = 'bg-brand-primary text-white border-brand-primary shadow-glow-primary font-bold';
                  } else if (isStepDone) {
                    pillStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium';
                  }

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepJump(idx)}
                      className={`h-7 px-2.5 rounded-lg border text-[11px] transition-all flex items-center gap-1 shrink-0 focus-visible:ring-2 focus-visible:ring-brand-primary ${pillStyle}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Jump to step ${idx + 1}: ${step.title}`}
                    >
                      {isStepDone && !isCurrent ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                      <span className="hidden md:inline text-[10px]">{step.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6 pb-32 sm:pb-12">
            {/* Step Header */}
            <header className="space-y-2 pb-4 border-b border-bg-border">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span className="uppercase tracking-wider font-mono text-brand-accent">
                  SECTION {currentStepIndex + 1}
                </span>
                <span className="text-[11px]">PDF Source: Section {lesson.pdfSection}</span>
              </div>
              <h1
                ref={stepHeadingRef}
                tabIndex={-1}
                className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight outline-none focus:outline-none"
              >
                {currentStep.title}
              </h1>
              {currentStep.description && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {currentStep.description}
                </p>
              )}
            </header>

            {/* Content Blocks */}
            <div className="space-y-4">
              {currentStep.blocks.map((block, idx) => (
                <ContentBlockRenderer key={idx} block={block} lessonId={lesson.id} />
              ))}

              {/* Interactive Knowledge Check if present in this step */}
              {currentStep.knowledgeCheck && (
                <KnowledgeCheckCard
                  lessonId={lesson.id}
                  question={currentStep.knowledgeCheck}
                  savedScore={lessonProgress.knowledgeCheckScores[currentStep.knowledgeCheck.id]}
                  onRecordAttempt={(lId, qId, correct) => {
                    recordKnowledgeCheckAttempt(lId, qId, correct);
                    if (correct) {
                      markStepCompleted(lesson.id, currentStep.id);
                      setAriaLiveMessage(`Quiz passed! ${currentStep.title} verified.`);
                    } else {
                      setAriaLiveMessage('Incorrect answer. Review explanation and retry.');
                    }
                  }}
                  onPass={() => {
                    markStepCompleted(lesson.id, currentStep.id);
                  }}
                />
              )}

              {/* Explicit Section Completion status / action */}
              <div className="pt-2 flex items-center justify-between border-t border-bg-border/60 text-xs">
                {isCurrentStepCompleted ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Section Completed</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkCurrentStepComplete}
                    className="px-3 py-1.5 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-secondary hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <span>Mark Section Completed</span>
                  </button>
                )}
                <span className="text-[11px] text-text-secondary">Step {currentStepIndex + 1} of {totalSteps}</span>
              </div>
            </div>

            {/* Lesson Completion Card (Displayed when on final step or completed) */}
            {isFinalStep && (
              <section 
                aria-label="Unit completion status" 
                className="my-8 p-6 rounded-2xl bg-bg-surface border border-bg-border shadow-glass space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    hasCompletedLesson
                      ? 'bg-emerald-500/20 text-brand-secondary'
                      : completionEligibility.eligible
                      ? 'bg-brand-primary/20 text-brand-primary'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {hasCompletedLesson ? (
                      <CheckCircle2 className="w-6 h-6 text-brand-secondary" />
                    ) : (
                      <Award className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {hasCompletedLesson
                        ? (!hasNextLesson ? 'Unit Mastered! (All Core Units Completed)' : 'Unit Mastered!')
                        : completionEligibility.eligible
                        ? 'All Requirements Fulfilled!'
                        : 'Almost There!'}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {hasCompletedLesson
                        ? (!hasNextLesson
                            ? `You have successfully completed ${lesson.title}. Congratulations! You have finished all 6 foundational interactive units in Phase 2. Subsequent units will unlock in Phase 3.`
                            : `You have successfully completed ${lesson.title}. Progress is permanently saved.`)
                        : completionEligibility.eligible
                        ? 'You have reviewed all steps and passed the knowledge checks. Click below to seal completion.'
                        : 'To complete this lesson, make sure you have visited all sections and passed the required knowledge check.'}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!hasCompletedLesson ? (
                    <button
                      type="button"
                      disabled={!completionEligibility.eligible}
                      onClick={handleFinishLesson}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-brand-primary ${
                        completionEligibility.eligible
                          ? 'bg-brand-secondary hover:bg-emerald-600 text-bg-dark font-extrabold shadow-glow-green active:scale-95'
                          : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-bg-border'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Unit Completed</span>
                    </button>
                  ) : (
                    <>
                      {hasNextLesson && onNextLesson && (
                        <button
                          type="button"
                          onClick={onNextLesson}
                          className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-glow-primary transition-all focus-visible:ring-2 focus-visible:ring-brand-primary"
                        >
                          <span>Continue to Next Unit</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      {!hasNextLesson && onNavigateToDashboard && (
                        <button
                          type="button"
                          onClick={onNavigateToDashboard}
                          className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-glow-primary transition-all focus-visible:ring-2 focus-visible:ring-brand-primary"
                        >
                          <span>Return to Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2.5 rounded-xl bg-bg-elevated hover:bg-bg-border text-white text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
                      >
                        <span>Back to Curriculum</span>
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Desktop Footer Navigation Bar */}
            <footer className="pt-8 pb-12 border-t border-bg-border hidden sm:flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handlePrevStep}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  currentStepIndex > 0
                    ? 'bg-bg-surface hover:bg-bg-elevated border border-bg-border text-white'
                    : 'opacity-40 text-text-muted cursor-not-allowed'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              {!isFinalStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-glow-primary transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span>Next: {lesson.steps[currentStepIndex + 1]?.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-secondary hover:text-white text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span>Finish & Return</span>
                </button>
              )}
            </footer>
          </main>

          {/* Mobile Safe-Area Sticky Footer Navigation Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-surface/95 backdrop-blur-md border-t border-bg-border px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-glass">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrevStep}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary ${
                currentStepIndex > 0
                  ? 'bg-bg-elevated text-white border border-bg-border active:scale-95'
                  : 'opacity-40 text-text-muted cursor-not-allowed border border-transparent'
              }`}
              aria-label="Previous step"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <span className="text-[11px] font-mono font-medium text-text-secondary">
              {currentStepIndex + 1} / {totalSteps}
            </span>

            {!isFinalStep ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="min-h-[44px] px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-primary transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Next step"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="min-h-[44px] px-4 rounded-xl bg-bg-elevated hover:bg-bg-border border border-bg-border text-white text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Finish and return"
              >
                <span>Finish</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};


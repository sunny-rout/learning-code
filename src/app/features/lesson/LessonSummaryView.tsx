import React from 'react';
import { Lesson } from '@/types/lesson';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft,
  Printer,
  Sparkles
} from 'lucide-react';

interface LessonSummaryViewProps {
  lesson: Lesson;
  onExitSummary: () => void;
}

/**
 * Pure, read-only consolidated reference summary for completed lessons.
 * Displays all steps, content blocks, diagrams, and knowledge-check answer keys in an all-in-one view.
 * Guarantees zero side effects: no progress hooks, no state mutations, no interactive radios.
 */
export const LessonSummaryView: React.FC<LessonSummaryViewProps> = ({
  lesson,
  onExitSummary,
}) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Summary Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Unit Mastered — Reference Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            {lesson.title}: Consolidated Summary
          </h2>
          <p className="text-xs text-text-secondary">
            All concepts, commands, visual diagrams, and quiz explanations in a single reference sheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bg-elevated hover:bg-bg-border border border-bg-border text-text-secondary hover:text-white text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Guide</span>
          </button>

          <button
            type="button"
            onClick={onExitSummary}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stepper</span>
          </button>
        </div>
      </div>

      {/* Steps Traversal in All-in-One Format */}
      <div className="space-y-10">
        {lesson.steps.map((step, stepIndex) => (
          <section
            key={step.id}
            aria-labelledby={`summary-step-${step.id}`}
            className="p-6 rounded-2xl bg-bg-surface/90 border border-bg-border shadow-glass space-y-6"
          >
            {/* Step Section Header */}
            <div className="border-b border-bg-border pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-accent">
                  SECTION {stepIndex + 1}
                </span>
                <h3 id={`summary-step-${step.id}`} className="text-lg font-bold text-white">
                  {step.title}
                </h3>
              </div>
              <span className="text-[11px] text-text-muted">
                Step {stepIndex + 1} of {lesson.steps.length}
              </span>
            </div>

            {step.description && (
              <p className="text-xs text-text-secondary leading-relaxed">
                {step.description}
              </p>
            )}

            {/* Step Content Blocks */}
            <div className="space-y-4">
              {step.blocks.map((block, blockIndex) => (
                <ContentBlockRenderer
                  key={blockIndex}
                  block={block}
                  lessonId={lesson.id}
                />
              ))}
            </div>

            {/* Read-Only Knowledge Check Answer Key */}
            {step.knowledgeCheck && (
              <div className="mt-6 p-5 rounded-xl bg-bg-dark/80 border border-brand-primary/30 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-accent">
                  <HelpCircle className="w-4 h-4 text-brand-accent" />
                  <span>Knowledge Check — Reference Answer Key</span>
                </div>

                <p className="text-sm font-semibold text-white">
                  {step.knowledgeCheck.question}
                </p>

                {/* Read-only Option List with Marked Answer */}
                <div className="space-y-2">
                  {step.knowledgeCheck.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === step.knowledgeCheck!.correctIndex;
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-bg-surface/50 border-bg-border/60 text-text-muted opacity-70'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct Answer</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Educational Rationale */}
                <div className="p-3 rounded-lg bg-bg-surface border border-bg-border text-xs text-text-secondary leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">
                    Concept Rationale:
                  </span>
                  {step.knowledgeCheck.explanation}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Bottom Sticky-Safe Bar */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-secondary">
          <Sparkles className="w-4 h-4" />
          <span>Curriculum Mastery Achieved for {lesson.title}</span>
        </div>
        <div>
          <button
            type="button"
            onClick={onExitSummary}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span>Return to Interactive Lesson</span>
          </button>
        </div>
      </div>
    </div>
  );
};

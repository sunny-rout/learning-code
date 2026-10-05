import React, { useState } from 'react';
import { KnowledgeCheckQuestion } from '@/types/lesson';
import { KnowledgeCheckScore } from '@/types/progress';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface KnowledgeCheckCardProps {
  lessonId: string;
  question: KnowledgeCheckQuestion;
  savedScore?: KnowledgeCheckScore;
  onRecordAttempt: (lessonId: string, questionId: string, isCorrect: boolean) => void;
  onPass?: () => void;
}

export const KnowledgeCheckCard: React.FC<KnowledgeCheckCardProps> = ({
  lessonId,
  question,
  savedScore,
  onRecordAttempt,
  onPass,
}) => {
  const isPassed = Boolean(savedScore?.passed);
  const [selectedOption, setSelectedOption] = useState<number | null>(() => {
    return isPassed ? question.correctIndex : null;
  });
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(isPassed);

  // Synchronize state if savedScore updates (e.g., storage rehydration or step navigation)
  React.useEffect(() => {
    if (savedScore?.passed) {
      setSelectedOption(question.correctIndex);
      setHasSubmitted(true);
    }
  }, [savedScore?.passed, question.correctIndex]);

  const handleSelectOption = (idx: number) => {
    if (hasSubmitted && isPassed) return; // Prevent changing if already passed
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === question.correctIndex;
    setHasSubmitted(true);

    onRecordAttempt(lessonId, question.id, isCorrect);

    if (isCorrect && onPass) {
      onPass();
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const isCurrentSelectionCorrect = selectedOption === question.correctIndex;

  return (
    <section 
      aria-labelledby={`kc-title-${question.id}`}
      className={`my-6 p-5 sm:p-6 rounded-2xl border transition-all ${
        isPassed
          ? 'bg-bg-surface/90 border-emerald-500/40 shadow-glow-green'
          : hasSubmitted && !isCurrentSelectionCorrect
          ? 'bg-bg-surface/90 border-rose-500/40'
          : 'bg-bg-surface border-bg-border shadow-glass'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-accent" />
          <span id={`kc-title-${question.id}`} className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            In-Lesson Knowledge Check
          </span>
        </div>
        {savedScore && savedScore.attempts > 0 && (
          <span className="text-[11px] text-text-muted">
            {savedScore.attempts} {savedScore.attempts === 1 ? 'attempt' : 'attempts'}
            {isPassed && ' • Passed ✓'}
          </span>
        )}
      </div>

      <h4 className="text-base sm:text-lg font-bold text-white mt-4 leading-snug">
        {question.question}
      </h4>

      {/* Answer options */}
      <div className="space-y-2.5 mt-4" role="radiogroup" aria-label="Question options">
        {question.options.map((option, idx) => {
          let style = 'bg-bg-dark border-bg-border hover:border-brand-primary/50 text-text-secondary';
          const isSelected = selectedOption === idx;

          if (hasSubmitted) {
            if (idx === question.correctIndex) {
              style = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-200 font-semibold';
            } else if (isSelected && !isCurrentSelectionCorrect) {
              style = 'bg-rose-500/10 border-rose-500/60 text-rose-300';
            }
          } else if (isSelected) {
            style = 'bg-brand-primary/10 border-brand-primary text-text-primary font-medium';
          }

          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={hasSubmitted && isPassed}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${style}`}
            >
              <span>{option}</span>
              {hasSubmitted && idx === question.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
              )}
              {hasSubmitted && isSelected && !isCurrentSelectionCorrect && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Immediate feedback & explanation */}
      {hasSubmitted && (
        <div 
          aria-live="polite"
          className={`mt-4 p-4 rounded-xl text-xs leading-relaxed space-y-1 ${
            isCurrentSelectionCorrect || isPassed
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-200'
          }`}
        >
          <span className="font-bold block">
            {isCurrentSelectionCorrect || isPassed ? '✓ Correct Answer!' : '✗ That is not correct.'}
          </span>
          <p>{question.explanation}</p>
        </div>
      )}

      {/* Submission / Retry Controls */}
      <div className="mt-5 flex items-center justify-end gap-3 pt-2">
        {hasSubmitted && !isCurrentSelectionCorrect && !isPassed ? (
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-bg-elevated hover:bg-bg-border border border-bg-border text-white text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        ) : !hasSubmitted ? (
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleSubmit}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-brand-primary ${
              selectedOption !== null
                ? 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-glow-primary active:scale-95'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-bg-border'
            }`}
          >
            <span>Check Answer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Requirement Passed</span>
          </div>
        )}
      </div>
    </section>
  );
};

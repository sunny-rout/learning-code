import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { NavigationTab } from '@/types';

interface QuizQuestion {
  id: number;
  question: string;
  source: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizViewProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ onNavigate }) => {
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "Do 'git add' and 'git commit' upload files to GitHub?",
      source: "PDF Section 2 (Page 3)",
      options: [
        "Yes, any commit is automatically pushed to GitHub.",
        "No, both commands operate solely on your local computer.",
        "Only git commit uploads files, git add stays local.",
        "Only if your remote origin is active."
      ],
      correctIndex: 1,
      explanation: "Remember the safety note from Section 2: 'git add' and 'git commit' do not upload anything to GitHub. Push ('git push') sends committed work to GitHub."
    },
    {
      id: 2,
      question: "What does the command 'git switch -c feature-login' accomplish?",
      source: "PDF Section 7 (Page 4)",
      options: [
        "Deletes the feature-login branch.",
        "Clones feature-login from GitHub.",
        "Creates a new branch named feature-login AND switches to it in one step.",
        "Compares feature-login against the main branch."
      ],
      correctIndex: 2,
      explanation: "Per Section 7: 'git switch -c creates and switches in one step.' The older syntax equivalent is 'git checkout -b'."
    },
    {
      id: 3,
      question: "Which command safely unstages a file while preserving all of your code changes?",
      source: "PDF Section 10 (Page 5)",
      options: [
        "git restore file.js",
        "git reset --hard HEAD~1",
        "git restore --staged file.js",
        "git clean -f"
      ],
      correctIndex: 2,
      explanation: "'git restore --staged file.js' unstages the file but keeps its edits. 'git restore file.js' discards unstaged edits in the working tree."
    },
    {
      id: 4,
      question: "When Git encounters a merge conflict, what markers does it insert into the file?",
      source: "PDF Section 9 (Page 5)",
      options: [
        "[[[ CURRENT ]]] vs [[[ REMOTE ]]]",
        "<<<<<<< HEAD, =======, and >>>>>>> branch-name",
        "<!-- CONFLICT START --> and <!-- CONFLICT END -->",
        "**ERROR: CONFLICT**"
      ],
      correctIndex: 1,
      explanation: "Git divides the conflicting code using '<<<<<<< HEAD' for the current branch, '=======' as the divider, and '>>>>>>> branch' for the incoming branch."
    },
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    if (idx === currentQ.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-brand-primary" />
          <span>Interactive Knowledge Check</span>
        </h1>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          Validate your understanding of concepts, syntax, and safety rules from the beginner&apos;s guide.
        </p>
      </div>

      {!isFinished ? (
        <div className="p-6 md:p-8 rounded-2xl bg-bg-surface border border-bg-border shadow-glass space-y-6">
          {/* Header indicator */}
          <div className="flex items-center justify-between text-xs pb-4 border-b border-bg-border">
            <span className="font-mono text-brand-accent font-semibold">
              QUESTION {currentIndex + 1} OF {questions.length}
            </span>
            <span className="text-text-muted">{currentQ.source}</span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              let optionStyle = 'bg-bg-dark border-bg-border hover:border-brand-primary/50 text-text-secondary';
              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  optionStyle = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold';
                } else if (idx === selectedAnswer) {
                  optionStyle = 'bg-rose-500/10 border-rose-500/50 text-rose-300';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswered && idx === selectedAnswer && idx !== currentQ.correctIndex && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className={`p-4 rounded-xl text-xs leading-relaxed space-y-1 ${
              selectedAnswer === currentQ.correctIndex
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-200'
            }`}>
              <span className="font-bold block">
                {selectedAnswer === currentQ.correctIndex ? 'Correct!' : 'Incorrect.'}
              </span>
              <p>{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center gap-2 shadow-glow-primary transition-all"
              >
                <span>{currentIndex + 1 === questions.length ? 'See Results' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-bg-surface border border-bg-border shadow-glass text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 text-brand-primary mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Quiz Completed!</h2>
            <p className="text-sm text-text-secondary mt-1">
              You scored <span className="font-bold text-brand-accent">{score}</span> out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-bg-border border border-bg-border text-white text-xs font-bold inline-flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('learn')}
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold inline-flex items-center gap-2 shadow-glow-primary transition-all"
              >
                <span>Browse Lessons</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

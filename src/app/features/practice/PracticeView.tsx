import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, ArrowRight, Terminal, Lock } from 'lucide-react';
import { NavigationTab } from '@/types';

interface PracticeViewProps {
  onNavigate?: (tab: NavigationTab) => void;
  onLaunchScenario?: (scenarioId: number) => void;
}

interface Exercise {
  id: number;
  title: string;
  pdfRef: string;
  difficulty: 'Beginner' | 'Intermediate';
  description: string;
  steps: string[];
  recommendedCommands: string[];
  completed: boolean;
  isPhase4?: boolean;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onNavigate, onLaunchScenario }) => {
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 1,
      title: 'Exercise 1: Initialize a Repository',
      pdfRef: 'PDF Section 15 (Page 8)',
      difficulty: 'Beginner',
      description: 'Create a local project directory, initialize an empty Git repository, and inspect initial status.',
      steps: [
        'Run git init in sandbox to create the repository',
        'Check repository status using git status',
        'Create a README.md file using touch README.md',
      ],
      recommendedCommands: ['git init', 'git status', 'touch README.md'],
      completed: true,
    },
    {
      id: 2,
      title: 'Exercise 2: Your First Commit',
      pdfRef: 'PDF Section 15 (Page 8 & 9)',
      difficulty: 'Beginner',
      description: 'Move your first file to the staging area and record an immutable checkpoint in local history.',
      steps: [
        'Stage README.md using git add README.md',
        'Commit the staged changes with a descriptive message',
        'View the commit history using git log --oneline',
      ],
      recommendedCommands: ['git add README.md', 'git commit -m "Initial commit"', 'git log --oneline'],
      completed: true,
    },
    {
      id: 3,
      title: 'Exercise 3: Branching Without Fear',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Beginner',
      description: 'Isolate changes from your main branch by creating and switching to a dedicated feature branch.',
      steps: [
        'Create and switch to feature/about using git switch -c feature/about',
        'Create about.txt and commit it on the feature branch',
        'Switch back to the main branch and verify file isolation',
      ],
      recommendedCommands: [
        'git switch -c feature/about',
        'touch about.txt',
        'git add about.txt',
        'git commit -m "Add about page"',
        'git switch main',
      ],
      completed: false,
    },
    {
      id: 4,
      title: 'Exercise 4: Merging Branches',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Beginner',
      description: 'Incorporate completed feature work from your feature branch cleanly into your main branch.',
      steps: [
        'Ensure you are checked out on the main branch',
        'Merge feature/about into main using git merge feature/about',
        'Verify merge history and file tree with git log --oneline',
      ],
      recommendedCommands: ['git switch main', 'git merge feature/about', 'git log --oneline'],
      completed: false,
    },
    {
      id: 5,
      title: 'Exercise 5: Connecting to GitHub & Pushing',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Intermediate',
      description: 'Establish a remote connection to GitHub and synchronize your local commits to the cloud.',
      steps: [
        'Add the remote URL as origin',
        'Push the main branch with upstream tracking (-u)',
        'Verify the remote connection with git remote -v',
      ],
      recommendedCommands: [
        'git remote add origin https://github.com/student/git-practice.git',
        'git push -u origin main',
        'git remote -v',
      ],
      completed: false,
    },
    {
      id: 6,
      title: 'Exercise 6: Undo and Stash Operations',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Intermediate',
      description: 'Safely recover from mistakes by discarding uncommitted edits, unstaging, and stashing work.',
      steps: [
        'Make an uncommitted modification and discard it with git restore',
        'Stage a file and unstage it using git restore --staged',
        'Temporarily save unfinished work with git stash and restore with git stash pop',
      ],
      recommendedCommands: ['git restore <file>', 'git restore --staged <file>', 'git stash push', 'git stash pop'],
      completed: false,
      isPhase4: true,
    },
  ]);

  const toggleComplete = (id: number) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, completed: !ex.completed } : ex)));
  };

  const completedCount = exercises.filter((e) => e.completed).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-brand-secondary" />
            <span>PDF Practice Checklist</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Hands-on exercises taken directly from Section 15 of the beginner&apos;s guide. Launch any exercise directly in the simulator.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-surface border border-bg-border shadow-sm">
          <span className="text-xs text-text-muted">Completed:</span>
          <span className="text-sm font-bold text-brand-secondary">{completedCount} / {exercises.length}</span>
          <div className="w-24 h-2 bg-bg-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-secondary transition-all"
              style={{ width: `${(completedCount / exercises.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              ex.completed
                ? 'bg-bg-surface/60 border-brand-secondary/30'
                : 'bg-bg-surface border-bg-border hover:border-brand-primary/40'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-brand-accent">
                      {ex.pdfRef}
                    </span>
                    {ex.isPhase4 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        Phase 4
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">{ex.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => toggleComplete(ex.id)}
                  className="text-text-muted hover:text-brand-secondary transition-colors"
                  aria-label={`Toggle completion for ${ex.title}`}
                >
                  {ex.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-secondary" />
                  ) : (
                    <Circle className="w-6 h-6 text-text-muted" />
                  )}
                </button>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {ex.description}
              </p>

              {/* Checklist items */}
              <div className="space-y-1.5 mb-4">
                {ex.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="text-brand-accent mt-0.5">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action and Target Commands */}
            <div className="pt-3 border-t border-bg-border/60 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider block mb-1.5">
                  Target Commands
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ex.recommendedCommands.map((cmd, idx) => (
                    <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-dark border border-bg-border text-brand-accent">
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>

              {ex.isPhase4 ? (
                <div className="w-full py-2 px-3 rounded-xl bg-bg-elevated border border-bg-border/80 text-text-muted text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-text-muted" />
                  <span>Coming in Phase 4 (Stash & Advanced Undo)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onLaunchScenario) {
                      onLaunchScenario(ex.id);
                    } else if (onNavigate) {
                      onNavigate('playground');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-glow-primary transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Launch in Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

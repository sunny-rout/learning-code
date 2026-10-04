import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, ArrowRight, Terminal } from 'lucide-react';
import { NavigationTab } from '@/types';

interface PracticeViewProps {
  onNavigate?: (tab: NavigationTab) => void;
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
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onNavigate }) => {
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 1,
      title: 'Exercise 1: Initialize a Repository',
      pdfRef: 'PDF Section 15 (Page 8)',
      difficulty: 'Beginner',
      description: 'Create a local project directory, initialize an empty Git repository, and inspect initial status.',
      steps: [
        'Create a folder called git-practice',
        'Run git init and check status',
        'Create a README.md file in the folder'
      ],
      recommendedCommands: ['mkdir git-practice', 'cd git-practice', 'git init', 'git status'],
      completed: true,
    },
    {
      id: 2,
      title: 'Exercise 2: Your First Commit',
      pdfRef: 'PDF Section 15 (Page 8 & 9)',
      difficulty: 'Beginner',
      description: 'Move your first file to the staging area and record an immutable checkpoint in local history.',
      steps: [
        'Stage README.md using git add',
        'Commit the staged changes with a descriptive message',
        'View the commit history using git log --oneline',
        'Edit the file and inspect changes with git diff'
      ],
      recommendedCommands: ['git add README.md', 'git commit -m "Initial commit"', 'git log --oneline', 'git diff'],
      completed: true,
    },
    {
      id: 3,
      title: 'Exercise 3: Branching Without Fear',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Beginner',
      description: 'Isolate changes from your main branch by creating and switching to a dedicated feature branch.',
      steps: [
        'Create and switch to feature/about in one command',
        'Create an about.txt file and commit it',
        'Switch back to the main branch'
      ],
      recommendedCommands: ['git switch -c feature/about', 'git add about.txt', 'git commit -m "Add about page"', 'git switch main'],
      completed: false,
    },
    {
      id: 4,
      title: 'Exercise 4: Merging Branches',
      pdfRef: 'PDF Section 15 (Page 9)',
      difficulty: 'Beginner',
      description: 'Incorporate completed feature work from your feature branch cleanly into your main branch.',
      steps: [
        'Ensure you are on the main branch',
        'Merge feature/about into main',
        'Verify that about.txt exists and check git log'
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
        'Simulate creating a GitHub repository',
        'Add the remote URL as origin',
        'Push the main branch with upstream tracking (-u)',
        'Verify the repository commits online'
      ],
      recommendedCommands: ['git remote add origin https://github.com/user/git-practice.git', 'git push -u origin main', 'git remote -v'],
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
        'Temporarily save unfinished work with git stash and restore with git stash pop'
      ],
      recommendedCommands: ['git restore <file>', 'git restore --staged <file>', 'git stash push -m "WIP"', 'git stash pop'],
      completed: false,
    },
  ]);

  const toggleComplete = (id: number) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const completedCount = exercises.filter(e => e.completed).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Target className="w-6 h-6 text-brand-secondary" />
            <span>PDF Practice Checklist</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Hands-on exercises taken directly from Section 15 of the beginner&apos;s guide.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-surface border border-bg-border">
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
            className={`p-5 rounded-2xl border transition-all ${
              ex.completed
                ? 'bg-bg-surface/60 border-brand-secondary/30'
                : 'bg-bg-surface border-bg-border hover:border-brand-primary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-brand-accent">
                  {ex.pdfRef}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{ex.title}</h3>
              </div>

              <button
                onClick={() => toggleComplete(ex.id)}
                className="text-text-muted hover:text-brand-secondary transition-colors"
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

            {/* Recommended commands */}
            <div className="pt-3 border-t border-bg-border/60">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider block mb-1.5">
                Target Commands
              </span>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ex.recommendedCommands.map((cmd, idx) => (
                  <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-dark border border-bg-border text-brand-accent">
                    {cmd}
                  </span>
                ))}
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('playground')}
                  className="w-full py-1.5 px-3 rounded-lg bg-bg-dark hover:bg-bg-elevated border border-bg-border text-text-secondary hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-brand-secondary" />
                  <span>Try in Sandbox Terminal</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

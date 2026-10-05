import React, { useState } from 'react';
import { TrendingUp, Flame, Award, BookOpen, ShieldCheck, Star, RotateCcw } from 'lucide-react';
import { FOUNDATIONAL_LESSONS } from '@/data/lessons';
import { NavigationTab } from '@/types';
import { useProgress } from '@/hooks/useProgress';

interface ProgressViewProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigate }) => {
  const { progress, streak, resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const completedLessons = FOUNDATIONAL_LESSONS.filter(
    (l) => progress.lessonProgress[l.id]?.completed
  );
  const completed = completedLessons.length;
  const total = FOUNDATIONAL_LESSONS.length;
  const percentage = Math.round((completed / total) * 100);

  const badges = [
    { 
      title: 'Repo Pioneer', 
      desc: 'Ran git init and verified repository status', 
      earned: Boolean(
        progress.lessonProgress['lesson-03']?.completed || 
        (progress.lessonProgress['lesson-03']?.completedStepIds && progress.lessonProgress['lesson-03'].completedStepIds.length > 0)
      ), 
      icon: Star 
    },
    { 
      title: 'Safe Committer', 
      desc: 'Mastered staged vs unstaged diffs and clean commit history', 
      earned: Boolean(progress.lessonProgress['lesson-04']?.completed), 
      icon: Award 
    },
    { 
      title: 'Branch Navigator', 
      desc: 'Mastered branch creation, switching, and HEAD safety', 
      earned: Boolean(progress.lessonProgress['lesson-07']?.completed), 
      icon: BookOpen 
    },
    { 
      title: 'Conflict Slayer', 
      desc: 'Resolved merge disputes and conflict markers cleanly', 
      earned: Boolean(progress.lessonProgress['lesson-09']?.completed), 
      icon: ShieldCheck 
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-brand-primary" />
          <span>Learning Analytics & Progress</span>
        </h1>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          Track your progress through all 17 units, practice streaks, and mastery achievements.
        </p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Modules Completed</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{completed}</span>
            <span className="text-xs text-text-muted">/ {total} units</span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-bg-dark overflow-hidden">
            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${percentage}%` }} />
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('learn')}
              className="mt-3 text-xs text-brand-primary hover:text-brand-accent font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Continue Next Unit &rarr;</span>
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{streak.currentStreak}</span>
            <span className="text-xs text-text-muted">days active</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-2">
            {streak.activeToday ? 'Active today! Keep the flame alive.' : streak.lastActiveDate ? `Last active: ${streak.lastActiveDate}` : 'Complete a lesson section to start your streak.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Core Units Mastered</span>
            <Award className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-brand-secondary">{completed}</span>
            <span className="text-xs text-text-muted">/ {total} completed</span>
          </div>
          {onNavigate ? (
            <button
              onClick={() => onNavigate('learn')}
              className="mt-2 text-xs text-brand-secondary hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Explore Curriculum &rarr;</span>
            </button>
          ) : (
            <p className="text-[11px] text-text-secondary mt-2">Interactive curriculum</p>
          )}
        </div>
      </div>

      {/* Badges Section */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-bg-border shadow-glass space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Mastery Milestones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  b.earned
                    ? 'bg-bg-elevated/70 border-brand-primary/40'
                    : 'bg-bg-dark/40 border-bg-border opacity-50'
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
                    b.earned ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-border text-text-muted'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{b.title}</h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-snug">{b.desc}</p>
                </div>
                <span className={`text-[10px] font-semibold mt-3 ${b.earned ? 'text-brand-secondary' : 'text-text-muted'}`}>
                  {b.earned ? '✓ Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Checklist & Source Citation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-bg-elevated to-bg-surface border border-bg-border space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-accent">
          <ShieldCheck className="w-4 h-4 text-brand-secondary" />
          <span>Curriculum Source Attribution</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Every concept, syntax pattern, and exercise is verified against the official documentation (<a href="https://git-scm.com/docs" target="_blank" rel="noreferrer" className="text-brand-accent underline">git-scm.com</a>) and the <strong className="text-white">Git Operations & Commands – Beginner&apos;s Guide</strong>.
        </p>
      </div>

      {/* Progress Administration / Reset Tool */}
      <div className="pt-4 border-t border-bg-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Reset Progress
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Clear all saved lessons, steps, and quiz scores to start fresh.
          </p>
        </div>

        <div>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-border text-text-secondary text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-border border border-bg-border text-text-muted hover:text-rose-400 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Learning Progress</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { TrendingUp, Flame, Award, CheckCircle2, BookOpen, Clock, ShieldCheck, Star } from 'lucide-react';
import { MODULES } from '@/data/modules';

export const ProgressView: React.FC = () => {
  const completedModuleIds = ['module-01', 'module-02', 'module-03'];
  const total = MODULES.length;
  const completed = completedModuleIds.length;
  const percentage = Math.round((completed / total) * 100);

  const badges = [
    { title: 'Repo Pioneer', desc: 'Ran git init and verified status', earned: true, icon: Star },
    { title: 'Safe Committer', desc: 'Understood staged vs unstaged diffs', earned: true, icon: Award },
    { title: 'Branch Navigator', desc: 'Mastered branch switching without detached HEAD', earned: false, icon: BookOpen },
    { title: 'Conflict Slayer', desc: 'Resolved a manual merge conflict cleanly', earned: false, icon: ShieldCheck },
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
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">3</span>
            <span className="text-xs text-text-muted">days active</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-2">Next reward unlocks in 2 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Terminal Commands Run</span>
            <Award className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-brand-secondary">18</span>
            <span className="text-xs text-text-muted">operations</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-2">In safe browser sandbox</p>
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
    </div>
  );
};

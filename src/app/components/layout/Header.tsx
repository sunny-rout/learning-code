import React from 'react';
import { GitBranch, Flame, Award, Terminal, Search } from 'lucide-react';
import { NavigationTab } from '@/types';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  streakDays?: number;
  completedCount?: number;
  totalModules?: number;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  streakDays = 3,
  completedCount = 4,
  totalModules = 17,
}) => {
  return (
    <header className="h-16 border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center shadow-glow-primary">
          <GitBranch className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              GitMastery
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-accent border border-brand-primary/30">
              Interactive
            </span>
          </div>
          <p className="text-xs text-text-muted hidden sm:block">Beginner to Pro Git & GitHub Journey</p>
        </div>
      </div>

      {/* Quick search / Jump to cheat sheet */}
      <div className="hidden md:flex items-center">
        <button
          onClick={() => setActiveTab('cheat-sheet')}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-bg-dark/80 border border-bg-border text-text-secondary hover:text-text-primary hover:border-brand-primary/50 text-xs transition-all w-64 shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <span>Search Git commands...</span>
          <kbd className="ml-auto text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded border border-bg-border text-text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* User stats & quick triggers */}
      <div className="flex items-center gap-4">
        {/* Learning Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>{streakDays} Day Streak</span>
        </div>

        {/* Completion Progress pill */}
        <div 
          onClick={() => setActiveTab('progress')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-medium cursor-pointer hover:bg-brand-primary/20 transition-all"
        >
          <Award className="w-4 h-4 text-brand-accent" />
          <span>{completedCount}/{totalModules} Modules</span>
        </div>

        {/* Launch Playground Quick Button */}
        <button
          onClick={() => setActiveTab('playground')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-primary-hover hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-primary transition-all active:scale-95"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open Playground</span>
        </button>
      </div>
    </header>
  );
};

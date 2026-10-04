import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Terminal, 
  Target, 
  HelpCircle, 
  TrendingUp, 
  FileCode2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { NavigationTab } from '@/types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn Modules', icon: BookOpen, badge: '17 Units', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'playground', label: 'Interactive Playground', icon: Terminal, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { id: 'practice', label: 'Practice Challenges', icon: Target },
    { id: 'quiz', label: 'Knowledge Quizzes', icon: HelpCircle },
    { id: 'progress', label: 'Progress & Stats', icon: TrendingUp },
    { id: 'cheat-sheet', label: 'Git Cheat Sheet', icon: FileCode2, badge: 'PDF Ref', badgeColor: 'bg-sky-500/20 text-sky-300' },
  ];

  return (
    <aside className="w-64 border-r border-bg-border bg-bg-surface/50 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 hidden lg:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-glow-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-brand-accent'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-bg-elevated text-text-muted'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Source citation card */}
        <div className="p-3.5 rounded-xl bg-bg-elevated/50 border border-bg-border/60">
          <div className="flex items-center gap-2 text-brand-accent text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Official Syllabus</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Curriculum sourced from <span className="text-text-secondary font-medium">Git Operations & Commands – Beginner's Guide</span> (W3Schools & git-scm.com).
          </p>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="pt-4 border-t border-bg-border/60">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
          <span>Educational Simulator (Safe Sandboxed)</span>
        </div>
      </div>
    </aside>
  );
};

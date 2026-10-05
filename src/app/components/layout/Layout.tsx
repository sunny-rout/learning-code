import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NavigationTab } from '@/types';
import { 
  LayoutDashboard, 
  BookOpen, 
  Terminal, 
  Target, 
  HelpCircle, 
  TrendingUp, 
  FileCode2 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  streakDays?: number;
  completedCount?: number;
  totalModules?: number;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  streakDays,
  completedCount,
  totalModules
}) => {
  const mobileNavItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'playground', label: 'Play', icon: Terminal },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'cheat-sheet', label: 'Cheats', icon: FileCode2 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-dark text-text-primary">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        streakDays={streakDays}
        completedCount={completedCount}
        totalModules={totalModules}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/95 backdrop-blur-lg border-t border-bg-border z-30 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors ${
                isActive ? 'text-brand-primary font-semibold' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

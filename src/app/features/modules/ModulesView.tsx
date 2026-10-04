import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Sparkles,
  FileText,
  X
} from 'lucide-react';
import { MODULES } from '@/data/modules';
import { ModuleItem, NavigationTab } from '@/types';

interface ModulesViewProps {
  selectedModuleId?: string;
  onSelectModuleId?: (id: string) => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({ 
  selectedModuleId, 
  onSelectModuleId,
  onNavigate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModule, setActiveModule] = useState<ModuleItem>(() => {
    if (selectedModuleId) {
      const found = MODULES.find(m => m.id === selectedModuleId);
      if (found) return found;
    }
    return MODULES[0];
  });
  const [isLessonOpen, setIsLessonOpen] = useState<boolean>(false);

  // Sync external selectedModuleId
  React.useEffect(() => {
    if (selectedModuleId) {
      const found = MODULES.find(m => m.id === selectedModuleId);
      if (found) {
        setActiveModule(found);
      }
    }
  }, [selectedModuleId]);

  const handleSelectModule = (module: ModuleItem) => {
    setActiveModule(module);
    if (onSelectModuleId) {
      onSelectModuleId(module.id);
    }
  };

  const categories = ['All', 'Fundamentals', 'Daily Workflow', 'Branching & Merging', 'History & Recovery', 'Advanced'];

  const filteredModules = MODULES.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesQuery = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.commands.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-primary" />
            <span>Interactive Learning Curriculum</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            17 modules transitioning from complete Git beginner to advanced real-world workflows.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or commands..."
            className="w-full bg-bg-surface border border-bg-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary placeholder:text-text-muted transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-primary text-white shadow-glow-primary'
                : 'bg-bg-surface border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredModules.map((module) => {
            const isSelected = activeModule.id === module.id;
            return (
              <div
                key={module.id}
                onClick={() => handleSelectModule(module)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-bg-elevated border-brand-primary shadow-glow-primary'
                    : 'bg-bg-surface/80 border-bg-border hover:border-bg-border/80 hover:bg-bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isSelected
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-dark border border-bg-border text-text-secondary'
                    }`}>
                      {String(module.number).padStart(2, '0')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{module.title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-text-muted">
                          {module.category}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {module.description}
                      </p>

                      {/* Commands preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {module.commands.map((cmd, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-dark text-brand-accent border border-bg-border"
                          >
                            {cmd}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span>{module.durationMinutes}m</span>
                    </div>
                    <span className="text-[10px] text-text-muted">PDF Sec {module.pdfSection}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Module Detail Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-bg-surface border border-bg-border p-5 space-y-5 shadow-glass">
            <div className="flex items-center justify-between pb-3 border-b border-bg-border">
              <span className="text-xs font-mono font-semibold text-brand-accent">
                UNIT {String(activeModule.number).padStart(2, '0')} PREVIEW
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
                PDF Source: Sec {activeModule.pdfSection}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{activeModule.title}</h2>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                {activeModule.description}
              </p>
            </div>

            {/* Learning Phases Inside This Module */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Module Breakdown
              </h4>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="p-2 rounded-lg bg-bg-dark/60 border border-bg-border/60 flex items-center justify-between">
                  <span>1. Intuition & Real-world Analogy</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="p-2 rounded-lg bg-bg-dark/60 border border-bg-border/60 flex items-center justify-between">
                  <span>2. Visual State Diagram</span>
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="p-2 rounded-lg bg-bg-dark/60 border border-bg-border/60 flex items-center justify-between">
                  <span>3. Terminal Simulator Practice</span>
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="p-2 rounded-lg bg-bg-dark/60 border border-bg-border/60 flex items-center justify-between">
                  <span>4. Quick Knowledge Check</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Command targets */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Target Commands
              </h4>
              <div className="space-y-1">
                {activeModule.commands.map((cmd, idx) => (
                  <div key={idx} className="font-mono text-xs px-2.5 py-1.5 rounded-lg bg-bg-dark border border-bg-border text-brand-accent">
                    $ {cmd}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsLessonOpen(true)}
              className="w-full py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-glow-primary transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Start Unit {activeModule.number}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Modal / Drawer */}
      {isLessonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-bg-surface border border-bg-border rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-bg-border">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-accent">
                  UNIT {String(activeModule.number).padStart(2, '0')}
                </span>
                <span className="text-xs text-text-muted">PDF Source: Section {activeModule.pdfSection}</span>
              </div>
              <button
                onClick={() => setIsLessonOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{activeModule.title}</h2>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{activeModule.description}</p>
            </div>

            {/* 6-step curriculum roadmap inside unit */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Interactive Learning Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-bg-dark border border-indigo-500/20 space-y-1">
                  <span className="font-bold text-indigo-300">1. Intuition & Real-World Analogy</span>
                  <p className="text-text-muted text-[11px]">
                    Mental models that make Git behavior instantly click for beginners.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-bg-dark border border-sky-500/20 space-y-1">
                  <span className="font-bold text-sky-300">2. 4-Stage State Diagram</span>
                  <p className="text-text-muted text-[11px]">
                    See how files transition between Working Dir, Staging, Local Repo & Remote.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-bg-dark border border-emerald-500/20 space-y-1">
                  <span className="font-bold text-emerald-300">3. Terminal Sandbox Practice</span>
                  <p className="text-text-muted text-[11px]">
                    Practice target commands with real-time feedback and state verification.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-bg-dark border border-amber-500/20 space-y-1">
                  <span className="font-bold text-amber-300">4. Knowledge Check Quiz</span>
                  <p className="text-text-muted text-[11px]">
                    Validate key syntax, flags, and common pitfalls before moving to next unit.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Commands */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Commands Covered
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeModule.commands.map((cmd, idx) => (
                  <span key={idx} className="font-mono text-xs px-3 py-1.5 rounded-lg bg-bg-dark border border-bg-border text-brand-accent">
                    $ {cmd}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-bg-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    onClick={() => {
                      setIsLessonOpen(false);
                      onNavigate('playground');
                    }}
                    className="px-4 py-2 rounded-xl bg-bg-elevated hover:bg-bg-border text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-brand-secondary" />
                    <span>Try in Sandbox</span>
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => {
                      setIsLessonOpen(false);
                      onNavigate('practice');
                    }}
                    className="px-4 py-2 rounded-xl bg-bg-elevated hover:bg-bg-border text-white text-xs font-semibold transition-colors"
                  >
                    <span>Practice Exercises</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsLessonOpen(false)}
                className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

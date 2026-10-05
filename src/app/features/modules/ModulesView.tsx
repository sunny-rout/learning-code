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
  Lock,
  PlayCircle
} from 'lucide-react';
import { MODULES } from '@/data/modules';
import { ModuleItem, NavigationTab } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { getLessonForModule, getLessonMetadataForModule } from '@/data/lessons';

interface ModulesViewProps {
  selectedModuleId?: string;
  onSelectModuleId?: (id: string) => void;
  onNavigate?: (tab: NavigationTab) => void;
  onStartLesson?: (lessonId: string) => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({ 
  selectedModuleId, 
  onSelectModuleId,
  onStartLesson 
}) => {
  const { getLessonProgress } = useProgress();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModule, setActiveModule] = useState<ModuleItem>(() => {
    if (selectedModuleId) {
      const found = MODULES.find(m => m.id === selectedModuleId);
      if (found) return found;
    }
    return MODULES[0];
  });

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
            const lessonMeta = getLessonMetadataForModule(module.id);
            const lesson = getLessonForModule(module.id);
            const targetLessonId = lesson?.id || lessonMeta?.id;
            const lessonProg = targetLessonId ? getLessonProgress(targetLessonId) : null;
            const isCompleted = lessonProg ? lessonProg.completed : false;
            const isInProgress = lessonProg
              ? !isCompleted && (lessonProg.completedStepIds.length > 0 || Boolean(lessonProg.currentStepId))
              : false;

            return (
              <div
                key={module.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectModule(module)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectModule(module);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isSelected
                    ? 'bg-bg-elevated border-brand-primary shadow-glow-primary'
                    : isCompleted
                    ? 'bg-emerald-500/[0.04] border-emerald-500/30 hover:border-emerald-500/60 hover:bg-bg-surface'
                    : isInProgress
                    ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/60 hover:bg-bg-surface'
                    : 'bg-bg-surface/80 border-bg-border hover:border-bg-border/80 hover:bg-bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                      isSelected
                        ? 'bg-brand-primary text-white'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-bg-dark border border-bg-border text-text-secondary'
                    }`}>
                      {String(module.number).padStart(2, '0')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{module.title}</h3>
                        
                        {isCompleted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                            In Progress ({lessonProg?.completedStepIds.length ?? 0}/{lesson ? lesson.steps.length : '?'})
                          </span>
                        ) : lesson ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-accent font-semibold">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-text-muted">
                            Syllabus
                          </span>
                        )}

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-text-muted hidden sm:inline">
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
          {(() => {
            const activeLessonMeta = getLessonMetadataForModule(activeModule.id);
            const activeLesson = getLessonForModule(activeModule.id);
            const targetLessonId = activeLesson?.id || activeLessonMeta?.id;
            const activeLessonProg = targetLessonId ? getLessonProgress(targetLessonId) : null;
            const isCompleted = activeLessonProg ? activeLessonProg.completed : false;
            const isInProgress = activeLessonProg
              ? !isCompleted && (activeLessonProg.completedStepIds.length > 0 || Boolean(activeLessonProg.currentStepId))
              : false;

            return (
              <div className="sticky top-20 rounded-2xl bg-bg-surface border border-bg-border p-5 space-y-5 shadow-glass">
                <div className="flex items-center justify-between pb-3 border-b border-bg-border">
                  <span className="text-xs font-mono font-semibold text-brand-accent">
                    UNIT {String(activeModule.number).padStart(2, '0')} OVERVIEW
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium border border-brand-primary/20">
                    PDF Source: Sec {activeModule.pdfSection}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-white">{activeModule.title}</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {activeLesson?.subtitle || activeModule.description}
                  </p>
                </div>

                {/* Learning Steps / Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {activeLesson ? 'Curriculum Steps' : 'Module Breakdown'}
                  </h4>
                  {activeLesson ? (
                    <div className="space-y-1.5 text-xs text-text-secondary">
                      {activeLesson.steps.map((step, idx) => {
                        const isStepDone = activeLessonProg?.completedStepIds.includes(step.id);
                        return (
                          <div 
                            key={step.id} 
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              isStepDone 
                                ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300' 
                                : 'bg-bg-dark/60 border-bg-border/60'
                            }`}
                          >
                            <span className="truncate max-w-[200px]">
                              {idx + 1}. {step.title}
                            </span>
                            {isStepDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : step.knowledgeCheck ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
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
                  )}
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

                {/* Primary Action Button */}
                {targetLessonId ? (
                  <button 
                    type="button"
                    onClick={() => onStartLesson && onStartLesson(targetLessonId)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                      isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green'
                        : isInProgress
                        ? 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-glow-primary'
                        : 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-glow-primary'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        <span>Review Unit {activeModule.number}</span>
                      </>
                    ) : isInProgress ? (
                      <>
                        <span>Resume Unit {activeModule.number}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Start Unit {activeModule.number}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-bg-elevated border border-bg-border text-text-muted text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Interactive Unit Coming in Phase 3</span>
                    </button>
                    <p className="text-[11px] text-text-muted text-center leading-relaxed">
                      Syllabus & practice exercises are available in the Practice section.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

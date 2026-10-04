import React from 'react';
import { 
  Rocket, 
  Terminal, 
  ArrowRight, 
  GitCommit, 
  Award,
  Sparkles
} from 'lucide-react';
import { MODULES } from '@/data/modules';
import { NavigationTab } from '@/types';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectModule?: (moduleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectModule }) => {
  const currentModule = MODULES[3]; // Staging and Committing (Module 4)

  const handleModuleClick = (moduleId: string) => {
    if (onSelectModule) {
      onSelectModule(moduleId);
    } else {
      onNavigate('learn');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-dark border border-bg-border p-6 md:p-8 shadow-glass">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-accent text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Git Learning Journey</span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Master Git & GitHub Through <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-accent via-indigo-300 to-brand-primary bg-clip-text text-transparent">
                Visual Intuition & Practical Simulators
              </span>
            </h1>

            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Based on the official <strong className="text-text-primary">Git Operations & Commands Guide</strong>. Learn when and why to use each command, visualize the 4-stage pipeline, and build muscle memory with live terminal practice.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('learn')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold shadow-glow-primary transition-all active:scale-95"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('playground')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-bg-border border border-bg-border text-text-primary text-sm font-semibold transition-all hover:border-brand-primary/40"
              >
                <Terminal className="w-4 h-4 text-brand-secondary" />
                <span>Open Simulator</span>
              </button>
            </div>
          </div>

          {/* Quick Continue Card */}
          <div className="w-full lg:w-80 p-5 rounded-xl bg-bg-dark/60 border border-bg-border/80 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="uppercase tracking-wider font-semibold text-brand-accent">Up Next</span>
              <span>Unit {currentModule.number} of {MODULES.length}</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{currentModule.title}</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                {currentModule.description}
              </p>
            </div>

            {/* Progress mini bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Overall Progress</span>
                <span className="text-text-primary font-medium">24%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full w-[24%]" />
              </div>
            </div>

            <button
              onClick={() => handleModuleClick(currentModule.id)}
              className="w-full py-2 px-3 rounded-lg bg-bg-elevated hover:bg-brand-primary/20 border border-brand-primary/30 text-brand-accent text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <span>Resume Lesson</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* The 6-Step Learning Methodology Banner */}
      <div className="rounded-xl border border-bg-border bg-bg-surface/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Our Learning Sequence
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1. UNDERSTAND', desc: 'Core intuition & analogies', color: 'text-indigo-400 border-indigo-500/30' },
            { step: '2. VISUALIZE', desc: '4-stage state animation', color: 'text-sky-400 border-sky-500/30' },
            { step: '3. EXPLORE', desc: 'Inspect syntax & flags', color: 'text-cyan-400 border-cyan-500/30' },
            { step: '4. PRACTISE', desc: 'Safe browser terminal', color: 'text-emerald-400 border-emerald-500/30' },
            { step: '5. APPLY', desc: 'Real branch & PR story', color: 'text-amber-400 border-amber-500/30' },
            { step: '6. TEST', desc: 'Predict-the-output quizzes', color: 'text-rose-400 border-rose-500/30' },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg bg-bg-dark/40 border ${item.color} flex flex-col justify-between`}>
              <span className="text-xs font-bold">{item.step}</span>
              <span className="text-[11px] text-text-muted mt-1">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Practice Exercises */}
        <div 
          onClick={() => onNavigate('practice')}
          className="p-5 rounded-xl bg-bg-surface border border-bg-border hover:border-brand-secondary/40 transition-all cursor-pointer group hover:shadow-glow-green"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary mb-3 group-hover:scale-110 transition-transform">
            <Rocket className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-secondary transition-colors">
            PDF Practice Checklist
          </h3>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Complete the 6 practical exercises defined in the guide: Initialize, First Commit, Branching, Merging, GitHub, and Undo/Stash.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-secondary">
            <span>Start Exercises</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Git Command Quick Reference */}
        <div 
          onClick={() => onNavigate('cheat-sheet')}
          className="p-5 rounded-xl bg-bg-surface border border-bg-border hover:border-brand-accent/40 transition-all cursor-pointer group hover:shadow-glow-accent"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-3 group-hover:scale-110 transition-transform">
            <GitCommit className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-accent transition-colors">
            Command Quick Reference
          </h3>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Searchable command cheat sheet from Section 12 of the guide with syntax, flags, danger levels, and common mistakes.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
            <span>Browse Commands</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Knowledge Quizzes */}
        <div 
          onClick={() => onNavigate('quiz')}
          className="p-5 rounded-xl bg-bg-surface border border-bg-border hover:border-brand-primary/40 transition-all cursor-pointer group hover:shadow-glow-primary"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-3 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-brand-primary transition-colors">
            Interactive Knowledge Quizzes
          </h3>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Test yourself with predict-the-output questions, command ordering, and troubleshooting scenarios.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
            <span>Take a Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Curriculum Overview by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Curriculum Modules</h2>
            <p className="text-xs text-text-muted">17 structured units matching the comprehensive syllabus</p>
          </div>
          <button 
            onClick={() => onNavigate('learn')}
            className="text-xs font-semibold text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1"
          >
            <span>View All Modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.slice(0, 6).map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className="p-4 rounded-xl bg-bg-surface/70 border border-bg-border hover:border-brand-primary/40 transition-all cursor-pointer hover:bg-bg-elevated/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-brand-accent font-semibold">Unit {String(module.number).padStart(2, '0')}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-dark border border-bg-border text-text-muted">
                    {module.category}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-white">{module.title}</h4>
                <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                  {module.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-bg-border/60 flex items-center justify-between text-[11px] text-text-muted">
                <span>{module.durationMinutes} mins</span>
                <span className="font-mono text-text-secondary">{module.commands[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

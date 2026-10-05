import React from 'react';
import { ScenarioDefinition } from '@/types/simulator';
import { Target, CheckCircle2, Award } from 'lucide-react';

interface ScenarioStatusBarProps {
  scenario: ScenarioDefinition;
  isCompleted: boolean;
  onExitScenario: () => void;
}

export const ScenarioStatusBar: React.FC<ScenarioStatusBarProps> = ({
  scenario,
  isCompleted,
  onExitScenario,
}) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isCompleted
        ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-glow-green'
        : 'bg-bg-surface border-brand-primary/30 shadow-glass'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-accent">
              PRACTICE CHALLENGE
            </span>
            <span className="text-[11px] text-text-muted">{scenario.subtitle}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-primary" />
            <span>{scenario.title}</span>
          </h2>
          <p className="text-xs text-text-secondary">
            {scenario.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fadeIn">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Exercise Completed!</span>
            </div>
          ) : (
            <div className="text-xs text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>In Progress</span>
            </div>
          )}

          <button
            type="button"
            onClick={onExitScenario}
            className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-border text-text-secondary hover:text-white text-xs font-medium transition-colors"
          >
            <span>Exit Practice Mode</span>
          </button>
        </div>
      </div>

      {/* Target steps checklist */}
      <div className="mt-3 pt-3 border-t border-bg-border/60">
        <div className="text-[10px] uppercase font-bold text-text-muted mb-1.5">
          Goal Steps to Accomplish:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {scenario.steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-bg-dark/60 border-bg-border/60 text-text-secondary'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-bg-surface text-[10px] font-bold flex items-center justify-center shrink-0 border border-bg-border">
                  {idx + 1}
                </span>
              )}
              <span className="truncate">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

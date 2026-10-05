import React from 'react';
import { StateChangeSummary } from '@/types/simulator';
import { Lightbulb, Layers } from 'lucide-react';

interface StateChangeExplainerProps {
  explanation?: StateChangeSummary;
}

export const StateChangeExplainer: React.FC<StateChangeExplainerProps> = ({ explanation }) => {
  if (!explanation) {
    return (
      <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-bg-border/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400/60" />
          <span>Execute any Git command above to see real-time state analysis and architecture explanation.</span>
        </div>
        <span className="text-[10px] font-mono text-brand-secondary">Ready</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-bg-surface border border-brand-primary/30 shadow-glass animate-fadeIn space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-accent">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span>What Just Happened: {explanation.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-text-muted" />
          <span className="text-[10px] text-text-muted font-medium">
            Affected: {explanation.affectedStages.join(' → ')}
          </span>
        </div>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed pl-6">
        {explanation.description}
      </p>
    </div>
  );
};

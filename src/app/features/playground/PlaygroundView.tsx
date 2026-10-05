import React, { useState } from 'react';
import { useGitSimulator } from '@/hooks/useGitSimulator';
import { GitConsole } from './GitConsole';
import { PipelineStageView } from './PipelineStageView';
import { CommitGraphView } from './CommitGraphView';
import { StateChangeExplainer } from './StateChangeExplainer';
import { ScenarioStatusBar } from './ScenarioStatusBar';
import { Terminal, RefreshCw, Layers, GitBranch, Target } from 'lucide-react';

interface PlaygroundViewProps {
  initialScenarioId?: number | null;
  onExitScenario?: () => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  initialScenarioId = null,
  onExitScenario,
}) => {
  const {
    repoState,
    outputHistory,
    commandHistory,
    runCommand,
    resetSandbox,
    activeScenarioId,
    activeScenario,
    isScenarioCompleted,
  } = useGitSimulator(initialScenarioId);

  const [mobileTab, setMobileTab] = useState<'console' | 'graph'>('console');

  const latestEntry = outputHistory.length > 0 ? outputHistory[outputHistory.length - 1] : undefined;

  const handleScenarioSelect = (val: string) => {
    if (val === 'freeform') {
      resetSandbox(null);
    } else {
      const sId = parseInt(val, 10);
      if (!isNaN(sId)) {
        resetSandbox(sId);
      }
    }
  };

  const QUICK_COMMANDS = ['git status', 'git add .', 'git commit -m "Update"', 'git log --oneline', 'git switch main'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Sandbox Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-brand-secondary" />
            <span>Interactive Git Sandbox & Visualizer</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Experiment with Git operations in a sandboxed in-memory engine and watch the repository state evolve in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scenario Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface border border-bg-border text-xs text-text-secondary">
            <Target className="w-3.5 h-3.5 text-brand-primary" />
            <select
              value={activeScenarioId ? String(activeScenarioId) : 'freeform'}
              onChange={(e) => handleScenarioSelect(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              aria-label="Select practice scenario or freeform sandbox"
            >
              <option value="freeform" className="bg-bg-dark text-white">Freeform Sandbox</option>
              <option value="1" className="bg-bg-dark text-white">Ex 1: Initialize Repository</option>
              <option value="2" className="bg-bg-dark text-white">Ex 2: Your First Commit</option>
              <option value="3" className="bg-bg-dark text-white">Ex 3: Branching Without Fear</option>
              <option value="4" className="bg-bg-dark text-white">Ex 4: Merging Branches</option>
              <option value="5" className="bg-bg-dark text-white">Ex 5: Remote & Pushing</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => resetSandbox(activeScenarioId)}
            className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-secondary hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Reset sandbox repository"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sandbox</span>
          </button>
        </div>
      </div>

      {/* Active Practice Scenario Status Checklist Banner (if active) */}
      {activeScenario && (
        <ScenarioStatusBar
          scenario={activeScenario}
          isCompleted={isScenarioCompleted}
          onExitScenario={() => {
            resetSandbox(null);
            if (onExitScenario) onExitScenario();
          }}
        />
      )}

      {/* 4-Stage Architecture Pipeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-text-muted px-1">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-accent" />
            <span>Live 4-Stage Git Repository Pipeline</span>
          </span>
          <span className="font-mono text-[11px]">Deterministic State Engine</span>
        </div>
        <PipelineStageView repoState={repoState} />
      </div>

      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden items-center justify-center p-1 rounded-xl bg-bg-surface border border-bg-border">
        <button
          type="button"
          onClick={() => setMobileTab('console')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'console'
              ? 'bg-brand-primary text-white shadow-glow-primary'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Git Console & Status</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('graph')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'graph'
              ? 'bg-brand-primary text-white shadow-glow-primary'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Commit Graph (DAG)</span>
        </button>
      </div>

      {/* Main Dual-Column Interactive Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Command Console (7 cols on lg) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'graph' ? 'hidden lg:block' : 'block'}`}>
          <GitConsole
            outputHistory={outputHistory}
            commandHistory={commandHistory}
            activeBranch={repoState.activeBranch}
            onExecuteCommand={runCommand}
            onClear={() => runCommand('clear')}
          />

          {/* Quick-Action Command Chips for Touchscreens / Fast Exploration */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-text-muted shrink-0 mr-1">Quick:</span>
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => runCommand(cmd)}
                className="px-2.5 py-1 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-secondary hover:text-brand-accent font-mono text-[11px] whitespace-nowrap transition-colors"
              >
                $ {cmd}
              </button>
            ))}
          </div>

          {/* What Just Happened Educational Theory Explainer */}
          <StateChangeExplainer explanation={latestEntry?.explanation} />
        </div>

        {/* Right Column: Commit Graph DAG (5 cols on lg) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'console' ? 'hidden lg:block' : 'block'}`}>
          <CommitGraphView repoState={repoState} />

          {/* Educational Safety Banner */}
          <div className="p-3.5 rounded-xl bg-bg-surface/50 border border-bg-border/60 text-xs text-text-secondary space-y-1">
            <span className="font-bold text-white block">Interactive Safety Guarantee:</span>
            <p className="text-[11px] leading-relaxed text-text-muted">
              All commands execute in memory within your browser sandbox. Commits, branch pointers, and merges never alter your local machine or real files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

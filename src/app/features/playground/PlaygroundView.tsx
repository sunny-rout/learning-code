import React, { useState } from 'react';
import { Terminal, Layers, RefreshCw, Info } from 'lucide-react';

export const PlaygroundView: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '# Welcome to GitLearn Sandbox Terminal (Phase 1 Application Shell)',
    '# Sourced from Git Operations & Commands Guide (W3Schools & git-scm.com)',
    '# Try typing: git status, git init, git add ., or git log'
  ]);

  const handleReset = () => {
    setTerminalLines([
      '# Sandbox reset. Working tree refreshed.',
      '# Try typing: git status, git init, git add ., or git log'
    ]);
    setInputVal('');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const newLines = [...terminalLines, `$ ${trimmed}`];

    if (trimmed === 'git status') {
      newLines.push(
        'On branch main',
        'No commits yet',
        'Untracked files: (use "git add <file>..." to include in what will be committed)',
        '  README.md',
        'nothing added to commit but untracked files present'
      );
    } else if (trimmed === 'git init') {
      newLines.push('Initialized empty Git repository in /home/student/my-first-project/.git/');
    } else if (trimmed === 'git add .' || trimmed === 'git add README.md') {
      newLines.push('Changes to be committed: (use "git restore --staged <file>..." to unstage)', '  new file:   README.md');
    } else if (trimmed.startsWith('git commit')) {
      newLines.push('[main (root-commit) 4a8f92c] Initial commit', ' 1 file changed, 1 insertion(+)');
    } else if (trimmed === 'clear') {
      setTerminalLines([]);
      setInputVal('');
      return;
    } else {
      newLines.push(`[Phase 1 Shell] Command recognized: '${trimmed}'. Full in-memory engine arriving in Phase 2.`);
    }

    setTerminalLines(newLines);
    setInputVal('');
  };
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Terminal className="w-6 h-6 text-brand-secondary" />
            <span>Interactive Git Sandbox & Playground</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Experiment with Git operations in a sandboxed educational terminal and watch repository state evolve in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-text-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95"
            aria-label="Reset Sandbox"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sandbox</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Workflow Architecture Visualization Preview */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border shadow-glass space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Live 4-Stage Git Repository Pipeline
            </h3>
          </div>
          <span className="text-[11px] text-text-muted">Pure in-memory state</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage 1: Working Directory */}
          <div className="p-4 rounded-xl bg-bg-dark/80 border border-amber-500/30 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">1. Working Directory</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">Uncommitted</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Files on your local disk. New and modified files live here before being prepared.
              </p>
            </div>
            <div className="pt-3 border-t border-bg-border/60">
              <span className="font-mono text-[11px] text-text-secondary block truncate">
                $ git add &lt;file&gt;
              </span>
            </div>
          </div>

          {/* Stage 2: Staging Area */}
          <div className="p-4 rounded-xl bg-bg-dark/80 border border-emerald-500/30 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400">2. Staging Area (Index)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">Staged</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                The draft checkpoint. You handpick changes that will go into the next commit snapshot.
              </p>
            </div>
            <div className="pt-3 border-t border-bg-border/60">
              <span className="font-mono text-[11px] text-text-secondary block truncate">
                $ git commit -m &quot;...&quot;
              </span>
            </div>
          </div>

          {/* Stage 3: Local Repository */}
          <div className="p-4 rounded-xl bg-bg-dark/80 border border-indigo-500/30 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-400">3. Local Repository</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">HEAD</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Immutable snapshots inside your hidden .git database. Stored safely on your computer.
              </p>
            </div>
            <div className="pt-3 border-t border-bg-border/60">
              <span className="font-mono text-[11px] text-text-secondary block truncate">
                $ git push origin main
              </span>
            </div>
          </div>

          {/* Stage 4: Remote Repository */}
          <div className="p-4 rounded-xl bg-bg-dark/80 border border-sky-500/30 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400">4. Remote (GitHub)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono">origin</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Cloud repository for backups and team collaboration. Synced via push, fetch, and pull.
              </p>
            </div>
            <div className="pt-3 border-t border-bg-border/60">
              <span className="font-mono text-[11px] text-text-secondary block truncate">
                $ git pull origin main
              </span>
            </div>
          </div>
        </div>

        {/* Safety Note banner from PDF */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Safety Golden Rule from Guide:</strong> <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">git add</code> and <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">git commit</code> operate strictly on your local machine and <em>never</em> upload anything to GitHub.
          </span>
        </div>
      </div>

      {/* Terminal Simulator Window Shell */}
      <div className="rounded-2xl border border-bg-border bg-bg-dark/95 shadow-glass overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 bg-bg-surface/80 border-b border-bg-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-text-muted ml-2">bash – simulated-git-terminal</span>
          </div>

          <span className="text-[11px] font-mono text-brand-secondary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
            Safe Mode (In-Memory Engine)
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs space-y-2 min-h-[260px] max-h-[400px] overflow-y-auto">
          {terminalLines.map((line, idx) => {
            if (line.startsWith('$ ')) {
              return (
                <div key={idx} className="text-text-secondary flex items-center gap-2 pt-1">
                  <span className="text-emerald-400">student@laptop</span>
                  <span className="text-text-muted">:</span>
                  <span className="text-brand-accent">~/my-first-project</span>
                  <span className="text-text-muted">(main)</span>
                  <span className="text-text-primary">$</span>
                  <span className="text-white font-semibold">{line.slice(2)}</span>
                </div>
              );
            }
            if (line.startsWith('#')) {
              return <div key={idx} className="text-text-muted italic">{line}</div>;
            }
            return (
              <div key={idx} className="text-slate-300 pl-4 border-l-2 border-brand-primary/40 leading-relaxed">
                {line}
              </div>
            );
          })}

          {/* Interactive Command Input Form */}
          <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-2">
            <span className="text-emerald-400">student@laptop</span>
            <span className="text-text-muted">:</span>
            <span className="text-brand-accent">~/my-first-project</span>
            <span className="text-text-muted">(main)</span>
            <span className="text-text-primary">$</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="type git command..."
              className="flex-1 bg-transparent border-none text-text-primary font-mono text-xs focus:outline-none placeholder:text-text-muted/50"
              autoFocus
              aria-label="Terminal command input"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

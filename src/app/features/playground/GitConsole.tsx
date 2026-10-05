import React, { useState, useEffect, useRef } from 'react';
import { ConsoleOutputEntry } from '@/hooks/useGitSimulator';
import { Terminal, Shield, CornerDownLeft } from 'lucide-react';

interface GitConsoleProps {
  outputHistory: ConsoleOutputEntry[];
  commandHistory: string[];
  activeBranch: string | null;
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
}

const COMMON_GIT_COMMANDS = [
  'git status',
  'git init',
  'git add .',
  'git add README.md',
  'git rm ',
  'git rm --cached ',
  'git commit -m ""',
  'git log --oneline',
  'git diff',
  'git diff --staged',
  'git branch',
  'git switch main',
  'git switch -c feature/about',
  'git merge',
  'git remote -v',
  'git push -u origin main',
  'touch README.md',
  'clear',
  'help',
];

export const GitConsole: React.FC<GitConsoleProps> = ({
  outputHistory,
  commandHistory,
  activeBranch,
  onExecuteCommand,
  onClear: _onClear,
}) => {
  const [inputValue, setInputValue] = useState('');
  const historyCursor = useRef<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputValue.trim();
    if (!cmd) return;

    onExecuteCommand(cmd);
    setInputValue('');
    historyCursor.current = -1;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Up arrow: walk back in history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const nextCursor =
        historyCursor.current === -1
          ? commandHistory.length - 1
          : Math.max(0, historyCursor.current - 1);

      historyCursor.current = nextCursor;
      setInputValue(commandHistory[nextCursor] || '');
      return;
    }

    // Down arrow: walk forward in history
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length === 0 || historyCursor.current === -1) return;

      const nextCursor = historyCursor.current + 1;
      if (nextCursor >= commandHistory.length) {
        historyCursor.current = -1;
        setInputValue('');
      } else {
        historyCursor.current = nextCursor;
        setInputValue(commandHistory[nextCursor] || '');
      }
      return;
    }

    // Tab: auto-complete command prefix
    if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputValue.trim();
      if (!current) return;

      const match = COMMON_GIT_COMMANDS.find((cmd) => cmd.startsWith(current) && cmd !== current);
      if (match) {
        setInputValue(match);
      }
    }
  };

  const branchDisplay = activeBranch ? activeBranch : 'HEAD detached';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="rounded-2xl border border-bg-border bg-bg-dark/95 shadow-glass overflow-hidden flex flex-col h-[460px] cursor-text"
    >
      {/* Console Title Bar */}
      <div className="px-4 py-2.5 bg-bg-surface/90 border-b border-bg-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-text-muted ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-accent" />
            <span>git-console — ~/my-first-project</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-brand-secondary">
          <Shield className="w-3 h-3 text-brand-secondary" />
          <span className="hidden sm:inline">In-Memory Engine (Safe Sandbox)</span>
          <span className="sm:hidden">Safe Mode</span>
        </div>
      </div>

      {/* Console Scrollable Body */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
        className="flex-1 p-4 font-mono text-xs space-y-2 overflow-y-auto"
      >
        {outputHistory.map((entry) => (
          <div key={entry.id} className="space-y-1">
            {entry.command && (
              <div className="flex items-center gap-2 pt-1 text-text-secondary">
                <span className="text-emerald-400">student@laptop</span>
                <span className="text-text-muted">:</span>
                <span className="text-brand-accent">~/my-first-project</span>
                <span className="text-amber-400">({branchDisplay})</span>
                <span className="text-text-primary">$</span>
                <span className="text-white font-bold">{entry.command}</span>
              </div>
            )}

            {entry.stdout.map((line, idx) => {
              if (line.startsWith('#')) {
                return (
                  <div key={idx} className="text-text-muted italic">
                    {line}
                  </div>
                );
              }
              return (
                <div key={idx} className="text-slate-200 pl-4 border-l-2 border-brand-primary/30 whitespace-pre-wrap leading-relaxed">
                  {line}
                </div>
              );
            })}

            {entry.stderr.map((line, idx) => (
              <div key={idx} className="text-rose-400 pl-4 border-l-2 border-rose-500/40 whitespace-pre-wrap leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        ))}

        {/* Live Active Input Prompt */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <span className="text-emerald-400 shrink-0">student@laptop</span>
          <span className="text-text-muted shrink-0">:</span>
          <span className="text-brand-accent shrink-0">~/my-first-project</span>
          <span className="text-amber-400 shrink-0">({branchDisplay})</span>
          <span className="text-text-primary shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type git command (or 'help')..."
            className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder:text-text-muted/40 min-w-0"
            autoFocus
            aria-label="Simulated Git console command input"
          />
          <button
            type="submit"
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-bg-surface border border-bg-border text-text-muted hover:text-white text-[10px] shrink-0"
            title="Execute Command"
          >
            <span>Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

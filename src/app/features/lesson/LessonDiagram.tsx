import React from 'react';
import { DiagramBlock } from '@/types/lesson';
import { Layers, ShieldCheck } from 'lucide-react';

interface LessonDiagramProps {
  diagram: DiagramBlock;
}

export const LessonDiagram: React.FC<LessonDiagramProps> = ({ diagram }) => {
  const renderDiagramContent = () => {
    switch (diagram.variant) {
      case 'pipeline-4stage':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Working Directory */}
              <div className="p-3.5 rounded-xl bg-bg-dark border border-amber-500/40 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-400">1. Working Directory</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">Disk</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Your raw files on disk. Edits are unstaged and untracked until prepared.
                </p>
                <div className="mt-2 text-[10px] font-mono text-amber-400/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-500/20">
                  $ git add &lt;file&gt;
                </div>
              </div>

              {/* Staging Area */}
              <div className="p-3.5 rounded-xl bg-bg-dark border border-emerald-500/40 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-400">2. Staging Area (Index)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono">Pallet</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  The draft checkpoint. You handpick changes ready for the next commit.
                </p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400/90 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                  $ git commit -m &quot;...&quot;
                </div>
              </div>

              {/* Local Repository */}
              <div className="p-3.5 rounded-xl bg-bg-dark border border-indigo-500/40 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400">3. Local Repository</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">HEAD</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Permanent snapshots sealed into your offline hidden .git history database.
                </p>
                <div className="mt-2 text-[10px] font-mono text-indigo-400/90 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-500/20">
                  $ git push origin &lt;branch&gt;
                </div>
              </div>

              {/* Remote Repository */}
              <div className="p-3.5 rounded-xl bg-bg-dark border border-sky-500/40 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-sky-400">4. Remote (GitHub)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono">Cloud</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Remote server for backups, team pull requests, and multi-developer sync.
                </p>
                <div className="mt-2 text-[10px] font-mono text-sky-400/90 bg-sky-950/30 px-2 py-1 rounded border border-sky-500/20">
                  $ git pull origin main
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Safety Distinction:</strong> Stages 1, 2, and 3 are 100% offline. Stage 4 is the only area that touches the network.
              </span>
            </div>
          </div>
        );

      case 'branch-divergence':
        return (
          <div className="p-4 rounded-xl bg-bg-dark border border-bg-border space-y-4">
            <div className="flex flex-col gap-3 font-mono text-xs">
              {/* Main branch line */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-20 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-center">
                  main
                </span>
                <span className="text-text-muted">──● C1 ──● C2 ───────────────────● C4 (merge) ──►</span>
              </div>
              {/* Feature branch line */}
              <div className="flex items-center gap-2 flex-wrap pl-20 sm:pl-24">
                <span className="text-brand-accent">└──● C3 (feature-login) ──┘</span>
              </div>
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed border-t border-bg-border/60 pt-2.5">
              • <strong>C1 & C2:</strong> Base commits shared by everyone on <code className="text-indigo-300">main</code>.<br />
              • <strong>C3:</strong> Isolated feature development done on <code className="text-sky-300">feature-login</code>.<br />
              • <strong>C4:</strong> Merge commit created when merging back into <code className="text-indigo-300">main</code>.
            </div>
          </div>
        );

      case 'conflict-split':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 font-mono text-xs">
              <div className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD (Current Branch)</span>
              </div>
              <div className="bg-bg-dark/80 p-2.5 rounded border border-indigo-500/30 text-emerald-300">
                const message = &quot;Hello World&quot;;
              </div>
              <p className="text-[10px] text-text-muted mt-2 font-sans">
                The code currently present on the branch you are standing on.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/40 font-mono text-xs">
              <div className="text-[11px] text-sky-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature-login (Incoming)</span>
              </div>
              <div className="bg-bg-dark/80 p-2.5 rounded border border-sky-500/30 text-amber-300">
                const message = &quot;Welcome to Git&quot;;
              </div>
              <p className="text-[10px] text-text-muted mt-2 font-sans">
                The competing code being merged from the incoming branch.
              </p>
            </div>
          </div>
        );

      case 'undo-matrix':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-bg-border rounded-xl overflow-hidden font-sans">
              <thead className="bg-bg-elevated text-text-secondary text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Command</th>
                  <th className="p-2.5">Target</th>
                  <th className="p-2.5">Working Files</th>
                  <th className="p-2.5">Staging Area</th>
                  <th className="p-2.5">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border text-text-secondary font-mono">
                <tr>
                  <td className="p-2.5 text-text-primary">git restore &lt;file&gt;</td>
                  <td className="p-2.5 font-sans">Unstaged edit</td>
                  <td className="p-2.5 text-rose-400 font-sans">Discards edits</td>
                  <td className="p-2.5 font-sans">Unchanged</td>
                  <td className="p-2.5 text-rose-400 font-sans font-semibold">Destructive</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-text-primary">git restore --staged &lt;file&gt;</td>
                  <td className="p-2.5 font-sans">Staged file</td>
                  <td className="p-2.5 text-emerald-400 font-sans">Preserved</td>
                  <td className="p-2.5 text-emerald-400 font-sans">Unstaged</td>
                  <td className="p-2.5 text-emerald-400 font-sans font-semibold">Safe</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-text-primary">git reset --soft HEAD~1</td>
                  <td className="p-2.5 font-sans">Last commit</td>
                  <td className="p-2.5 text-emerald-400 font-sans">Preserved</td>
                  <td className="p-2.5 text-indigo-400 font-sans">Remains staged</td>
                  <td className="p-2.5 text-amber-400 font-sans font-semibold">Caution</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-text-primary">git reset --hard HEAD~1</td>
                  <td className="p-2.5 font-sans">Last commit</td>
                  <td className="p-2.5 text-rose-400 font-sans">Completely erased</td>
                  <td className="p-2.5 text-rose-400 font-sans">Erased</td>
                  <td className="p-2.5 text-rose-400 font-sans font-semibold">Highly Destructive</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-text-primary">git revert &lt;hash&gt;</td>
                  <td className="p-2.5 font-sans">Past commit</td>
                  <td className="p-2.5 text-emerald-400 font-sans">Creates inverse commit</td>
                  <td className="p-2.5 text-emerald-400 font-sans">Committed</td>
                  <td className="p-2.5 text-emerald-400 font-sans font-semibold">Safe (Shared history)</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'config-hierarchy':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-bg-dark border border-bg-border space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase">Scope 1: System</span>
              <h4 className="text-xs font-bold text-white font-mono">/etc/gitconfig</h4>
              <p className="text-[11px] text-text-muted">Applies to all users on this OS machine.</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase">Scope 2: Global (--global)</span>
              <h4 className="text-xs font-bold text-indigo-200 font-mono">~/.gitconfig</h4>
              <p className="text-[11px] text-text-muted">Applies to your user account across all repositories.</p>
            </div>
            <div className="p-3 rounded-xl bg-bg-dark border border-bg-border space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase">Scope 3: Local</span>
              <h4 className="text-xs font-bold text-white font-mono">.git/config</h4>
              <p className="text-[11px] text-text-muted">Overrides global settings for this single project.</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-xl bg-bg-dark border border-bg-border text-xs text-text-muted">
            Interactive diagram: {diagram.caption}
          </div>
        );
    }
  };

  return (
    <figure className="my-5 rounded-2xl bg-bg-surface/90 border border-bg-border p-4 sm:p-5 shadow-glass space-y-3">
      <figcaption className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider pb-2 border-b border-bg-border">
        <Layers className="w-4 h-4 text-brand-accent" />
        <span>{diagram.caption}</span>
      </figcaption>
      
      {/* Visual content */}
      <div className="pt-1">
        {renderDiagramContent()}
      </div>

      {/* Screen-reader accessible transcript */}
      <div className="sr-only" aria-live="polite">
        Diagram illustration: {diagram.caption}
      </div>
    </figure>
  );
};

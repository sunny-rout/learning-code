import React from 'react';
import { GitRepoState } from '@/types/simulator';
import { getStagedChanges, getUnstagedChanges, getUntrackedFiles } from '@/services/simulator/gitHelpers';
import { HardDrive, Layers, GitCommit, Cloud, ArrowRight } from 'lucide-react';

interface PipelineStageViewProps {
  repoState: GitRepoState;
}

export const PipelineStageView: React.FC<PipelineStageViewProps> = ({ repoState }) => {
  const headCommit = repoState.headCommitId ? repoState.commits[repoState.headCommitId] : null;
  const headTree = headCommit ? headCommit.tree : {};

  const staged = getStagedChanges(headTree, repoState.index);
  const unstaged = getUnstagedChanges(repoState.index, repoState.workingTree);
  const untracked = getUntrackedFiles(repoState.workingTree, repoState.index, headTree);

  const totalCommits = Object.keys(repoState.commits).length;
  const activeBranchName = repoState.activeBranch || 'main';
  const remoteOrigin = repoState.remotes['origin'];
  const isPushed = Boolean(
    remoteOrigin &&
    remoteOrigin.branches[activeBranchName] &&
    remoteOrigin.branches[activeBranchName] === repoState.headCommitId
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Stage 1: Working Directory */}
      <div className="p-3.5 rounded-xl bg-bg-surface border border-bg-border/80 flex flex-col justify-between min-h-[140px] shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <HardDrive className="w-3.5 h-3.5" />
              <span>1. Working Tree</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-medium">
              {untracked.length + unstaged.length} files
            </span>
          </div>

          <div className="space-y-1 my-2 max-h-[60px] overflow-y-auto">
            {untracked.map((f) => (
              <div key={f} className="text-[11px] font-mono text-text-secondary flex items-center justify-between">
                <span className="truncate">{f}</span>
                <span className="text-[9px] text-amber-400/80 font-sans">untracked</span>
              </div>
            ))}
            {unstaged.map((u) => (
              <div key={u.path} className="text-[11px] font-mono text-text-secondary flex items-center justify-between">
                <span className="truncate">{u.path}</span>
                <span className="text-[9px] text-amber-300 font-sans">{u.type}</span>
              </div>
            ))}
            {untracked.length === 0 && unstaged.length === 0 && (
              <span className="text-[11px] text-text-muted italic">Working tree clean</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-bg-border/60 text-[10px] text-text-muted font-mono flex items-center gap-1">
          <span>git add</span>
          <ArrowRight className="w-3 h-3 text-text-muted" />
        </div>
      </div>

      {/* Stage 2: Staging Area */}
      <div className="p-3.5 rounded-xl bg-bg-surface border border-bg-border/80 flex flex-col justify-between min-h-[140px] shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
              <span>2. Staging Index</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-medium">
              {staged.length} staged
            </span>
          </div>

          <div className="space-y-1 my-2 max-h-[60px] overflow-y-auto">
            {staged.map((s) => (
              <div key={s.path} className="text-[11px] font-mono text-text-secondary flex items-center justify-between">
                <span className="truncate">{s.path}</span>
                <span className="text-[9px] text-emerald-400 font-sans">{s.type}</span>
              </div>
            ))}
            {staged.length === 0 && (
              <span className="text-[11px] text-text-muted italic">Staging area empty</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-bg-border/60 text-[10px] text-text-muted font-mono flex items-center gap-1">
          <span>git commit</span>
          <ArrowRight className="w-3 h-3 text-text-muted" />
        </div>
      </div>

      {/* Stage 3: Local Repository */}
      <div className="p-3.5 rounded-xl bg-bg-surface border border-bg-border/80 flex flex-col justify-between min-h-[140px] shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <GitCommit className="w-3.5 h-3.5" />
              <span>3. Local Repo</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-medium">
              {totalCommits} commits
            </span>
          </div>

          <div className="space-y-1 my-2">
            <div className="text-[11px] flex items-center justify-between">
              <span className="text-text-muted">Branch:</span>
              <span className="font-mono font-bold text-indigo-300">{activeBranchName}</span>
            </div>
            <div className="text-[11px] flex items-center justify-between">
              <span className="text-text-muted">HEAD:</span>
              <span className="font-mono text-text-secondary">
                {repoState.headCommitId ? repoState.headCommitId.slice(0, 7) : 'None'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-bg-border/60 text-[10px] text-text-muted font-mono flex items-center gap-1">
          <span>git push</span>
          <ArrowRight className="w-3 h-3 text-text-muted" />
        </div>
      </div>

      {/* Stage 4: Remote Repository */}
      <div className="p-3.5 rounded-xl bg-bg-surface border border-bg-border/80 flex flex-col justify-between min-h-[140px] shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Cloud className="w-3.5 h-3.5" />
              <span>4. Remote (origin)</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
              isPushed ? 'bg-sky-500/10 text-sky-300' : 'bg-bg-dark text-text-muted'
            }`}>
              {remoteOrigin ? (isPushed ? 'Synced' : 'Ahead') : 'Unset'}
            </span>
          </div>

          <div className="space-y-1 my-2">
            {remoteOrigin ? (
              <>
                <div className="text-[11px] flex items-center justify-between">
                  <span className="text-text-muted">Remote:</span>
                  <span className="font-mono text-sky-300">{remoteOrigin.name}</span>
                </div>
                <div className="text-[10px] font-mono text-text-muted truncate" title={remoteOrigin.url}>
                  {remoteOrigin.url}
                </div>
              </>
            ) : (
              <span className="text-[11px] text-text-muted italic">No remote configured</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-bg-border/60 text-[10px] text-text-muted">
          <span>GitHub Cloud Backup</span>
        </div>
      </div>
    </div>
  );
};

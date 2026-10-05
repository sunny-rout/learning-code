import React, { useState, useEffect, useRef } from 'react';
import { GitRepoState, GitCommitNode } from '@/types/simulator';
import { GitBranch, GitCommit, FileText, X } from 'lucide-react';

interface CommitGraphViewProps {
  repoState: GitRepoState;
}

interface RenderNode {
  commit: GitCommitNode;
  x: number;
  y: number;
  lane: number;
  branches: string[];
  isHead: boolean;
}

export const CommitGraphView: React.FC<CommitGraphViewProps> = ({ repoState }) => {
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveNodeIdRef = useRef<string | null>(null);

  // Close drawer on Escape key
  useEffect(() => {
    if (!selectedCommitId) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCommitId(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedCommitId]);

  // Focus management: focus close button when drawer opens, restore focus to node on close
  useEffect(() => {
    if (selectedCommitId) {
      closeButtonRef.current?.focus();
    } else if (lastActiveNodeIdRef.current) {
      const nodeEl = document.getElementById(`commit-node-${lastActiveNodeIdRef.current}`);
      nodeEl?.focus();
      lastActiveNodeIdRef.current = null;
    }
  }, [selectedCommitId]);

  const commitsList = Object.values(repoState.commits);
  if (commitsList.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-bg-surface border border-bg-border shadow-glass text-center space-y-3 min-h-[300px] flex flex-col items-center justify-center">
        <GitCommit className="w-8 h-8 text-text-muted opacity-40 animate-pulse" />
        <h3 className="text-sm font-bold text-white">No Commits Recorded Yet</h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
          Initialize a repository, stage files with <code className="text-brand-accent">git add</code>, and create your first snapshot with <code className="text-brand-accent">git commit</code> to watch the DAG graph emerge.
        </p>
      </div>
    );
  }

  // Sort commits by timestamp (oldest to newest)
  const sortedCommits = [...commitsList].sort((a, b) => a.timestamp - b.timestamp);

  // Assign lanes to branches/commits
  const laneMap = new Map<string, number>();
  let nextLane = 0;

  const nodes: RenderNode[] = [];
  const nodeMap = new Map<string, RenderNode>();

  const ROW_HEIGHT = 64;
  const COL_WIDTH = 48;
  const MARGIN_LEFT = 40;
  const MARGIN_TOP = 40;

  sortedCommits.forEach((commit, idx) => {
    // Determine lane: if parent has lane, reuse or allocate new lane for branch
    let lane = 0;
    if (commit.parentIds.length > 0) {
      const parentLane = laneMap.get(commit.parentIds[0]) ?? 0;
      // If another child already took parentLane, bump
      const siblings = nodes.filter((n) => n.commit.parentIds.includes(commit.parentIds[0]));
      lane = siblings.length > 0 ? parentLane + 1 : parentLane;
    } else {
      lane = nextLane++;
    }

    laneMap.set(commit.id, lane);

    // Find branches pointing to this commit (local + remote tracking)
    const localBranches = Object.entries(repoState.branches)
      .filter(([_, bRef]) => bRef.commitId === commit.id)
      .map(([name]) => name);

    const remoteBranches = Object.entries(repoState.remotes || {})
      .flatMap(([remoteName, remoteObj]) =>
        Object.entries(remoteObj.branches || {})
          .filter(([_, cId]) => cId === commit.id)
          .map(([bName]) => `${remoteName}/${bName}`)
      );

    const pointingBranches = [...localBranches, ...remoteBranches];

    const isHead = repoState.headCommitId === commit.id;

    const renderNode: RenderNode = {
      commit,
      x: MARGIN_LEFT + lane * COL_WIDTH,
      y: MARGIN_TOP + idx * ROW_HEIGHT,
      lane,
      branches: pointingBranches,
      isHead,
    };

    nodes.push(renderNode);
    nodeMap.set(commit.id, renderNode);
  });

  const svgHeight = Math.max(300, MARGIN_TOP * 2 + sortedCommits.length * ROW_HEIGHT);
  const maxLane = Math.max(...nodes.map((n) => n.lane), 1);
  const svgWidth = Math.max(280, MARGIN_LEFT * 2 + (maxLane + 1) * COL_WIDTH + 140);

  const selectedCommit = selectedCommitId ? repoState.commits[selectedCommitId] : null;

  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface shadow-glass overflow-hidden flex flex-col h-[460px]">
      {/* Title Header */}
      <div className="px-4 py-2.5 bg-bg-elevated/70 border-b border-bg-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-bold text-white">Commit Graph (DAG)</span>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          {commitsList.length} snapshot{commitsList.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 overflow-auto p-4 relative">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          {/* Connector Lines between Parents and Children */}
          {nodes.map((node) =>
            node.commit.parentIds.map((pId) => {
              const parentNode = nodeMap.get(pId);
              if (!parentNode) return null;

              // Draw bezier curve if lanes differ, else straight line
              const isStraight = node.x === parentNode.x;
              const pathD = isStraight
                ? `M ${parentNode.x} ${parentNode.y} L ${node.x} ${node.y}`
                : `M ${parentNode.x} ${parentNode.y} C ${parentNode.x} ${
                    (parentNode.y + node.y) / 2
                  }, ${node.x} ${(parentNode.y + node.y) / 2}, ${node.x} ${node.y}`;

              return (
                <path
                  key={`${pId}->${node.commit.id}`}
                  d={pathD}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeOpacity="0.7"
                />
              );
            })
          )}

          {/* Commit Nodes & Labels */}
          {nodes.map((node) => {
            const isSelected = selectedCommitId === node.commit.id;

            return (
              <g
                key={node.commit.id}
                id={`commit-node-${node.commit.id}`}
                tabIndex={0}
                role="button"
                aria-label={`Commit ${node.commit.id}: ${node.commit.message}${node.isHead ? ', HEAD pointer' : ''}${node.branches.length > 0 ? ', branches: ' + node.branches.join(', ') : ''}`}
                className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus:outline-none"
                onClick={() => {
                  lastActiveNodeIdRef.current = node.commit.id;
                  setSelectedCommitId(node.commit.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    lastActiveNodeIdRef.current = node.commit.id;
                    setSelectedCommitId(node.commit.id);
                  }
                }}
              >
                {/* Outer halo if selected or HEAD */}
                {node.isHead && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '8s' }}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? '10' : '8'}
                  fill={node.isHead ? '#10B981' : isSelected ? '#3B82F6' : '#6366F1'}
                  stroke="#1E1B4B"
                  strokeWidth="2"
                  className="transition-all group-hover:scale-125"
                />

                {/* Commit Short Hash and Message Label */}
                <text
                  x={node.x + 18}
                  y={node.y - 4}
                  className="font-mono text-[11px] font-bold fill-white"
                >
                  {node.commit.id}
                </text>
                <text
                  x={node.x + 72}
                  y={node.y - 4}
                  className="font-sans text-[11px] fill-slate-300 truncate"
                  style={{ maxWidth: '120px' }}
                >
                  {node.commit.message.length > 20
                    ? `${node.commit.message.slice(0, 20)}...`
                    : node.commit.message}
                </text>

                {/* Branch Badges */}
                {node.branches.map((bName, bIdx) => {
                  const isRemote = bName.includes('/');
                  const isActive = bName === repoState.activeBranch;
                  return (
                    <g key={bName} transform={`translate(${node.x + 18 + bIdx * 64}, ${node.y + 8})`}>
                      <rect
                        x="0"
                        y="-10"
                        width={bName.length * 6.5 + 12}
                        height="15"
                        rx="4"
                        fill={isActive ? '#047857' : isRemote ? '#7C2D12' : '#312E81'}
                        stroke={isActive ? '#10B981' : isRemote ? '#F97316' : '#6366F1'}
                        strokeWidth="1"
                      />
                      <text
                        x="6"
                        y="1"
                        className="font-mono text-[9px] font-semibold fill-white"
                      >
                        {bName}
                      </text>
                    </g>
                  );
                })}

                {/* HEAD Pill if pointed directly */}
                {node.isHead && (
                  <g transform={`translate(${node.x + 18 + node.branches.length * 64}, ${node.y + 8})`}>
                    <rect
                      x="0"
                      y="-10"
                      width="38"
                      height="15"
                      rx="4"
                      fill="#065F46"
                      stroke="#34D399"
                      strokeWidth="1"
                    />
                    <text x="5" y="1" className="font-mono text-[9px] font-extrabold fill-emerald-200">
                      HEAD
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Commit Detail Drawer */}
        {selectedCommit && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label={`Commit details for ${selectedCommit.id}`}
            className="absolute bottom-2 left-2 right-2 p-3.5 rounded-xl bg-bg-surface/95 border border-brand-primary/40 shadow-glass backdrop-blur-md animate-fadeIn z-20 space-y-2"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-bg-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-accent">
                  {selectedCommit.id}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                  {selectedCommit.message}
                </span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedCommitId(null)}
                className="text-text-muted hover:text-white p-1 rounded hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-brand-accent"
                aria-label="Close commit details"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-text-muted flex items-center justify-between">
              <span>Author: {selectedCommit.author}</span>
              <span>{new Date(selectedCommit.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="pt-1">
              <div className="text-[10px] uppercase font-bold text-text-muted mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-brand-accent" />
                <span>Tree Snapshot ({Object.keys(selectedCommit.tree).length} files):</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                {Object.keys(selectedCommit.tree).map((p) => (
                  <span
                    key={p}
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-dark border border-bg-border text-text-secondary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

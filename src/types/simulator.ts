export type FileStage = 'working' | 'staging' | 'committed';

export interface SimulatedFile {
  path: string;
  content: string;
}

export interface GitCommitNode {
  id: string;               // Deterministic 7-character hex string (e.g. "4a8f92c")
  parentIds: string[];      // Empty for root commit; [p1] for standard; [p1, p2] for merge
  message: string;
  author: string;
  timestamp: number;
  tree: Record<string, string>; // Complete path -> content snapshot at this commit
}

export interface GitBranchRef {
  name: string;
  commitId: string;
  upstream?: string;        // e.g. "origin/main"
}

export interface GitRemoteRef {
  name: string;             // e.g. "origin"
  url: string;
  commits: Record<string, GitCommitNode>; // Remote object store
  branches: Record<string, string>;       // branch name -> commitId
}

export interface GitStashEntry {
  id: string;                      // "stash@{0}", "stash@{1}", ...
  message: string;                 // e.g. "WIP on main: 14c7b7e initial commit"
  timestamp: number;
  branch: string;                  // Branch name where stash was created
  baseCommitId: string | null;     // Commit ID HEAD pointed to when stashed
  stagedSnapshot: Record<string, string>;   // Exact index state of tracked files at stash time
  workingSnapshot: Record<string, string>;  // Exact workingTree state of tracked files at stash time
}

export interface PreMergeSnapshot {
  workingTree: Record<string, string>;
  index: Record<string, string>;
  headCommitId: string | null;
  activeBranch: string | null;
}

export interface GitMergeConflictState {
  targetBranch: string;
  targetCommitId: string;
  baseCommitId: string;
  conflictingPaths: string[];      // Paths currently holding conflict markers
  resolvedPaths: string[];         // Paths where markers were removed and staged
  preMergeSnapshot: PreMergeSnapshot;
}

export interface GitRepoState {
  isInitialized: boolean;
  workingTree: Record<string, string>; // path -> content
  index: Record<string, string>;       // path -> content (staging area)
  commits: Record<string, GitCommitNode>; // commitId -> commit
  branches: Record<string, GitBranchRef>; // branchName -> branch ref
  activeBranch: string | null;         // "main", "feature", etc. (null if detached HEAD)
  headCommitId: string | null;
  remotes: Record<string, GitRemoteRef>; // remoteName -> remote ref
  stash: GitStashEntry[];              // LIFO stash stack
  mergeState: GitMergeConflictState | null; // Active merge conflict state or null
}

export interface StateChangeSummary {
  title: string;
  description: string;
  affectedStages: ('working' | 'staging' | 'local' | 'remote')[];
}

export interface CommandResult {
  nextState: GitRepoState;
  stdout: string[];
  stderr: string[];
  exitCode: number;
  explanation?: StateChangeSummary;
}

export interface ParsedCommand {
  raw: string;
  program: string;
  subcommand?: string;
  flags: Record<string, string | boolean>;
  positionalArgs: string[];
}

export interface ScenarioDefinition {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  initialState: GitRepoState;
  targetCommands: string[];
  steps: string[];
  isCompleted: (state: GitRepoState) => boolean;
}

import { GitCommitNode, GitRemoteRef } from '@/types/simulator';

/**
 * Checks exact path presence in a tree (distinguishing empty file content "" from missing path).
 */
export function hasPath(tree: Record<string, string>, path: string): boolean {
  return Object.prototype.hasOwnProperty.call(tree, path);
}

/**
 * Computes a deterministic 7-character hexadecimal commit ID.
 * Based on FNV-1a 32-bit hash algorithm over the commit's content and metadata.
 */
export function createDeterministicCommitId(
  parentIds: string[],
  message: string,
  tree: Record<string, string>,
  author: string,
  timestamp: number
): string {
  // Sort paths for canonical tree representation
  const sortedPaths = Object.keys(tree).sort();
  const treeRep = sortedPaths.map((p) => `${p}:${tree[p]}`).join(';');
  const seedString = `${parentIds.join(',')}|${message}|${treeRep}|${author}|${timestamp}`;

  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < seedString.length; i++) {
    hash ^= seedString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV-1a prime
  }

  // Convert to unsigned 32-bit integer, then to 7-character zero-padded hex
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(7, '0').slice(0, 7);
}

export interface StagedItem {
  path: string;
  type: 'new file' | 'modified' | 'deleted';
}

export interface UnstagedItem {
  path: string;
  type: 'modified' | 'deleted';
}

/**
 * Derives staged changes independently by comparing HEAD vs index across union of their paths.
 */
export function getStagedChanges(
  headTree: Record<string, string>,
  index: Record<string, string>
): StagedItem[] {
  const items: StagedItem[] = [];
  const allPaths = new Set([...Object.keys(headTree), ...Object.keys(index)]);

  for (const p of Array.from(allPaths).sort()) {
    const inHead = hasPath(headTree, p);
    const inIndex = hasPath(index, p);

    if (!inHead && inIndex) {
      items.push({ path: p, type: 'new file' });
    } else if (inHead && inIndex && headTree[p] !== index[p]) {
      items.push({ path: p, type: 'modified' });
    } else if (inHead && !inIndex) {
      items.push({ path: p, type: 'deleted' });
    }
  }

  return items;
}

/**
 * Derives unstaged changes independently by comparing index vs workingTree across keys of index.
 */
export function getUnstagedChanges(
  index: Record<string, string>,
  workingTree: Record<string, string>
): UnstagedItem[] {
  const items: UnstagedItem[] = [];

  for (const p of Object.keys(index).sort()) {
    const inWorking = hasPath(workingTree, p);

    if (!inWorking) {
      items.push({ path: p, type: 'deleted' });
    } else if (workingTree[p] !== index[p]) {
      items.push({ path: p, type: 'modified' });
    }
  }

  return items;
}

/**
 * Derives untracked files by comparing workingTree against index and HEAD.
 */
export function getUntrackedFiles(
  workingTree: Record<string, string>,
  index: Record<string, string>,
  _headTree?: Record<string, string>
): string[] {
  const untracked: string[] = [];

  for (const p of Object.keys(workingTree).sort()) {
    // Untracked if not in index (either completely new, or deleted from index relative to HEAD)
    if (!hasPath(index, p)) {
      untracked.push(p);
    }
  }

  return untracked;
}

/**
 * Evaluates whether the working tree or index has local modifications relative to HEAD.
 * Uses exact path-presence to ensure empty files are never conflated with missing files.
 */
export function evaluateDirtyTree(
  workingTree: Record<string, string>,
  index: Record<string, string>,
  headTree: Record<string, string>
): { isDirty: boolean; dirtyPaths: string[] } {
  const dirty = new Set<string>();

  // 1. Check index vs HEAD (staged modifications, additions, deletions)
  const allIndexHeadPaths = new Set([...Object.keys(index), ...Object.keys(headTree)]);
  for (const p of allIndexHeadPaths) {
    const inHead = hasPath(headTree, p);
    const inIndex = hasPath(index, p);
    if (inHead !== inIndex || (inHead && inIndex && headTree[p] !== index[p])) {
      dirty.add(p);
    }
  }

  // 2. Check workingTree vs index (unstaged modifications and deletions)
  for (const p of Object.keys(index)) {
    const inWorking = hasPath(workingTree, p);
    if (!inWorking || workingTree[p] !== index[p]) {
      dirty.add(p);
    }
  }

  return { isDirty: dirty.size > 0, dirtyPaths: Array.from(dirty) };
}

/**
 * Checks whether potentialAncestorId is an ancestor of targetCommitId.
 * Supports arbitrary DAG branch topologies and multiple parents (merge commits) with visited set.
 */
export function isAncestor(
  commits: Record<string, GitCommitNode>,
  potentialAncestorId: string,
  targetCommitId: string
): boolean {
  if (potentialAncestorId === targetCommitId) return true;

  const queue: string[] = [targetCommitId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const node = commits[currId];
    if (!node) continue;

    for (const parentId of node.parentIds) {
      if (parentId === potentialAncestorId) {
        return true;
      }
      if (!visited.has(parentId)) {
        queue.push(parentId);
      }
    }
  }

  return false;
}

/**
 * Finds the lowest common ancestor (merge base) between two commits using BFS.
 */
export function findMergeBase(
  commits: Record<string, GitCommitNode>,
  commitAId: string,
  commitBId: string
): string | null {
  if (commitAId === commitBId) return commitAId;

  // Collect all ancestors of commitA with their shortest distance
  const ancestorsA = new Set<string>();
  const queueA: string[] = [commitAId];
  while (queueA.length > 0) {
    const curr = queueA.shift()!;
    ancestorsA.add(curr);
    const node = commits[curr];
    if (node) {
      for (const pid of node.parentIds) {
        if (!ancestorsA.has(pid)) queueA.push(pid);
      }
    }
  }

  // BFS from commitB: first ancestor of B that is also an ancestor of A is the merge base
  const queueB: string[] = [commitBId];
  const visitedB = new Set<string>();

  while (queueB.length > 0) {
    const curr = queueB.shift()!;
    if (visitedB.has(curr)) continue;
    visitedB.add(curr);

    if (ancestorsA.has(curr)) {
      return curr;
    }

    const node = commits[curr];
    if (node) {
      for (const pid of node.parentIds) {
        if (!visitedB.has(pid)) queueB.push(pid);
      }
    }
  }

  return null;
}

/**
 * Validates that all reachable commits in a remote branch are present in the remote object store.
 * Verifies multi-parent merge chains without cycles.
 */
export function verifyRemoteAncestryIntegrity(
  remote: GitRemoteRef,
  branchName: string
): void {
  const targetCommitId = remote.branches[branchName];
  if (!targetCommitId) {
    throw new Error(`Remote branch '${branchName}' is not defined in remote '${remote.name}'`);
  }

  const targetCommit = remote.commits[targetCommitId];
  if (!targetCommit) {
    throw new Error(`Remote branch '${branchName}' references missing commit '${targetCommitId}'`);
  }

  const queue: string[] = [targetCommitId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const commitId = queue.shift()!;
    if (visited.has(commitId)) {
      continue;
    }
    visited.add(commitId);

    const commit = remote.commits[commitId];
    if (!commit) {
      throw new Error(`Integrity Error: Reachable commit '${commitId}' is missing from remote store`);
    }

    for (const parentId of commit.parentIds) {
      if (!Object.prototype.hasOwnProperty.call(remote.commits, parentId)) {
        throw new Error(
          `Integrity Error: Commit '${commitId}' references missing parent '${parentId}' in remote store`
        );
      }
      if (!visited.has(parentId)) {
        queue.push(parentId);
      }
    }
  }
}

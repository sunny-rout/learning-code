import { executeCommand } from '../src/services/simulator/gitEngine';
import { createPristineRepoState } from '../src/services/simulator/defaultState';
import { isAncestor, findMergeBase, verifyRemoteAncestryIntegrity } from '../src/services/simulator/gitHelpers';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Git Merge & Ancestry Unit Tests ---');

// 1. Ancestry Evaluation & Fast-Forward Merge
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "base" > base.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1: Base"').nextState;

  const c1Id = state.headCommitId!;

  // Create and advance feature branch
  state = executeCommand(state, 'git switch -c feature').nextState;
  state = executeCommand(state, 'echo "feature" > feat.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C2: Feature"').nextState;

  const c2Id = state.headCommitId!;

  // Verify ancestry
  assert(isAncestor(state.commits, c1Id, c2Id), 'C1 must be ancestor of C2');
  assert(!isAncestor(state.commits, c2Id, c1Id), 'C2 is not ancestor of C1');

  // Switch back to main and merge feature (Fast-forward!)
  state = executeCommand(state, 'git switch main').nextState;
  assert(state.headCommitId === c1Id, 'main is at C1');

  const mergeRes = executeCommand(state, 'git merge feature');
  assert(mergeRes.exitCode === 0, 'Merge should succeed');
  assert(mergeRes.stdout.some((l) => l.includes('Fast-forward')), 'Must perform fast-forward');
  assert(mergeRes.nextState.headCommitId === c2Id, 'main now points directly to C2');
  assert(mergeRes.nextState.workingTree['feat.txt'] === 'feature\n', 'Working tree updated to C2 tree');
  assert(Object.keys(mergeRes.nextState.commits).length === 2, 'No extra commit node created during FF');

  console.log('✓ Test 1 Passed: Fast-forward merge detection and pointer advancement');
}

// 2. Non-Conflicting 3-Way Merge (2 Parents)
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "common" > common.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1: Common"').nextState;

  const c1Id = state.headCommitId!;

  // Branch A: adds feature.txt
  state = executeCommand(state, 'git switch -c branch-a').nextState;
  state = executeCommand(state, 'echo "a" > a.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C2: Add a.txt"').nextState;
  const c2Id = state.headCommitId!;

  // Branch B (from main C1): adds b.txt
  state = executeCommand(state, 'git switch main').nextState;
  state = executeCommand(state, 'echo "b" > b.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C3: Add b.txt"').nextState;
  const c3Id = state.headCommitId!;

  // Find merge base
  const base = findMergeBase(state.commits, c3Id, c2Id);
  assert(base === c1Id, 'Merge base must be C1');

  // Merge branch-a into main
  const mergeRes = executeCommand(state, 'git merge branch-a');
  assert(mergeRes.exitCode === 0, '3-way merge should succeed');
  assert(mergeRes.stdout.some((l) => l.includes('Merge made by the \'ort\' strategy')), 'Uses 3-way merge strategy');

  const mergeCommit = mergeRes.nextState.commits[mergeRes.nextState.headCommitId!];
  assert(mergeCommit.parentIds.length === 2, 'Merge commit must have exactly 2 parents');
  assert(mergeCommit.parentIds[0] === c3Id, 'Parent 1 is main');
  assert(mergeCommit.parentIds[1] === c2Id, 'Parent 2 is branch-a');

  // Resulting tree has all files
  assert(mergeCommit.tree['common.txt'] === 'common\n', 'Has common.txt');
  assert(mergeCommit.tree['a.txt'] === 'a\n', 'Has a.txt');
  assert(mergeCommit.tree['b.txt'] === 'b\n', 'Has b.txt');

  console.log('✓ Test 2 Passed: Non-conflicting 3-way merge with 2-parent linkage');
}

// 3. Conflicting Merge Safe Abort
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "version 1" > file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1: Initial"').nextState;

  // Branch 1: modifies file.txt
  state = executeCommand(state, 'git switch -c b1').nextState;
  state = executeCommand(state, 'echo "version from b1" > file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C2 on b1"').nextState;

  // Main branch: also modifies file.txt differently
  state = executeCommand(state, 'git switch main').nextState;
  state = executeCommand(state, 'echo "version from main" > file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C3 on main"').nextState;

  const preMergeState = state;
  const conflictRes = executeCommand(state, 'git merge b1');

  assert(conflictRes.exitCode === 1, 'Conflicting merge must exit with code 1');
  assert(conflictRes.stdout.some((l) => l.includes('CONFLICT (content)')), 'Output indicates conflict');
  assert(conflictRes.stderr.some((l) => l.includes('Phase 4')), 'Notice indicates Phase 4 conflict resolution');

  // State must be completely uncorrupted
  assert(conflictRes.nextState.headCommitId === preMergeState.headCommitId, 'HEAD unchanged');
  assert(conflictRes.nextState.workingTree['file.txt'] === 'version from main\n', 'Working tree preserved');

  console.log('✓ Test 3 Passed: Conflicting merge clean educational abort');
}

// 4. Remote Push of Multi-Parent Merge Commit & Full Graph Integrity
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "c" > c.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1"').nextState;

  state = executeCommand(state, 'git switch -c feat').nextState;
  state = executeCommand(state, 'echo "f" > f.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C2"').nextState;

  state = executeCommand(state, 'git switch main').nextState;
  state = executeCommand(state, 'echo "m" > m.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C3"').nextState;

  // Merge
  state = executeCommand(state, 'git merge feat').nextState;

  // Push to remote
  state = executeCommand(state, 'git remote add origin https://github.com/student/merge-repo.git').nextState;
  state = executeCommand(state, 'git push -u origin main').nextState;

  const remote = state.remotes['origin'];
  assert(remote !== undefined, 'Remote exists');

  // Multi-parent remote graph traversal verification
  verifyRemoteAncestryIntegrity(remote, 'main');
  assert(Object.keys(remote.commits).length === 4, 'All 4 commits (C1, C2, C3, and Merge C4) pushed to remote');

  console.log('✓ Test 4 Passed: Multi-parent remote push graph integrity');
}

console.log('--- ALL GIT MERGE TESTS PASSED! ---');

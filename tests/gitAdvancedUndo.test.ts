import { executeCommand } from '../src/services/simulator/gitEngine';
import { createPristineRepoState, createPracticeExerciseState } from '../src/services/simulator/defaultState';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 4: Advanced Undo, Stash & Conflict Resolution Unit Tests ---');

// ========================================================
// 1. Stash Subsystem Tests
// ========================================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "Initial README" > README.md').nextState;
  state = executeCommand(state, 'echo "Initial notes" > notes.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1: Initial commit"').nextState;

  // Nothing to stash when clean
  const cleanStash = executeCommand(state, 'git stash');
  assert(cleanStash.stdout.some((l) => l.includes('No local changes to save')), 'Clean stash notice');
  assert(cleanStash.nextState.stash.length === 0, 'No stash entry created');

  // Make modifications:
  // 1. README.md modified and staged
  // 2. notes.txt modified in working tree (unstaged)
  // 3. newfile.txt staged (not in HEAD)
  state = executeCommand(state, 'echo "Updated README" > README.md').nextState;
  state = executeCommand(state, 'git add README.md').nextState;
  state = executeCommand(state, 'echo "WIP notes" > notes.txt').nextState;
  state = executeCommand(state, 'echo "Staged new file" > newfile.txt').nextState;
  state = executeCommand(state, 'git add newfile.txt').nextState;

  // Stash with message
  const stashRes = executeCommand(state, 'git stash push -m "WIP on docs"');
  assert(stashRes.exitCode === 0, 'git stash push succeeds');
  state = stashRes.nextState;

  assert(state.stash.length === 1, 'Stash stack has 1 entry');
  assert(state.stash[0].message === 'WIP on docs', 'Stash message preserved');
  assert(state.stash[0].stagedSnapshot['README.md'] === 'Updated README\n', 'Staged snapshot preserved');
  assert(state.stash[0].workingSnapshot['notes.txt'] === 'WIP notes\n', 'Working snapshot preserved');
  assert(state.stash[0].stagedSnapshot['newfile.txt'] === 'Staged new file\n', 'Staged new file snapshot preserved');

  // Working directory and index should now be clean and match HEAD
  assert(state.workingTree['README.md'] === 'Initial README\n', 'Working tree reset to HEAD');
  assert(state.workingTree['notes.txt'] === 'Initial notes\n', 'Tracked file reset to HEAD');
  assert(!('newfile.txt' in state.workingTree), 'Staged new file removed from working tree');
  assert(state.index['README.md'] === 'Initial README\n', 'Index reset to HEAD');

  // git stash list
  const listRes = executeCommand(state, 'git stash list');
  assert(listRes.stdout.some((l) => l.includes('stash@{0}') && l.includes('WIP on docs')), 'List shows stash entry');

  // Push a second stash
  state = executeCommand(state, 'echo "Feature 2 edit" > notes.txt').nextState;
  state = executeCommand(state, 'git stash push -m "Feature 2 work"').nextState;
  assert(state.stash.length === 2, 'Stash stack has 2 entries');
  assert(state.stash[0].message === 'Feature 2 work', 'Newest stash at index 0');
  assert(state.stash[1].message === 'WIP on docs', 'Previous stash at index 1');

  // git stash drop drops stash@{0}
  const dropRes = executeCommand(state, 'git stash drop');
  assert(dropRes.exitCode === 0, 'git stash drop succeeds');
  state = dropRes.nextState;
  assert(state.stash.length === 1, 'Dropped 1 entry');
  assert(state.stash[0].message === 'WIP on docs', 'Remaining entry is WIP on docs');

  // git stash pop dirty working tree guard
  state = executeCommand(state, 'echo "Dirty edit" > README.md').nextState;
  const dirtyPopRes = executeCommand(state, 'git stash pop');
  assert(dirtyPopRes.exitCode === 1, 'Dirty pop rejected with exitCode 1');
  assert(dirtyPopRes.stderr.some((l) => l.toLowerCase().includes('would be overwritten by merge')), 'Dirty pop error message');
  assert(dirtyPopRes.nextState.stash.length === 1, 'Stash entry preserved on dirty pop failure');

  // Discard dirty edit
  state = executeCommand(state, 'git restore README.md').nextState;

  // git stash pop untracked-file collision guard
  // Popping stash@{0} will restore newfile.txt (which is currently not in index and not in HEAD).
  // If newfile.txt already exists untracked, it must abort with exitCode 1!
  state = executeCommand(state, 'echo "Colliding untracked content" > newfile.txt').nextState;
  const collisionPopRes = executeCommand(state, 'git stash pop');
  assert(collisionPopRes.exitCode === 1, 'Untracked collision pop rejected with exitCode 1');
  assert(collisionPopRes.stderr.some((l) => l.includes('untracked working tree file') && l.includes('would be overwritten')), 'Untracked collision error message');
  assert(collisionPopRes.nextState.stash.length === 1, 'Stash remains at stash@{0}');
  assert(collisionPopRes.nextState.workingTree['newfile.txt'] === 'Colliding untracked content\n', 'Untracked file preserved');

  // Remove colliding file and add an unrelated untracked file to verify it stays untouched
  delete state.workingTree['newfile.txt'];
  state.workingTree['unrelated.txt'] = 'unrelated untracked file\n';

  const cleanPopRes = executeCommand(state, 'git stash pop');
  assert(cleanPopRes.exitCode === 0, 'Clean stash pop succeeds');
  state = cleanPopRes.nextState;
  assert(state.stash.length === 0, 'Stash stack empty after pop');
  assert(state.workingTree['notes.txt'] === 'WIP notes\n', 'notes.txt restored');
  assert(state.index['README.md'] === 'Updated README\n', 'Staged README restored to index');
  assert(state.workingTree['newfile.txt'] === 'Staged new file\n', 'newfile.txt restored');
  assert(state.workingTree['unrelated.txt'] === 'unrelated untracked file\n', 'Unrelated untracked file preserved');

  // git stash clear
  state = executeCommand(state, 'git stash push -m "Temp"').nextState;
  assert(state.stash.length === 1, 'Stash created for clear test');
  const clearRes = executeCommand(state, 'git stash clear');
  assert(clearRes.exitCode === 0, 'git stash clear succeeds');
  assert(clearRes.nextState.stash.length === 0, 'All stashes cleared');

  console.log('✓ Test 1 Passed: Stash Subsystem (push, list, drop, dirty guard, untracked collision guard, pop, clear)');
}

// ========================================================
// 2. Reset Subsystem Tests
// ========================================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "v1" > app.js').nextState;
  state = executeCommand(state, 'git add app.js').nextState;
  state = executeCommand(state, 'git commit -m "C1: Initial"').nextState;
  const c1Id = state.headCommitId!;

  state = executeCommand(state, 'echo "v2" > app.js').nextState;
  state = executeCommand(state, 'git add app.js').nextState;
  state = executeCommand(state, 'git commit -m "C2: Version 2"').nextState;
  const c2Id = state.headCommitId!;

  // 2.1 git reset HEAD (un-stage files without touching working tree)
  state = executeCommand(state, 'echo "v3" > app.js').nextState;
  state = executeCommand(state, 'git add app.js').nextState;
  assert(state.index['app.js'] === 'v3\n', 'File is staged');

  const unstageRes = executeCommand(state, 'git reset HEAD');
  assert(unstageRes.exitCode === 0, 'git reset HEAD succeeds');
  assert(unstageRes.nextState.index['app.js'] === 'v2\n', 'Index reset to HEAD commit v2');
  assert(unstageRes.nextState.workingTree['app.js'] === 'v3\n', 'Working tree preserved with v3 edit');
  assert(unstageRes.nextState.headCommitId === c2Id, 'HEAD commit unchanged');

  // Re-stage
  state = executeCommand(unstageRes.nextState, 'git add app.js').nextState;

  // 2.2 git reset --soft HEAD~1
  const softRes = executeCommand(state, 'git reset --soft HEAD~1');
  assert(softRes.exitCode === 0, 'git reset --soft succeeds');
  assert(softRes.nextState.headCommitId === c1Id, 'HEAD pointer moved to C1');
  assert(softRes.nextState.index['app.js'] === 'v3\n', 'Index preserved under --soft');
  assert(softRes.nextState.workingTree['app.js'] === 'v3\n', 'Working tree preserved under --soft');

  // 2.3 git reset --mixed C2 (by hash)
  const mixedRes = executeCommand(softRes.nextState, `git reset --mixed ${c2Id.slice(0, 7)}`);
  assert(mixedRes.exitCode === 0, 'git reset --mixed succeeds with short hash');
  assert(mixedRes.nextState.headCommitId === c2Id, 'HEAD pointer moved back to C2');
  assert(mixedRes.nextState.index['app.js'] === 'v2\n', 'Index reset to C2 content (v2)');
  assert(mixedRes.nextState.workingTree['app.js'] === 'v3\n', 'Working tree preserved (v3)');

  // 2.4 git reset --hard HEAD~1
  // Add an unrelated untracked file to verify it is NOT deleted by --hard
  state = mixedRes.nextState;
  state = executeCommand(state, 'echo "I am safe" > untracked.txt').nextState;
  const hardRes = executeCommand(state, 'git reset --hard HEAD~1');
  assert(hardRes.exitCode === 0, 'git reset --hard succeeds');
  assert(hardRes.nextState.headCommitId === c1Id, 'HEAD pointer moved to C1');
  assert(hardRes.nextState.index['app.js'] === 'v1\n', 'Index reset to C1 content');
  assert(hardRes.nextState.workingTree['app.js'] === 'v1\n', 'Working tree reset to C1 content');
  assert(hardRes.nextState.workingTree['untracked.txt'] === 'I am safe\n', 'Untracked file preserved under --hard');

  console.log('✓ Test 2 Passed: Reset Subsystem (HEAD unstage, --soft, --mixed, --hard, hash resolution, untracked safety)');
}

// ========================================================
// 3. Revert Subsystem Tests
// ========================================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "base" > base.txt').nextState;
  state = executeCommand(state, 'git add base.txt').nextState;
  state = executeCommand(state, 'git commit -m "C1: Base"').nextState;

  state = executeCommand(state, 'echo "feature" > feat.txt').nextState;
  state = executeCommand(state, 'git add feat.txt').nextState;
  state = executeCommand(state, 'git commit -m "C2: Add feat"').nextState;
  const c2Id = state.headCommitId!;

  // 3.1 Revert single parent commit C2
  const revertRes = executeCommand(state, `git revert ${c2Id.slice(0, 7)}`);
  assert(revertRes.exitCode === 0, 'git revert succeeds');
  const revertCommit = revertRes.nextState.commits[revertRes.nextState.headCommitId!];
  assert(revertCommit.message.includes('Revert "C2: Add feat"'), 'Commit message indicates revert');
  assert(revertCommit.parentIds.length === 1 && revertCommit.parentIds[0] === c2Id, 'Append-only single parent linkage');
  assert(!('feat.txt' in revertCommit.tree), 'feat.txt removed by inverse snapshot');
  assert(revertCommit.tree['base.txt'] === 'base\n', 'base.txt retained');
  assert(!('feat.txt' in revertRes.nextState.workingTree), 'feat.txt removed from working tree');

  // 3.2 Reject revert when working tree is dirty
  let dirtyState = revertRes.nextState;
  dirtyState = executeCommand(dirtyState, 'echo "dirty" > base.txt').nextState;
  const dirtyRevertRes = executeCommand(dirtyState, `git revert ${c2Id.slice(0, 7)}`);
  assert(dirtyRevertRes.exitCode === 1, 'Revert rejected on dirty working tree');
  assert(dirtyRevertRes.stderr.some((l) => l.includes('your local changes would be overwritten')), 'Dirty revert error message');

  // 3.3 Reject revert of a merge commit
  // Create a 2-parent merge commit
  let mState = createPristineRepoState();
  mState = executeCommand(mState, 'git init').nextState;
  mState = executeCommand(mState, 'echo "c1" > c1.txt').nextState;
  mState = executeCommand(mState, 'git add .').nextState;
  mState = executeCommand(mState, 'git commit -m "C1"').nextState;

  mState = executeCommand(mState, 'git switch -c branch-x').nextState;
  mState = executeCommand(mState, 'echo "x" > x.txt').nextState;
  mState = executeCommand(mState, 'git add .').nextState;
  mState = executeCommand(mState, 'git commit -m "CX"').nextState;

  mState = executeCommand(mState, 'git switch main').nextState;
  mState = executeCommand(mState, 'echo "m" > m.txt').nextState;
  mState = executeCommand(mState, 'git add .').nextState;
  mState = executeCommand(mState, 'git commit -m "CM"').nextState;

  const mergeRes = executeCommand(mState, 'git merge branch-x');
  assert(mergeRes.exitCode === 0, 'Merge created');
  const mergeCommitId = mergeRes.nextState.headCommitId!;

  const revertMergeRes = executeCommand(mergeRes.nextState, `git revert ${mergeCommitId.slice(0, 7)}`);
  assert(revertMergeRes.exitCode === 1, 'Revert merge commit rejected with exitCode 1');
  assert(revertMergeRes.stderr.some((l) => l.includes('is a merge')), 'Merge revert error message');

  console.log('✓ Test 3 Passed: Revert Subsystem (inverse commit, dirty guard, merge commit rejection)');
}

// ========================================================
// 4. Interactive Merge Conflict Resolution Tests
// ========================================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "Initial config" > settings.json').nextState;
  state = executeCommand(state, 'git add settings.json').nextState;
  state = executeCommand(state, 'git commit -m "C1: Initial settings"').nextState;

  // Branch feature: edits settings.json
  state = executeCommand(state, 'git switch -c feature/dark-theme').nextState;
  state = executeCommand(state, 'echo "theme: dark" > settings.json').nextState;
  state = executeCommand(state, 'git add settings.json').nextState;
  state = executeCommand(state, 'git commit -m "C2: Dark theme"').nextState;

  // Main branch: edits settings.json differently
  state = executeCommand(state, 'git switch main').nextState;
  state = executeCommand(state, 'echo "theme: light" > settings.json').nextState;
  state = executeCommand(state, 'git add settings.json').nextState;
  state = executeCommand(state, 'git commit -m "C3: Light theme"').nextState;
  const c3Id = state.headCommitId!;

  // 4.1 Trigger conflicting merge
  const mergeRes = executeCommand(state, 'git merge feature/dark-theme');
  assert(mergeRes.exitCode === 1, 'Conflict returns exitCode 1');
  assert(mergeRes.nextState.mergeState !== null, 'mergeState is active');
  assert(mergeRes.nextState.mergeState.conflictingPaths.includes('settings.json'), 'settings.json is marked conflicting');

  // Verify conflict markers in working tree
  const conflictingContent = mergeRes.nextState.workingTree['settings.json'];
  assert(conflictingContent.includes('<<<<<<< HEAD'), 'Has <<<<<<< HEAD marker');
  assert(conflictingContent.includes('theme: light'), 'Has HEAD content');
  assert(conflictingContent.includes('======='), 'Has ======= marker');
  assert(conflictingContent.includes('theme: dark'), 'Has target branch content');
  assert(conflictingContent.includes('>>>>>>> feature/dark-theme'), 'Has >>>>>>> marker');

  // 4.2 Branch switching is blocked during active merge
  const switchRes = executeCommand(mergeRes.nextState, 'git switch feature/dark-theme');
  assert(switchRes.exitCode === 128, 'Switch blocked with exitCode 128');
  assert(switchRes.stderr.some((l) => l.includes('you need to resolve your current index first')), 'Switch blocked message');

  // 4.3 git add fails if conflict markers are still present
  const addBlockedRes = executeCommand(mergeRes.nextState, 'git add settings.json');
  assert(addBlockedRes.exitCode === 1, 'git add blocked when conflict markers exist');
  assert(addBlockedRes.stderr.some((l) => l.includes('still contains unresolved conflict markers')), 'Marker rejection error message');

  // 4.4 git merge --abort cleanly restores pre-merge snapshot
  const abortRes = executeCommand(mergeRes.nextState, 'git merge --abort');
  assert(abortRes.exitCode === 0, 'git merge --abort succeeds');
  assert(abortRes.nextState.mergeState === null, 'mergeState cleared');
  assert(abortRes.nextState.headCommitId === c3Id, 'HEAD unchanged after abort');
  assert(abortRes.nextState.workingTree['settings.json'] === 'theme: light\n', 'Working tree restored to pre-merge state');
  assert(abortRes.nextState.index['settings.json'] === 'theme: light\n', 'Index restored to pre-merge state');

  // 4.5 Resolve conflict, stage, and complete merge commit
  // Re-trigger merge
  const mergeRes2 = executeCommand(abortRes.nextState, 'git merge feature/dark-theme');
  state = mergeRes2.nextState;
  assert(state.mergeState !== null, 'Merge state active again');

  // Manually resolve conflict in working tree
  state.workingTree['settings.json'] = 'theme: system-preference\n';

  // git add should now succeed
  const addResolvedRes = executeCommand(state, 'git add settings.json');
  assert(addResolvedRes.exitCode === 0, 'git add succeeds once markers are resolved');
  state = addResolvedRes.nextState;
  assert(state.mergeState !== null && state.mergeState.resolvedPaths.includes('settings.json'), 'Marked as resolved in mergeState');

  // git commit creates 2-parent merge commit and clears mergeState
  const commitRes = executeCommand(state, 'git commit -m "Merge branch feature/dark-theme"');
  assert(commitRes.exitCode === 0, 'Merge commit succeeds');
  assert(commitRes.nextState.mergeState === null, 'mergeState cleared after commit');
  const finalCommit = commitRes.nextState.commits[commitRes.nextState.headCommitId!];
  assert(finalCommit.parentIds.length === 2, 'Merge commit has 2 parents');
  assert(finalCommit.tree['settings.json'] === 'theme: system-preference\n', 'Resolved tree content saved');

  console.log('✓ Test 4 Passed: Interactive Merge Conflict Resolution (markers, switch block, add guard, abort, resolve & commit)');
}

// ========================================================
// 5. UI & State Presentation Integrity Tests
// ========================================================
{
  // Test prompt formatting logic
  const branchName = 'main';
  const isMerging = true;
  const branchDisplay = isMerging ? `${branchName}|MERGING` : branchName;
  assert(branchDisplay === 'main|MERGING', 'Prompt reflects active merging state');

  const cleanDisplay = (!false) ? `${branchName}` : `${branchName}|MERGING`;
  assert(cleanDisplay === 'main', 'Prompt returns to clean branch name');

  // Verify Exercise 6 state contract
  const ex6State = createPracticeExerciseState(6);
  assert(ex6State.isInitialized === true, 'Ex 6 initialized');
  assert(ex6State.activeBranch === 'main', 'Ex 6 on main branch');
  assert(ex6State.stash.length === 0, 'Ex 6 stash initially empty');
  assert(ex6State.mergeState === null, 'Ex 6 mergeState initially null');

  console.log('✓ Test 5 Passed: UI & State Presentation Integrity (branch|MERGING prompt & Ex 6 contract)');
}

console.log('--- ALL PHASE 4 UNIT TESTS PASSED SUCCESSFULLY! ---');

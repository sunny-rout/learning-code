import { executeCommand } from '../src/services/simulator/gitEngine';
import { createPristineRepoState } from '../src/services/simulator/defaultState';
import { tokenizeCommand, parseCommandLine } from '../src/services/simulator/commandParser';
import {
  getStagedChanges,
  getUnstagedChanges,
  getUntrackedFiles,
  evaluateDirtyTree,
  verifyRemoteAncestryIntegrity,
} from '../src/services/simulator/gitHelpers';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Git Engine & Parser Unit Tests ---');

// 1. Command Tokenizer & Parser
{
  const { tokens, error } = tokenizeCommand('git commit -m "feat: initial commit with spaces"');
  assert(!error, 'Tokenizer should succeed on valid quoted input');
  assert(tokens.length === 4, 'Should have 4 tokens');
  assert(tokens[0] === 'git' && tokens[1] === 'commit' && tokens[2] === '-m', 'Tokens prefix match');
  assert(tokens[3] === 'feat: initial commit with spaces', 'Quoted string content preserved without quotes');

  const { parsed: parsedAM } = parseCommandLine('git commit -am "hotfix"');
  assert(parsedAM?.flags['a'] === true, '-am should parse flag a as true');
  assert(parsedAM?.flags['m'] === 'hotfix', '-am should parse flag m as hotfix');

  const { error: unclosedError } = tokenizeCommand('git commit -m "unclosed string');
  assert(Boolean(unclosedError), 'Should error on unclosed quote');

  console.log('✓ Test 1 Passed: Command Tokenizer and Flag Parser');
}

// 2. Uninitialized Repository Defense
{
  let state = createPristineRepoState();
  const res = executeCommand(state, 'git status');
  assert(res.exitCode === 128, 'git status should exit 128 when not initialized');
  assert(res.stderr[0].includes('not a git repository'), 'Must output standard git fatal error');

  console.log('✓ Test 2 Passed: Uninitialized repository access defense');
}

// 3. git init Lifecycle
{
  let state = createPristineRepoState();
  const initRes = executeCommand(state, 'git init');
  assert(initRes.exitCode === 0, 'git init should succeed');
  assert(initRes.nextState.isInitialized === true, 'Repo must be marked initialized');
  assert(initRes.nextState.activeBranch === 'main', 'Active branch must default to main');

  // Re-initialization idempotence
  const reinitRes = executeCommand(initRes.nextState, 'git init');
  assert(reinitRes.exitCode === 0, 'Re-init should succeed without error');
  assert(reinitRes.stdout[0].includes('Reinitialized existing Git repository'), 'Output confirms re-init');

  console.log('✓ Test 3 Passed: git init lifecycle and idempotence');
}

// 4. File Creation & Status
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;

  // touch file
  state = executeCommand(state, 'touch test.txt').nextState;
  assert(state.workingTree['test.txt'] === '', 'File should exist with empty content');

  const statusRes = executeCommand(state, 'git status');
  assert(statusRes.stdout.some((l) => l.includes('test.txt')), 'Status must report test.txt in untracked');

  console.log('✓ Test 4 Passed: File creation and initial untracked status');
}

// 5. Staging & Staged-New-Then-Modified Dual-Listing
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "version 1" > app.js').nextState;

  // Stage app.js
  state = executeCommand(state, 'git add app.js').nextState;
  assert(state.index['app.js'] === 'version 1\n', 'Staging area must contain version 1');

  // Modify app.js in working tree again!
  state = executeCommand(state, 'echo "version 2" > app.js').nextState;
  assert(state.workingTree['app.js'] === 'version 2\n', 'Working tree has version 2');
  assert(state.index['app.js'] === 'version 1\n', 'Staging area still has version 1');

  // Check independent derivation
  const staged = getStagedChanges({}, state.index);
  const unstaged = getUnstagedChanges(state.index, state.workingTree);

  assert(staged.length === 1 && staged[0].type === 'new file' && staged[0].path === 'app.js', 'Staged as new file');
  assert(unstaged.length === 1 && unstaged[0].type === 'modified' && unstaged[0].path === 'app.js', 'Unstaged as modified');

  // Check git status text output reflects dual-listing
  const statusRes = executeCommand(state, 'git status');
  const fullOutput = statusRes.stdout.join('\n');
  assert(fullOutput.includes('Changes to be committed:'), 'Must show Changes to be committed');
  assert(fullOutput.includes('new file:   app.js'), 'Must show new file: app.js');
  assert(fullOutput.includes('Changes not staged for commit:'), 'Must show Changes not staged');
  assert(fullOutput.includes('modified:   app.js'), 'Must show modified: app.js');

  console.log('✓ Test 5 Passed: Staged-new-then-modified dual-listing verified');
}

// 6. Staged Deletion & Recreated on Disk
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "base" > file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "Add file.txt"').nextState;

  // Delete from disk and stage deletion
  state = executeCommand(state, 'rm file.txt').nextState;
  state = executeCommand(state, 'git add file.txt').nextState;

  // Staged deletion verified
  const stagedDel = getStagedChanges(state.commits[state.headCommitId!].tree, state.index);
  assert(stagedDel.length === 1 && stagedDel[0].type === 'deleted', 'Must be staged deletion');

  // Recreate on disk!
  state = executeCommand(state, 'echo "recreated" > file.txt').nextState;
  const untracked = getUntrackedFiles(state.workingTree, state.index, state.commits[state.headCommitId!].tree);
  assert(untracked.includes('file.txt'), 'Recreated file must be listed in untracked files');

  console.log('✓ Test 6 Passed: Staged deletion and working-tree recreation');
}

// 7. git restore --staged and git restore
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "v1" > demo.txt').nextState;
  state = executeCommand(state, 'git add demo.txt').nextState;

  // Unstage using restore --staged
  state = executeCommand(state, 'git restore --staged demo.txt').nextState;
  assert(!('demo.txt' in state.index), 'demo.txt must be removed from staging index');
  assert(state.workingTree['demo.txt'] === 'v1\n', 'Working tree must remain untouched');

  // Discard working tree change with restore
  state = executeCommand(state, 'git add demo.txt').nextState;
  state = executeCommand(state, 'git commit -m "Base demo"').nextState;
  state = executeCommand(state, 'echo "bad edit" > demo.txt').nextState;
  state = executeCommand(state, 'git restore demo.txt').nextState;
  assert(state.workingTree['demo.txt'] === 'v1\n', 'Working tree edit must be discarded to match commit');

  console.log('✓ Test 7 Passed: git restore --staged and git restore');
}

// 8. git commit and empty staging guard
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;

  // Attempt commit with empty staging
  const emptyRes = executeCommand(state, 'git commit -m "empty"');
  assert(emptyRes.stdout.some((l) => l.includes('nothing to commit')), 'Must refuse commit on empty stage');
  assert(Object.keys(emptyRes.nextState.commits).length === 0, 'Zero commits created');

  // Valid commit
  state = executeCommand(state, 'touch test.md').nextState;
  state = executeCommand(state, 'git add test.md').nextState;
  const commitRes = executeCommand(state, 'git commit -m "Initial test.md"');
  assert(commitRes.exitCode === 0, 'Commit should succeed');
  assert(Object.keys(commitRes.nextState.commits).length === 1, '1 commit created');
  assert(commitRes.nextState.branches['main'].commitId !== '', 'main branch points to commit');

  console.log('✓ Test 8 Passed: git commit and empty staging area guard');
}

// 9. git branch creation, listing and deletion
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1"').nextState;

  // Create branch
  state = executeCommand(state, 'git branch feature').nextState;
  assert('feature' in state.branches, 'feature branch must exist');
  assert(state.branches['feature'].commitId === state.branches['main'].commitId, 'Points to same commit');

  // Prevent duplicate branch
  const dupRes = executeCommand(state, 'git branch feature');
  assert(dupRes.exitCode === 128, 'Duplicate branch creation must error');

  // Prevent deleting active branch
  const delActiveRes = executeCommand(state, 'git branch -d main');
  assert(delActiveRes.exitCode === 1, 'Cannot delete active branch');

  // Delete non-active branch
  state = executeCommand(state, 'git branch -d feature').nextState;
  assert(!('feature' in state.branches), 'feature branch deleted');

  console.log('✓ Test 9 Passed: git branch creation, duplicate check, and deletion');
}

// 10. Conservative Dirty-Tree Switch Rejection
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "main file" > file.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1 on main"').nextState;

  state = executeCommand(state, 'git branch feature').nextState;

  // Make working tree dirty
  state = executeCommand(state, 'echo "uncommitted edit" >> file.txt').nextState;

  // Attempt switch to feature
  const dirtyRes = executeCommand(state, 'git switch feature');
  assert(dirtyRes.exitCode === 1, 'Dirty switch must be aborted');
  assert(dirtyRes.stderr[0].includes('Your local changes to the following files would be overwritten'), 'Aborts with error');
  assert(dirtyRes.nextState.activeBranch === 'main', 'Active branch must remain main');

  // Clean dirty change and switch
  state = executeCommand(state, 'git restore file.txt').nextState;
  const cleanRes = executeCommand(state, 'git switch feature');
  assert(cleanRes.exitCode === 0, 'Clean switch succeeds');
  assert(cleanRes.nextState.activeBranch === 'feature', 'Switched to feature branch');

  console.log('✓ Test 10 Passed: Conservative dirty-tree switch rejection');
}

// 11. Remote Push & Ancestry Integrity Verification
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch f1.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C1"').nextState;
  state = executeCommand(state, 'touch f2.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "C2"').nextState;

  // Add remote
  state = executeCommand(state, 'git remote add origin https://github.com/student/repo.git').nextState;
  assert('origin' in state.remotes, 'origin remote added');

  // Push
  state = executeCommand(state, 'git push -u origin main').nextState;
  const remote = state.remotes['origin'];
  assert(remote.branches['main'] === state.headCommitId, 'Remote branch main points to local head');
  assert(Object.keys(remote.commits).length === 2, 'Both commits synchronized to remote');

  // Verify full recursive multi-parent traversal integrity
  verifyRemoteAncestryIntegrity(remote, 'main');
  console.log('✓ Test 11 Passed: Remote push and ancestry integrity verification');
}

// 12. git rm and git rm --cached with failure cases
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;

  // Failure case: missing pathspec
  const noPathRes = executeCommand(state, 'git rm');
  assert(noPathRes.exitCode === 128, 'git rm without path must exit 128');
  assert(noPathRes.stderr[0].includes('No pathspec was given'), 'Error explains missing path');

  // Failure case: path not in repo
  const noMatchRes = executeCommand(state, 'git rm nonexistent.txt');
  assert(noMatchRes.exitCode === 128, 'git rm on nonexistent file must exit 128');
  assert(noMatchRes.stderr[0].includes('did not match any files'), 'Pathspec did not match error');

  // Setup tracked file
  state = executeCommand(state, 'echo "data1" > file1.txt').nextState;
  state = executeCommand(state, 'echo "data2" > file2.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "Base commit"').nextState;

  // Failure case: local modifications without --force
  state = executeCommand(state, 'echo "modified" > file1.txt').nextState;
  const modRes = executeCommand(state, 'git rm file1.txt');
  assert(modRes.exitCode === 1, 'git rm must fail if file has uncommitted local modifications');
  assert(modRes.stderr.some((l) => l.includes('local modifications')), 'Explains local modifications');
  assert('file1.txt' in modRes.nextState.workingTree, 'File preserved in working tree');
  assert('file1.txt' in modRes.nextState.index, 'File preserved in staging index');

  // Revert modification
  state = executeCommand(state, 'git restore file1.txt').nextState;

  // Behavior 1: git rm --cached file1.txt (keeps file on disk, removes from index)
  const cachedRmRes = executeCommand(state, 'git rm --cached file1.txt');
  assert(cachedRmRes.exitCode === 0, 'git rm --cached must succeed');
  assert(!('file1.txt' in cachedRmRes.nextState.index), 'Removed from staging index');
  assert('file1.txt' in cachedRmRes.nextState.workingTree, 'Preserved in working tree on disk');
  state = cachedRmRes.nextState;

  // Behavior 2: git rm file2.txt (removes from both disk and index)
  const rmRes = executeCommand(state, 'git rm file2.txt');
  assert(rmRes.exitCode === 0, 'git rm must succeed');
  assert(!('file2.txt' in rmRes.nextState.index), 'Removed from staging index');
  assert(!('file2.txt' in rmRes.nextState.workingTree), 'Removed from working tree');
  state = rmRes.nextState;

  console.log('✓ Test 12 Passed: git rm and git rm --cached with failure cases');
}

// 13. End-to-end git commit -am
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "original" > tracked.txt').nextState;
  state = executeCommand(state, 'git add tracked.txt').nextState;
  state = executeCommand(state, 'git commit -m "C1"').nextState;
  const c1Id = state.headCommitId!;

  // Modify tracked file in working tree without git add
  state = executeCommand(state, 'echo "updated content" > tracked.txt').nextState;

  // Create an untracked file (should NOT be auto-staged by -a)
  state = executeCommand(state, 'touch untracked.txt').nextState;

  // Execute git commit -am
  const commitRes = executeCommand(state, 'git commit -am "C2: auto-staged commit"');
  assert(commitRes.exitCode === 0, 'git commit -am should succeed');
  state = commitRes.nextState;

  const c2Id = state.headCommitId!;
  assert(c2Id !== c1Id, 'New commit snapshot created');
  const c2Commit = state.commits[c2Id];
  assert(c2Commit.tree['tracked.txt'] === 'updated content\n', 'Committed tree contains updated content');
  assert(!('untracked.txt' in c2Commit.tree), 'Untracked file was NOT auto-staged or committed');
  assert('untracked.txt' in state.workingTree, 'Untracked file preserved in working tree');

  console.log('✓ Test 13 Passed: End-to-end git commit -am execution and untracked isolation');
}

console.log('--- ALL GIT ENGINE TESTS PASSED! ---');


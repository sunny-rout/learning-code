import { executeCommand } from '../src/services/simulator/gitEngine';
import { createPristineRepoState } from '../src/services/simulator/defaultState';
import { resetRemoteRegistry, getRemoteFixture } from '../src/services/simulator/remoteFixtures';
import { LESSON_05 } from '../src/data/lessons/lesson-05';
import { LESSON_06 } from '../src/data/lessons/lesson-06';
import { LESSON_08 } from '../src/data/lessons/lesson-08';
import { LESSON_10 } from '../src/data/lessons/lesson-10';
import { LESSON_11 } from '../src/data/lessons/lesson-11';
import { LESSON_12 } from '../src/data/lessons/lesson-12';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 5: Remote Repositories, Synchronization & Curriculum Tests ---');

// ========================================================
// 1. Remote Branch Inspection & Upstream Configuration Tests
// ========================================================
{
  resetRemoteRegistry();
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "Hello World" > README.md').nextState;
  state = executeCommand(state, 'git add README.md').nextState;
  state = executeCommand(state, 'git commit -m "Initial commit"').nextState;
  state = executeCommand(state, 'git remote add origin https://github.com/student/git-practice.git').nextState;

  // Before push: no remote tracking branches
  const resBranchRBefore = executeCommand(state, 'git branch -r');
  assert(resBranchRBefore.exitCode === 0, 'git branch -r exits 0');
  assert(!resBranchRBefore.stdout.some((l) => l.includes('origin/main')), 'No origin/main before push');

  // Push with -u
  const pushRes = executeCommand(state, 'git push -u origin main');
  assert(pushRes.exitCode === 0, 'git push -u origin main succeeds');
  state = pushRes.nextState;

  // Verify upstream tracking branch is stored
  assert(state.branches['main'].upstream === 'origin/main', 'upstream is set on main branch');

  // git branch -r shows origin/main
  const resBranchR = executeCommand(state, 'git branch -r');
  assert(resBranchR.stdout.some((l) => l.includes('origin/main')), 'git branch -r shows origin/main');

  // git branch -a shows local and remote tracking
  const resBranchA = executeCommand(state, 'git branch -a');
  assert(resBranchA.stdout.some((l) => l.includes('* main')), 'git branch -a shows active local main');
  assert(resBranchA.stdout.some((l) => l.includes('remotes/origin/main')), 'git branch -a shows remotes/origin/main');

  // git branch -vv shows tracking annotation
  const resBranchVV = executeCommand(state, 'git branch -vv');
  assert(resBranchVV.stdout.some((l) => l.includes('[origin/main]')), 'git branch -vv indicates [origin/main]');

  // Upstream push with no arguments (0 args)
  state = executeCommand(state, 'echo "Update 1" >> README.md').nextState;
  state = executeCommand(state, 'git add README.md').nextState;
  state = executeCommand(state, 'git commit -m "Commit 2"').nextState;
  const pushZeroArgs = executeCommand(state, 'git push');
  assert(pushZeroArgs.exitCode === 0, '0-arg git push succeeds with upstream');
  assert(pushZeroArgs.stdout.some((l) => l.includes('main -> main')), '0-arg push output confirms branch sync');

  // Branch without upstream rejects 0-arg push
  state = executeCommand(state, 'git switch -c feature/test').nextState;
  state = executeCommand(state, 'echo "feature" > feat.txt').nextState;
  state = executeCommand(state, 'git add feat.txt').nextState;
  state = executeCommand(state, 'git commit -m "Feat commit"').nextState;
  const pushNoUpstream = executeCommand(state, 'git push');
  assert(pushNoUpstream.exitCode === 1, 'git push rejects branch without upstream');
  assert([...pushNoUpstream.stdout, ...pushNoUpstream.stderr].some((l) => l.includes('no upstream branch')), 'Helpful no-upstream error message');

  // Manual upstream setting via git branch -u
  const setUpstreamRes = executeCommand(state, 'git branch -u origin/main');
  assert(setUpstreamRes.exitCode === 0, 'git branch -u sets upstream');
  assert(setUpstreamRes.nextState.branches['feature/test'].upstream === 'origin/main', 'feature/test upstream updated');

  // Setting invalid upstream fails
  const setInvalidUpstream = executeCommand(state, 'git branch -u origin/nonexistent');
  assert(setInvalidUpstream.exitCode === 1, 'git branch -u invalid remote branch fails');

  console.log('✓ Test 1 Passed: Remote branch inspection, upstream tracking and 0-arg push');
}

// ========================================================
// 2. git fetch Isolation Tests
// ========================================================
{
  resetRemoteRegistry();
  // Remote fixture https://github.com/example/upstream-repo.git has commits u1 and u2 on main
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'git remote add origin https://github.com/example/upstream-repo.git').nextState;
  state = executeCommand(state, 'echo "Local initial" > file.txt').nextState;
  state = executeCommand(state, 'git add file.txt').nextState;
  state = executeCommand(state, 'git commit -m "Local root commit"').nextState;

  const localHeadBefore = state.headCommitId;
  const localTreeBefore = { ...state.workingTree };
  const localIndexBefore = { ...state.index };

  const fetchRes = executeCommand(state, 'git fetch origin');
  assert(fetchRes.exitCode === 0, 'git fetch origin succeeds');
  state = fetchRes.nextState;

  const upstreamFixture = getRemoteFixture('https://github.com/example/upstream-repo.git')!;
  const expectedRemoteCommit = upstreamFixture.branches['main'];

  // Isolation verification:
  // 1. Remote tracking branch origin/main is updated
  assert(state.remotes['origin'].branches['main'] === expectedRemoteCommit, 'origin/main ref points to remote commit');
  // 2. Local HEAD branch pointer did NOT move
  assert(state.headCommitId === localHeadBefore, 'Local HEAD did not move during fetch');
  // 3. Working tree is completely unchanged
  assert(JSON.stringify(state.workingTree) === JSON.stringify(localTreeBefore), 'Working tree untouched by fetch');
  // 4. Index is completely unchanged
  assert(JSON.stringify(state.index) === JSON.stringify(localIndexBefore), 'Index untouched by fetch');
  // 5. Remote commits are now reachable in local commit store
  assert(Boolean(state.commits[expectedRemoteCommit]), 'Fetched commit exists in local commit store');

  console.log('✓ Test 2 Passed: git fetch isolation verified (remote refs updated, working tree/HEAD pristine)');
}

// ========================================================
// 3. git pull Fast-Forward and Divergent Clean Integration
// ========================================================
{
  resetRemoteRegistry();
  // Clone https://github.com/example/project.git
  let state = createPristineRepoState();
  state = executeCommand(state, 'git clone https://github.com/example/project.git').nextState;
  assert(state.isInitialized, 'Clone initialized repository');
  assert(state.branches['main']?.upstream === 'origin/main', 'Clone sets upstream on main');

  // Advance the remote fixture to simulate collaborator pushing commit p2
  const fixture = getRemoteFixture('https://github.com/example/project.git')!;
  const baseCommitId = fixture.branches['main'];
  const newCommitId = 'p2';
  fixture.commits[newCommitId] = {
    id: newCommitId,
    message: 'Add collaborator notes',
    author: 'Collaborator <collab@example.com>',
    timestamp: '2026-10-05T00:00:00Z',
    parentIds: [baseCommitId],
    tree: {
      ...fixture.commits[baseCommitId].tree,
      'notes.md': '# Shared Notes\nCollaboration is great.\n',
    },
  };
  fixture.branches['main'] = newCommitId;

  // Local runs git pull -> Fast-forward integration
  const pullRes = executeCommand(state, 'git pull');
  assert(pullRes.exitCode === 0, 'git pull exits 0 on fast-forward');
  assert(pullRes.stdout.some((l) => l.includes('Fast-forward')), 'Reports Fast-forward');
  state = pullRes.nextState;

  assert(state.headCommitId === 'p2', 'HEAD advanced to p2');
  assert(state.remotes['origin'].branches['main'] === 'p2', 'origin/main advanced to p2');
  assert(state.workingTree['notes.md']?.includes('# Shared Notes'), 'New file checked out in working tree');
  assert(state.index['notes.md']?.includes('# Shared Notes'), 'New file staged in index');

  // Now create divergent commits on separate files
  // Local creates local_feat.txt
  state = executeCommand(state, 'echo "local feature" > local_feat.txt').nextState;
  state = executeCommand(state, 'git add local_feat.txt').nextState;
  state = executeCommand(state, 'git commit -m "Local feature"').nextState;
  const localCommitId = state.headCommitId!;

  // Remote creates remote_feat.txt
  const remoteCommitId = 'p3';
  fixture.commits[remoteCommitId] = {
    id: remoteCommitId,
    message: 'Remote collaborator feature',
    author: 'Collaborator <collab@example.com>',
    timestamp: '2026-10-05T01:00:00Z',
    parentIds: ['p2'],
    tree: {
      ...fixture.commits['p2'].tree,
      'remote_feat.txt': 'remote content\n',
    },
  };
  fixture.branches['main'] = remoteCommitId;

  // Local runs git pull -> Divergent clean 3-way merge
  const divergentPullRes = executeCommand(state, 'git pull');
  assert(divergentPullRes.exitCode === 0, 'Divergent pull cleanly merges');
  state = divergentPullRes.nextState;

  const mergeCommit = state.commits[state.headCommitId!];
  assert(mergeCommit.parentIds.length === 2, 'Merge commit has 2 parents');
  assert(mergeCommit.parentIds.includes(localCommitId), 'Merge commit parent 1 is local commit');
  assert(mergeCommit.parentIds.includes(remoteCommitId), 'Merge commit parent 2 is remote commit');
  assert(Boolean(state.workingTree['local_feat.txt']), 'Local feature file preserved in working tree');
  assert(Boolean(state.workingTree['remote_feat.txt']), 'Remote feature file integrated in working tree');

  console.log('✓ Test 3 Passed: git pull fast-forward and divergent clean 3-way merge');
}

// ========================================================
// 4. git pull Conflict Integration and Abort Preservation
// ========================================================
{
  resetRemoteRegistry();
  let state = createPristineRepoState();
  state = executeCommand(state, 'git clone https://github.com/example/project.git').nextState;

  // Local edits app.js
  state = executeCommand(state, 'echo "console.log(\'local version\');" > app.js').nextState;
  state = executeCommand(state, 'git add app.js').nextState;
  state = executeCommand(state, 'git commit -m "Local change to app.js"').nextState;
  const prePullHead = state.headCommitId!;
  const prePullWorkingApp = state.workingTree['app.js'];

  // Remote fixture also edits app.js differently
  const fixture = getRemoteFixture('https://github.com/example/project.git')!;
  const baseCommitId = fixture.branches['main'];
  const conflictCommitId = 'p_conflict';
  fixture.commits[conflictCommitId] = {
    id: conflictCommitId,
    message: 'Remote collaborator change to app.js',
    author: 'Collaborator <collab@example.com>',
    timestamp: '2026-10-05T02:00:00Z',
    parentIds: [baseCommitId],
    tree: {
      ...fixture.commits[baseCommitId].tree,
      'app.js': 'console.log("remote version");\n',
    },
  };
  fixture.branches['main'] = conflictCommitId;

  // Run git pull -> produces merge conflict
  const conflictPull = executeCommand(state, 'git pull');
  assert(conflictPull.exitCode === 1, 'Pull with conflicting files exits 1');
  assert(conflictPull.stdout.some((l) => l.includes('CONFLICT (content)')), 'Conflict notice emitted');
  state = conflictPull.nextState;

  // Verify non-atomic pull property:
  // 1. Fetch DID succeed: origin/main ref points to remote commit
  assert(state.remotes['origin'].branches['main'] === conflictCommitId, 'origin/main advanced to remote commit');
  // 2. Conflict markers are in working tree
  assert(state.workingTree['app.js'].includes('<<<<<<< HEAD'), 'app.js contains HEAD conflict marker');
  assert(state.workingTree['app.js'].includes('>>>>>>> origin/main'), 'app.js contains origin/main conflict marker');
  // 3. mergeState is populated
  assert(Boolean(state.mergeState), 'mergeState is active');
  assert(state.mergeState?.conflictingPaths.includes('app.js'), 'app.js listed in mergeState conflictingPaths');

  // git merge --abort should restore local working tree/HEAD while preserving origin/main
  const abortRes = executeCommand(state, 'git merge --abort');
  assert(abortRes.exitCode === 0, 'git merge --abort succeeds');
  state = abortRes.nextState;

  assert(state.headCommitId === prePullHead, 'HEAD restored to pre-pull commit');
  assert(state.workingTree['app.js'] === prePullWorkingApp, 'Working tree app.js restored to local version');
  assert(state.mergeState === null, 'mergeState cleared after abort');
  // Crucial: origin/main remains advanced!
  assert(state.remotes['origin'].branches['main'] === conflictCommitId, 'origin/main remains advanced after merge --abort');

  console.log('✓ Test 4 Passed: git pull conflict generates markers; merge --abort preserves fetched remote ref');
}

// ========================================================
// 5. git clone Edge Cases & Deterministic Fixture
// ========================================================
{
  resetRemoteRegistry();
  let state = createPristineRepoState();

  // Invalid URL fails
  const badClone = executeCommand(state, 'git clone https://github.com/invalid/nonexistent.git');
  assert(badClone.exitCode !== 0, 'Clone invalid URL fails');
  assert([...badClone.stdout, ...badClone.stderr].some((l) => l.toLowerCase().includes('not found')), 'Emits repository not found');

  // Valid clone
  const goodClone = executeCommand(state, 'git clone https://github.com/example/project.git');
  assert(goodClone.exitCode === 0, 'Clone succeeds');
  state = goodClone.nextState;

  assert(state.isInitialized, 'Cloned repo is initialized');
  assert(state.activeBranch === 'main', 'Default branch is main');
  assert(Boolean(state.remotes['origin']), 'Origin remote exists');
  assert(state.remotes['origin'].url === 'https://github.com/example/project.git', 'Remote URL correctly set');
  assert(state.workingTree['README.md']?.includes('Sample Web App'), 'README.md checked out');
  assert(state.workingTree['app.js'] !== undefined, 'app.js checked out');

  // Re-cloning inside an initialized repo fails
  const reClone = executeCommand(state, 'git clone https://github.com/student/git-practice.git');
  assert(reClone.exitCode !== 0, 'Re-cloning in initialized repo fails');
  assert([...reClone.stdout, ...reClone.stderr].some((l) => l.includes('already exists')), 'Reports repository already initialized');

  console.log('✓ Test 5 Passed: git clone validation and deterministic fixture checkout');
}

// ========================================================
// 6. git show Unified Diff & Commit Inspection
// ========================================================
{
  resetRemoteRegistry();
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'echo "Line 1" > file.txt').nextState;
  state = executeCommand(state, 'git add file.txt').nextState;
  state = executeCommand(state, 'git commit -m "Root commit"').nextState;
  const rootSha = state.headCommitId!;

  // Show root commit
  const showRoot = executeCommand(state, `git show ${rootSha}`);
  assert(showRoot.exitCode === 0, 'git show root commit exits 0');
  assert(showRoot.stdout.some((l) => l.includes('commit ' + rootSha)), 'Shows commit SHA');
  assert(showRoot.stdout.some((l) => l.includes('Author:')), 'Shows Author');
  assert(showRoot.stdout.some((l) => l.includes('diff --git a/file.txt b/file.txt')), 'Shows diff header');
  assert(showRoot.stdout.some((l) => l.includes('new file mode 100644')), 'Indicates new file');
  assert(showRoot.stdout.some((l) => l.includes('+Line 1')), 'Shows added line');

  // Second commit: modify file.txt and add second.txt
  state = executeCommand(state, 'echo "Line 2" >> file.txt').nextState;
  state = executeCommand(state, 'echo "Second file" > second.txt').nextState;
  state = executeCommand(state, 'git add .').nextState;
  state = executeCommand(state, 'git commit -m "Modify and add"').nextState;
  const secondSha = state.headCommitId!;

  // Show HEAD without arguments
  const showHead = executeCommand(state, 'git show');
  assert(showHead.exitCode === 0, 'git show defaults to HEAD');
  assert(showHead.stdout.some((l) => l.includes('commit ' + secondSha)), 'Shows second commit SHA');
  assert(showHead.stdout.some((l) => l.includes('diff --git a/second.txt b/second.txt')), 'Shows diff for second.txt');

  // Invalid commit sha
  const showBad = executeCommand(state, 'git show 9999999');
  assert(showBad.exitCode !== 0, 'git show bad SHA exits non-zero');
  assert([...showBad.stdout, ...showBad.stderr].some((l) => l.includes('fatal: bad object')), 'Emits fatal bad object');

  console.log('✓ Test 6 Passed: git show root commit, single-parent diff, and error handling');
}

// ========================================================
// 7. Phase 5 Lesson Modules Schema & Quality Verification
// ========================================================
{
  const phase5Lessons = [
    { lesson: LESSON_05, num: 5, expectedMod: 'module-05' },
    { lesson: LESSON_06, num: 6, expectedMod: 'module-06' },
    { lesson: LESSON_08, num: 8, expectedMod: 'module-08' },
    { lesson: LESSON_10, num: 10, expectedMod: 'module-10' },
    { lesson: LESSON_11, num: 11, expectedMod: 'module-11' },
    { lesson: LESSON_12, num: 12, expectedMod: 'module-12' },
  ];

  for (const { lesson, num, expectedMod } of phase5Lessons) {
    assert(lesson.number === num, `Lesson number must be ${num}`);
    assert(lesson.moduleId === expectedMod, `Lesson moduleId must be ${expectedMod}`);
    assert(Boolean(lesson.title), `Lesson ${num} must have title`);
    assert(Boolean(lesson.subtitle), `Lesson ${num} must have subtitle`);
    assert(lesson.estimatedMinutes > 0, `Lesson ${num} must have positive duration`);
    assert(lesson.steps.length >= 4, `Lesson ${num} must have at least 4 steps`);

    // Verify knowledge check
    const checkStep = lesson.steps.find((s) => s.knowledgeCheck !== undefined);
    assert(Boolean(checkStep), `Lesson ${num} must include knowledge check question`);
    assert(checkStep!.knowledgeCheck!.options.length >= 3, `Lesson ${num} question must have >=3 options`);
    assert(checkStep!.knowledgeCheck!.correctIndex >= 0, `Lesson ${num} correctIndex valid`);

    // Verify summary step
    const summaryStep = lesson.steps.find((s) => s.blocks.some((b) => b.type === 'summary'));
    assert(Boolean(summaryStep), `Lesson ${num} must contain summary block`);

    // Verify pitfalls
    const hasPitfall = lesson.steps.some((s) => s.blocks.some((b) => b.type === 'pitfall'));
    assert(hasPitfall, `Lesson ${num} must contain pitfall block`);
  }

  console.log('✓ Test 7 Passed: Lessons 05, 06, 08, 10, 11, 12 adhere strictly to schema');
}

console.log('All Phase 5 Remote Sync & Curriculum unit tests passed successfully!');

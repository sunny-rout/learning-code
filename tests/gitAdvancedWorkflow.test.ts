import { executeCommand, isIgnored } from '../src/services/simulator/gitEngine';
import { createPristineRepoState, createPracticeExerciseState } from '../src/services/simulator/defaultState';
import { resetRemoteRegistry } from '../src/services/simulator/remoteFixtures';
import { PRACTICE_SCENARIOS } from '../src/services/simulator/scenarioService';
import { ALL_LESSON_METADATA, loadLesson } from '../src/data/lessons';

console.log('--- Running Phase 6: Advanced Workflow, Tagging, File Management & Reflog Unit Tests ---');

// ==========================================
// Test 1: .gitignore Ordered Rule Evaluation & Last Matching Rule Precedence
// ==========================================
{
  const gitignore = `
# System ignore rules
*.log
!important.log
dist/
secrets.env
*.tmp
!keep.tmp
  `.trim();

  // 1. Basic matching
  if (!isIgnored('app.log', gitignore)) throw new Error('Test 1 Failed: app.log should be ignored');
  if (isIgnored('important.log', gitignore)) throw new Error('Test 1 Failed: important.log should NOT be ignored due to ! negation');
  if (!isIgnored('dist/bundle.js', gitignore)) throw new Error('Test 1 Failed: dist/bundle.js should be ignored by directory rule');
  if (!isIgnored('secrets.env', gitignore)) throw new Error('Test 1 Failed: secrets.env should be ignored by exact rule');
  if (isIgnored('README.md', gitignore)) throw new Error('Test 1 Failed: README.md should not be ignored');
  if (!isIgnored('cache.tmp', gitignore)) throw new Error('Test 1 Failed: cache.tmp should be ignored');
  if (isIgnored('keep.tmp', gitignore)) throw new Error('Test 1 Failed: keep.tmp should NOT be ignored due to ! negation');

  // 2. Integration with simulator engine
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch .gitignore').nextState;
  state.workingTree['.gitignore'] = '*.log\n!vital.log\ncache/\n';
  state = executeCommand(state, 'touch file.txt').nextState;
  state = executeCommand(state, 'touch debug.log').nextState;
  state = executeCommand(state, 'touch vital.log').nextState;

  // git status should show file.txt, .gitignore, and vital.log as untracked, but NOT debug.log
  const statusRes = executeCommand(state, 'git status -s');
  const statusOut = statusRes.stdout.join('\n');
  if (!statusOut.includes('?? file.txt')) throw new Error('Test 1 Failed: file.txt should be untracked in status');
  if (!statusOut.includes('?? vital.log')) throw new Error('Test 1 Failed: vital.log should be untracked in status');
  if (statusOut.includes('debug.log')) throw new Error('Test 1 Failed: debug.log should be omitted from status because it is ignored');

  // git add . should stage file.txt, .gitignore, vital.log, but NOT debug.log
  state = executeCommand(state, 'git add .').nextState;
  if (!Object.prototype.hasOwnProperty.call(state.index, 'file.txt')) throw new Error('Test 1 Failed: file.txt should be staged');
  if (!Object.prototype.hasOwnProperty.call(state.index, 'vital.log')) throw new Error('Test 1 Failed: vital.log should be staged');
  if (Object.prototype.hasOwnProperty.call(state.index, 'debug.log')) throw new Error('Test 1 Failed: debug.log should NOT be staged');

  // git add debug.log specifically should be rejected with exitCode 1
  const addIgnoredRes = executeCommand(state, 'git add debug.log');
  if (addIgnoredRes.exitCode !== 1) throw new Error('Test 1 Failed: git add on ignored file must exit with code 1');
  const errOutput = addIgnoredRes.stderr.join(' ');
  if (!errOutput.includes('ignored by one of your .gitignore files')) {
    throw new Error('Test 1 Failed: git add on ignored file must output warning message');
  }

  // Already tracked file is preserved when added to .gitignore
  state = executeCommand(state, 'git commit -m "Initial commit"').nextState;
  state.workingTree['.gitignore'] = '*.log\nfile.txt\n'; // file.txt is now in .gitignore
  state.workingTree['file.txt'] = 'updated content';
  const trackedStatusRes = executeCommand(state, 'git status -s');
  if (!trackedStatusRes.stdout.some((l) => l.includes('M file.txt'))) {
    throw new Error('Test 1 Failed: Already-tracked file must still show modifications even if added to .gitignore');
  }

  console.log('✓ Test 1 Passed: .gitignore ordered rule evaluation, negation, and index isolation verified');
}

// ==========================================
// Test 2: git mv and File Renaming
// ==========================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch old-name.txt').nextState;
  state = executeCommand(state, 'git add old-name.txt').nextState;
  state = executeCommand(state, 'git commit -m "Add old-name.txt"').nextState;

  // Error case: destination already exists
  state = executeCommand(state, 'touch existing.txt').nextState;
  const dupMv = executeCommand(state, 'git mv old-name.txt existing.txt');
  if (dupMv.exitCode !== 128) throw new Error('Test 2 Failed: git mv to existing target must exit with 128');

  // Success case: atomic rename in workingTree and index
  const mvRes = executeCommand(state, 'git mv old-name.txt new-name.txt');
  if (mvRes.exitCode !== 0) throw new Error('Test 2 Failed: valid git mv must succeed');
  state = mvRes.nextState;

  if (Object.prototype.hasOwnProperty.call(state.workingTree, 'old-name.txt')) throw new Error('Test 2 Failed: old path must be deleted from workingTree');
  if (!Object.prototype.hasOwnProperty.call(state.workingTree, 'new-name.txt')) throw new Error('Test 2 Failed: new path must exist in workingTree');
  if (Object.prototype.hasOwnProperty.call(state.index, 'old-name.txt')) throw new Error('Test 2 Failed: old path must be removed from staging index');
  if (!Object.prototype.hasOwnProperty.call(state.index, 'new-name.txt')) throw new Error('Test 2 Failed: new path must be staged in index');

  console.log('✓ Test 2 Passed: git mv atomic rename and collision guard verified');
}

// ==========================================
// Test 3: git clean (-n dry-run, -f force, unsupported flags, ignored preservation)
// ==========================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch tracked.txt').nextState;
  state = executeCommand(state, 'git add tracked.txt').nextState;
  state = executeCommand(state, 'git commit -m "Base commit"').nextState;

  // Add untracked and ignored files
  state.workingTree['.gitignore'] = '*.log\n';
  state.workingTree['temp.txt'] = 'temp content';
  state.workingTree['scratch.js'] = 'scratch content';
  state.workingTree['debug.log'] = 'ignored log';

  // 1. git clean without -n or -f must be rejected
  const bareClean = executeCommand(state, 'git clean');
  if (bareClean.exitCode !== 1) throw new Error('Test 3 Failed: bare git clean without -f or -n must fail');
  if (!bareClean.stderr.some((l) => l.includes('clean.requireForce'))) {
    throw new Error('Test 3 Failed: bare git clean must report clean.requireForce error');
  }

  // 2. Unsupported flags must be rejected
  const unsupportedClean = executeCommand(state, 'git clean -fd');
  if (unsupportedClean.exitCode !== 1) throw new Error('Test 3 Failed: unsupported clean flags must be rejected');

  // 3. git clean -n (dry-run): preview without deleting
  const dryRun = executeCommand(state, 'git clean -n');
  if (dryRun.exitCode !== 0) throw new Error('Test 3 Failed: git clean -n must succeed');
  const dryLines = dryRun.stdout.join('\n');
  if (!dryLines.includes('Would remove temp.txt')) throw new Error('Test 3 Failed: dry run must report temp.txt');
  if (!dryLines.includes('Would remove scratch.js')) throw new Error('Test 3 Failed: dry run must report scratch.js');
  if (dryLines.includes('debug.log')) throw new Error('Test 3 Failed: dry run must PRESERVE ignored debug.log');
  // State must remain completely unchanged
  if (!Object.prototype.hasOwnProperty.call(dryRun.nextState.workingTree, 'temp.txt')) throw new Error('Test 3 Failed: dry run must NOT delete files');

  // 4. git clean -f (force): deletes untracked, preserves ignored and tracked
  const forceClean = executeCommand(state, 'git clean -f');
  if (forceClean.exitCode !== 0) throw new Error('Test 3 Failed: git clean -f must succeed');
  state = forceClean.nextState;

  if (Object.prototype.hasOwnProperty.call(state.workingTree, 'temp.txt')) throw new Error('Test 3 Failed: temp.txt should have been deleted');
  if (Object.prototype.hasOwnProperty.call(state.workingTree, 'scratch.js')) throw new Error('Test 3 Failed: scratch.js should have been deleted');
  if (!Object.prototype.hasOwnProperty.call(state.workingTree, 'tracked.txt')) throw new Error('Test 3 Failed: tracked.txt must be preserved');
  if (!Object.prototype.hasOwnProperty.call(state.workingTree, 'debug.log')) throw new Error('Test 3 Failed: ignored debug.log must be preserved');

  console.log('✓ Test 3 Passed: git clean -n dry-run, -f force, and ignored file preservation verified');
}

// ==========================================
// Test 4: Tag Subsystem (lightweight, annotated, listing, deletion, git show)
// ==========================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch app.js').nextState;
  state = executeCommand(state, 'git add app.js').nextState;
  state = executeCommand(state, 'git commit -m "First release candidate"').nextState;
  const c1Id = state.headCommitId!;

  // 1. Create lightweight tag
  state = executeCommand(state, 'git tag v0.9-alpha').nextState;
  if (!state.tags['v0.9-alpha']) throw new Error('Test 4 Failed: v0.9-alpha tag not created');
  if (state.tags['v0.9-alpha'].type !== 'lightweight') throw new Error('Test 4 Failed: must be lightweight tag');
  if (state.tags['v0.9-alpha'].commitId !== c1Id) throw new Error('Test 4 Failed: tag must point to c1Id');

  // 2. Create annotated tag
  state = executeCommand(state, 'git tag -a v1.0.0 -m "Official release 1.0.0"').nextState;
  if (!state.tags['v1.0.0']) throw new Error('Test 4 Failed: v1.0.0 tag not created');
  const aTag = state.tags['v1.0.0'];
  if (aTag.type !== 'annotated') throw new Error('Test 4 Failed: must be annotated tag');
  if (aTag.message !== 'Official release 1.0.0') throw new Error('Test 4 Failed: annotated message mismatch');

  // 3. Duplicate tag rejection
  const dupTag = executeCommand(state, 'git tag v1.0.0');
  if (dupTag.exitCode !== 128) throw new Error('Test 4 Failed: duplicate tag creation must fail with 128');

  // 4. Tag listing
  const tagList = executeCommand(state, 'git tag');
  if (tagList.stdout[0] !== 'v0.9-alpha' || tagList.stdout[1] !== 'v1.0.0') {
    throw new Error('Test 4 Failed: tags must be listed in alphabetical order');
  }

  // 5. git show <tag> resolution
  // Lightweight tag shows commit
  const showLight = executeCommand(state, 'git show v0.9-alpha');
  if (!showLight.stdout.some((l) => l.includes(`commit ${c1Id}`))) {
    throw new Error('Test 4 Failed: git show on lightweight tag must show target commit');
  }

  // Annotated tag shows tag metadata header then commit details
  const showAnnotated = executeCommand(state, 'git show v1.0.0');
  const annOut = showAnnotated.stdout.join('\n');
  if (!annOut.includes('tag v1.0.0')) throw new Error('Test 4 Failed: git show on annotated tag must show tag header');
  if (!annOut.includes('Official release 1.0.0')) throw new Error('Test 4 Failed: must show annotated tag message');
  if (!annOut.includes(`commit ${c1Id}`)) throw new Error('Test 4 Failed: must show commit details');

  // Invalid tag returns exitCode 128 fatal: bad object
  const showBad = executeCommand(state, 'git show v999.0.0');
  if (showBad.exitCode !== 128 || !showBad.stderr.some((l) => l.includes('fatal: bad object'))) {
    throw new Error('Test 4 Failed: git show on invalid tag must return 128 with fatal: bad object');
  }

  // 6. Delete tag
  state = executeCommand(state, 'git tag -d v0.9-alpha').nextState;
  if (state.tags['v0.9-alpha']) throw new Error('Test 4 Failed: v0.9-alpha should have been deleted');

  console.log('✓ Test 4 Passed: Tag creation, listing, inspection, and deletion verified');
}

// ==========================================
// Test 5: Remote Tag Collision Guard & Push Synchronization
// ==========================================
{
  resetRemoteRegistry();
  let state = createPracticeExerciseState(7);
  const c1Id = state.headCommitId!;

  // Create annotated tag v1.0.0 locally
  state = executeCommand(state, 'git tag -a v1.0.0 -m "Release version 1.0.0"').nextState;

  // Push tag to origin: git push origin --tags
  const pushRes = executeCommand(state, 'git push origin --tags');
  if (pushRes.exitCode !== 0) throw new Error('Test 5 Failed: git push origin --tags failed');
  state = pushRes.nextState;

  const origin = state.remotes['origin'];
  if (!origin.tags || origin.tags['v1.0.0'] !== c1Id) {
    throw new Error('Test 5 Failed: remote origin must now contain v1.0.0 tag pointing to c1Id');
  }

  // Idempotent push of same tag to same commit
  const pushIdempotent = executeCommand(state, 'git push origin --tags');
  if (pushIdempotent.exitCode !== 0 || !pushIdempotent.stdout.includes('Everything up-to-date')) {
    throw new Error('Test 5 Failed: pushing identical tag must be idempotent with Everything up-to-date');
  }

  // COLLISION REJECTION GUARD (Blocker 4):
  // Simulate remote tag pointing to a different commit
  state.remotes['origin'].tags['v1.0.0'] = '9999999'; // different SHA on remote
  const collisionRes = executeCommand(state, 'git push origin --tags');
  if (collisionRes.exitCode !== 1) throw new Error('Test 5 Failed: pushing conflicting tag must be rejected with exitCode 1');
  const collisionErr = [...collisionRes.stdout, ...collisionRes.stderr].join(' ');
  if (!collisionErr.includes('[rejected]') || !collisionErr.includes('already exists')) {
    throw new Error('Test 5 Failed: conflicting tag push must emit rejected already exists message');
  }
  // Verify remote tag was NOT overwritten
  if (state.remotes['origin'].tags['v1.0.0'] !== '9999999') {
    throw new Error('Test 5 Failed: remote tag must never be silently overwritten');
  }

  console.log('✓ Test 5 Passed: Remote tag synchronization, idempotence, and collision rejection guard verified');
}

// ==========================================
// Test 6: Reflog Semantics & Movement Auditing
// ==========================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch file.txt').nextState;
  state = executeCommand(state, 'git add file.txt').nextState;
  state = executeCommand(state, 'git commit -m "Commit 1"').nextState;
  const c1 = state.headCommitId!;

  state = executeCommand(state, 'echo "v2" > file.txt').nextState;
  state = executeCommand(state, 'git commit -am "Commit 2"').nextState;
  const c2 = state.headCommitId!;

  // 1. Verify reflog entries: newest first
  if (!state.reflog || state.reflog.length !== 2) {
    throw new Error(`Test 6 Failed: reflog should have 2 entries, found ${state.reflog?.length}`);
  }
  if (state.reflog[0].id !== 'HEAD@{0}' || state.reflog[0].commitId !== c2) {
    throw new Error('Test 6 Failed: HEAD@{0} must point to latest commit c2');
  }
  if (state.reflog[1].id !== 'HEAD@{1}' || state.reflog[1].commitId !== c1) {
    throw new Error('Test 6 Failed: HEAD@{1} must point to earlier commit c1');
  }

  // 2. Stash operations do NOT create fake reflog entries
  state = executeCommand(state, 'echo "dirty" > file.txt').nextState;
  state = executeCommand(state, 'git stash').nextState;
  if (state.reflog.length !== 2) {
    throw new Error('Test 6 Failed: git stash must NOT record a reflog entry');
  }
  state = executeCommand(state, 'git stash pop').nextState;
  if (state.reflog.length !== 2) {
    throw new Error('Test 6 Failed: git stash pop must NOT record a reflog entry');
  }

  // 3. git reflog command outputs formatted entries
  const reflogOut = executeCommand(state, 'git reflog');
  if (reflogOut.stdout.length !== 2) throw new Error('Test 6 Failed: git reflog should print 2 lines');
  if (!reflogOut.stdout[0].includes('HEAD@{0}') || !reflogOut.stdout[1].includes('HEAD@{1}')) {
    throw new Error('Test 6 Failed: git reflog must display HEAD@{n} identifiers');
  }

  console.log('✓ Test 6 Passed: Reflog pointer movement recording and stash isolation verified');
}

// ==========================================
// Test 7: HEAD@{n} Resolution & Recovery
// ==========================================
{
  let state = createPristineRepoState();
  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'touch data.txt').nextState;
  state = executeCommand(state, 'git add data.txt').nextState;
  state = executeCommand(state, 'git commit -m "Important work"').nextState;
  const goodCommitId = state.headCommitId!;

  // Make a second commit
  state = executeCommand(state, 'echo "broken" > data.txt').nextState;
  state = executeCommand(state, 'git commit -am "Accidental mistake"').nextState;

  // Accidental hard reset to HEAD~1
  state = executeCommand(state, 'git reset --hard HEAD~1').nextState;
  if (state.headCommitId !== goodCommitId) throw new Error('Test 7 Failed: reset should have moved HEAD');

  // Now recover using HEAD@{1}
  // The reset itself moved HEAD, creating a new reflog entry!
  // Entry 0 is the reset: moving to HEAD~1
  // Entry 1 is the commit: Accidental mistake
  const recoverRes = executeCommand(state, 'git reset --hard HEAD@{1}');
  if (recoverRes.exitCode !== 0) throw new Error('Test 7 Failed: git reset --hard HEAD@{1} failed');
  state = recoverRes.nextState;

  if (state.workingTree['data.txt'] !== 'broken\n') {
    throw new Error('Test 7 Failed: recovery with HEAD@{1} did not restore commit state');
  }

  // Detached checkout of HEAD@{2}
  const checkoutReflog = executeCommand(state, 'git checkout HEAD@{2}');
  if (checkoutReflog.exitCode !== 0) throw new Error('Test 7 Failed: checkout HEAD@{2} failed');
  if (checkoutReflog.nextState.activeBranch !== null) {
    throw new Error('Test 7 Failed: checking out HEAD@{n} must result in detached HEAD');
  }

  // Out of bounds reflog reference
  const badRef = executeCommand(state, 'git reset HEAD@{99}');
  if (badRef.exitCode !== 128) throw new Error('Test 7 Failed: out-of-bounds HEAD@{n} must return exitCode 128');

  console.log('✓ Test 7 Passed: HEAD@{n} resolution, recovery, and detached checkout verified');
}

// ==========================================
// Test 8: Exercise 7 Capstone Practice Scenario
// ==========================================
{
  resetRemoteRegistry();
  const scenario = PRACTICE_SCENARIOS[7];
  if (!scenario) throw new Error('Test 8 Failed: Exercise 7 definition missing in PRACTICE_SCENARIOS');

  let state = scenario.initialState;
  if (scenario.isCompleted(state)) throw new Error('Test 8 Failed: Initial state should not be completed');

  // Step 1: Create and switch to feature/login
  state = executeCommand(state, 'git switch -c feature/login').nextState;

  // Step 2: Create login.js and commit
  state = executeCommand(state, 'touch login.js').nextState;
  state = executeCommand(state, 'git add login.js').nextState;
  state = executeCommand(state, 'git commit -m "Add login module"').nextState;

  // Step 3: Switch back to main and merge feature/login
  state = executeCommand(state, 'git switch main').nextState;
  state = executeCommand(state, 'git merge feature/login').nextState;

  // Step 4: Delete feature branch
  state = executeCommand(state, 'git branch -d feature/login').nextState;

  // Step 5: Create annotated release tag v1.0.0
  state = executeCommand(state, 'git tag -a v1.0.0 -m "Release version 1.0.0"').nextState;

  // Step 6: Push all tags to origin
  state = executeCommand(state, 'git push origin --tags').nextState;

  // Step 7: Evaluate scenario completion contract
  if (!scenario.isCompleted(state)) {
    throw new Error('Test 8 Failed: Scenario 7 evaluator did not pass after completing all required workflow steps');
  }

  console.log('✓ Test 8 Passed: Exercise 7 Capstone Workflow and Evaluator Verified');
}

// ==========================================
// Test 9: Curriculum Lessons 13–17 Schema & Metadata
// ==========================================
(async () => {
  const lessonIds = ['lesson-13', 'lesson-14', 'lesson-15', 'lesson-16', 'lesson-17'];

  for (const id of lessonIds) {
    const meta = ALL_LESSON_METADATA.find((m) => m.id === id);
    if (!meta) throw new Error(`Test 9 Failed: Metadata for ${id} not found`);

    const lesson = await loadLesson(id);
    if (!lesson) throw new Error(`Test 9 Failed: Dynamic loader for ${id} failed to load lesson`);

    if (lesson.id !== id) throw new Error(`Test 9 Failed: ${id} id mismatch`);
    if (!lesson.steps || lesson.steps.length < 3) throw new Error(`Test 9 Failed: ${id} must have at least 3 steps`);

    const hasQuiz = lesson.steps.some((s) => s.knowledgeCheck);
    if (!hasQuiz) throw new Error(`Test 9 Failed: ${id} must have a knowledge check step`);
  }

  console.log('✓ Test 9 Passed: Lessons 13–17 metadata, dynamic loaders, and schemas verified');
  console.log('All Phase 6 Advanced Workflow & Curriculum unit tests passed successfully!');
})();

import { executeCommand } from '../src/services/simulator/gitEngine';
import { PRACTICE_SCENARIOS } from '../src/services/simulator/scenarioService';
import { verifyRemoteAncestryIntegrity } from '../src/services/simulator/gitHelpers';
import { createPracticeExerciseState } from '../src/services/simulator/defaultState';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Practice Scenario Validation Tests ---');

// 1. Scenario 1: Initialize a Repository
{
  const scenario = PRACTICE_SCENARIOS[1];
  let state = scenario.initialState;
  assert(!scenario.isCompleted(state), 'Initial state must not be completed');

  state = executeCommand(state, 'git init').nextState;
  state = executeCommand(state, 'git status').nextState;
  assert(!scenario.isCompleted(state), 'Requires README.md creation');

  state = executeCommand(state, 'touch README.md').nextState;
  assert(scenario.isCompleted(state), 'Exercise 1 goal conditions satisfied');
  console.log('✓ Scenario 1 Passed: Initialize a Repository');
}

// 2. Scenario 2: Your First Commit
{
  const scenario = PRACTICE_SCENARIOS[2];
  let state = scenario.initialState;
  assert(!scenario.isCompleted(state), 'Initial state must not be completed');

  state = executeCommand(state, 'git add README.md').nextState;
  assert(!scenario.isCompleted(state), 'Staging alone does not complete exercise');

  state = executeCommand(state, 'git commit -m "Initial commit"').nextState;
  assert(scenario.isCompleted(state), 'Exercise 2 completed after commit');
  console.log('✓ Scenario 2 Passed: Your First Commit');
}

// 3. Scenario 3: Branching Without Fear (with Strict Isolation Contract)
{
  const scenario = PRACTICE_SCENARIOS[3];
  let state = scenario.initialState;
  assert(!scenario.isCompleted(state), 'Initial state must not be completed');

  // Step 1: Switch to feature branch
  state = executeCommand(state, 'git switch -c feature/about').nextState;
  assert(state.activeBranch === 'feature/about', 'On feature/about');

  // Step 2: Create file and commit
  state = executeCommand(state, 'touch about.txt').nextState;
  state = executeCommand(state, 'git add about.txt').nextState;
  state = executeCommand(state, 'git commit -m "Add about page"').nextState;
  assert(!scenario.isCompleted(state), 'Must switch back to main to verify isolation');

  // Step 3: Switch back to main
  state = executeCommand(state, 'git switch main').nextState;
  assert(state.activeBranch === 'main', 'Switched back to main');

  // Verify strict isolation contract
  assert(scenario.isCompleted(state), 'Exercise 3 completed: feature branch holds about.txt, main is clean');
  assert(!('about.txt' in state.workingTree), 'Working tree on main does not have about.txt');
  assert(!('about.txt' in state.commits[state.headCommitId!].tree), 'main commit tree does not have about.txt');
  assert('about.txt' in state.commits[state.branches['feature/about'].commitId].tree, 'feature branch has about.txt');

  console.log('✓ Scenario 3 Passed: Branching Without Fear & Isolation Contract');
}

// 4. Scenario 4: Merging Branches (Divergent Non-Conflicting Merge)
{
  const scenario = PRACTICE_SCENARIOS[4];
  let state = scenario.initialState;
  assert(!scenario.isCompleted(state), 'Initial state must not be completed');

  // Verify divergent starting graph: main has docs.md, feature has about.txt
  assert('docs.md' in state.workingTree, 'main has docs.md');
  assert(!('about.txt' in state.workingTree), 'main does not have about.txt yet');

  // Merge feature/about into main
  const mergeRes = executeCommand(state, 'git merge feature/about');
  assert(mergeRes.exitCode === 0, 'Merge succeeds cleanly');
  state = mergeRes.nextState;

  assert(scenario.isCompleted(state), 'Exercise 4 completed: about.txt incorporated into main');
  assert('about.txt' in state.workingTree, 'about.txt now in working tree');
  assert('docs.md' in state.workingTree, 'docs.md preserved in working tree');
  assert('README.md' in state.workingTree, 'README.md preserved in working tree');

  // Verify merge commit has 2 parents
  const mergeCommit = state.commits[state.headCommitId!];
  assert(mergeCommit.parentIds.length === 2, 'Merge commit has 2 parents');

  console.log('✓ Scenario 4 Passed: Merging Branches with 2-parent merge commit');
}

// 5. Scenario 5: Connecting to GitHub & Pushing
{
  const scenario = PRACTICE_SCENARIOS[5];
  let state = scenario.initialState;
  assert(!scenario.isCompleted(state), 'Initial state must not be completed');

  state = executeCommand(state, 'git remote add origin https://github.com/student/git-practice.git').nextState;
  assert(!scenario.isCompleted(state), 'Adding remote alone does not complete exercise');

  state = executeCommand(state, 'git push -u origin main').nextState;
  assert(scenario.isCompleted(state), 'Exercise 5 completed after push');

  // Verify remote store has reachable commits
  verifyRemoteAncestryIntegrity(state.remotes['origin'], 'main');
  console.log('✓ Scenario 5 Passed: Connecting to GitHub & Pushing');
}

// 6. Reset & Re-entry Coverage Across Exercises 1–5
{
  for (let id = 1; id <= 5; id++) {
    const scenario = PRACTICE_SCENARIOS[id];
    let state = scenario.initialState;
    assert(!scenario.isCompleted(state), `Exercise ${id}: Initial seed state must not be completed`);

    // Mutate state with dirty edits, commits, and branches
    if (!state.isInitialized) {
      state = executeCommand(state, 'git init').nextState;
    }
    state = executeCommand(state, `touch dirty_exercise_${id}.tmp`).nextState;
    state = executeCommand(state, `git add dirty_exercise_${id}.tmp`).nextState;
    state = executeCommand(state, `git commit -m "Polluting commit ${id}"`).nextState;
    state = executeCommand(state, `git branch dirty_branch_${id}`).nextState;

    assert(`dirty_exercise_${id}.tmp` in state.workingTree, `Dirty file exists before reset in Ex ${id}`);
    assert(`dirty_branch_${id}` in state.branches, `Dirty branch exists before reset in Ex ${id}`);

    // Perform reset to starting seed state (matching useGitSimulator resetSandbox logic)
    const resetState = createPracticeExerciseState(id);
    assert(!scenario.isCompleted(resetState), `Exercise ${id}: Reset state must be strictly incomplete`);
    assert(
      !(`dirty_exercise_${id}.tmp` in resetState.workingTree),
      `Exercise ${id}: Reset must eliminate mutated files`
    );
    assert(
      !(`dirty_branch_${id}` in resetState.branches),
      `Exercise ${id}: Reset must eliminate mutated branches`
    );

    // Verify pristine baseline invariants per exercise
    if (id === 1) {
      assert(resetState.isInitialized === false, 'Ex 1 reset is uninitialized');
      assert(Object.keys(resetState.workingTree).length === 0, 'Ex 1 reset workingTree is empty');
    } else if (id === 2) {
      assert(resetState.isInitialized === true, 'Ex 2 reset is initialized');
      assert('README.md' in resetState.workingTree, 'Ex 2 reset has README.md');
      assert(resetState.headCommitId === null, 'Ex 2 reset has null HEAD');
    } else if (id === 3) {
      assert(resetState.headCommitId !== null, 'Ex 3 reset has 1 commit');
      assert(!('about.txt' in resetState.workingTree), 'Ex 3 reset does not have about.txt');
    } else if (id === 4) {
      assert(Object.keys(resetState.commits).length === 3, 'Ex 4 reset has 3 commits');
      assert('feature/about' in resetState.branches, 'Ex 4 reset has feature/about branch');
      assert('docs.md' in resetState.workingTree, 'Ex 4 reset has docs.md');
    } else if (id === 5) {
      assert(Object.keys(resetState.remotes).length === 0, 'Ex 5 reset has 0 remotes');
    }
  }

  // Cross-scenario re-entry test: Complete Ex 1, switch to Ex 2, switch to Ex 4, then back to Ex 1
  let currentScenarioState = createPracticeExerciseState(1);
  currentScenarioState = executeCommand(currentScenarioState, 'git init').nextState;
  currentScenarioState = executeCommand(currentScenarioState, 'touch README.md').nextState;
  assert(PRACTICE_SCENARIOS[1].isCompleted(currentScenarioState), 'Ex 1 completed');

  // Re-enter Ex 2: must get Ex 2 seed state without Ex 1 state carryover
  currentScenarioState = createPracticeExerciseState(2);
  assert(!PRACTICE_SCENARIOS[2].isCompleted(currentScenarioState), 'Ex 2 re-entry pristine');
  assert(currentScenarioState.isInitialized === true, 'Ex 2 re-entry is initialized');

  // Re-enter Ex 4: must have Ex 4 divergent 3-commit graph
  currentScenarioState = createPracticeExerciseState(4);
  assert(Object.keys(currentScenarioState.commits).length === 3, 'Ex 4 re-entry has 3 commits');
  assert('feature/about' in currentScenarioState.branches, 'Ex 4 re-entry has feature/about branch');

  // Re-enter Ex 1: must be uninitialized again
  currentScenarioState = createPracticeExerciseState(1);
  assert(currentScenarioState.isInitialized === false, 'Ex 1 re-entry restored to uninitialized');
  assert(Object.keys(currentScenarioState.workingTree).length === 0, 'Ex 1 re-entry empty tree');

  console.log('✓ Scenario 6 Passed: Automated Reset & Re-entry Coverage Across Exercises 1–5');
}

// 7. Exercise 6: Undo and Stash Operations
{
  let state = PRACTICE_SCENARIOS[6].initialState;
  assert(!PRACTICE_SCENARIOS[6].isCompleted(state), 'Ex 6 initially incomplete');

  // Step 1: Discard unstaged changes to README.md
  state = executeCommand(state, 'git restore README.md').nextState;
  // Step 2: Unstage feature.txt
  state = executeCommand(state, 'git restore --staged feature.txt').nextState;
  // Step 3: Stash temporary work
  state = executeCommand(state, 'git stash').nextState;
  assert(state.stash.length === 1, 'Stash entry created');
  assert(!PRACTICE_SCENARIOS[6].isCompleted(state), 'Ex 6 incomplete while stash not popped');

  // Step 4: Reapply stashed work
  state = executeCommand(state, 'git stash pop').nextState;
  assert(state.stash.length === 0, 'Stash popped cleanly');
  assert(PRACTICE_SCENARIOS[6].isCompleted(state), 'Ex 6 completed');

  // Re-entry test: re-entering Ex 6 yields clean seed state with stash length 0
  const reentered = createPracticeExerciseState(6);
  assert(!PRACTICE_SCENARIOS[6].isCompleted(reentered), 'Ex 6 re-entry incomplete');
  assert(reentered.stash.length === 0, 'Ex 6 re-entry stash clean');

  console.log('✓ Scenario 7 Passed: Exercise 6 Undo and Stash Operations Goal & Re-entry Validation');
}

console.log('--- ALL PRACTICE SCENARIO VALIDATION TESTS PASSED! ---');



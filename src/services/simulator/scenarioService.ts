import { GitRepoState, ScenarioDefinition } from '@/types/simulator';
import { createPracticeExerciseState } from './defaultState';
import { verifyRemoteAncestryIntegrity } from './gitHelpers';

export const PRACTICE_SCENARIOS: Record<number, ScenarioDefinition> = {
  1: {
    id: 1,
    title: 'Exercise 1: Initialize a Repository',
    subtitle: 'PDF Section 15 (Page 8)',
    description: 'Initialize an empty Git repository in the sandbox and create a README.md file in the working directory.',
    initialState: createPracticeExerciseState(1),
    targetCommands: ['git init', 'git status', 'touch README.md'],
    steps: [
      'Run `git init` to initialize the repository',
      'Run `git status` to inspect current branch status',
      'Run `touch README.md` to create your first project file',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      return state.isInitialized && Object.prototype.hasOwnProperty.call(state.workingTree, 'README.md');
    },
  },

  2: {
    id: 2,
    title: 'Exercise 2: Your First Commit',
    subtitle: 'PDF Section 15 (Page 8 & 9)',
    description: 'Move README.md to the staging index and record an immutable checkpoint in local repository history.',
    initialState: createPracticeExerciseState(2),
    targetCommands: ['git add README.md', 'git commit -m "Initial commit"', 'git log --oneline'],
    steps: [
      'Stage README.md using `git add README.md`',
      'Create a commit using `git commit -m "..."` with a descriptive message',
      'Inspect local history using `git log --oneline`',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      if (!state.isInitialized || !state.headCommitId) return false;
      const headCommit = state.commits[state.headCommitId];
      if (!headCommit) return false;
      return (
        Object.keys(state.commits).length >= 1 &&
        Object.prototype.hasOwnProperty.call(headCommit.tree, 'README.md')
      );
    },
  },

  3: {
    id: 3,
    title: 'Exercise 3: Branching Without Fear',
    subtitle: 'PDF Section 15 (Page 9)',
    description: 'Isolate experimental work on a dedicated branch, create a commit, and switch back to main to observe isolation.',
    initialState: createPracticeExerciseState(3),
    targetCommands: [
      'git switch -c feature/about',
      'touch about.txt',
      'git add about.txt',
      'git commit -m "Add about page"',
      'git switch main',
    ],
    steps: [
      'Create and switch to `feature/about` using `git switch -c feature/about`',
      'Create `about.txt` with `touch about.txt` and stage it with `git add about.txt`',
      'Commit on the feature branch using `git commit -m "Add about page"`',
      'Switch back to `main` using `git switch main` and verify `about.txt` is isolated',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      const featureBranch = state.branches['feature/about'];
      const mainBranch = state.branches['main'];
      if (!featureBranch || !mainBranch) return false;

      // 1. Must be currently on main
      if (state.activeBranch !== 'main') return false;

      // 2. Feature branch must point to a different, newer commit
      if (featureBranch.commitId === mainBranch.commitId) return false;

      const featureCommit = state.commits[featureBranch.commitId];
      const mainCommit = state.commits[mainBranch.commitId];
      if (!featureCommit || !mainCommit) return false;

      // 3. Feature branch tree must have about.txt
      if (!Object.prototype.hasOwnProperty.call(featureCommit.tree, 'about.txt')) return false;

      // 4. Main branch commit tree and current working tree must NOT have about.txt (proves isolation)
      const mainHasIt = Object.prototype.hasOwnProperty.call(mainCommit.tree, 'about.txt');
      const workingHasIt = Object.prototype.hasOwnProperty.call(state.workingTree, 'about.txt');

      return !mainHasIt && !workingHasIt;
    },
  },

  4: {
    id: 4,
    title: 'Exercise 4: Merging Branches',
    subtitle: 'PDF Section 15 (Page 9)',
    description: 'Incorporate completed work from feature/about into main using git merge.',
    initialState: createPracticeExerciseState(4),
    targetCommands: ['git switch main', 'git merge feature/about', 'git log --oneline'],
    steps: [
      'Ensure you are checked out on `main`',
      'Merge the feature branch using `git merge feature/about`',
      'Inspect the merged history using `git log --oneline`',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      if (state.activeBranch !== 'main' || !state.headCommitId) return false;
      const headCommit = state.commits[state.headCommitId];
      if (!headCommit) return false;

      // Head commit on main must now contain about.txt
      const hasAboutInHead = Object.prototype.hasOwnProperty.call(headCommit.tree, 'about.txt');
      const hasAboutInWorking = Object.prototype.hasOwnProperty.call(state.workingTree, 'about.txt');

      return hasAboutInHead && hasAboutInWorking;
    },
  },

  5: {
    id: 5,
    title: 'Exercise 5: Connecting to GitHub & Pushing',
    subtitle: 'PDF Section 15 (Page 9)',
    description: 'Register a remote named origin and push the main branch with upstream tracking.',
    initialState: createPracticeExerciseState(5),
    targetCommands: [
      'git remote add origin https://github.com/student/git-practice.git',
      'git push -u origin main',
      'git remote -v',
    ],
    steps: [
      'Add remote origin using `git remote add origin https://github.com/student/git-practice.git`',
      'Push your commits with upstream tracking using `git push -u origin main`',
      'Verify remote connection with `git remote -v`',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      const origin = state.remotes['origin'];
      if (!origin) return false;
      if (!origin.branches['main']) return false;
      if (origin.branches['main'] !== state.headCommitId) return false;

      try {
        verifyRemoteAncestryIntegrity(origin, 'main');
        return true;
      } catch {
        return false;
      }
    },
  },

  6: {
    id: 6,
    title: 'Exercise 6: Undo and Stash Operations',
    subtitle: 'Advanced Git Undo & Stashing',
    description: 'Discard unstaged changes, unstage staged files, stash work in progress, and reapply it safely.',
    initialState: createPracticeExerciseState(6),
    targetCommands: [
      'git restore README.md',
      'git restore --staged feature.txt',
      'git stash',
      'git stash pop',
    ],
    steps: [
      'Discard unwanted modifications to README.md using `git restore README.md`',
      'Unstage feature.txt using `git restore --staged feature.txt`',
      'Stash your temporary work safely with `git stash`',
      'Reapply your stashed work using `git stash pop`',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      const c1Id = state.headCommitId;
      if (!c1Id || !state.commits[c1Id]) return false;
      const headTree = state.commits[c1Id].tree;
      if (state.workingTree['README.md'] !== headTree['README.md']) return false;

      // feature.txt must be back in workingTree
      if (!state.workingTree['feature.txt']) return false;

      // Stash stack must be empty (popped)
      if (state.stash && state.stash.length > 0) return false;

      return !state.mergeState;
    },
  },

  7: {
    id: 7,
    title: 'Exercise 7: Production Workflow, Tagging & Push',
    subtitle: 'Feature Lifecycle, Annotated Release Tagging & Remote Tag Push',
    description: 'Implement a feature on a dedicated branch, merge it into main, clean up the branch, create annotated release tag v1.0.0, and publish all tags to origin.',
    initialState: createPracticeExerciseState(7),
    targetCommands: [
      'git switch -c feature/login',
      'touch login.js',
      'git add login.js',
      'git commit -m "Add login module"',
      'git switch main',
      'git merge feature/login',
      'git branch -d feature/login',
      'git tag -a v1.0.0 -m "Release version 1.0.0"',
      'git push origin --tags',
    ],
    steps: [
      'Create and switch to `feature/login` using `git switch -c feature/login`',
      'Create `login.js` using `touch login.js`, stage it with `git add login.js`, and commit with `git commit -m "Add login module"`',
      'Switch back to `main` using `git switch main` and merge with `git merge feature/login`',
      'Delete the merged feature branch with `git branch -d feature/login`',
      'Create annotated tag `v1.0.0` with `git tag -a v1.0.0 -m "Release version 1.0.0"`',
      'Push your tags to GitHub with `git push origin --tags`',
    ],
    isCompleted: (state: GitRepoState): boolean => {
      // 1. Must be on main
      if (state.activeBranch !== 'main' || !state.headCommitId) return false;
      const headCommit = state.commits[state.headCommitId];
      if (!headCommit) return false;

      // 2. Feature commit exists and main contains the merge
      if (!Object.prototype.hasOwnProperty.call(headCommit.tree, 'login.js')) return false;

      // 3. Feature branch deleted
      if (state.branches['feature/login']) return false;

      // 4. Annotated tag v1.0.0 points to HEAD
      const localTag = state.tags?.['v1.0.0'];
      if (!localTag || localTag.type !== 'annotated' || localTag.commitId !== state.headCommitId) {
        return false;
      }

      // 5. Remote v1.0.0 tag exists and points to the same commit
      const origin = state.remotes['origin'];
      if (!origin || !origin.tags || origin.tags['v1.0.0'] !== state.headCommitId) {
        return false;
      }

      return true;
    },
  },
};

export function getScenarioById(id: number): ScenarioDefinition | undefined {
  return PRACTICE_SCENARIOS[id];
}

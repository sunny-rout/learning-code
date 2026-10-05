import { GitRepoState, GitCommitNode } from '@/types/simulator';
import { createDeterministicCommitId } from './gitHelpers';

/**
 * Creates a completely clean, uninitialized repository state for freeform playground use.
 */
export function createPristineRepoState(): GitRepoState {
  return {
    isInitialized: false,
    workingTree: {
      'README.md': '# Welcome to GitLearn Sandbox\nExplore Git commands in an isolated in-memory environment.\n',
    },
    index: {},
    commits: {},
    branches: {},
    activeBranch: null,
    headCommitId: null,
    remotes: {},
  };
}

/**
 * Creates pre-seeded repository states for the beginner practice exercises.
 */
export function createPracticeExerciseState(exerciseId: number): GitRepoState {
  const timestamp = 1700000000000;
  const author = 'Student <student@example.com>';

  switch (exerciseId) {
    case 1:
      // Exercise 1: Initialize a Repository
      return {
        isInitialized: false,
        workingTree: {},
        index: {},
        commits: {},
        branches: {},
        activeBranch: null,
        headCommitId: null,
        remotes: {},
      };

    case 2:
      // Exercise 2: Your First Commit
      return {
        isInitialized: true,
        workingTree: {
          'README.md': '# My Practice Project\nLearning Git step-by-step.\n',
        },
        index: {},
        commits: {},
        branches: {
          main: { name: 'main', commitId: '' },
        },
        activeBranch: 'main',
        headCommitId: null,
        remotes: {},
      };

    case 3: {
      // Exercise 3: Branching Without Fear (1 commit on main)
      const c1Tree = { 'README.md': '# My Practice Project\n' };
      const c1Id = createDeterministicCommitId([], 'Initial commit', c1Tree, author, timestamp);
      const c1: GitCommitNode = {
        id: c1Id,
        parentIds: [],
        message: 'Initial commit',
        author,
        timestamp,
        tree: c1Tree,
      };

      return {
        isInitialized: true,
        workingTree: { ...c1Tree },
        index: { ...c1Tree },
        commits: { [c1Id]: c1 },
        branches: {
          main: { name: 'main', commitId: c1Id },
        },
        activeBranch: 'main',
        headCommitId: c1Id,
        remotes: {},
      };
    }

    case 4: {
      // Exercise 4: Merging Branches
      // Divergent, non-conflicting starting graph to teach true merge commit:
      // Base C1: README.md
      // Feature C2: adds about.txt (parent C1)
      // Main C3: adds docs.md (parent C1)
      const c1Tree = { 'README.md': '# Project\n' };
      const c1Id = createDeterministicCommitId([], 'Initial commit', c1Tree, author, timestamp);
      const c1: GitCommitNode = {
        id: c1Id,
        parentIds: [],
        message: 'Initial commit',
        author,
        timestamp,
        tree: c1Tree,
      };

      const c2Tree = { 'README.md': '# Project\n', 'about.txt': 'About our practice team.\n' };
      const c2Id = createDeterministicCommitId([c1Id], 'Add about page', c2Tree, author, timestamp + 1000);
      const c2: GitCommitNode = {
        id: c2Id,
        parentIds: [c1Id],
        message: 'Add about page',
        author,
        timestamp: timestamp + 1000,
        tree: c2Tree,
      };

      const c3Tree = { 'README.md': '# Project\n', 'docs.md': 'Project Documentation.\n' };
      const c3Id = createDeterministicCommitId([c1Id], 'Add docs page', c3Tree, author, timestamp + 2000);
      const c3: GitCommitNode = {
        id: c3Id,
        parentIds: [c1Id],
        message: 'Add docs page',
        author,
        timestamp: timestamp + 2000,
        tree: c3Tree,
      };

      return {
        isInitialized: true,
        workingTree: { ...c3Tree },
        index: { ...c3Tree },
        commits: {
          [c1Id]: c1,
          [c2Id]: c2,
          [c3Id]: c3,
        },
        branches: {
          main: { name: 'main', commitId: c3Id },
          'feature/about': { name: 'feature/about', commitId: c2Id },
        },
        activeBranch: 'main',
        headCommitId: c3Id,
        remotes: {},
      };
    }

    case 5: {
      // Exercise 5: Connecting to GitHub & Pushing (Local commits on main, 0 remotes)
      const c1Tree = { 'README.md': '# My Awesome Project\n' };
      const c1Id = createDeterministicCommitId([], 'Initial commit', c1Tree, author, timestamp);
      const c1: GitCommitNode = {
        id: c1Id,
        parentIds: [],
        message: 'Initial commit',
        author,
        timestamp,
        tree: c1Tree,
      };

      return {
        isInitialized: true,
        workingTree: { ...c1Tree },
        index: { ...c1Tree },
        commits: { [c1Id]: c1 },
        branches: {
          main: { name: 'main', commitId: c1Id },
        },
        activeBranch: 'main',
        headCommitId: c1Id,
        remotes: {},
      };
    }

    default:
      return createPristineRepoState();
  }
}

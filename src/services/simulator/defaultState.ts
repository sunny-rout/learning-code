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
    stash: [],
    mergeState: null,
    tags: {},
    reflog: [],
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
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [],
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
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [],
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
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [
          {
            id: 'HEAD@{0}',
            commitId: c1Id,
            action: 'commit (initial)',
            message: 'Initial commit',
            timestamp,
          },
        ],
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
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [
          {
            id: 'HEAD@{0}',
            commitId: c3Id,
            action: 'commit',
            message: 'Add docs page',
            timestamp: timestamp + 2000,
          },
          {
            id: 'HEAD@{1}',
            commitId: c1Id,
            action: 'commit (initial)',
            message: 'Initial commit',
            timestamp,
          },
        ],
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
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [
          {
            id: 'HEAD@{0}',
            commitId: c1Id,
            action: 'commit (initial)',
            message: 'Initial commit',
            timestamp,
          },
        ],
      };
    }

    case 6: {
      // Exercise 6: Undo and Stash Operations
      // Starting state: 1 commit on main, 1 unstaged edit on README.md, 1 staged edit on feature.txt
      const c1Tree = {
        'README.md': '# My Practice Project\nStable production content.\n',
        'feature.txt': 'Feature base content.\n',
      };
      const c1Id = createDeterministicCommitId([], 'Initial stable commit', c1Tree, author, timestamp);
      const c1: GitCommitNode = {
        id: c1Id,
        parentIds: [],
        message: 'Initial stable commit',
        author,
        timestamp,
        tree: c1Tree,
      };

      return {
        isInitialized: true,
        workingTree: {
          'README.md': '# My Practice Project\nAccidental unwanted typo here!\n',
          'feature.txt': 'Temporary feature notes to unstage.\n',
        },
        index: {
          'README.md': '# My Practice Project\nStable production content.\n',
          'feature.txt': 'Temporary feature notes to unstage.\n',
        },
        commits: { [c1Id]: c1 },
        branches: {
          main: { name: 'main', commitId: c1Id },
        },
        activeBranch: 'main',
        headCommitId: c1Id,
        remotes: {},
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [
          {
            id: 'HEAD@{0}',
            commitId: c1Id,
            action: 'commit (initial)',
            message: 'Initial stable commit',
            timestamp,
          },
        ],
      };
    }

    case 7: {
      // Exercise 7: Complete Production Workflow & Tagging
      // Pre-seeded with 1 initial commit on main, origin remote registered and pushed with upstream tracking
      const c1Tree = { 'README.md': '# Production App\nStable production codebase.\n' };
      const c1Id = createDeterministicCommitId([], 'Initial production commit', c1Tree, author, timestamp);
      const c1: GitCommitNode = {
        id: c1Id,
        parentIds: [],
        message: 'Initial production commit',
        author,
        timestamp,
        tree: c1Tree,
      };

      const remoteUrl = 'https://github.com/student/git-practice.git';

      return {
        isInitialized: true,
        workingTree: { ...c1Tree },
        index: { ...c1Tree },
        commits: { [c1Id]: c1 },
        branches: {
          main: { name: 'main', commitId: c1Id, upstream: 'origin/main' },
        },
        activeBranch: 'main',
        headCommitId: c1Id,
        remotes: {
          origin: {
            name: 'origin',
            url: remoteUrl,
            commits: { [c1Id]: c1 },
            branches: { main: c1Id },
            tags: {},
          },
        },
        stash: [],
        mergeState: null,
        tags: {},
        reflog: [
          {
            id: 'HEAD@{0}',
            commitId: c1Id,
            action: 'commit (initial)',
            message: 'Initial production commit',
            timestamp,
          },
        ],
      };
    }

    default:
      return createPristineRepoState();
  }
}

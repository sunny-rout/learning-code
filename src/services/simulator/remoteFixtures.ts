import { GitCommitNode, SimulatedRemoteRepo } from '@/types/simulator';
import { createDeterministicCommitId } from './gitHelpers';

const REMOTE_AUTHOR = 'Collaborator <teammate@example.com>';

function createInitialFixtures(): Record<string, SimulatedRemoteRepo> {
  // 1. Student practice remote (matches Exercise 5 & curriculum)
  const practiceUrl = 'https://github.com/student/git-practice.git';
  const p1Tree = { 'README.md': '# Practice Project\nInitial README on GitHub remote.\n' };
  const p1Id = createDeterministicCommitId([], 'Remote initial commit', p1Tree, REMOTE_AUTHOR, 1700000100000);
  const p1Commit: GitCommitNode = {
    id: p1Id,
    parentIds: [],
    message: 'Remote initial commit',
    author: REMOTE_AUTHOR,
    timestamp: 1700000100000,
    tree: p1Tree,
  };

  // 2. Cloneable sample project
  const projectUrl = 'https://github.com/example/project.git';
  const projTree = {
    'README.md': '# Sample Web App\nWelcome to the cloned project repository.\n',
    'app.js': 'console.log("Hello from cloned app!");\n',
  };
  const projC1Id = createDeterministicCommitId([], 'Initial project release', projTree, REMOTE_AUTHOR, 1700000200000);
  const projC1: GitCommitNode = {
    id: projC1Id,
    parentIds: [],
    message: 'Initial project release',
    author: REMOTE_AUTHOR,
    timestamp: 1700000200000,
    tree: projTree,
  };

  // 3. Upstream repo with divergent commits for testing fetch & pull
  const upstreamUrl = 'https://github.com/example/upstream-repo.git';
  const u1Tree = { 'shared.txt': 'base content\n' };
  const u1Id = createDeterministicCommitId([], 'Base commit', u1Tree, REMOTE_AUTHOR, 1700000300000);
  const u1: GitCommitNode = {
    id: u1Id,
    parentIds: [],
    message: 'Base commit',
    author: REMOTE_AUTHOR,
    timestamp: 1700000300000,
    tree: u1Tree,
  };

  const u2Tree = { 'shared.txt': 'base content\n', 'upstream-feature.txt': 'new upstream work\n' };
  const u2Id = createDeterministicCommitId([u1Id], 'Upstream update', u2Tree, REMOTE_AUTHOR, 1700000350000);
  const u2: GitCommitNode = {
    id: u2Id,
    parentIds: [u1Id],
    message: 'Upstream update',
    author: REMOTE_AUTHOR,
    timestamp: 1700000350000,
    tree: u2Tree,
  };

  return {
    [practiceUrl]: {
      url: practiceUrl,
      defaultBranch: 'main',
      branches: { main: p1Id },
      commits: { [p1Id]: p1Commit },
    },
    [projectUrl]: {
      url: projectUrl,
      defaultBranch: 'main',
      branches: { main: projC1Id },
      commits: { [projC1Id]: projC1 },
    },
    [upstreamUrl]: {
      url: upstreamUrl,
      defaultBranch: 'main',
      branches: { main: u2Id },
      commits: {
        [u1Id]: u1,
        [u2Id]: u2,
      },
    },
  };
}

// In-memory simulated remote registry
let remoteRegistry: Record<string, SimulatedRemoteRepo> = createInitialFixtures();

export function resetRemoteRegistry(): void {
  remoteRegistry = createInitialFixtures();
}

export function getRemoteFixture(url: string): SimulatedRemoteRepo | undefined {
  return remoteRegistry[url];
}

export function getOrCreateRemoteFixture(url: string): SimulatedRemoteRepo {
  if (!remoteRegistry[url]) {
    remoteRegistry[url] = {
      url,
      defaultBranch: 'main',
      branches: {},
      commits: {},
    };
  }
  return remoteRegistry[url];
}

export function registerRemoteFixture(fixture: SimulatedRemoteRepo): void {
  remoteRegistry[fixture.url] = fixture;
}

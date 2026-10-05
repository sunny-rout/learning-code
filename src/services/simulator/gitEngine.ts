import {
  GitRepoState,
  CommandResult,
  GitCommitNode,
  GitRemoteRef,
} from '@/types/simulator';
import { parseCommandLine } from './commandParser';
import {
  hasPath,
  createDeterministicCommitId,
  getStagedChanges,
  getUnstagedChanges,
  getUntrackedFiles,
  evaluateDirtyTree,
  isAncestor,
  findMergeBase,
} from './gitHelpers';

const SIMULATOR_AUTHOR = 'Student <student@example.com>';

/**
 * Pure state reducer executing a command against a GitRepoState.
 * Returns the next state and console output lines.
 */
export function executeCommand(
  currentState: GitRepoState,
  rawInput: string
): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      nextState: currentState,
      stdout: [],
      stderr: [],
      exitCode: 0,
    };
  }

  const { parsed, error } = parseCommandLine(trimmed);
  if (error || !parsed) {
    return {
      nextState: currentState,
      stdout: [],
      stderr: [error || 'syntax error: unable to parse command'],
      exitCode: 1,
    };
  }

  // 1. In-memory console file utilities (touch, echo, rm, cat, clear, reset, help)
  if (parsed.program === 'touch') {
    return handleTouch(currentState, parsed.positionalArgs);
  }

  if (parsed.program === 'echo') {
    return handleEcho(currentState, parsed.raw, parsed.positionalArgs);
  }

  if (parsed.program === 'rm') {
    return handleRm(currentState, parsed.positionalArgs);
  }

  if (parsed.program === 'cat') {
    return handleCat(currentState, parsed.positionalArgs);
  }

  if (parsed.program === 'clear') {
    return {
      nextState: currentState,
      stdout: [],
      stderr: [],
      exitCode: 0,
    };
  }

  if (parsed.program === 'help') {
    return handleHelp(currentState);
  }

  // 2. Git commands
  if (parsed.program === 'git') {
    return handleGitCommand(currentState, parsed.subcommand, parsed.flags, parsed.positionalArgs, parsed.raw);
  }

  return {
    nextState: currentState,
    stdout: [],
    stderr: [`command not found: ${parsed.program}. Type 'help' for available commands.`],
    exitCode: 127,
  };
}

// ==========================================
// Console Utilities Handlers
// ==========================================

function handleTouch(state: GitRepoState, args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['touch: missing file operand'],
      exitCode: 1,
    };
  }

  const filename = args[0];
  const nextWorkingTree = { ...state.workingTree };
  if (!hasPath(nextWorkingTree, filename)) {
    nextWorkingTree[filename] = '';
  }

  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Created file '${filename}'`,
      description: `File '${filename}' is now on disk in the Working Directory. It is currently untracked by Git.`,
      affectedStages: ['working'],
    },
  };
}

function handleEcho(state: GitRepoState, rawInput: string, args: string[]): CommandResult {
  // Check for redirect operator: echo "content" > file or echo "content" >> file
  const isAppend = rawInput.includes('>>');
  const isOverwrite = !isAppend && rawInput.includes('>');

  if (isOverwrite || isAppend) {
    const operator = isAppend ? '>>' : '>';
    const parts = rawInput.split(operator);
    const contentRaw = parts[0].trim().replace(/^echo\s+/, '').trim();
    // Strip wrapping quotes if any
    const content = contentRaw.replace(/^["']|["']$/g, '');
    const filename = parts[1].trim();

    if (!filename) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['syntax error near unexpected token `newline`'],
        exitCode: 1,
      };
    }

    const nextWorkingTree = { ...state.workingTree };
    const prev = nextWorkingTree[filename] || '';
    nextWorkingTree[filename] = isAppend ? prev + content + '\n' : content + '\n';

    return {
      nextState: {
        ...state,
        workingTree: nextWorkingTree,
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Wrote content to '${filename}'`,
        description: `Modified '${filename}' in the Working Directory.`,
        affectedStages: ['working'],
      },
    };
  }

  // Standard echo prints to stdout
  const message = args.join(' ');
  return {
    nextState: state,
    stdout: [message],
    stderr: [],
    exitCode: 0,
  };
}

function handleRm(state: GitRepoState, args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['rm: missing operand'],
      exitCode: 1,
    };
  }

  const filename = args[0];
  if (!hasPath(state.workingTree, filename)) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`rm: cannot remove '${filename}': No such file or directory`],
      exitCode: 1,
    };
  }

  const nextWorkingTree = { ...state.workingTree };
  delete nextWorkingTree[filename];

  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Deleted '${filename}' from Working Directory`,
      description: `Removed '${filename}' from disk. If this file was previously committed or staged, Git will report it as deleted.`,
      affectedStages: ['working'],
    },
  };
}

function handleCat(state: GitRepoState, args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['cat: missing file operand'],
      exitCode: 1,
    };
  }

  const filename = args[0];
  if (!hasPath(state.workingTree, filename)) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`cat: ${filename}: No such file or directory`],
      exitCode: 1,
    };
  }

  const content = state.workingTree[filename];
  const lines = content.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop(); // drop trailing empty string from split
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleHelp(state: GitRepoState): CommandResult {
  return {
    nextState: state,
    stdout: [
      'GitLearn Simulated Console — Supported Commands:',
      '  git init                    Initialize an empty Git repository',
      '  git status [-s]             Show the working tree and staging area status',
      '  git add <file> | .          Stage file changes for commit',
      '  git rm [--cached] <file>    Remove file from index (and working tree)',
      '  git restore [--staged] <f>  Discard changes in working tree or unstage files',
      '  git commit -m "<message>"   Record staged changes as a new commit snapshot',
      '  git commit -am "<message>"  Stage tracked files and commit in one step',
      '  git log [--oneline]         Show commit logs',
      '  git diff [--staged]         Show changes between stages',
      '  git branch [<name>] [-d]    List, create, or delete branches',
      '  git switch [-c] <name>      Switch to a branch (or create & switch)',
      '  git checkout [-b] <name>    Switch branches (alias for switch)',
      '  git merge <branch>          Merge target branch into active branch',
      '  git remote add <name> <url> Register a remote repository (e.g. origin)',
      '  git remote -v               List registered remote repositories',
      '  git push [-u] <rem> <br>    Push commits to simulated remote',
      '  touch / echo / rm / cat     In-memory file creation and manipulation',
      '  clear / help                Console screen utilities',
    ],
    stderr: [],
    exitCode: 0,
  };
}

// ==========================================
// Git Commands Handler
// ==========================================

function handleGitCommand(
  state: GitRepoState,
  subcommand: string | undefined,
  flags: Record<string, string | boolean>,
  args: string[],
  _rawInput: string
): CommandResult {
  if (!subcommand) {
    return {
      nextState: state,
      stdout: ['usage: git [--version] [--help] <command> [<args>]', "Type 'help' for supported commands."],
      stderr: [],
      exitCode: 0,
    };
  }

  // 1. git init
  if (subcommand === 'init') {
    if (state.isInitialized) {
      return {
        nextState: state,
        stdout: ['Reinitialized existing Git repository in /home/student/my-first-project/.git/'],
        stderr: [],
        exitCode: 0,
      };
    }

    return {
      nextState: {
        ...state,
        isInitialized: true,
        branches: {
          main: { name: 'main', commitId: '' },
        },
        activeBranch: 'main',
        headCommitId: null,
      },
      stdout: ['Initialized empty Git repository in /home/student/my-first-project/.git/'],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Initialized Empty Git Repository',
        description: "Created the hidden '.git' metadata repository. Default active branch is 'main'.",
        affectedStages: ['local'],
      },
    };
  }

  // All other commands require repository to be initialized
  if (!state.isInitialized) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: not a git repository (or any of the parent directories): .git'],
      exitCode: 128,
    };
  }

  const headCommit = state.headCommitId ? state.commits[state.headCommitId] : null;
  const headTree = headCommit ? headCommit.tree : {};

  // 2. git status
  if (subcommand === 'status') {
    return handleGitStatus(state, flags, headTree);
  }

  // 3. git add
  if (subcommand === 'add') {
    return handleGitAdd(state, args, headTree);
  }

  // 3b. git rm
  if (subcommand === 'rm') {
    return handleGitRm(state, flags, args, headTree);
  }

  // 4. git restore
  if (subcommand === 'restore') {
    return handleGitRestore(state, flags, args, headTree);
  }

  // 5. git commit
  if (subcommand === 'commit') {
    return handleGitCommit(state, flags, headTree);
  }

  // 6. git log
  if (subcommand === 'log') {
    return handleGitLog(state, flags);
  }

  // 7. git diff
  if (subcommand === 'diff') {
    return handleGitDiff(state, flags, headTree);
  }

  // 8. git branch
  if (subcommand === 'branch') {
    return handleGitBranch(state, flags, args);
  }

  // 9. git switch & git checkout
  if (subcommand === 'switch' || subcommand === 'checkout') {
    return handleGitSwitch(state, flags, args, subcommand === 'checkout');
  }

  // 10. git merge
  if (subcommand === 'merge') {
    return handleGitMerge(state, args);
  }

  // 11. git remote
  if (subcommand === 'remote') {
    return handleGitRemote(state, flags, args);
  }

  // 12. git push
  if (subcommand === 'push') {
    return handleGitPush(state, flags, args);
  }

  return {
    nextState: state,
    stdout: [],
    stderr: [`git: '${subcommand}' is not supported in this educational sandbox. Type 'help' for commands.`],
    exitCode: 1,
  };
}

// ==========================================
// Git Core Subcommand Implementations
// ==========================================

function handleGitStatus(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  headTree: Record<string, string>
): CommandResult {
  const staged = getStagedChanges(headTree, state.index);
  const unstaged = getUnstagedChanges(state.index, state.workingTree);
  const untracked = getUntrackedFiles(state.workingTree, state.index, headTree);

  const activeBranchName = state.activeBranch || 'HEAD (detached)';
  const isShort = Boolean(flags['s'] || flags['short']);

  if (isShort) {
    const lines: string[] = [];
    staged.forEach((s) => {
      const code = s.type === 'new file' ? 'A ' : s.type === 'modified' ? 'M ' : 'D ';
      lines.push(`${code} ${s.path}`);
    });
    unstaged.forEach((u) => {
      const code = u.type === 'modified' ? ' M' : ' D';
      lines.push(`${code} ${u.path}`);
    });
    untracked.forEach((u) => lines.push(`?? ${u}`));
    return {
      nextState: state,
      stdout: lines,
      stderr: [],
      exitCode: 0,
    };
  }

  const lines: string[] = [`On branch ${activeBranchName}`];

  if (!state.headCommitId) {
    lines.push('No commits yet');
  }

  if (staged.length > 0) {
    lines.push('');
    lines.push('Changes to be committed:');
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    staged.forEach((item) => {
      lines.push(`\t${item.type}:   ${item.path}`);
    });
  }

  if (unstaged.length > 0) {
    lines.push('');
    lines.push('Changes not staged for commit:');
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push('  (use "git restore <file>..." to discard changes in working directory)');
    unstaged.forEach((item) => {
      lines.push(`\t${item.type}:   ${item.path}`);
    });
  }

  if (untracked.length > 0) {
    lines.push('');
    lines.push('Untracked files:');
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    untracked.forEach((item) => {
      lines.push(`\t${item}`);
    });
  }

  if (staged.length === 0 && unstaged.length === 0 && untracked.length === 0) {
    lines.push('nothing to commit, working tree clean');
  } else if (staged.length === 0 && (unstaged.length > 0 || untracked.length > 0)) {
    lines.push('');
    lines.push('no changes added to commit (use "git add" to track)');
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleGitAdd(
  state: GitRepoState,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['Nothing specified, nothing added.', 'hint: Maybe you wanted to say `git add .`?'],
      exitCode: 0,
    };
  }

  const target = args[0];
  const nextIndex = { ...state.index };
  const stagedFiles: string[] = [];

  if (target === '.' || target === '-A') {
    // Stage all files in working tree
    for (const [p, content] of Object.entries(state.workingTree)) {
      nextIndex[p] = content;
      stagedFiles.push(p);
    }
    // Also remove any file from index if it was deleted from workingTree
    for (const p of Object.keys(state.index)) {
      if (!hasPath(state.workingTree, p)) {
        delete nextIndex[p];
        stagedFiles.push(p);
      }
    }
  } else {
    // Stage specific file
    if (!hasPath(state.workingTree, target)) {
      // Check if file was in index/HEAD and deleted from workingTree
      if (hasPath(state.index, target) || hasPath(headTree, target)) {
        delete nextIndex[target];
        stagedFiles.push(target);
      } else {
        return {
          nextState: state,
          stdout: [],
          stderr: [`fatal: pathspec '${target}' did not match any files`],
          exitCode: 128,
        };
      }
    } else {
      nextIndex[target] = state.workingTree[target];
      stagedFiles.push(target);
    }
  }

  return {
    nextState: {
      ...state,
      index: nextIndex,
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Staged changes for commit`,
      description: `Copied '${stagedFiles.join(', ')}' into the Staging Area (Index). These changes are now prepared for the next commit snapshot.`,
      affectedStages: ['working', 'staging'],
    },
  };
}

function handleGitRm(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: No pathspec was given. Which files should I remove?'],
      exitCode: 128,
    };
  }

  const path = args[0];
  const isCached = Boolean(flags['cached']);
  const isForce = Boolean(flags['f'] || flags['force']);

  const inIndex = hasPath(state.index, path);
  const inHead = hasPath(headTree, path);

  if (!inIndex && !inHead) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: pathspec '${path}' did not match any files`],
      exitCode: 128,
    };
  }

  // If not --cached and not --force, verify working tree does not have uncommitted/unstaged modifications relative to index
  if (!isCached && !isForce && inIndex && hasPath(state.workingTree, path)) {
    if (state.workingTree[path] !== state.index[path]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          `error: the following file has local modifications:`,
          `    ${path}`,
          `(use --cached to keep the file, or -f to force removal)`,
        ],
        exitCode: 1,
      };
    }
  }

  const nextIndex = { ...state.index };
  delete nextIndex[path];

  const nextWorkingTree = { ...state.workingTree };
  if (!isCached) {
    delete nextWorkingTree[path];
  }

  return {
    nextState: {
      ...state,
      index: nextIndex,
      workingTree: nextWorkingTree,
    },
    stdout: [`rm '${path}'`],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: isCached ? `Un-tracked '${path}'` : `Removed '${path}'`,
      description: isCached
        ? `Removed '${path}' from the Staging Area while preserving it in your Working Directory.`
        : `Removed '${path}' from both the Staging Area and the Working Directory.`,
      affectedStages: isCached ? ['staging'] : ['working', 'staging'],
    },
  };
}

function handleGitRestore(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: you must specify path(s) to restore'],
      exitCode: 128,
    };
  }

  const path = args[0];
  const isStaged = Boolean(flags['staged']);

  if (isStaged) {
    // Unstage: restore index from HEAD
    if (!hasPath(state.index, path)) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: pathspec '${path}' did not match any file(s) known to git`],
        exitCode: 1,
      };
    }

    const nextIndex = { ...state.index };
    if (hasPath(headTree, path)) {
      nextIndex[path] = headTree[path];
    } else {
      // Was a staged new file: unstaging removes it from index completely
      delete nextIndex[path];
    }

    return {
      nextState: {
        ...state,
        index: nextIndex,
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Unstaged '${path}'`,
        description: `Restored the index for '${path}' to match HEAD. The working tree remains untouched.`,
        affectedStages: ['staging'],
      },
    };
  }

  // Discard working tree changes: restore workingTree from index (or HEAD if not in index)
  const sourceTree = hasPath(state.index, path) ? state.index : headTree;
  if (!hasPath(sourceTree, path)) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`error: pathspec '${path}' did not match any file(s) known to git`],
      exitCode: 1,
    };
  }

  const nextWorkingTree = { ...state.workingTree, [path]: sourceTree[path] };
  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Discarded working tree changes in '${path}'`,
      description: `Reverted '${path}' in the Working Directory to match the Staging Area / HEAD.`,
      affectedStages: ['working'],
    },
  };
}

function handleGitCommit(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  headTree: Record<string, string>
): CommandResult {
  const message = typeof flags['m'] === 'string' ? flags['m'] : null;
  const isAll = Boolean(flags['a']);

  if (!message) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['error: switch `m` requires a value', 'Aborting commit due to empty commit message.'],
      exitCode: 1,
    };
  }

  let effectiveIndex = { ...state.index };

  // If -a flag provided: auto-stage all tracked files that were modified or deleted in workingTree
  if (isAll) {
    for (const p of Object.keys(effectiveIndex)) {
      if (hasPath(state.workingTree, p)) {
        effectiveIndex[p] = state.workingTree[p];
      } else {
        delete effectiveIndex[p];
      }
    }
  }

  // Check if staging area has any changes relative to HEAD
  const staged = getStagedChanges(headTree, effectiveIndex);
  if (staged.length === 0) {
    return {
      nextState: state,
      stdout: ['On branch ' + (state.activeBranch || 'main'), 'nothing to commit, working tree clean'],
      stderr: [],
      exitCode: 0,
    };
  }

  const timestamp = Date.now();
  const parentIds = state.headCommitId ? [state.headCommitId] : [];
  const commitId = createDeterministicCommitId(parentIds, message, effectiveIndex, SIMULATOR_AUTHOR, timestamp);

  const newCommit: GitCommitNode = {
    id: commitId,
    parentIds,
    message,
    author: SIMULATOR_AUTHOR,
    timestamp,
    tree: { ...effectiveIndex },
  };

  const nextCommits = { ...state.commits, [commitId]: newCommit };
  const nextBranches = { ...state.branches };

  if (state.activeBranch) {
    nextBranches[state.activeBranch] = {
      ...nextBranches[state.activeBranch],
      commitId,
    };
  }

  const branchLabel = state.activeBranch ? state.activeBranch : 'HEAD detached at ' + commitId;
  const isRoot = parentIds.length === 0;
  const rootTag = isRoot ? ' (root-commit)' : '';

  return {
    nextState: {
      ...state,
      index: effectiveIndex,
      commits: nextCommits,
      branches: nextBranches,
      headCommitId: commitId,
    },
    stdout: [
      `[${branchLabel}${rootTag} ${commitId}] ${message}`,
      ` ${staged.length} file${staged.length > 1 ? 's' : ''} changed`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Created Commit [${commitId}]`,
      description: `Sealed staged files into immutable snapshot '${commitId}' on branch '${state.activeBranch}'.`,
      affectedStages: ['staging', 'local'],
    },
  };
}

function handleGitLog(
  state: GitRepoState,
  flags: Record<string, string | boolean>
): CommandResult {
  if (!state.headCommitId) {
    return {
      nextState: state,
      stdout: [],
      stderr: ["fatal: your current branch '" + (state.activeBranch || 'main') + "' does not have any commits yet"],
      exitCode: 128,
    };
  }

  const isOneLine = Boolean(flags['oneline']);
  const lines: string[] = [];

  // Traverse commits backwards from headCommitId
  let currentId: string | null = state.headCommitId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const commit: GitCommitNode | undefined = state.commits[currentId];
    if (!commit) break;

    // Decorators: (HEAD -> main, feature)
    const decorators: string[] = [];
    if (currentId === state.headCommitId && state.activeBranch) {
      decorators.push(`HEAD -> ${state.activeBranch}`);
    } else if (currentId === state.headCommitId) {
      decorators.push('HEAD');
    }

    for (const [bName, bRef] of Object.entries(state.branches)) {
      if (bRef.commitId === currentId && bName !== state.activeBranch) {
        decorators.push(bName);
      }
    }

    const decorStr = decorators.length > 0 ? ` (${decorators.join(', ')})` : '';

    if (isOneLine) {
      lines.push(`${commit.id}${decorStr} ${commit.message}`);
    } else {
      lines.push(`commit ${commit.id}${decorStr}`);
      lines.push(`Author: ${commit.author}`);
      lines.push(`Date:   ${new Date(commit.timestamp).toUTCString()}`);
      lines.push('');
      lines.push(`    ${commit.message}`);
      lines.push('');
    }

    // Follow primary parent
    currentId = commit.parentIds.length > 0 ? commit.parentIds[0] : null;
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleGitDiff(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  headTree: Record<string, string>
): CommandResult {
  const isStaged = Boolean(flags['staged'] || flags['cached']);
  const lines: string[] = [];

  if (isStaged) {
    // Compare headTree vs index
    const staged = getStagedChanges(headTree, state.index);
    if (staged.length === 0) {
      return { nextState: state, stdout: [], stderr: [], exitCode: 0 };
    }
    staged.forEach((item) => {
      lines.push(`diff --git a/${item.path} b/${item.path}`);
      lines.push(`--- a/${item.path}`);
      lines.push(`+++ b/${item.path}`);
      const before = headTree[item.path] || '';
      const after = state.index[item.path] || '';
      if (before) lines.push(`- ${before.trim()}`);
      if (after) lines.push(`+ ${after.trim()}`);
    });
  } else {
    // Compare index vs workingTree
    const unstaged = getUnstagedChanges(state.index, state.workingTree);
    if (unstaged.length === 0) {
      return { nextState: state, stdout: [], stderr: [], exitCode: 0 };
    }
    unstaged.forEach((item) => {
      lines.push(`diff --git a/${item.path} b/${item.path}`);
      lines.push(`--- a/${item.path}`);
      lines.push(`+++ b/${item.path}`);
      const before = state.index[item.path] || '';
      const after = state.workingTree[item.path] || '';
      if (before) lines.push(`- ${before.trim()}`);
      if (after) lines.push(`+ ${after.trim()}`);
    });
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleGitBranch(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  const isDelete = Boolean(flags['d'] || flags['D']);

  if (isDelete) {
    if (args.length === 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['fatal: branch name required'],
        exitCode: 1,
      };
    }
    const target = args[0];
    if (target === state.activeBranch) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: Cannot delete branch '${target}' checked out at '/home/student/my-first-project'`],
        exitCode: 1,
      };
    }
    if (!state.branches[target]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: branch '${target}' not found.`],
        exitCode: 1,
      };
    }

    const nextBranches = { ...state.branches };
    delete nextBranches[target];

    return {
      nextState: {
        ...state,
        branches: nextBranches,
      },
      stdout: [`Deleted branch ${target} (was ${state.branches[target].commitId.slice(0, 7)}).`],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Deleted Branch '${target}'`,
        description: `Removed reference '${target}'. The commits themselves remain in history if reachable.`,
        affectedStages: ['local'],
      },
    };
  }

  // Branch creation: git branch <name>
  if (args.length > 0) {
    const branchName = args[0];
    if (state.branches[branchName]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`fatal: A branch named '${branchName}' already exists.`],
        exitCode: 128,
      };
    }

    const currentCommit = state.headCommitId || '';
    const nextBranches = {
      ...state.branches,
      [branchName]: {
        name: branchName,
        commitId: currentCommit,
      },
    };

    return {
      nextState: {
        ...state,
        branches: nextBranches,
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Created Branch '${branchName}'`,
        description: `Created new branch reference '${branchName}' pointing to current commit ${currentCommit.slice(0, 7)}. HEAD remains on '${state.activeBranch}'.`,
        affectedStages: ['local'],
      },
    };
  }

  // Listing branches
  const lines: string[] = [];
  for (const bName of Object.keys(state.branches).sort()) {
    if (bName === state.activeBranch) {
      lines.push(`* \x1b[32m${bName}\x1b[0m`);
    } else {
      lines.push(`  ${bName}`);
    }
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleGitSwitch(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  isCheckout: boolean
): CommandResult {
  const createFlag = flags['c'] || flags['b'];
  const isCreate = Boolean(createFlag);
  let targetBranch = isCreate && typeof createFlag === 'string' ? createFlag : args[0];

  if (!targetBranch) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: missing branch name`],
      exitCode: 1,
    };
  }

  // If -c or -b: create and switch
  if (isCreate) {
    if (state.branches[targetBranch]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`fatal: A branch named '${targetBranch}' already exists.`],
        exitCode: 128,
      };
    }

    const nextBranches = {
      ...state.branches,
      [targetBranch]: {
        name: targetBranch,
        commitId: state.headCommitId || '',
      },
    };

    return {
      nextState: {
        ...state,
        branches: nextBranches,
        activeBranch: targetBranch,
      },
      stdout: [`Switched to a new branch '${targetBranch}'`],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Created and Switched to '${targetBranch}'`,
        description: `Created branch '${targetBranch}' at current commit and updated HEAD pointer.`,
        affectedStages: ['local'],
      },
    };
  }

  // Normal switch
  if (!state.branches[targetBranch]) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        isCheckout
          ? `error: pathspec '${targetBranch}' did not match any file(s) known to git`
          : `fatal: invalid reference: ${targetBranch}`,
      ],
      exitCode: 1,
    };
  }

  if (targetBranch === state.activeBranch) {
    return {
      nextState: state,
      stdout: [`Already on '${targetBranch}'`],
      stderr: [],
      exitCode: 0,
    };
  }

  const targetCommitId = state.branches[targetBranch].commitId;
  const targetCommit = targetCommitId ? state.commits[targetCommitId] : null;
  const targetTree = targetCommit ? targetCommit.tree : {};

  // CONSERVATIVE DIRTY-TREE CHECK
  const headCommit = state.headCommitId ? state.commits[state.headCommitId] : null;
  const headTree = headCommit ? headCommit.tree : {};
  const dirtyCheck = evaluateDirtyTree(state.workingTree, state.index, headTree);

  if (dirtyCheck.isDirty) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'error: Your local changes to the following files would be overwritten by checkout:',
        ...dirtyCheck.dirtyPaths.map((p) => `\t${p}`),
        'Please commit your changes or stash them before you switch branches.',
        'Aborting',
      ],
      exitCode: 1,
    };
  }

  // Untracked collision check: Untracked files that exist in target tree
  const untracked = getUntrackedFiles(state.workingTree, state.index, headTree);
  for (const u of untracked) {
    if (hasPath(targetTree, u)) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          'error: The following untracked working tree files would be overwritten by checkout:',
          `\t${u}`,
          'Please move or remove them before you switch branches.',
          'Aborting',
        ],
        exitCode: 1,
      };
    }
  }

  // Clean switch: replace workingTree and index with targetTree (preserving untracked files)
  const nextWorkingTree: Record<string, string> = { ...targetTree };
  for (const u of untracked) {
    nextWorkingTree[u] = state.workingTree[u];
  }

  return {
    nextState: {
      ...state,
      activeBranch: targetBranch,
      headCommitId: targetCommitId || null,
      index: { ...targetTree },
      workingTree: nextWorkingTree,
    },
    stdout: [`Switched to branch '${targetBranch}'`],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Switched Branch to '${targetBranch}'`,
      description: `Moved HEAD to branch '${targetBranch}'. Working directory and staging area updated to match snapshot.`,
      affectedStages: ['working', 'staging', 'local'],
    },
  };
}

function handleGitMerge(
  state: GitRepoState,
  args: string[]
): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: No commit specified and merge.default not set.'],
      exitCode: 128,
    };
  }

  const targetBranch = args[0];
  if (!state.branches[targetBranch]) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`merge: ${targetBranch} - not something we can merge`],
      exitCode: 1,
    };
  }

  if (targetBranch === state.activeBranch) {
    return {
      nextState: state,
      stdout: ['Already up to date.'],
      stderr: [],
      exitCode: 0,
    };
  }

  const currentCommitId = state.headCommitId;
  const targetCommitId = state.branches[targetBranch].commitId;

  if (!targetCommitId) {
    return {
      nextState: state,
      stdout: ['Already up to date.'],
      stderr: [],
      exitCode: 0,
    };
  }

  if (!currentCommitId) {
    // Current branch has no commits, fast-forward directly to target
    const targetCommit = state.commits[targetCommitId];
    const nextBranches = {
      ...state.branches,
      [state.activeBranch!]: {
        ...state.branches[state.activeBranch!],
        commitId: targetCommitId,
      },
    };
    return {
      nextState: {
        ...state,
        branches: nextBranches,
        headCommitId: targetCommitId,
        index: { ...targetCommit.tree },
        workingTree: { ...targetCommit.tree },
      },
      stdout: [`Updating 0000000..${targetCommitId.slice(0, 7)}`, 'Fast-forward'],
      stderr: [],
      exitCode: 0,
    };
  }

  if (currentCommitId === targetCommitId) {
    return {
      nextState: state,
      stdout: ['Already up to date.'],
      stderr: [],
      exitCode: 0,
    };
  }

  // 1. Ancestry Evaluation for Fast-Forward
  const isFastForward = isAncestor(state.commits, currentCommitId, targetCommitId);

  if (isFastForward) {
    const targetCommit = state.commits[targetCommitId];
    const nextBranches = {
      ...state.branches,
      [state.activeBranch!]: {
        ...state.branches[state.activeBranch!],
        commitId: targetCommitId,
      },
    };

    return {
      nextState: {
        ...state,
        branches: nextBranches,
        headCommitId: targetCommitId,
        index: { ...targetCommit.tree },
        workingTree: { ...targetCommit.tree },
      },
      stdout: [
        `Updating ${currentCommitId.slice(0, 7)}..${targetCommitId.slice(0, 7)}`,
        'Fast-forward',
      ],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Fast-Forward Merge Completed`,
        description: `Active branch '${state.activeBranch}' was directly behind '${targetBranch}'. Simply advanced pointer to ${targetCommitId.slice(0, 7)}.`,
        affectedStages: ['working', 'staging', 'local'],
      },
    };
  }

  // 2. Non-Fast-Forward Merge: Find merge base
  const mergeBaseId = findMergeBase(state.commits, currentCommitId, targetCommitId);
  const baseTree = mergeBaseId && state.commits[mergeBaseId] ? state.commits[mergeBaseId].tree : {};
  const currentTree = state.commits[currentCommitId].tree;
  const targetTree = state.commits[targetCommitId].tree;

  // Conflict evaluation: detect if same path was modified differently in both branches relative to base
  const allPaths = new Set([
    ...Object.keys(baseTree),
    ...Object.keys(currentTree),
    ...Object.keys(targetTree),
  ]);

  const conflicts: string[] = [];
  const mergedTree: Record<string, string> = {};

  for (const p of allPaths) {
    const baseVal = baseTree[p];
    const currentVal = currentTree[p];
    const targetVal = targetTree[p];

    if (currentVal === targetVal) {
      if (currentVal !== undefined) mergedTree[p] = currentVal;
    } else if (currentVal === baseVal) {
      // Changed only in target
      if (targetVal !== undefined) mergedTree[p] = targetVal;
    } else if (targetVal === baseVal) {
      // Changed only in current
      if (currentVal !== undefined) mergedTree[p] = currentVal;
    } else {
      // Modified differently in both! Conflict!
      conflicts.push(p);
    }
  }

  if (conflicts.length > 0) {
    return {
      nextState: state,
      stdout: conflicts.map((c) => `Auto-merging ${c}\nCONFLICT (content): Merge conflict in ${c}`),
      stderr: [
        '[Educational Sandbox Notice] Interactive 3-way merge conflict editing is scheduled for Phase 4.',
        'To preserve repository state, this merge has been aborted.',
      ],
      exitCode: 1,
    };
  }

  // Create clean 2-parent merge commit
  const timestamp = Date.now();
  const parentIds = [currentCommitId, targetCommitId];
  const mergeMessage = `Merge branch '${targetBranch}' into ${state.activeBranch}`;
  const mergeCommitId = createDeterministicCommitId(parentIds, mergeMessage, mergedTree, SIMULATOR_AUTHOR, timestamp);

  const mergeCommit: GitCommitNode = {
    id: mergeCommitId,
    parentIds,
    message: mergeMessage,
    author: SIMULATOR_AUTHOR,
    timestamp,
    tree: mergedTree,
  };

  const nextCommits = { ...state.commits, [mergeCommitId]: mergeCommit };
  const nextBranches = {
    ...state.branches,
    [state.activeBranch!]: {
      ...state.branches[state.activeBranch!],
      commitId: mergeCommitId,
    },
  };

  return {
    nextState: {
      ...state,
      commits: nextCommits,
      branches: nextBranches,
      headCommitId: mergeCommitId,
      index: { ...mergedTree },
      workingTree: { ...mergedTree },
    },
    stdout: [
      `Merge made by the 'ort' strategy.`,
      `Created merge commit [${mergeCommitId.slice(0, 7)}] with 2 parents (${currentCommitId.slice(0, 7)}, ${targetCommitId.slice(0, 7)}).`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `3-Way Merge Commit Created [${mergeCommitId.slice(0, 7)}]`,
      description: `Combined diverged work from '${targetBranch}' into '${state.activeBranch}'. Generated merge snapshot with two parent links.`,
      affectedStages: ['working', 'staging', 'local'],
    },
  };
}

function handleGitRemote(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  const isVerbose = Boolean(flags['v'] || flags['verbose']);

  if (args.length === 0 || isVerbose) {
    const lines: string[] = [];
    for (const [rName, rRef] of Object.entries(state.remotes)) {
      if (isVerbose) {
        lines.push(`${rName}\t${rRef.url} (fetch)`);
        lines.push(`${rName}\t${rRef.url} (push)`);
      } else {
        lines.push(rName);
      }
    }
    return { nextState: state, stdout: lines, stderr: [], exitCode: 0 };
  }

  const sub = args[0];
  if (sub === 'add') {
    if (args.length < 3) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['usage: git remote add <name> <url>'],
        exitCode: 1,
      };
    }
    const rName = args[1];
    const rUrl = args[2];

    if (state.remotes[rName]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: remote ${rName} already exists.`],
        exitCode: 3,
      };
    }

    const nextRemotes: Record<string, GitRemoteRef> = {
      ...state.remotes,
      [rName]: {
        name: rName,
        url: rUrl,
        commits: {},
        branches: {},
      },
    };

    return {
      nextState: {
        ...state,
        remotes: nextRemotes,
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Added Remote '${rName}'`,
        description: `Configured remote '${rName}' pointing to '${rUrl}'. Ready to synchronize commits.`,
        affectedStages: ['remote'],
      },
    };
  }

  return {
    nextState: state,
    stdout: [],
    stderr: [`error: unknown remote subcommand '${sub}'`],
    exitCode: 1,
  };
}

function handleGitPush(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  let remoteName = 'origin';
  let branchName = state.activeBranch || 'main';

  // Support: git push, git push origin main, git push -u origin main
  if (args.length >= 2) {
    remoteName = args[0];
    branchName = args[1];
  } else if (args.length === 1) {
    remoteName = args[0];
  }

  const remote = state.remotes[remoteName];
  if (!remote) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: '${remoteName}' does not appear to be a git repository`, "fatal: Could not read from remote repository."],
      exitCode: 128,
    };
  }

  const localBranch = state.branches[branchName];
  if (!localBranch || !localBranch.commitId) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`error: src refspec ${branchName} does not match any`],
      exitCode: 1,
    };
  }

  // OBJECT GRAPH SYNCHRONIZATION:
  // Recursively collect all reachable commits from localBranch.commitId down all parent paths
  const reachableCommits: Record<string, GitCommitNode> = { ...remote.commits };
  const queue: string[] = [localBranch.commitId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const cId = queue.shift()!;
    if (visited.has(cId)) continue;
    visited.add(cId);

    const commit = state.commits[cId];
    if (commit) {
      reachableCommits[cId] = commit;
      for (const pId of commit.parentIds) {
        if (!visited.has(pId)) {
          queue.push(pId);
        }
      }
    }
  }

  const nextRemotes: Record<string, GitRemoteRef> = {
    ...state.remotes,
    [remoteName]: {
      ...remote,
      commits: reachableCommits,
      branches: {
        ...remote.branches,
        [branchName]: localBranch.commitId,
      },
    },
  };

  const nextBranches = { ...state.branches };
  if (flags['u']) {
    nextBranches[branchName] = {
      ...localBranch,
      upstream: `${remoteName}/${branchName}`,
    };
  }

  return {
    nextState: {
      ...state,
      remotes: nextRemotes,
      branches: nextBranches,
    },
    stdout: [
      `Enumerating objects: ${visited.size}, done.`,
      `Writing objects: 100% (${visited.size}/${visited.size}), done.`,
      `To ${remote.url}`,
      ` * [new branch]      ${branchName} -> ${branchName}`,
      flags['u'] ? `branch '${branchName}' set up to track '${remoteName}/${branchName}'.` : '',
    ].filter(Boolean),
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Pushed Commits to Remote (${remoteName}/${branchName})`,
      description: `Transferred ${visited.size} commit object(s) to '${remoteName}'. Remote branch is synchronized with local HEAD.`,
      affectedStages: ['local', 'remote'],
    },
  };
}

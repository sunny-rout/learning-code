import {
  GitRepoState,
  CommandResult,
  GitCommitNode,
  GitRemoteRef,
  GitStashEntry,
  GitMergeConflictState,
  PreMergeSnapshot,
  GitTagRef,
  GitReflogEntry,
} from '@/types/simulator';
import { parseCommandLine } from './commandParser';
import { getRemoteFixture, getOrCreateRemoteFixture } from './remoteFixtures';
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
 * Evaluates whether a given file path is ignored by .gitignore rules.
 * Implements ordered evaluation where the last matching rule wins.
 * Supports exact paths, wildcards (*), directory prefixes, comments (#), and negation (!).
 */
export function isIgnored(path: string, gitignoreContent: string | undefined): boolean {
  if (!gitignoreContent) return false;
  const lines = gitignoreContent.split('\n');
  let ignored = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    let isNegation = false;
    let pattern = line;
    if (pattern.startsWith('!')) {
      isNegation = true;
      pattern = pattern.slice(1).trim();
    }

    let matches = false;
    if (pattern.endsWith('/')) {
      // Directory match: e.g. "dist/" or "logs/"
      const dirName = pattern.slice(0, -1);
      matches = path.startsWith(pattern) || path === dirName || path.startsWith(dirName + '/');
    } else if (pattern.includes('*')) {
      // Wildcard: e.g. "*.log", "temp-*.txt"
      const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexStr);
      const basename = path.split('/').pop() || path;
      matches = regex.test(path) || regex.test(basename);
    } else {
      // Exact match or basename match
      const basename = path.split('/').pop() || path;
      matches = path === pattern || basename === pattern;
    }

    if (matches) {
      ignored = !isNegation;
    }
  }

  return ignored;
}

/**
 * Appends a HEAD movement entry to the reflog, newest first.
 * Reflog tracks HEAD/branch pointer movements only, capped at 50 entries.
 * Does NOT recursively trigger further reflog recordings.
 */
function recordReflogEntry(
  state: GitRepoState,
  action: string,
  message: string,
  targetCommitId: string
): GitRepoState {
  const existingReflog = state.reflog || [];
  const newEntry: GitReflogEntry = {
    id: 'HEAD@{0}',
    commitId: targetCommitId,
    action,
    message,
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...existingReflog].slice(0, 50).map((entry, idx) => ({
    ...entry,
    id: `HEAD@{${idx}}`,
  }));

  return {
    ...state,
    reflog: updated,
  };
}

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
      '  git mv <source> <target>    Move or rename a file in working tree and index',
      '  git clean -n | -f           Preview or remove untracked files (preserves ignored)',
      '  git restore [--staged] <f>  Discard changes in working tree or unstage files',
      '  git commit -m "<message>"   Record staged changes as a new commit snapshot',
      '  git commit -am "<message>"  Stage tracked files and commit in one step',
      '  git log [--oneline]         Show commit logs',
      '  git diff [--staged]         Show changes between stages',
      '  git branch [<name>] [-d]    List, create, or delete branches',
      '  git switch [-c] <name>      Switch to a branch (or create & switch)',
      '  git checkout [-b] <name>    Switch branches (alias for switch)',
      '  git merge [--abort] <branch> Merge branches or abort in-progress merge',
      '  git stash [push|pop|list]   Temporarily shelve and restore working changes',
      '  git reset [--hard|--soft]   Reset current HEAD to the specified state',
      '  git revert <commit>         Create a new commit that reverts an earlier commit',
      '  git remote add <name> <url> Register a remote repository (e.g. origin)',
      '  git remote -v               List registered remote repositories',
      '  git push [-u] <rem> <br>    Push commits to simulated remote',
      '  git fetch [<remote>]        Download objects and refs from remote',
      '  git pull [<remote>] [<br>]  Fetch and integrate with local branch',
      '  git clone <url>             Clone a repository into a new workspace',
      '  git tag [-a <n> -m <msg>]   Create, list, or delete release tags',
      '  git show [<object>]         Show commit details, tag info, and unified diff',
      '  git reflog                  Show movement history of the HEAD pointer',
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

  // 1b. git clone (operates on uninitialized sandbox)
  if (subcommand === 'clone') {
    return handleGitClone(state, args);
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

  // 3c. git mv
  if (subcommand === 'mv') {
    return handleGitMv(state, args);
  }

  // 3d. git clean
  if (subcommand === 'clean') {
    return handleGitClean(state, flags, args, headTree);
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
    return handleGitMerge(state, flags, args);
  }

  // 11. git stash
  if (subcommand === 'stash') {
    return handleGitStash(state, flags, args, headTree);
  }

  // 12. git reset
  if (subcommand === 'reset') {
    return handleGitReset(state, flags, args, headTree);
  }

  // 13. git revert
  if (subcommand === 'revert') {
    return handleGitRevert(state, flags, args, headTree);
  }

  // 14. git remote
  if (subcommand === 'remote') {
    return handleGitRemote(state, flags, args);
  }

  // 15. git push
  if (subcommand === 'push') {
    return handleGitPush(state, flags, args);
  }

  // 16. git fetch
  if (subcommand === 'fetch') {
    return handleGitFetch(state, flags, args);
  }

  // 17. git pull
  if (subcommand === 'pull') {
    return handleGitPull(state, flags, args, headTree);
  }

  // 18. git show
  if (subcommand === 'show') {
    return handleGitShow(state, flags, args);
  }

  // 19. git tag
  if (subcommand === 'tag') {
    return handleGitTag(state, flags, args);
  }

  // 20. git reflog
  if (subcommand === 'reflog') {
    return handleGitReflog(state, args);
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
  const rawUntracked = getUntrackedFiles(state.workingTree, state.index, headTree);
  const gitignoreContent = state.workingTree['.gitignore'];
  const untracked = rawUntracked.filter((u) => !isIgnored(u, gitignoreContent));

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

  if (state.mergeState) {
    lines.push('You have unmerged paths.');
    lines.push('  (fix conflicts and run "git commit")');
    lines.push('  (use "git merge --abort" to abort the merge)');
    if (state.mergeState.conflictingPaths.length > 0) {
      lines.push('');
      lines.push('Unmerged paths:');
      lines.push('  (use "git add <file>..." to mark resolution)');
      state.mergeState.conflictingPaths.forEach((cp) => {
        lines.push(`\tboth modified:   ${cp}`);
      });
    }
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
  const gitignoreContent = state.workingTree['.gitignore'];

  if (target === '.' || target === '-A') {
    // Stage all unignored (or already tracked) files in working tree
    for (const [p, content] of Object.entries(state.workingTree)) {
      const isTracked = hasPath(state.index, p) || hasPath(headTree, p);
      if (isTracked || !isIgnored(p, gitignoreContent)) {
        nextIndex[p] = content;
        stagedFiles.push(p);
      }
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
      const isTracked = hasPath(state.index, target) || hasPath(headTree, target);
      if (!isTracked && isIgnored(target, gitignoreContent)) {
        return {
          nextState: state,
          stdout: [],
          stderr: [
            'The following paths are ignored by one of your .gitignore files:',
            target,
            'hint: Use -f if you really want to add them.',
            'fatal: no files added',
          ],
          exitCode: 1,
        };
      }
      nextIndex[target] = state.workingTree[target];
      stagedFiles.push(target);
    }
  }

  // If merge in progress: verify conflict markers are absent
  let nextMergeState = state.mergeState;
  const stdoutLines: string[] = [];

  if (state.mergeState) {
    const hasMarkers = (content: string) =>
      content.includes('<<<<<<< HEAD') || content.includes('=======') || content.includes('>>>>>>>');

    for (const f of stagedFiles) {
      if (hasPath(state.workingTree, f) && hasMarkers(state.workingTree[f])) {
        return {
          nextState: state,
          stdout: [],
          stderr: [
            `error: '${f}' still contains unresolved conflict markers.`,
            'Please edit the file to resolve all conflicts before staging.',
          ],
          exitCode: 1,
        };
      }
    }

    const resolvedInThisStep = stagedFiles.filter((f) => state.mergeState!.conflictingPaths.includes(f));
    if (resolvedInThisStep.length > 0) {
      const nextConflicting = state.mergeState.conflictingPaths.filter((cp) => !stagedFiles.includes(cp));
      const nextResolved = Array.from(new Set([...state.mergeState.resolvedPaths, ...resolvedInThisStep]));
      nextMergeState = {
        ...state.mergeState,
        conflictingPaths: nextConflicting,
        resolvedPaths: nextResolved,
      };
      resolvedInThisStep.forEach((f) => stdoutLines.push(`Resolved conflict in '${f}'`));
    }
  }

  return {
    nextState: {
      ...state,
      index: nextIndex,
      mergeState: nextMergeState,
    },
    stdout: stdoutLines,
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

function handleGitMv(
  state: GitRepoState,
  args: string[]
): CommandResult {
  if (args.length < 2) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: destination exists, source, destination: missing arguments'],
      exitCode: 128,
    };
  }

  const source = args[0];
  const destination = args[1];

  if (!hasPath(state.workingTree, source)) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: bad source, source=${source}, destination=${destination}`],
      exitCode: 128,
    };
  }

  if (hasPath(state.workingTree, destination)) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: destination exists, source=${source}, destination=${destination}`],
      exitCode: 128,
    };
  }

  const content = state.workingTree[source];
  const nextWorkingTree = { ...state.workingTree };
  delete nextWorkingTree[source];
  nextWorkingTree[destination] = content;

  const nextIndex = { ...state.index };
  delete nextIndex[source];
  nextIndex[destination] = content;

  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
      index: nextIndex,
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Renamed '${source}' to '${destination}'`,
      description: `Moved file and automatically staged rename from '${source}' to '${destination}'.`,
      affectedStages: ['working', 'staging'],
    },
  };
}

function handleGitClean(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  const hasN = Boolean(flags['n']);
  const hasF = Boolean(flags['f']);
  const invalidFlags = Object.keys(flags).filter((k) => k !== 'n' && k !== 'f');
  if (invalidFlags.length > 0 || args.some((a) => a.startsWith('-') && a !== '-n' && a !== '-f')) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        "fatal: unrecognized or unsupported clean flag. Only 'git clean -n' and 'git clean -f' are supported.",
      ],
      exitCode: 1,
    };
  }

  if (!hasN && !hasF) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'fatal: clean.requireForce defaults to true and neither -i, -n, nor -f given; refusing to clean',
      ],
      exitCode: 1,
    };
  }

  const gitignoreContent = state.workingTree['.gitignore'];
  const untracked = getUntrackedFiles(state.workingTree, state.index, headTree);
  // Preserves ignored files
  const cleanable = untracked.filter((u) => !isIgnored(u, gitignoreContent)).sort();

  if (hasN) {
    const lines = cleanable.map((f) => `Would remove ${f}`);
    return {
      nextState: state,
      stdout: lines,
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Preview Untracked File Cleanup',
        description: 'Dry run preview of untracked files that would be removed. Ignored files are preserved.',
        affectedStages: ['working'],
      },
    };
  }

  // Force clean (-f)
  const nextWorkingTree = { ...state.workingTree };
  cleanable.forEach((f) => {
    delete nextWorkingTree[f];
  });
  const lines = cleanable.map((f) => `Removing ${f}`);

  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
    },
    stdout: lines,
    stderr: [],
    exitCode: 0,
    explanation: {
      title: 'Removed Untracked Files',
      description: 'Forcefully deleted uncommitted and untracked files. Preserved tracked and ignored files.',
      affectedStages: ['working'],
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
  // Gating on in-progress merge conflicts
  if (state.mergeState && state.mergeState.conflictingPaths.length > 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'fatal: You have not concluded your merge (MERGE_HEAD exists).',
        'Please resolve all conflicts and stage them with `git add` before committing.',
      ],
      exitCode: 128,
    };
  }

  const userMessage = typeof flags['m'] === 'string' ? flags['m'] : null;
  const isAll = Boolean(flags['a']);

  const defaultMergeMsg = state.mergeState
    ? `Merge branch '${state.mergeState.targetBranch}' into ${state.activeBranch || 'main'}`
    : null;
  const message = userMessage || defaultMergeMsg;

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
  if (staged.length === 0 && !state.mergeState) {
    return {
      nextState: state,
      stdout: ['On branch ' + (state.activeBranch || 'main'), 'nothing to commit, working tree clean'],
      stderr: [],
      exitCode: 0,
    };
  }

  const timestamp = Date.now();
  const parentIds = state.mergeState
    ? [state.mergeState.preMergeSnapshot.headCommitId || '', state.mergeState.targetCommitId].filter(Boolean)
    : state.headCommitId
    ? [state.headCommitId]
    : [];

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
  const wasMerging = Boolean(state.mergeState);

  const commitAction = isRoot ? 'commit (initial)' : wasMerging ? 'commit (merge)' : 'commit';
  const stateWithCommit: GitRepoState = {
    ...state,
    index: effectiveIndex,
    commits: nextCommits,
    branches: nextBranches,
    headCommitId: commitId,
    mergeState: null,
  };
  const finalState = recordReflogEntry(stateWithCommit, commitAction, message, commitId);

  return {
    nextState: finalState,
    stdout: [
      `[${branchLabel}${rootTag} ${commitId}] ${message}`,
      ` ${staged.length} file${staged.length > 1 ? 's' : ''} changed`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: wasMerging ? `Merged and Created Commit [${commitId}]` : `Created Commit [${commitId}]`,
      description: wasMerging
        ? `Resolved conflicts and sealed 2-parent merge snapshot '${commitId}' into branch '${state.activeBranch}'.`
        : `Sealed staged files into immutable snapshot '${commitId}' on branch '${state.activeBranch}'.`,
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

  // Flags
  const isRemoteOnly = Boolean(flags['r'] || flags['remotes']);
  const isAll = Boolean(flags['a'] || flags['all']);
  const isVeryVerbose = Boolean(flags['vv']);
  const isSetUpstream = Boolean(flags['u'] || flags['set-upstream-to']);

  if (isSetUpstream) {
    const upstreamSpec = typeof flags['u'] === 'string'
      ? flags['u']
      : typeof flags['set-upstream-to'] === 'string'
      ? flags['set-upstream-to']
      : args[0];
    const targetBranch = (typeof flags['u'] === 'string' || typeof flags['set-upstream-to'] === 'string')
      ? (args[0] || state.activeBranch)
      : (args[1] || state.activeBranch);

    if (!targetBranch || !state.branches[targetBranch]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`fatal: branch '${targetBranch}' not found`],
        exitCode: 1,
      };
    }

    if (upstreamSpec.includes('/')) {
      const [rName, bName] = upstreamSpec.split('/');
      if (!state.remotes[rName] || !state.remotes[rName].branches[bName]) {
        return {
          nextState: state,
          stdout: [],
          stderr: [`error: the requested upstream branch '${upstreamSpec}' does not exist`],
          exitCode: 1,
        };
      }
    }

    const nextBranches = {
      ...state.branches,
      [targetBranch]: {
        ...state.branches[targetBranch],
        upstream: upstreamSpec,
      },
    };

    return {
      nextState: { ...state, branches: nextBranches },
      stdout: [`branch '${targetBranch}' set up to track '${upstreamSpec}'.`],
      stderr: [],
      exitCode: 0,
    };
  }

  if (isRemoteOnly) {
    const lines: string[] = [];
    for (const [rName, rRef] of Object.entries(state.remotes)) {
      for (const bName of Object.keys(rRef.branches).sort()) {
        lines.push(`  ${rName}/${bName}`);
      }
    }
    return {
      nextState: state,
      stdout: lines,
      stderr: [],
      exitCode: 0,
    };
  }

  if (isAll) {
    const lines: string[] = [];
    for (const bName of Object.keys(state.branches).sort()) {
      if (bName === state.activeBranch) {
        lines.push(`* ${bName}`);
      } else {
        lines.push(`  ${bName}`);
      }
    }
    for (const [rName, rRef] of Object.entries(state.remotes)) {
      for (const bName of Object.keys(rRef.branches).sort()) {
        lines.push(`  remotes/${rName}/${bName}`);
      }
    }
    return {
      nextState: state,
      stdout: lines,
      stderr: [],
      exitCode: 0,
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

  // Listing branches (default / -vv)
  const lines: string[] = [];
  for (const bName of Object.keys(state.branches).sort()) {
    const bRef = state.branches[bName];
    const isCur = bName === state.activeBranch;
    const prefix = isCur ? `* ${bName}` : `  ${bName}`;

    if (isVeryVerbose) {
      const cId = bRef.commitId ? bRef.commitId.slice(0, 7) : '0000000';
      const cMsg = bRef.commitId && state.commits[bRef.commitId] ? state.commits[bRef.commitId].message : '';
      const tracking = bRef.upstream ? `[${bRef.upstream}] ` : '';
      lines.push(`${prefix.padEnd(20)} ${cId} ${tracking}${cMsg}`);
    } else {
      lines.push(prefix);
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
  if (state.mergeState) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'fatal: you need to resolve your current index first',
        'fatal: cannot switch branches while a merge is in progress.',
        "Complete the merge with 'git commit' or abort it with 'git merge --abort'.",
      ],
      exitCode: 128,
    };
  }

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

    const nextState: GitRepoState = {
      ...state,
      branches: nextBranches,
      activeBranch: targetBranch,
    };
    const finalState = recordReflogEntry(
      nextState,
      'checkout',
      `moving from ${state.activeBranch || 'HEAD'} to ${targetBranch}`,
      state.headCommitId || ''
    );

    return {
      nextState: finalState,
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

  // Normal switch or detached HEAD checkout
  let detachedCommitId: string | null = null;
  const isBranchTarget = Boolean(state.branches[targetBranch]);

  if (!isBranchTarget) {
    if (isCheckout) {
      if (targetBranch.match(/^HEAD@\{(\d+)\}$/)) {
        const match = targetBranch.match(/^HEAD@\{(\d+)\}$/);
        const idx = parseInt(match![1], 10);
        const entry = state.reflog?.[idx];
        if (!entry) {
          return {
            nextState: state,
            stdout: [],
            stderr: [`fatal: Log for 'HEAD' only has ${state.reflog?.length || 0} entries.`],
            exitCode: 128,
          };
        }
        detachedCommitId = entry.commitId;
      } else {
        const commitMatch = Object.keys(state.commits).find(
          (id) => id === targetBranch || id.startsWith(targetBranch)
        );
        if (commitMatch) {
          detachedCommitId = commitMatch;
        }
      }
    }

    if (!detachedCommitId) {
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
  }

  if (isBranchTarget && targetBranch === state.activeBranch) {
    return {
      nextState: state,
      stdout: [`Already on '${targetBranch}'`],
      stderr: [],
      exitCode: 0,
    };
  }

  const targetCommitId = isBranchTarget ? state.branches[targetBranch].commitId : detachedCommitId;
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

  const nextActiveBranch = isBranchTarget ? targetBranch : null;
  const nextState: GitRepoState = {
    ...state,
    activeBranch: nextActiveBranch,
    headCommitId: targetCommitId || null,
    index: { ...targetTree },
    workingTree: nextWorkingTree,
  };

  const fromRef = state.activeBranch || state.headCommitId?.slice(0, 7) || 'HEAD';
  const toRef = nextActiveBranch || targetCommitId?.slice(0, 7) || 'HEAD';
  const finalState = recordReflogEntry(nextState, 'checkout', `moving from ${fromRef} to ${toRef}`, targetCommitId || '');

  const stdout = isBranchTarget
    ? [`Switched to branch '${targetBranch}'`]
    : [
        `Note: switching to '${targetBranch}'.`,
        `You are in 'detached HEAD' state. You can look around, make experimental`,
        `changes and commit them, and you can discard any commits you make in this`,
        `state without impacting any branches by switching back to a branch.`,
        `HEAD is now at ${targetCommitId?.slice(0, 7)} ${targetCommit?.message || ''}`,
      ];

  return {
    nextState: finalState,
    stdout,
    stderr: [],
    exitCode: 0,
    explanation: {
      title: isBranchTarget ? `Switched Branch to '${targetBranch}'` : `Checked Out Commit in Detached HEAD`,
      description: isBranchTarget
        ? `Moved HEAD to branch '${targetBranch}'. Working directory and staging area updated to match snapshot.`
        : `Detached HEAD at commit ${targetCommitId?.slice(0, 7)}. Working directory updated.`,
      affectedStages: ['working', 'staging', 'local'],
    },
  };
}

function handleGitMerge(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  // 1. git merge --abort
  if (flags['abort'] || args.includes('--abort')) {
    if (!state.mergeState) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['fatal: There is no merge to abort (MERGE_HEAD missing).'],
        exitCode: 128,
      };
    }
    return {
      nextState: {
        ...state,
        workingTree: { ...state.mergeState.preMergeSnapshot.workingTree },
        index: { ...state.mergeState.preMergeSnapshot.index },
        headCommitId: state.mergeState.preMergeSnapshot.headCommitId,
        activeBranch: state.mergeState.preMergeSnapshot.activeBranch,
        mergeState: null,
      },
      stdout: ['Merge aborted. Repository restored to pre-merge state.'],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Merge Aborted',
        description: 'Cancelled in-progress merge and restored working tree and index to pre-merge state.',
        affectedStages: ['working', 'staging'],
      },
    };
  }

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

  const headCommit = state.headCommitId ? state.commits[state.headCommitId] : null;
  const headTree = headCommit ? headCommit.tree : {};

  // PRE-MERGE CLEAN CHECK
  const dirtyCheck = evaluateDirtyTree(state.workingTree, state.index, headTree);
  if (dirtyCheck.isDirty) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'error: Your local changes to the following files would be overwritten by merge:',
        ...dirtyCheck.dirtyPaths.map((p) => `\t${p}`),
        'Please commit your changes or stash them before you merge.',
        'Aborting',
      ],
      exitCode: 1,
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

    const nextState: GitRepoState = {
      ...state,
      branches: nextBranches,
      headCommitId: targetCommitId,
      index: { ...targetCommit.tree },
      workingTree: { ...targetCommit.tree },
    };
    const finalState = recordReflogEntry(
      nextState,
      `merge ${targetBranch}`,
      'Fast-forward',
      targetCommitId
    );

    return {
      nextState: finalState,
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
    const preMergeSnapshot: PreMergeSnapshot = {
      workingTree: { ...state.workingTree },
      index: { ...state.index },
      headCommitId: state.headCommitId,
      activeBranch: state.activeBranch,
    };

    const nextWorkingTree = { ...state.workingTree };
    const nextIndex = { ...state.index };

    // Apply non-conflicting files
    for (const [p, content] of Object.entries(mergedTree)) {
      nextWorkingTree[p] = content;
      nextIndex[p] = content;
    }

    // Populate conflicting files with standard Git conflict markers
    for (const c of conflicts) {
      const currentVal = (currentTree[c] ?? '').trimEnd();
      const targetVal = (targetTree[c] ?? '').trimEnd();
      nextWorkingTree[c] = `<<<<<<< HEAD\n${currentVal}\n=======\n${targetVal}\n>>>>>>> ${targetBranch}\n`;
    }

    const nextMergeState: GitMergeConflictState = {
      targetBranch,
      targetCommitId,
      baseCommitId: mergeBaseId || '',
      conflictingPaths: conflicts,
      resolvedPaths: [],
      preMergeSnapshot,
    };

    return {
      nextState: {
        ...state,
        workingTree: nextWorkingTree,
        index: nextIndex,
        mergeState: nextMergeState,
      },
      stdout: conflicts.map((c) => `Auto-merging ${c}\nCONFLICT (content): Merge conflict in ${c}`),
      stderr: [
        'Automatic merge failed; fix conflicts and then commit the result.',
        "Use 'git status' to see conflicted paths, or 'git merge --abort' to cancel.",
      ],
      exitCode: 1,
      explanation: {
        title: 'Merge Conflict Detected',
        description: `Automatic merge encountered conflicts in ${conflicts.join(', ')}. Conflict markers have been placed in the working tree.`,
        affectedStages: ['working', 'staging'],
      },
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

function handleGitStash(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  const action = args[0] || 'push';

  // 1. git stash list
  if (action === 'list') {
    if (state.stash.length === 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: [],
        exitCode: 0,
      };
    }
    const lines = state.stash.map((s, idx) => `stash@{${idx}}: ${s.message}`);
    return {
      nextState: state,
      stdout: lines,
      stderr: [],
      exitCode: 0,
    };
  }

  // 2. git stash clear
  if (action === 'clear') {
    return {
      nextState: {
        ...state,
        stash: [],
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Cleared Stash Stack',
        description: 'Removed all stashed entries from the stash stack.',
        affectedStages: ['working'],
      },
    };
  }

  // 3. git stash drop
  if (action === 'drop') {
    if (state.stash.length === 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['error: No stash entries found.'],
        exitCode: 1,
      };
    }
    const targetSpec = args[1] || 'stash@{0}';
    const match = targetSpec.match(/stash@\{(\d+)\}/);
    const dropIndex = match ? parseInt(match[1], 10) : 0;
    if (dropIndex < 0 || dropIndex >= state.stash.length) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: '${targetSpec}' is not a valid stash reference`],
        exitCode: 1,
      };
    }

    const nextStash = state.stash.filter((_, idx) => idx !== dropIndex).map((entry, idx) => ({
      ...entry,
      id: `stash@{${idx}}`,
    }));

    return {
      nextState: {
        ...state,
        stash: nextStash,
      },
      stdout: [`Dropped refs/stash@{${dropIndex}} (${state.stash[dropIndex].id})`],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Dropped Stash Entry stash@{${dropIndex}}`,
        description: 'Removed stash entry from stack.',
        affectedStages: ['working'],
      },
    };
  }

  // 4. git stash pop
  if (action === 'pop') {
    if (state.stash.length === 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['error: No stash entries found.'],
        exitCode: 1,
      };
    }

    const topEntry = state.stash[0];

    // Check A: Conservative Dirty-Tree Guard
    const dirtyCheck = evaluateDirtyTree(state.workingTree, state.index, headTree);
    if (dirtyCheck.isDirty) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          'error: Your local changes to the following files would be overwritten by merge:',
          ...dirtyCheck.dirtyPaths.map((p) => `\t${p}`),
          'Please commit your changes or stash them before you pop.',
        ],
        exitCode: 1,
      };
    }

    // Check B: Explicit Untracked-File Collision Guard
    const restorePaths = Array.from(
      new Set([...Object.keys(topEntry.workingSnapshot), ...Object.keys(topEntry.stagedSnapshot)])
    );
    const untrackedPaths = getUntrackedFiles(state.workingTree, state.index, headTree);
    const collisions = restorePaths.filter((p) => untrackedPaths.includes(p));

    if (collisions.length > 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          'error: The following untracked working tree files would be overwritten by merge:',
          ...collisions.map((p) => `\t${p}`),
          'Please move or remove them before you pop your stash.',
          'Aborting',
        ],
        exitCode: 1,
      };
    }

    // Clean restore: preserve unrelated untracked files
    const nextWorkingTree: Record<string, string> = {};
    for (const u of untrackedPaths) {
      nextWorkingTree[u] = state.workingTree[u];
    }
    // Restore tracked working files
    for (const [p, content] of Object.entries(topEntry.workingSnapshot)) {
      nextWorkingTree[p] = content;
    }
    // Restore staged index files
    const nextIndex: Record<string, string> = { ...topEntry.stagedSnapshot };

    const nextStash = state.stash.slice(1).map((entry, idx) => ({
      ...entry,
      id: `stash@{${idx}}`,
    }));

    return {
      nextState: {
        ...state,
        workingTree: nextWorkingTree,
        index: nextIndex,
        stash: nextStash,
      },
      stdout: [
        `On branch ${state.activeBranch || 'main'}`,
        'Changes to be committed / not staged restored from stash.',
        `Dropped refs/stash@{0} (${topEntry.id})`,
      ],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Popped Stash into Working Directory',
        description: 'Restored staged and unstaged work in progress from stash@{0} and removed it from stash stack.',
        affectedStages: ['working', 'staging'],
      },
    };
  }

  // 5. git stash [push] [-m "<msg>"]
  const staged = getStagedChanges(headTree, state.index);
  const unstaged = getUnstagedChanges(state.index, state.workingTree);

  if (staged.length === 0 && unstaged.length === 0) {
    return {
      nextState: state,
      stdout: ['No local changes to save'],
      stderr: [],
      exitCode: 0,
    };
  }

  const customMessage =
    typeof flags['m'] === 'string'
      ? flags['m']
      : action !== 'push' && action !== 'stash'
      ? action
      : null;
  const headShort = state.headCommitId ? state.headCommitId.slice(0, 7) : '0000000';
  const headMsg =
    state.headCommitId && state.commits[state.headCommitId]
      ? state.commits[state.headCommitId].message
      : 'initial';
  const branchName = state.activeBranch || 'HEAD';
  const defaultMessage = `WIP on ${branchName}: ${headShort} ${headMsg}`;
  const stashMessage = customMessage || defaultMessage;

  // Tracked working tree snapshot (only files tracked in index or HEAD)
  const workingSnapshot: Record<string, string> = {};
  for (const p of Object.keys(state.workingTree)) {
    if (hasPath(state.index, p) || hasPath(headTree, p)) {
      workingSnapshot[p] = state.workingTree[p];
    }
  }

  const stagedSnapshot: Record<string, string> = { ...state.index };

  const newEntry: GitStashEntry = {
    id: `stash@{0}`,
    message: stashMessage,
    timestamp: Date.now(),
    branch: branchName,
    baseCommitId: state.headCommitId,
    stagedSnapshot,
    workingSnapshot,
  };

  const nextStash = [
    newEntry,
    ...state.stash.map((s, idx) => ({ ...s, id: `stash@{${idx + 1}}` })),
  ];

  // Revert tracked files in workingTree and index to HEAD.tree, preserving untracked files
  const untracked = getUntrackedFiles(state.workingTree, state.index, headTree);
  const nextWorkingTree: Record<string, string> = { ...headTree };
  for (const u of untracked) {
    nextWorkingTree[u] = state.workingTree[u];
  }
  const nextIndex: Record<string, string> = { ...headTree };

  return {
    nextState: {
      ...state,
      workingTree: nextWorkingTree,
      index: nextIndex,
      stash: nextStash,
    },
    stdout: [`Saved working directory and index state ${stashMessage}`],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: 'Stashed Working Directory Changes',
      description: `Saved tracked edits to stash@{0} ('${stashMessage}'). Reverted working directory to clean HEAD snapshot.`,
      affectedStages: ['working', 'staging'],
    },
  };
}

function handleGitReset(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  const isSoft = Boolean(flags['soft']);
  const isHard = Boolean(flags['hard']);
  const isMixed = Boolean(flags['mixed']) || (!isSoft && !isHard);

  // Target commit spec: first non-flag arg, default to 'HEAD'
  const targetSpec = args[0] || 'HEAD';

  let targetCommitId: string | null = null;

  if (targetSpec === 'HEAD') {
    targetCommitId = state.headCommitId;
  } else if (targetSpec.match(/^HEAD@\{(\d+)\}$/)) {
    const match = targetSpec.match(/^HEAD@\{(\d+)\}$/);
    const idx = parseInt(match![1], 10);
    const entry = state.reflog?.[idx];
    if (!entry) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`fatal: Log for 'HEAD' only has ${state.reflog?.length || 0} entries.`],
        exitCode: 128,
      };
    }
    targetCommitId = entry.commitId;
  } else if (targetSpec.startsWith('HEAD~') || targetSpec.startsWith('HEAD^')) {
    let count = 1;
    if (targetSpec.startsWith('HEAD~')) {
      const numStr = targetSpec.slice(5);
      count = numStr ? parseInt(numStr, 10) : 1;
    }
    let curr: string | null = state.headCommitId;
    for (let i = 0; i < count; i++) {
      if (!curr || !state.commits[curr] || state.commits[curr].parentIds.length === 0) {
        return {
          nextState: state,
          stdout: [],
          stderr: [`fatal: ambiguous argument '${targetSpec}': unknown revision or path not in the working tree.`],
          exitCode: 128,
        };
      }
      curr = state.commits[curr].parentIds[0];
    }
    targetCommitId = curr;
  } else {
    // Hash or branch name
    if (state.branches[targetSpec]) {
      targetCommitId = state.branches[targetSpec].commitId;
    } else {
      const match = Object.keys(state.commits).find((id) => id.startsWith(targetSpec));
      if (!match) {
        return {
          nextState: state,
          stdout: [],
          stderr: [`fatal: ambiguous argument '${targetSpec}': unknown revision or path not in the working tree.`],
          exitCode: 128,
        };
      }
      targetCommitId = match;
    }
  }

  const targetCommit = targetCommitId ? state.commits[targetCommitId] : null;
  const targetTree = targetCommit ? targetCommit.tree : {};

  // 1. git reset HEAD (mixed reset without moving commit pointer)
  if (targetSpec === 'HEAD' && isMixed) {
    return {
      nextState: {
        ...state,
        index: { ...headTree },
      },
      stdout: ['Unstaged changes after reset:'],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Reset Staging Index to HEAD',
        description: 'Unstaged all staged changes. Working directory files remain untouched.',
        affectedStages: ['staging'],
      },
    };
  }

  // 2. git reset --hard
  if (isHard) {
    const untracked = getUntrackedFiles(state.workingTree, state.index, headTree);
    const collisions = untracked.filter((u) => hasPath(targetTree, u) && targetTree[u] !== state.workingTree[u]);

    if (collisions.length > 0) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          'fatal: The following untracked working tree files would be overwritten by reset:',
          ...collisions.map((c) => `\t${c}`),
          'Please move or remove them before you reset.',
          'Aborting',
        ],
        exitCode: 128,
      };
    }

    const nextWorkingTree: Record<string, string> = { ...targetTree };
    for (const u of untracked) {
      nextWorkingTree[u] = state.workingTree[u];
    }

    const nextBranches = { ...state.branches };
    if (state.activeBranch) {
      nextBranches[state.activeBranch] = {
        ...nextBranches[state.activeBranch],
        commitId: targetCommitId || '',
      };
    }

    const nextState: GitRepoState = {
      ...state,
      branches: nextBranches,
      headCommitId: targetCommitId,
      index: { ...targetTree },
      workingTree: nextWorkingTree,
    };
    const finalState = recordReflogEntry(nextState, 'reset', `moving to ${targetSpec}`, targetCommitId || '');

    return {
      nextState: finalState,
      stdout: [`HEAD is now at ${targetCommitId?.slice(0, 7) || '0000000'} ${targetCommit?.message || ''}`],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Hard Reset Completed',
        description: `Moved HEAD to ${targetCommitId?.slice(0, 7)}, reset index, and discarded working directory changes.`,
        affectedStages: ['working', 'staging', 'local'],
      },
    };
  }

  // 3. git reset --soft
  if (isSoft) {
    const nextBranches = { ...state.branches };
    if (state.activeBranch) {
      nextBranches[state.activeBranch] = {
        ...nextBranches[state.activeBranch],
        commitId: targetCommitId || '',
      };
    }
    const nextState: GitRepoState = {
      ...state,
      branches: nextBranches,
      headCommitId: targetCommitId,
    };
    const finalState = recordReflogEntry(nextState, 'reset', `moving to ${targetSpec}`, targetCommitId || '');

    return {
      nextState: finalState,
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: 'Soft Reset Completed',
        description: `Moved HEAD to ${targetCommitId?.slice(0, 7)}. Staging index and working directory were preserved.`,
        affectedStages: ['local'],
      },
    };
  }

  // 4. git reset --mixed <commit>
  const nextBranches = { ...state.branches };
  if (state.activeBranch) {
    nextBranches[state.activeBranch] = {
      ...nextBranches[state.activeBranch],
      commitId: targetCommitId || '',
    };
  }
  const nextState: GitRepoState = {
    ...state,
    branches: nextBranches,
    headCommitId: targetCommitId,
    index: { ...targetTree },
  };
  const finalState = recordReflogEntry(nextState, 'reset', `moving to ${targetSpec}`, targetCommitId || '');

  return {
    nextState: finalState,
    stdout: [
      `Unstaged changes after reset:`,
      `HEAD is now at ${targetCommitId?.slice(0, 7) || '0000000'} ${targetCommit?.message || ''}`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: 'Mixed Reset Completed',
      description: `Moved HEAD to ${targetCommitId?.slice(0, 7)} and reset index to match. Working directory edits preserved.`,
      affectedStages: ['staging', 'local'],
    },
  };
}

function handleGitRevert(
  state: GitRepoState,
  _flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: you must specify a commit to revert'],
      exitCode: 128,
    };
  }

  const targetSpec = args[0];
  const targetId = Object.keys(state.commits).find((id) => id === targetSpec || id.startsWith(targetSpec));
  if (!targetId || !state.commits[targetId]) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: bad revision '${targetSpec}'`],
      exitCode: 128,
    };
  }

  const targetCommit = state.commits[targetId];

  // Disallow merge commits
  if (targetCommit.parentIds.length > 1) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        `error: commit ${targetId} is a merge but no -m option was given.`,
        'fatal: revert failed',
      ],
      exitCode: 1,
    };
  }

  // Disallow root commits without parent
  if (targetCommit.parentIds.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['error: cannot revert root commit without parent', 'fatal: revert failed'],
      exitCode: 1,
    };
  }

  // Dirty check
  const dirtyCheck = evaluateDirtyTree(state.workingTree, state.index, headTree);
  if (dirtyCheck.isDirty) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        'error: your local changes would be overwritten by revert.',
        'hint: commit your changes or stash them to proceed.',
        'fatal: revert failed',
      ],
      exitCode: 1,
    };
  }

  const parentId = targetCommit.parentIds[0];
  const parentTree = state.commits[parentId].tree;

  const nextWorkingTree = { ...state.workingTree };
  const allAffected = new Set([...Object.keys(targetCommit.tree), ...Object.keys(parentTree)]);

  for (const p of allAffected) {
    const parentVal = parentTree[p];
    const targetVal = targetCommit.tree[p];

    if (parentVal !== targetVal) {
      if (parentVal === undefined) {
        delete nextWorkingTree[p];
      } else {
        nextWorkingTree[p] = parentVal;
      }
    }
  }

  const nextIndex = { ...nextWorkingTree };
  const timestamp = Date.now();
  const parentIds = state.headCommitId ? [state.headCommitId] : [];
  const revertMessage = `Revert "${targetCommit.message}"`;
  const revertCommitId = createDeterministicCommitId(parentIds, revertMessage, nextIndex, SIMULATOR_AUTHOR, timestamp);

  const newCommit: GitCommitNode = {
    id: revertCommitId,
    parentIds,
    message: revertMessage,
    author: SIMULATOR_AUTHOR,
    timestamp,
    tree: { ...nextIndex },
  };

  const nextCommits = { ...state.commits, [revertCommitId]: newCommit };
  const nextBranches = { ...state.branches };
  if (state.activeBranch) {
    nextBranches[state.activeBranch] = {
      ...nextBranches[state.activeBranch],
      commitId: revertCommitId,
    };
  }

  return {
    nextState: {
      ...state,
      commits: nextCommits,
      branches: nextBranches,
      headCommitId: revertCommitId,
      index: nextIndex,
      workingTree: nextWorkingTree,
    },
    stdout: [`[${state.activeBranch} ${revertCommitId}] ${revertMessage}`],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Created Revert Commit [${revertCommitId}]`,
      description: `Inverted changes from commit ${targetId.slice(0, 7)} and recorded as a new forward commit snapshot.`,
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

  // Support: git push, git push origin main, git push -u origin main, git push origin <tag>, git push origin --tags
  const isPushAllTags = Boolean(flags['tags']) || args.includes('--tags');
  if (args.length >= 2) {
    remoteName = args[0];
    branchName = args[1];
  } else if (args.length === 1 && !isPushAllTags) {
    remoteName = args[0];
  }

  // Tag push handling
  const isSpecificTag = Boolean(
    args.length >= 2 && state.tags && state.tags[args[1]] && !state.branches[args[1]]
  );

  if (isPushAllTags || isSpecificTag) {
    const remote = state.remotes[remoteName];
    if (!remote) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          `fatal: '${remoteName}' does not appear to be a git repository`,
          'fatal: Could not read from remote repository.',
        ],
        exitCode: 128,
      };
    }

    const tagsToPush = isPushAllTags
      ? Object.values(state.tags || {})
      : [state.tags[args[1]]];

    if (tagsToPush.length === 0) {
      return {
        nextState: state,
        stdout: ['Everything up-to-date'],
        stderr: [],
        exitCode: 0,
      };
    }

    // Remote tag collision guard (Blocker 4):
    // Idempotent on identical SHA, rejected on different SHA, never silently overwrite!
    for (const tag of tagsToPush) {
      const existingRemoteSha = remote.tags?.[tag.name];
      if (existingRemoteSha && existingRemoteSha !== tag.commitId) {
        return {
          nextState: state,
          stdout: [
            `To ${remote.url}`,
            ` ! [rejected]        ${tag.name} -> ${tag.name} (already exists)`,
          ],
          stderr: [
            `error: failed to push some refs to '${remote.url}'`,
            `hint: Updates were rejected because the tag already exists in the remote.`,
          ],
          exitCode: 1,
        };
      }
    }

    // Object graph synchronization: sync reachable commits from pushed tags
    const reachableCommits: Record<string, GitCommitNode> = { ...remote.commits };
    const queue: string[] = tagsToPush.map((t) => t.commitId);
    const visited = new Set<string>();

    while (queue.length > 0) {
      const cId = queue.shift()!;
      if (visited.has(cId)) continue;
      visited.add(cId);

      const commit = state.commits[cId];
      if (commit) {
        reachableCommits[cId] = commit;
        for (const pId of commit.parentIds) {
          if (!visited.has(pId)) queue.push(pId);
        }
      }
    }

    const nextRemoteTags: Record<string, string> = { ...(remote.tags || {}) };
    const pushedTagLines: string[] = [];
    let hasNew = false;

    for (const tag of tagsToPush) {
      if (!nextRemoteTags[tag.name]) {
        nextRemoteTags[tag.name] = tag.commitId;
        pushedTagLines.push(` * [new tag]         ${tag.name} -> ${tag.name}`);
        hasNew = true;
      }
    }

    // Update in-memory remote fixture as well
    const fixture = getOrCreateRemoteFixture(remote.url);
    for (const [cId, commit] of Object.entries(reachableCommits)) {
      fixture.commits[cId] = commit;
    }
    if (!fixture.tags) fixture.tags = {};
    for (const [tName, cId] of Object.entries(nextRemoteTags)) {
      fixture.tags[tName] = cId;
    }

    const nextRemotes: Record<string, GitRemoteRef> = {
      ...state.remotes,
      [remoteName]: {
        ...remote,
        commits: reachableCommits,
        tags: nextRemoteTags,
      },
    };

    if (!hasNew) {
      return {
        nextState: { ...state, remotes: nextRemotes },
        stdout: ['Everything up-to-date'],
        stderr: [],
        exitCode: 0,
      };
    }

    return {
      nextState: {
        ...state,
        remotes: nextRemotes,
      },
      stdout: [`To ${remote.url}`, ...pushedTagLines],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Pushed Tags to '${remoteName}'`,
        description: `Synchronized release tags and their reachable commits with ${remote.url}.`,
        affectedStages: ['remote'],
      },
    };
  }

  // Branch push handling
  if (args.length >= 2) {
    remoteName = args[0];
    branchName = args[1];
  } else if (args.length === 1) {
    remoteName = args[0];
  } else {
    // Zero arguments: resolve upstream tracking
    const currBranch = state.activeBranch ? state.branches[state.activeBranch] : null;
    if (currBranch?.upstream) {
      const parts = currBranch.upstream.split('/');
      remoteName = parts[0];
      branchName = parts.slice(1).join('/');
    } else {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          `fatal: The current branch ${state.activeBranch || 'main'} has no upstream branch.`,
          `To push the current branch and set the remote as upstream, use`,
          ``,
          `    git push --set-upstream origin ${state.activeBranch || 'main'}`,
        ],
        exitCode: 1,
      };
    }
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

  // Update in-memory remote fixture as well
  const fixture = getOrCreateRemoteFixture(remote.url);
  for (const [cId, commit] of Object.entries(reachableCommits)) {
    fixture.commits[cId] = commit;
  }
  fixture.branches[branchName] = localBranch.commitId;

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
  const isSetUpstream = Boolean(flags['u'] || flags['set-upstream']);
  if (isSetUpstream) {
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
      isSetUpstream ? `branch '${branchName}' set up to track '${remoteName}/${branchName}'.` : '',
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

function handleGitFetch(
  state: GitRepoState,
  _flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  const remoteName = args[0] || 'origin';
  const remote = state.remotes[remoteName];
  if (!remote) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        `fatal: '${remoteName}' does not appear to be a git repository`,
        "fatal: Could not read from remote repository.",
      ],
      exitCode: 128,
    };
  }

  const fixture = getRemoteFixture(remote.url) || getOrCreateRemoteFixture(remote.url);
  const nextCommits = { ...state.commits };
  const nextRemoteCommits = { ...remote.commits };
  const nextRemoteBranches = { ...remote.branches };
  const outputLines: string[] = [`From ${remote.url}`];

  for (const [bName, remoteCommitId] of Object.entries(fixture.branches)) {
    // Ingest all reachable commits from remoteCommitId
    const queue = [remoteCommitId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const cId = queue.shift()!;
      if (visited.has(cId)) continue;
      visited.add(cId);

      const commit = fixture.commits[cId];
      if (commit) {
        nextCommits[cId] = commit;
        nextRemoteCommits[cId] = commit;
        for (const pId of commit.parentIds) {
          queue.push(pId);
        }
      }
    }

    const prevCommitId = remote.branches[bName];
    nextRemoteBranches[bName] = remoteCommitId;

    if (!prevCommitId) {
      outputLines.push(` * [new branch]      ${bName}       -> ${remoteName}/${bName}`);
    } else if (prevCommitId !== remoteCommitId) {
      outputLines.push(`   ${prevCommitId.slice(0, 7)}..${remoteCommitId.slice(0, 7)}  ${bName}       -> ${remoteName}/${bName}`);
    }
  }

  const nextRemotes: Record<string, GitRemoteRef> = {
    ...state.remotes,
    [remoteName]: {
      ...remote,
      commits: nextRemoteCommits,
      branches: nextRemoteBranches,
    },
  };

  return {
    nextState: {
      ...state,
      commits: nextCommits,
      remotes: nextRemotes,
    },
    stdout: outputLines,
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Fetched from Remote '${remoteName}'`,
      description: `Synchronized remote tracking references (${remoteName}/*) and commit objects. Local HEAD, branches, and working tree were untouched.`,
      affectedStages: ['remote'],
    },
  };
}

function handleGitPull(
  state: GitRepoState,
  _flags: Record<string, string | boolean>,
  args: string[],
  headTree: Record<string, string>
): CommandResult {
  const dirtyCheck = evaluateDirtyTree(state.workingTree, state.index, headTree);

  let remoteName = 'origin';
  let branchName = state.activeBranch || 'main';

  if (args.length >= 2) {
    remoteName = args[0];
    branchName = args[1];
  } else if (args.length === 1) {
    remoteName = args[0];
  } else {
    const currentBranchRef = state.activeBranch ? state.branches[state.activeBranch] : null;
    if (!currentBranchRef?.upstream) {
      return {
        nextState: state,
        stdout: [],
        stderr: [
          `There is no tracking information for the current branch.`,
          `Please specify which branch you want to merge with.`,
          `See git-pull(1) for details.`,
          ``,
          `    git pull <remote> <branch>`,
          ``,
          `If you wish to set tracking information for this branch you can do so with:`,
          ``,
          `    git branch --set-upstream-to=<remote>/<branch> ${state.activeBranch || 'main'}`,
        ],
        exitCode: 1,
      };
    }
    const [uRemote, ...uBranchParts] = currentBranchRef.upstream.split('/');
    remoteName = uRemote;
    branchName = uBranchParts.join('/');
  }

  const remote = state.remotes[remoteName];
  if (!remote) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        `fatal: '${remoteName}' does not appear to be a git repository`,
        "fatal: Could not read from remote repository.",
      ],
      exitCode: 128,
    };
  }

  // Phase A: Fetch
  const fetchResult = handleGitFetch(state, {}, [remoteName]);
  const fetchedState = fetchResult.nextState;
  const remoteCommitId = fetchedState.remotes[remoteName]?.branches[branchName];

  if (!remoteCommitId) {
    return {
      nextState: fetchedState,
      stdout: fetchResult.stdout,
      stderr: [`fatal: couldn't find remote ref ${branchName}`],
      exitCode: 1,
    };
  }

  // Phase B: Integration
  const localCommitId = fetchedState.headCommitId;

  // Case B1: Already up to date
  if (localCommitId === remoteCommitId) {
    return {
      nextState: fetchedState,
      stdout: [...fetchResult.stdout, 'Already up to date.'],
      stderr: [],
      exitCode: 0,
    };
  }

  // Dirty check: reject merge integration (preserves fetched remote tracking ref)
  if (dirtyCheck.isDirty) {
    return {
      nextState: fetchedState,
      stdout: fetchResult.stdout,
      stderr: [
        'error: Your local changes to the following files would be overwritten by merge:',
        ...dirtyCheck.dirtyPaths.map((p) => `\t${p}`),
        'Please commit your changes or stash them before you merge.',
        'Aborting',
      ],
      exitCode: 1,
    };
  }

  // Case B2: Fast-Forward
  if (!localCommitId || isAncestor(fetchedState.commits, localCommitId, remoteCommitId)) {
    const targetCommit = fetchedState.commits[remoteCommitId];
    const nextBranches = { ...fetchedState.branches };
    if (fetchedState.activeBranch) {
      nextBranches[fetchedState.activeBranch] = {
        ...nextBranches[fetchedState.activeBranch],
        commitId: remoteCommitId,
      };
    }

    const nextState: GitRepoState = {
      ...fetchedState,
      branches: nextBranches,
      headCommitId: remoteCommitId,
      index: { ...targetCommit.tree },
      workingTree: { ...targetCommit.tree },
    };
    const finalState = recordReflogEntry(
      nextState,
      'pull',
      'Fast-forward',
      remoteCommitId
    );

    return {
      nextState: finalState,
      stdout: [
        ...fetchResult.stdout,
        `Updating ${localCommitId ? localCommitId.slice(0, 7) : '0000000'}..${remoteCommitId.slice(0, 7)}`,
        'Fast-forward',
      ],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Pulled from '${remoteName}/${branchName}' (Fast-Forward)`,
        description: `Advanced local '${fetchedState.activeBranch}' to ${remoteCommitId.slice(0, 7)} and updated working tree.`,
        affectedStages: ['working', 'staging', 'local', 'remote'],
      },
    };
  }

  // Case B3/B4: 3-way merge or conflict
  const mergeBaseId = findMergeBase(fetchedState.commits, localCommitId, remoteCommitId);
  const baseCommit = mergeBaseId ? fetchedState.commits[mergeBaseId] : null;
  const baseTree = baseCommit ? baseCommit.tree : {};
  const currentCommit = fetchedState.commits[localCommitId];
  const currentTree = currentCommit.tree;
  const targetCommit = fetchedState.commits[remoteCommitId];
  const targetTree = targetCommit.tree;

  const allPaths = new Set([
    ...Object.keys(baseTree),
    ...Object.keys(currentTree),
    ...Object.keys(targetTree),
  ]);

  const conflicts: string[] = [];
  const mergedWorkingTree = { ...fetchedState.workingTree };
  const mergedIndex = { ...fetchedState.index };

  for (const p of allPaths) {
    const baseVal = baseTree[p];
    const currentVal = currentTree[p];
    const targetVal = targetTree[p];

    if (currentVal === targetVal) {
      if (currentVal === undefined) {
        delete mergedIndex[p];
        delete mergedWorkingTree[p];
      } else {
        mergedIndex[p] = currentVal;
        mergedWorkingTree[p] = currentVal;
      }
    } else if (currentVal === baseVal) {
      if (targetVal === undefined) {
        delete mergedIndex[p];
        delete mergedWorkingTree[p];
      } else {
        mergedIndex[p] = targetVal;
        mergedWorkingTree[p] = targetVal;
      }
    } else if (targetVal === baseVal) {
      if (currentVal === undefined) {
        delete mergedIndex[p];
        delete mergedWorkingTree[p];
      } else {
        mergedIndex[p] = currentVal;
        mergedWorkingTree[p] = currentVal;
      }
    } else {
      conflicts.push(p);
      const cContent = currentVal || '';
      const tContent = targetVal || '';
      mergedWorkingTree[p] = `<<<<<<< HEAD\n${cContent}=======\n${tContent}>>>>>>> ${remoteName}/${branchName}\n`;
    }
  }

  if (conflicts.length > 0) {
    const preMergeSnapshot: PreMergeSnapshot = {
      workingTree: { ...state.workingTree },
      index: { ...state.index },
      headCommitId: state.headCommitId,
      activeBranch: state.activeBranch,
    };

    const mergeConflictState: GitMergeConflictState = {
      targetBranch: `${remoteName}/${branchName}`,
      targetCommitId: remoteCommitId,
      baseCommitId: mergeBaseId || '',
      conflictingPaths: conflicts,
      resolvedPaths: [],
      preMergeSnapshot,
    };

    return {
      nextState: {
        ...fetchedState,
        workingTree: mergedWorkingTree,
        mergeState: mergeConflictState,
      },
      stdout: [
        ...fetchResult.stdout,
        ...conflicts.map((p) => `Auto-merging ${p}`),
        ...conflicts.map((p) => `CONFLICT (content): Merge conflict in ${p}`),
        'Automatic merge failed; fix conflicts and then commit the result.',
      ],
      stderr: [],
      exitCode: 1,
      explanation: {
        title: 'Merge Conflict Triggered on Pull',
        description: `Incoming changes from '${remoteName}/${branchName}' conflicted with local edits. Conflict markers were placed in working tree.`,
        affectedStages: ['working', 'remote'],
      },
    };
  }

  // Clean 3-way merge commit
  const timestamp = Date.now();
  const parentIds = [localCommitId, remoteCommitId];
  const mergeMessage = `Merge branch '${branchName}' of ${remote.url}`;
  const mergeCommitId = createDeterministicCommitId(parentIds, mergeMessage, mergedIndex, SIMULATOR_AUTHOR, timestamp);

  const mergeCommit: GitCommitNode = {
    id: mergeCommitId,
    parentIds,
    message: mergeMessage,
    author: SIMULATOR_AUTHOR,
    timestamp,
    tree: { ...mergedIndex },
  };

  const nextBranches = { ...fetchedState.branches };
  if (fetchedState.activeBranch) {
    nextBranches[fetchedState.activeBranch] = {
      ...nextBranches[fetchedState.activeBranch],
      commitId: mergeCommitId,
    };
  }

  const nextState: GitRepoState = {
    ...fetchedState,
    commits: { ...fetchedState.commits, [mergeCommitId]: mergeCommit },
    branches: nextBranches,
    headCommitId: mergeCommitId,
    index: mergedIndex,
    workingTree: mergedWorkingTree,
  };
  const finalState = recordReflogEntry(
    nextState,
    'pull',
    "Merge made by the 'ort' strategy",
    mergeCommitId
  );

  return {
    nextState: finalState,
    stdout: [
      ...fetchResult.stdout,
      `Merge made by the 'ort' strategy.`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `3-Way Merge Pull Completed`,
      description: `Integrated '${remoteName}/${branchName}' into '${fetchedState.activeBranch}'. Generated 2-parent merge commit [${mergeCommitId.slice(0, 7)}].`,
      affectedStages: ['working', 'staging', 'local', 'remote'],
    },
  };
}

function handleGitClone(
  state: GitRepoState,
  args: string[]
): CommandResult {
  if (state.isInitialized) {
    const url = args[0] || '';
    const targetDir = url.split('/').pop()?.replace('.git', '') || 'project';
    return {
      nextState: state,
      stdout: [],
      stderr: [
        `fatal: destination path '${targetDir}' already exists and is not an empty directory.`,
        'hint: Clone can only be executed in an empty/uninitialized workspace in this sandbox.',
      ],
      exitCode: 128,
    };
  }

  if (args.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: You must specify a repository to clone.'],
      exitCode: 1,
    };
  }

  const url = args[0];
  const fixture = getRemoteFixture(url);
  if (!fixture) {
    return {
      nextState: state,
      stdout: [],
      stderr: [
        `fatal: repository '${url}' not found`,
        `hint: Supported demo fixtures include:`,
        `  - https://github.com/student/git-practice.git`,
        `  - https://github.com/example/project.git`,
        `  - https://github.com/example/upstream-repo.git`,
      ],
      exitCode: 128,
    };
  }

  const defaultBranch = fixture.defaultBranch || 'main';
  const defaultCommitId = fixture.branches[defaultBranch] || Object.keys(fixture.commits)[0] || '';
  const defaultCommit = fixture.commits[defaultCommitId];
  const defaultTree = defaultCommit ? { ...defaultCommit.tree } : {};

  const nextState: GitRepoState = {
    isInitialized: true,
    commits: { ...fixture.commits },
    remotes: {
      origin: {
        name: 'origin',
        url: fixture.url,
        commits: { ...fixture.commits },
        branches: { ...fixture.branches },
      },
    },
    branches: {
      [defaultBranch]: {
        name: defaultBranch,
        commitId: defaultCommitId,
        upstream: `origin/${defaultBranch}`,
      },
    },
    activeBranch: defaultBranch,
    headCommitId: defaultCommitId,
    index: { ...defaultTree },
    workingTree: { ...defaultTree },
    stash: [],
    mergeState: null,
    tags: {},
    reflog: [
      {
        id: 'HEAD@{0}',
        commitId: defaultCommitId,
        action: 'clone',
        message: `from ${url}`,
        timestamp: Date.now(),
      },
    ],
  };

  const commitCount = Object.keys(fixture.commits).length;
  const projectName = url.split('/').pop()?.replace(/\.git$/, '') || 'project';

  return {
    nextState,
    stdout: [
      `Cloning into '${projectName}'...`,
      `remote: Enumerating objects: ${commitCount}, done.`,
      `remote: Total ${commitCount} (delta 0), reused ${commitCount} (delta 0)`,
      `Receiving objects: 100% (${commitCount}/${commitCount}), done.`,
    ],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Cloned Repository from '${url}'`,
      description: `Created clean local clone. Checked out '${defaultBranch}' set up to track 'origin/${defaultBranch}'.`,
      affectedStages: ['working', 'staging', 'local', 'remote'],
    },
  };
}

function handleGitShow(
  state: GitRepoState,
  _flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  const targetSpec = args[0] || 'HEAD';
  let targetCommitId: string | null = null;
  let tagRef: GitTagRef | null = null;

  if (state.tags && state.tags[targetSpec]) {
    tagRef = state.tags[targetSpec];
    targetCommitId = tagRef.commitId;
  } else if (targetSpec === 'HEAD') {
    targetCommitId = state.headCommitId;
  } else if (state.branches[targetSpec]) {
    targetCommitId = state.branches[targetSpec].commitId;
  } else if (targetSpec.startsWith('HEAD~') || targetSpec.startsWith('HEAD^')) {
    let count = 1;
    if (targetSpec.startsWith('HEAD~')) {
      const numStr = targetSpec.slice(5);
      count = numStr ? parseInt(numStr, 10) : 1;
    }
    let curr = state.headCommitId;
    for (let i = 0; i < count; i++) {
      if (!curr || !state.commits[curr] || state.commits[curr].parentIds.length === 0) {
        curr = null;
        break;
      }
      curr = state.commits[curr].parentIds[0];
    }
    targetCommitId = curr;
  } else {
    const fullMatch = Object.keys(state.commits).find(
      (cId) => cId === targetSpec || cId.startsWith(targetSpec)
    );
    if (fullMatch) {
      targetCommitId = fullMatch;
    }
  }

  if (!targetCommitId || !state.commits[targetCommitId]) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: bad object ${targetSpec}`],
      exitCode: 128,
    };
  }

  const commit = state.commits[targetCommitId];
  const dateStr = new Date(commit.timestamp).toUTCString();
  const lines: string[] = [];

  if (tagRef && tagRef.type === 'annotated') {
    lines.push(`tag ${tagRef.name}`);
    lines.push(`Tagger: ${tagRef.tagger || SIMULATOR_AUTHOR}`);
    lines.push(`Date:   ${new Date(tagRef.timestamp || commit.timestamp).toUTCString()}`);
    lines.push('');
    lines.push(`    ${tagRef.message || ''}`);
    lines.push('');
  }

  lines.push(`commit ${commit.id}`);
  if (commit.parentIds.length > 1) {
    lines.push(`Merge: ${commit.parentIds.map((p) => p.slice(0, 7)).join(' ')}`);
  }
  lines.push(`Author: ${commit.author}`);
  lines.push(`Date:   ${dateStr}`);
  lines.push('');
  lines.push(`    ${commit.message}`);
  lines.push('');

  // Unified diff formatting
  if (commit.parentIds.length === 0) {
    // Root commit: all files added
    for (const [p, content] of Object.entries(commit.tree).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`diff --git a/${p} b/${p}`);
      lines.push(`new file mode 100644`);
      lines.push(`--- /dev/null`);
      lines.push(`+++ b/${p}`);
      const contentLines = content.split('\n');
      if (contentLines.length > 0 && contentLines[contentLines.length - 1] === '') {
        contentLines.pop();
      }
      lines.push(`@@ -0,0 +1,${contentLines.length} @@`);
      for (const cl of contentLines) {
        lines.push(`+${cl}`);
      }
    }
  } else if (commit.parentIds.length === 1) {
    const parent = state.commits[commit.parentIds[0]];
    const parentTree = parent ? parent.tree : {};
    const allPaths = Array.from(new Set([...Object.keys(parentTree), ...Object.keys(commit.tree)])).sort();

    for (const p of allPaths) {
      const oldVal = parentTree[p];
      const newVal = commit.tree[p];

      if (oldVal === undefined && newVal !== undefined) {
        // Added
        lines.push(`diff --git a/${p} b/${p}`);
        lines.push(`new file mode 100644`);
        lines.push(`--- /dev/null`);
        lines.push(`+++ b/${p}`);
        const contentLines = newVal.split('\n');
        if (contentLines.length > 0 && contentLines[contentLines.length - 1] === '') contentLines.pop();
        lines.push(`@@ -0,0 +1,${contentLines.length} @@`);
        for (const cl of contentLines) lines.push(`+${cl}`);
      } else if (oldVal !== undefined && newVal === undefined) {
        // Deleted
        lines.push(`diff --git a/${p} b/${p}`);
        lines.push(`deleted file mode 100644`);
        lines.push(`--- a/${p}`);
        lines.push(`+++ /dev/null`);
        const contentLines = oldVal.split('\n');
        if (contentLines.length > 0 && contentLines[contentLines.length - 1] === '') contentLines.pop();
        lines.push(`@@ -1,${contentLines.length} +0,0 @@`);
        for (const cl of contentLines) lines.push(`-${cl}`);
      } else if (oldVal !== newVal) {
        // Modified
        lines.push(`diff --git a/${p} b/${p}`);
        lines.push(`--- a/${p}`);
        lines.push(`+++ b/${p}`);
        const oldLines = oldVal.split('\n');
        if (oldLines.length > 0 && oldLines[oldLines.length - 1] === '') oldLines.pop();
        const newLines = newVal.split('\n');
        if (newLines.length > 0 && newLines[newLines.length - 1] === '') newLines.pop();
        lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
        for (const ol of oldLines) lines.push(`-${ol}`);
        for (const nl of newLines) lines.push(`+${nl}`);
      }
    }
  } else {
    // Merge commit
    lines.push(`diff --cc merged files`);
  }

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
  };
}

function handleGitTag(
  state: GitRepoState,
  flags: Record<string, string | boolean>,
  args: string[]
): CommandResult {
  const isDelete = Boolean(flags['d']);
  const isAnnotated = Boolean(flags['a']);
  const userMessage = typeof flags['m'] === 'string' ? flags['m'] : null;

  // 1. git tag (list tags in alphabetical order)
  if (!isDelete && !isAnnotated && args.length === 0) {
    const tagNames = Object.keys(state.tags || {}).sort();
    return {
      nextState: state,
      stdout: tagNames,
      stderr: [],
      exitCode: 0,
    };
  }

  // 2. git tag -d <name>
  if (isDelete) {
    const tagName = typeof flags['d'] === 'string' ? flags['d'] : args[0];
    if (!tagName) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['fatal: tag name required for deletion'],
        exitCode: 1,
      };
    }
    if (!state.tags || !state.tags[tagName]) {
      return {
        nextState: state,
        stdout: [],
        stderr: [`error: tag '${tagName}' not found.`],
        exitCode: 1,
      };
    }
    const targetCommit = state.tags[tagName].commitId;
    const nextTags = { ...state.tags };
    delete nextTags[tagName];

    return {
      nextState: {
        ...state,
        tags: nextTags,
      },
      stdout: [`Deleted tag '${tagName}' (was ${targetCommit.slice(0, 7)})`],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Deleted Tag '${tagName}'`,
        description: `Removed local tag ref '${tagName}'.`,
        affectedStages: ['local'],
      },
    };
  }

  // 3. Create tag
  const tagName = isAnnotated && typeof flags['a'] === 'string' ? flags['a'] : args[0];
  if (!tagName) {
    return {
      nextState: state,
      stdout: [],
      stderr: ['fatal: tag name required'],
      exitCode: 1,
    };
  }

  if (!state.headCommitId) {
    return {
      nextState: state,
      stdout: [],
      stderr: ["fatal: Failed to resolve 'HEAD' as a valid ref."],
      exitCode: 128,
    };
  }

  if (state.tags && state.tags[tagName]) {
    return {
      nextState: state,
      stdout: [],
      stderr: [`fatal: tag '${tagName}' already exists`],
      exitCode: 128,
    };
  }

  if (isAnnotated) {
    if (!userMessage) {
      return {
        nextState: state,
        stdout: [],
        stderr: ['fatal: -a requires -m option in this educational sandbox.'],
        exitCode: 1,
      };
    }

    const newTag: GitTagRef = {
      name: tagName,
      commitId: state.headCommitId,
      type: 'annotated',
      message: userMessage,
      tagger: SIMULATOR_AUTHOR,
      timestamp: Date.now(),
    };

    return {
      nextState: {
        ...state,
        tags: {
          ...state.tags,
          [tagName]: newTag,
        },
      },
      stdout: [],
      stderr: [],
      exitCode: 0,
      explanation: {
        title: `Created Annotated Tag '${tagName}'`,
        description: `Created annotated release tag '${tagName}' pointing to commit ${state.headCommitId.slice(0, 7)} with message "${userMessage}".`,
        affectedStages: ['local'],
      },
    };
  }

  // Lightweight tag
  const newTag: GitTagRef = {
    name: tagName,
    commitId: state.headCommitId,
    type: 'lightweight',
  };

  return {
    nextState: {
      ...state,
      tags: {
        ...state.tags,
        [tagName]: newTag,
      },
    },
    stdout: [],
    stderr: [],
    exitCode: 0,
    explanation: {
      title: `Created Lightweight Tag '${tagName}'`,
      description: `Created lightweight tag '${tagName}' pointing to commit ${state.headCommitId.slice(0, 7)}.`,
      affectedStages: ['local'],
    },
  };
}

function handleGitReflog(
  state: GitRepoState,
  _args: string[]
): CommandResult {
  const entries = state.reflog || [];
  if (entries.length === 0) {
    return {
      nextState: state,
      stdout: [],
      stderr: [],
      exitCode: 0,
    };
  }

  const lines = entries.map(
    (e) => `${e.commitId.slice(0, 7)} ${e.id}: ${e.action}: ${e.message}`
  );

  return {
    nextState: state,
    stdout: lines,
    stderr: [],
    exitCode: 0,
    explanation: {
      title: 'Reflog Inspection',
      description: 'Listed sequential history of all HEAD pointer movements.',
      affectedStages: ['local'],
    },
  };
}

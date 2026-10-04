import React, { useState } from 'react';
import { FileCode2, Search, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';

interface QuickCommand {
  task: string;
  command: string;
  category: 'Status & Setup' | 'Staging & Commits' | 'Branches & Merge' | 'Remote & Sync' | 'Undo & Stash' | 'Diagnostics';
  dangerLevel: 'safe' | 'caution' | 'destructive';
  description: string;
  pdfSection: number;
}

export const CheatSheetView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const commands: QuickCommand[] = [
    {
      task: 'Check status / version',
      command: 'git status | git --version',
      category: 'Status & Setup',
      dangerLevel: 'safe',
      description: 'Inspect current branch, staged files, uncommitted edits, and installed version.',
      pdfSection: 12,
    },
    {
      task: 'Initialize / clone',
      command: 'git init | git clone <URL>',
      category: 'Status & Setup',
      dangerLevel: 'safe',
      description: 'Create a new local repo (.git directory) or download an existing remote repository.',
      pdfSection: 12,
    },
    {
      task: 'Configure committer',
      command: 'git config --global user.name "Your Name" && git config --global user.email "you@example.com"',
      category: 'Status & Setup',
      dangerLevel: 'safe',
      description: 'Set your global Git committer identity.',
      pdfSection: 3,
    },
    {
      task: 'Stage / commit changes',
      command: 'git add <file> | git commit -m "message"',
      category: 'Staging & Commits',
      dangerLevel: 'safe',
      description: 'Add files to staging index, then record snapshot to local repository.',
      pdfSection: 12,
    },
    {
      task: 'Review unstaged changes',
      command: 'git diff',
      category: 'Staging & Commits',
      dangerLevel: 'safe',
      description: 'Show line-by-line differences between working directory and the staging area.',
      pdfSection: 5,
    },
    {
      task: 'Review staged changes',
      command: 'git diff --staged',
      category: 'Staging & Commits',
      dangerLevel: 'safe',
      description: 'Show changes prepared for the next commit snapshot.',
      pdfSection: 5,
    },
    {
      task: 'History / commit detail',
      command: 'git log --oneline | git show <HASH>',
      category: 'Staging & Commits',
      dangerLevel: 'safe',
      description: 'Display compact commit log or inspect detailed diff of a specific commit.',
      pdfSection: 12,
    },
    {
      task: 'Branching operations',
      command: 'git branch | git switch -c <name> | git switch main',
      category: 'Branches & Merge',
      dangerLevel: 'safe',
      description: 'List branches, create & switch in one step, or navigate back to main.',
      pdfSection: 12,
    },
    {
      task: 'Merge branch',
      command: 'git merge <branch-name>',
      category: 'Branches & Merge',
      dangerLevel: 'safe',
      description: 'Incorporate changes from target branch into the currently checked-out branch.',
      pdfSection: 12,
    },
    {
      task: 'Remote inspection / setup',
      command: 'git remote -v | git remote add origin <URL>',
      category: 'Remote & Sync',
      dangerLevel: 'safe',
      description: 'Inspect connected remote endpoints or link local repo to GitHub origin.',
      pdfSection: 12,
    },
    {
      task: 'Share / update code',
      command: 'git push -u origin <branch> | git pull | git fetch origin',
      category: 'Remote & Sync',
      dangerLevel: 'safe',
      description: 'Push commits to GitHub, fetch updates without merging, or pull and merge in one step.',
      pdfSection: 12,
    },
    {
      task: 'Discard unstaged edits',
      command: 'git restore <file>',
      category: 'Undo & Stash',
      dangerLevel: 'destructive',
      description: 'Discards uncommitted working edits. Irreversible if changes were never staged!',
      pdfSection: 10,
    },
    {
      task: 'Unstage changes safely',
      command: 'git restore --staged <file>',
      category: 'Undo & Stash',
      dangerLevel: 'safe',
      description: 'Removes file from staging area while preserving your edits in working directory.',
      pdfSection: 10,
    },
    {
      task: 'Undo last commit (keep edits)',
      command: 'git reset --soft HEAD~1',
      category: 'Undo & Stash',
      dangerLevel: 'caution',
      description: 'Rolls back commit but keeps all changes staged ready to recommit.',
      pdfSection: 10,
    },
    {
      task: 'Hard reset last commit',
      command: 'git reset --hard HEAD~1',
      category: 'Undo & Stash',
      dangerLevel: 'destructive',
      description: 'Destructive! Discards working files and commit history back to previous checkpoint.',
      pdfSection: 10,
    },
    {
      task: 'Safe reverse commit',
      command: 'git revert <HASH>',
      category: 'Undo & Stash',
      dangerLevel: 'safe',
      description: 'Creates a new commit that inverts the changes of an old commit. Safe for shared branches.',
      pdfSection: 10,
    },
    {
      task: 'Stash work in progress',
      command: 'git stash push -m "WIP" | git stash list | git stash pop',
      category: 'Undo & Stash',
      dangerLevel: 'safe',
      description: 'Temporarily shelve dirty changes to clear working tree, then pop them back.',
      pdfSection: 11,
    },
    {
      task: 'Cleanup preview',
      command: 'git clean -n',
      category: 'Diagnostics',
      dangerLevel: 'safe',
      description: 'Dry-run preview of untracked files that would be permanently removed.',
      pdfSection: 12,
    },
    {
      task: 'Recent reference history',
      command: 'git reflog',
      category: 'Diagnostics',
      dangerLevel: 'safe',
      description: 'Record of all HEAD movements. Essential for rescuing lost commits after a bad reset.',
      pdfSection: 12,
    },
  ];

  const categories = ['All', 'Status & Setup', 'Staging & Commits', 'Branches & Merge', 'Remote & Sync', 'Undo & Stash', 'Diagnostics'];

  const filtered = commands.filter((c) => {
    const matchCat = selectedCat === 'All' || c.category === selectedCat;
    const matchSearch = 
      c.task.toLowerCase().includes(search.toLowerCase()) ||
      c.command.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileCode2 className="w-6 h-6 text-brand-accent" />
            <span>Git Command Quick Reference</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Complete command matrix sourced from Section 12 of the beginner&apos;s guide, with safety ratings.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search command or task..."
            className="w-full bg-bg-surface border border-bg-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary placeholder:text-text-muted transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCat === cat
                ? 'bg-brand-accent text-bg-dark font-bold'
                : 'bg-bg-surface border border-bg-border text-text-secondary hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table Cards */}
      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-bg-surface border border-bg-border hover:border-bg-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{item.task}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-dark text-text-muted border border-bg-border">
                  {item.category}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  item.dangerLevel === 'destructive'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : item.dangerLevel === 'caution'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.dangerLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-text-secondary">{item.description}</p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="font-mono text-xs px-3 py-1.5 rounded-lg bg-bg-dark border border-bg-border text-brand-accent whitespace-nowrap overflow-x-auto max-w-xs sm:max-w-md">
                $ {item.command}
              </div>
              <button
                onClick={() => handleCopy(item.command)}
                className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-border text-text-secondary hover:text-white transition-colors"
                title="Copy command"
              >
                {copiedCmd === item.command ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

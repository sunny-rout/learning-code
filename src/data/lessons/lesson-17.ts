import { Lesson } from '@/types/lesson';

export const LESSON_17: Lesson = {
  id: 'lesson-17',
  moduleId: 'module-17',
  number: 17,
  title: 'Advanced Concepts: Reflog & Clean',
  subtitle: 'Recovering Lost Commits with git reflog and Safely Pruning Workspaces with git clean',
  pdfSection: 12,
  estimatedMinutes: 20,
  steps: [
    {
      id: 'step-17-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand how git reflog tracks sequential movements of the HEAD pointer.',
            'Recover "lost" commits after an accidental "git reset --hard" using HEAD@{n} references.',
            'Preview untracked file deletions safely with the dry-run command "git clean -n".',
            'Delete untracked workspace clutter with "git clean -f" while preserving ignored files.',
            'Review the complete curriculum architecture and solidify version control mastery.'
          ]
        },
        {
          type: 'concept',
          title: 'Git’s Ultimate Safety Net: The Reflog',
          content: 'In Git, committed work is almost never truly lost. Even if you reset past a commit or delete a branch, the commit still exists in the object store. The reflog (reference log) records every time HEAD changes location, providing an immutable audit trail for recovery.'
        },
        {
          type: 'diagram',
          variant: 'commit-graph',
          caption: 'Recovering unreferenced commits using the reflog pointer log'
        }
      ]
    },
    {
      id: 'step-17-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Flight Data Recorder',
          metaphor: 'Imagine you accidentally drop a notebook of recipes into an elevator shaft ("git reset --hard"). You panic thinking it is gone forever. But your building maintains an automated security log recording every single elevator movement and floor stop ("git reflog"). By looking at the elevator log at entry HEAD@{1}, you pinpoint the exact floor where you were standing and retrieve the notebook unharmed.',
          takeaway: 'The reflog is your black box safety net. If you made a commit, reflog can find it.'
        }
      ]
    },
    {
      id: 'step-17-reflog-commands',
      title: 'Reflog Inspection & Recovery Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git reflog',
          explanation: 'Displays a chronological list of recent HEAD movements with indices (HEAD@{0}, HEAD@{1}, ...) and short commit hashes.'
        },
        {
          type: 'command',
          command: 'git reset HEAD@{1}',
          explanation: 'Restores your active branch and moves HEAD back to the state it held one movement prior to the current state.'
        },
        {
          type: 'command',
          command: 'git checkout HEAD@{2}',
          explanation: 'Switches HEAD directly to the commit recorded at index 2 in detached HEAD mode for safe inspection.'
        },
        {
          type: 'pitfall',
          warning: 'Assuming uncommitted edits appear in the reflog',
          consequence: 'The reflog tracks HEAD and branch movements—it does NOT record uncommitted working directory edits.',
          solution: 'Always commit or stash your work before experimenting with resets or branch switches.'
        }
      ]
    },
    {
      id: 'step-17-clean-commands',
      title: 'Cleaning the Workspace with git clean',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Pruning Untracked Clutter',
          content: 'Over time, temporary files, scratch scripts, and unwanted experiments accumulate in your working tree. "git clean" removes untracked files without altering tracked files or Git history.'
        },
        {
          type: 'command',
          command: 'git clean -n',
          explanation: 'Performs a safe dry run, listing all untracked files that would be deleted without actually deleting anything.'
        },
        {
          type: 'command',
          command: 'git clean -f',
          explanation: 'Forcefully removes untracked files from your working tree. By default, ignored files matching .gitignore are preserved.'
        }
      ]
    },
    {
      id: 'step-17-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Test Your Knowledge',
          content: 'Verify your understanding of reflog recovery and workspace cleaning.'
        }
      ],
      knowledgeCheck: {
        id: 'q-17-reflog-recovery',
        question: 'If you accidentally execute "git reset --hard HEAD~1" and lose your latest commit, what should you do first to recover it?',
        options: [
          'Run "git reflog" to identify the previous commit hash at HEAD@{1}, then reset back to it',
          'Immediately delete the repository and re-clone',
          'Run "git clean -f" to restore lost files',
          'Run "git init" to reset the database'
        ],
        correctIndex: 0,
        explanation: 'Section 12 details: Use "git reflog" to find the commit hash before the accidental reset, then run "git reset HEAD@{1}" (or the specific commit hash) to restore your work.'
      }
    },
    {
      id: 'step-17-summary',
      title: 'Curriculum Completion Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            '"git reflog" records every HEAD pointer transition, serving as Git\'s ultimate recovery tool.',
            'Recover from accidental resets using "git reset HEAD@{n}".',
            'Always preview untracked file deletions with "git clean -n" before executing "git clean -f".',
            'Ignored files defined in .gitignore remain protected during standard git clean operations.',
            'Congratulations on mastering the complete Git learning curriculum from fundamentals to advanced workflows!'
          ]
        }
      ]
    }
  ]
};
export default LESSON_17;

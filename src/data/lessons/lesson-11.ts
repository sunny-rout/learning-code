import { Lesson } from '@/types/lesson';

export const LESSON_11: Lesson = {
  id: 'lesson-11',
  moduleId: 'module-11',
  number: 11,
  title: 'Undoing Changes Safely',
  subtitle: 'Mastering git restore, git revert, and git reset (--soft, --mixed, --hard)',
  pdfSection: 10,
  estimatedMinutes: 22,
  steps: [
    {
      id: 'step-11-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Discard unwanted working tree modifications using "git restore <path>".',
            'Unstage files from the index using "git restore --staged <path>".',
            'Undo committed changes safely on shared branches using "git revert <commit>".',
            'Understand the three modes of "git reset" (--soft, --mixed, and --hard).',
            'Recognize the golden rule: never rewrite or reset commits already published to collaborators.'
          ]
        },
        {
          type: 'concept',
          title: 'The Three Levels of Undoing',
          content: 'Mistakes happen at different stages: in the working tree (uncommitted), in the staging area (added), or already committed. Git provides dedicated, precise tools for each level so you can recover without losing valuable work.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Choosing between git restore, restore --staged, reset, and revert'
        }
      ]
    },
    {
      id: 'step-11-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Eraser vs Corkboard vs Bank Adjustment',
          metaphor: '"git restore" is an eraser on your private notebook paper. "git restore --staged" is taking an index card off the bulletin board outbox and placing it back onto your desk. "git revert" is an official bank accounting adjustment: instead of secretly tearing out last week\'s ledger page, the accountant enters a new compensating entry that cleanly cancels the previous error while keeping the audit trail transparent for everyone.',
          takeaway: 'Use git revert for shared remote commits; use git restore and git reset for your local, unshared experiments.'
        }
      ]
    },
    {
      id: 'step-11-commands',
      title: 'Undoing Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git restore <file>',
          explanation: 'Discards uncommitted changes in your working tree, resetting the file to match the index or HEAD.'
        },
        {
          type: 'command',
          command: 'git restore --staged <file>',
          explanation: 'Removes a file from the staging area while leaving your working tree file edits completely intact.'
        },
        {
          type: 'command',
          command: 'git revert <commit>',
          explanation: 'Creates a brand new commit that applies the exact inverse of the target commit. Safe for shared branches because it preserves linear history.'
        },
        {
          type: 'command',
          command: 'git reset --soft HEAD~1',
          explanation: 'Moves the HEAD branch pointer back one commit. Changes remain staged in the index, ready to amend or re-commit.'
        },
        {
          type: 'command',
          command: 'git reset --hard HEAD~1',
          explanation: 'Moves HEAD back and completely overwrites both the index and working tree to match the target commit. Discards all uncommitted changes.'
        },
        {
          type: 'pitfall',
          warning: 'Running "git reset --hard" with uncommitted work',
          consequence: 'Any uncommitted changes in your working tree are wiped out instantly and cannot be recovered via Git history.',
          solution: 'Always verify "git status" is clean or run "git stash" before executing any --hard reset.'
        }
      ]
    },
    {
      id: 'step-11-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm safe undoing strategies for shared branches.'
        }
      ],
      knowledgeCheck: {
        id: 'q-11-undo-shared-commit',
        question: 'A commit has already been pushed to the shared GitHub main branch. How should you undo it?',
        options: [
          'git reset --hard HEAD~1 followed by a force push',
          'git restore --all',
          'git revert <commit-hash>',
          'git stash drop'
        ],
        correctIndex: 2,
        explanation: 'Section 10 explains: "Use git revert for commits already shared with others. It creates a new commit that inverts the changes without rewriting history."'
      }
    },
    {
      id: 'step-11-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Use "git restore <file>" to discard unstaged working tree edits.',
            'Use "git restore --staged <file>" to unstage files while keeping edits.',
            'Use "git revert <commit>" to invert shared commits safely without rewriting history.',
            'Use "git reset --soft" or "--mixed" for local commit adjustments.',
            'Treat "git reset --hard" with extreme caution as it discards uncommitted work.'
          ]
        }
      ]
    }
  ]
};

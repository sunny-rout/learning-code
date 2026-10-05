import { Lesson } from '@/types/lesson';

export const LESSON_10: Lesson = {
  id: 'lesson-10',
  moduleId: 'module-10',
  number: 10,
  title: 'Comparing Changes',
  subtitle: 'Understanding Unified Diffs, Inspecting Workspaces, and Exploring Commit Details',
  pdfSection: 5,
  estimatedMinutes: 18,
  steps: [
    {
      id: 'step-10-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Inspect unstaged changes using "git diff" (working tree vs. staging area).',
            'Inspect staged changes using "git diff --staged" (staging area vs. last commit).',
            'Read and understand unified diff output symbols (+, -, and @@ chunk headers).',
            'Inspect specific commits and author details using "git show <commit>".',
            'Verify code changes before committing to avoid accidental commits.'
          ]
        },
        {
          type: 'concept',
          title: 'The Two Types of Diffs',
          content: 'In Git, changes move through stages. Unstaged edits reside only in your working tree. Once you run "git add", they enter the staging area (index). Therefore, Git provides two distinct diff commands to inspect what is unstaged versus what is staged and ready to commit.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'git diff (Working Tree -> Staging Area) vs git diff --staged (Staging Area -> HEAD)'
        }
      ]
    },
    {
      id: 'step-10-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Pencil Drafts vs The Outbox vs The Printed Book',
          metaphor: 'Imagine editing a book manuscript. When you scribble pencil notes on your draft desk, "git diff" compares your pencil scribbles against the typed pages you placed in your outbox. When you place finalized pages into the outbox, "git diff --staged" compares those boxed pages against the printed book on the library shelf (HEAD). "git show" opens a specific edition of the book to read the publisher notes and exact line changes.',
          takeaway: 'Never commit blindly: always check git diff and git diff --staged before typing git commit.'
        }
      ]
    },
    {
      id: 'step-10-commands',
      title: 'Diff & Inspection Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git diff',
          explanation: 'Shows all unstaged changes between your working tree and the staging area (index).'
        },
        {
          type: 'command',
          command: 'git diff --staged',
          explanation: 'Shows differences between files in the staging area and the most recent commit (HEAD). Can also be written as "git diff --cached".'
        },
        {
          type: 'command',
          command: 'git show <commit>',
          explanation: 'Shows the commit message, author, timestamp, and full unified diff introduced by that specific commit hash or ref.'
        },
        {
          type: 'pitfall',
          warning: 'Running "git diff" after "git add" and seeing empty output',
          consequence: 'Beginners panic thinking their changes were erased or lost because git diff shows nothing.',
          solution: 'When files are staged, "git diff" shows nothing because there is no difference between the working tree and the index. Use "git diff --staged" to inspect your staged files.'
        }
      ]
    },
    {
      id: 'step-10-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm which diff command inspects staged work.'
        }
      ],
      knowledgeCheck: {
        id: 'q-10-staged-diff',
        question: 'You just ran "git add index.html". Which command shows the changes you are about to commit?',
        options: [
          'git diff',
          'git diff --staged',
          'git status --diff',
          'git branch -v'
        ],
        correctIndex: 1,
        explanation: 'Section 5 explains: "git diff --staged (or --cached) compares the staging area against HEAD to inspect what is prepared for commit."'
      }
    },
    {
      id: 'step-10-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Use "git diff" to review unstaged edits before adding them.',
            'Use "git diff --staged" to verify staged changes before committing.',
            'Unified diff format indicates deleted lines with "-" and added lines with "+".',
            'Use "git show <commit>" to inspect full commit details and patches.'
          ]
        }
      ]
    }
  ]
};

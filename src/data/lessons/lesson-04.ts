import { Lesson } from '@/types/lesson';

export const LESSON_04: Lesson = {
  id: 'lesson-04',
  moduleId: 'module-04',
  number: 4,
  title: 'Staging and Committing',
  subtitle: 'The 3-Area Workflow, Reviewing Diffs, and Crafting Checkpoints',
  pdfSection: 5,
  estimatedMinutes: 15,
  steps: [
    {
      id: 'step-04-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand the 3 local areas: Working Directory, Staging Area, and Local Repository.',
            'Select and prepare files using "git add <file>" and "git add .".',
            'Inspect differences with "git diff" and staged differences with "git diff --staged".',
            'Create immutable snapshots with "git commit -m" and write descriptive messages.',
            'Remember the Golden Safety Rule: git add and git commit never send code to GitHub!'
          ]
        },
        {
          type: 'concept',
          title: 'The 3 Local Areas',
          content: 'Git does not snapshot everything you touch immediately. It uses a 3-step local pipeline:\n\n1. **Working Directory**: Where you edit, create, and delete files using your code editor.\n2. **Staging Area (Index)**: Where you assemble the exact set of changes you wish to include in the next commit.\n3. **Local Repository**: Where your finalized commit checkpoints are permanently sealed in history.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'The 4-Stage Lifecycle: Working Directory -> Staging Area -> Local Repo -> Remote (GitHub)',
          highlightStages: ['working', 'staging', 'local']
        }
      ]
    },
    {
      id: 'step-04-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Loading Dock & The Shipping Container',
          metaphor: 'Imagine a warehouse. Your workbench is where you build products (Working Directory). When an item is finished, you do not immediately ship a single screw in a giant freight container. Instead, you place the finished items onto the loading pallet (Staging Area). You can inspect the pallet, add more items, or take an item back off. Once the pallet is packed logically, you wrap it in cellophane, stamp it with a tracking ID, and archive it into the warehouse ledger (Local Commit).',
          takeaway: 'Staging lets you craft clean, logical commits containing only related changes.'
        },
        {
          type: 'concept',
          title: 'The Golden Safety Rule from the Guide',
          content: 'Remember: "git add" and "git commit" do NOT upload anything to GitHub. They operate strictly on your personal computer.',
          callout: {
            type: 'warning',
            text: 'You can commit 50 times completely offline. GitHub only receives your commits when you explicitly run "git push".'
          }
        }
      ]
    },
    {
      id: 'step-04-commands',
      title: 'Staging, Diffs & Commits',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git add README.md',
          explanation: 'Stages a specific file. Moves the file from the Working Directory into the Staging Area.'
        },
        {
          type: 'command',
          command: 'git add .',
          explanation: 'Stages all modified and new files under the current directory. Always review "git status" before running this to avoid staging unintended files.'
        },
        {
          type: 'command',
          command: 'git diff',
          explanation: 'Displays line-by-line differences between your working directory files and the staging area (shows unstaged edits).'
        },
        {
          type: 'command',
          command: 'git diff --staged',
          explanation: 'Displays the exact differences between the staging area and your last commit (shows what is prepared for the next commit).'
        },
        {
          type: 'command',
          command: 'git commit -m "Add project README"',
          explanation: 'Creates a new commit checkpoint containing all staged changes with an explanatory message.',
          flags: [
            { flag: '-m', description: 'Provides the commit message inline directly in the terminal.' }
          ]
        },
        {
          type: 'command',
          command: 'git log --oneline',
          explanation: 'Displays a compact, single-line summary of recent commits with their short 7-character SHA hashes.'
        },
        {
          type: 'output',
          command: 'git log --oneline',
          output: 'b7a2d1e (HEAD -> main) Add project README\n3f91c04 Initial repository setup',
          note: 'Shows the chronological commit history with HEAD pointing to the latest checkpoint.'
        },
        {
          type: 'pitfall',
          warning: 'Vague or lazy commit messages like "fixed stuff" or "update"',
          consequence: 'When bugs happen in production, you cannot understand why changes were made or locate bad commits.',
          solution: 'Write short, descriptive messages in the imperative mood, such as "Fix login validation" or "Add homepage layout" (as recommended in Section 5).'
        }
      ]
    },
    {
      id: 'step-04-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Test your grasp of diff inspection and the staging workflow.'
        }
      ],
      knowledgeCheck: {
        id: 'q-04-diff-vs-staged',
        question: 'Which command shows you changes that are staged and ready to be committed?',
        options: [
          'git diff',
          'git diff --staged',
          'git log --oneline',
          'git status --all'
        ],
        correctIndex: 1,
        explanation: 'Section 5 explains: "git diff shows unstaged changes; git diff --staged shows what is prepared for commit."'
      }
    },
    {
      id: 'step-04-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Edit in working directory -> stage with "git add" -> commit with "git commit -m".',
            'Use "git diff" to review unstaged edits before adding them.',
            'Use "git diff --staged" to verify what you are about to seal into history.',
            'git add and git commit are completely local and never upload to GitHub.'
          ]
        }
      ]
    }
  ]
};

import { Lesson } from '@/types/lesson';

export const LESSON_07: Lesson = {
  id: 'lesson-07',
  moduleId: 'module-07',
  number: 7,
  title: 'Branching and Merging',
  subtitle: 'Isolating Feature Development, Switching Contexts, and Safe Branch Cleanup',
  pdfSection: 7,
  estimatedMinutes: 18,
  steps: [
    {
      id: 'step-07-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand what a Git branch is: a lightweight movable pointer to a commit.',
            'Create feature branches instead of committing everything directly to main.',
            'Switch branches using the modern "git switch" and "git switch -c" commands.',
            'Merge a completed feature branch into main while standing on the receiving branch.',
            'Distinguish safe deletion (-d) from forced deletion (-D).'
          ]
        },
        {
          type: 'concept',
          title: 'Why Use Feature Branches?',
          content: 'A branch lets you develop a feature or test an experimental idea separately from the main line of work. If the feature succeeds, you merge it into main. If you decide to abandon it, your main production branch is completely untouched.'
        },
        {
          type: 'diagram',
          variant: 'branch-divergence',
          caption: 'Feature branch diverging from main and merging back into main'
        }
      ]
    },
    {
      id: 'step-07-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Parallel Universes / Movie Script drafts',
          metaphor: 'Imagine writing a movie script. The published draft is on your master copy (main). You want to experiment with an alternate ending where the hero turns evil. Rather than erasing your master copy, you photocopy the script into a separate folder called "evil-ending" (feature branch). You write and refine the alternate storyline there. If the director loves it, you incorporate those pages back into the master copy (git merge). If they hate it, you discard the folder and the master script was never touched.',
          takeaway: 'Branches give developers psychological safety: you can break things without breaking production.'
        }
      ]
    },
    {
      id: 'step-07-commands',
      title: 'Branching & Merging Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git branch',
          explanation: 'Lists all local branches. An asterisk (*) highlights the currently checked-out branch.'
        },
        {
          type: 'command',
          command: 'git switch -c feature-login',
          explanation: 'Creates a new branch named feature-login AND switches to it in one single step. (Modern replacement for "git checkout -b").',
          flags: [
            { flag: '-c', description: 'Create and switch to new branch.' }
          ]
        },
        {
          type: 'command',
          command: 'git switch main',
          explanation: 'Switches your working directory back to the main branch.'
        },
        {
          type: 'command',
          command: 'git merge feature-login',
          explanation: 'Combines the commits from feature-login into the active branch. CRITICAL: Always switch to the branch that should RECEIVE the work (e.g., main) before executing git merge!'
        },
        {
          type: 'command',
          command: 'git branch -d feature-login',
          explanation: 'Safely deletes the local branch after its changes have been merged.',
          flags: [
            { flag: '-d', description: 'Safe delete. Prevents deletion if unmerged commits exist.' },
            { flag: '-D', description: 'Force delete. Discards unmerged work without safety checks.' }
          ]
        },
        {
          type: 'pitfall',
          warning: 'Running "git merge" while still on the feature branch',
          consequence: 'Running "git merge main" merges main into your feature, rather than incorporating your feature into main.',
          solution: 'Section 7 Golden Rule: "Merge while on the branch that should receive the work (switch to main, then merge feature-login)."'
        }
      ]
    },
    {
      id: 'step-07-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm the proper merge sequence.'
        }
      ],
      knowledgeCheck: {
        id: 'q-07-merge-receiving-branch',
        question: 'To merge the changes of "feature-login" into the "main" branch, what branch must you be on when running git merge?',
        options: [
          'You must be on the feature-login branch.',
          'You must be on the main branch.',
          'You must be on a detached HEAD state.',
          'It does not matter which branch you are on.'
        ],
        correctIndex: 1,
        explanation: 'Per Section 7: "Merge while on the branch that should receive the work (for example, switch to main, then merge the feature branch)."'
      }
    },
    {
      id: 'step-07-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Create feature branches to build new functionality in isolation.',
            'Use "git switch -c <name>" to create and jump into a branch immediately.',
            'Always switch to the receiving branch before running "git merge".',
            'Delete merged branches with "-d"; use "-D" only when intentionally discarding work.'
          ]
        }
      ]
    }
  ]
};

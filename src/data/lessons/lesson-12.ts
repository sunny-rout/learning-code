import { Lesson } from '@/types/lesson';

export const LESSON_12: Lesson = {
  id: 'lesson-12',
  moduleId: 'module-12',
  number: 12,
  title: 'Stashing Changes',
  subtitle: 'Temporarily Shelving Work-in-Progress, Managing the Stash Stack, and Safe Restoration',
  pdfSection: 11,
  estimatedMinutes: 16,
  steps: [
    {
      id: 'step-12-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand what the Git stash stack is and when to use it.',
            'Shelve uncommitted local work with "git stash" or "git stash push -m <msg>".',
            'View saved stash entries using "git stash list".',
            'Restore and remove stashed work using "git stash pop".',
            'Safely discard unneeded stash entries with "git stash drop" and "git stash clear".'
          ]
        },
        {
          type: 'concept',
          title: 'What is Git Stash?',
          content: 'Git stash takes your uncommitted modifications (both staged and unstaged tracked changes), saves them onto a Last-In-First-Out (LIFO) stack, and reverts your working tree and index to clean HEAD state.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Stashing uncommitted changes onto the stash stack and popping back into working tree'
        }
      ]
    },
    {
      id: 'step-12-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Side Desk Drawer',
          metaphor: 'Imagine you are assembling a Lego model on your desk. Your manager suddenly rushes in asking you to inspect a blueprint immediately. You cannot finish the Lego model right now, but you do not want Lego pieces scattered all over your desk either. You sweep the current pieces into a desk drawer ("git stash"). Your desk is now completely clean. You inspect the blueprint. Once you are done, you open the drawer and dump the pieces back onto the desk ("git stash pop") right where you left off.',
          takeaway: 'Stashing gives you a clean slate in seconds without creating unnecessary "WIP" commits.'
        }
      ]
    },
    {
      id: 'step-12-commands',
      title: 'Stash Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git stash',
          explanation: 'Saves your tracked modifications to a new stash entry (stash@{0}) and resets the working tree and index to match HEAD.'
        },
        {
          type: 'command',
          command: 'git stash push -m "message"',
          explanation: 'Saves your modifications with a custom descriptive message, making it easy to identify later in the stash list.'
        },
        {
          type: 'command',
          command: 'git stash list',
          explanation: 'Lists all stored stashes in order from newest (stash@{0}) to oldest.'
        },
        {
          type: 'command',
          command: 'git stash pop',
          explanation: 'Restores the most recent stash entry (stash@{0}) back into your working tree and staging area, then removes it from the stash stack.'
        },
        {
          type: 'command',
          command: 'git stash drop',
          explanation: 'Permanently deletes the top stash entry (stash@{0}) without applying it.'
        },
        {
          type: 'command',
          command: 'git stash clear',
          explanation: 'Deletes all stash entries from the repository.'
        },
        {
          type: 'pitfall',
          warning: 'Attempting to pop a stash onto a dirty working tree',
          consequence: 'Applying stashed changes onto modified files can cause merge conflicts or overwrite uncommitted work.',
          solution: 'Git will reject "stash pop" if your working directory is dirty or if an untracked file conflicts with the stash snapshot. Ensure your working tree is clean before popping.'
        }
      ]
    },
    {
      id: 'step-12-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm the lifecycle of stashed entries.'
        }
      ],
      knowledgeCheck: {
        id: 'q-12-stash-pop-behavior',
        question: 'What happens to the stash entry after executing "git stash pop"?',
        options: [
          'It is applied and kept indefinitely at stash@{0}',
          'It is applied to the working tree and removed from the stash stack',
          'It creates a new commit on main',
          'It is permanently converted into a tag'
        ],
        correctIndex: 1,
        explanation: 'Section 11 explains: "git stash pop restores changes to your working tree and removes the stash from the stack."'
      }
    },
    {
      id: 'step-12-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Use "git stash" to shelve tracked uncommitted work and obtain a clean HEAD state.',
            'Use "git stash list" to inspect the stash stack.',
            'Use "git stash pop" to reapply the latest stash and remove it from the stack.',
            'Use "git stash drop" or "clear" to remove unneeded stashes safely.'
          ]
        }
      ]
    }
  ]
};

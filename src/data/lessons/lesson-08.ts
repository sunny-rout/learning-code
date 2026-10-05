import { Lesson } from '@/types/lesson';

export const LESSON_08: Lesson = {
  id: 'lesson-08',
  moduleId: 'module-08',
  number: 8,
  title: 'Fetching and Pulling',
  subtitle: 'Synchronizing with Remote Repositories, Remote-Tracking Branches, and Integration',
  pdfSection: 8,
  estimatedMinutes: 20,
  steps: [
    {
      id: 'step-08-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand what remote-tracking branches (e.g. origin/main) represent.',
            'Differentiate git fetch (safely download updates) from git pull (download + integrate).',
            'Inspect remote branches with "git branch -r" and "git branch -a".',
            'Understand how git pull integrates remote changes into your active branch.',
            'Recognize and resolve conflicts that can occur during a pull.'
          ]
        },
        {
          type: 'concept',
          title: 'Remote-Tracking Branches',
          content: 'When you connect to a remote repository, Git keeps read-only bookmarks called remote-tracking branches (like origin/main). They record where branches were on the remote server the last time you communicated with it.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Local branches vs remote-tracking branches vs remote repository'
        }
      ]
    },
    {
      id: 'step-08-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Checking the Mailbox vs Merging Notes',
          metaphor: 'Imagine a team bulletin board. git fetch is like walking over to the board and taking photos of new notices. You now have the latest information saved on your phone (origin/main), but your own desk notebook (your working tree) has not been touched. git pull is like taking those photos AND immediately copying them into your notebook, blending them with your current writing.',
          takeaway: 'git fetch is always safe because it never alters your local working files. git pull modifies your branch and working tree.'
        }
      ]
    },
    {
      id: 'step-08-commands',
      title: 'Fetch & Pull Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git fetch origin',
          explanation: 'Downloads new commits, branches, and tags from the remote "origin" and updates your origin/* remote-tracking branches. It does not touch your working tree or current branch.'
        },
        {
          type: 'command',
          command: 'git branch -r',
          explanation: 'Lists all remote-tracking branches currently known to your local repository.'
        },
        {
          type: 'command',
          command: 'git branch -a',
          explanation: 'Lists both local branches and remote-tracking branches together.'
        },
        {
          type: 'command',
          command: 'git pull',
          explanation: 'Fetches changes from the configured upstream tracking branch and immediately merges them into the current active branch.'
        },
        {
          type: 'pitfall',
          warning: 'Assuming git fetch modified your files',
          consequence: 'Developers run git fetch and open their editor, wondering why newly pushed collaborator changes are not visible.',
          solution: 'Remember that git fetch only updates remote-tracking references. You must merge or pull to incorporate those changes into your active branch.'
        }
      ]
    },
    {
      id: 'step-08-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm the distinction between fetch and pull.'
        }
      ],
      knowledgeCheck: {
        id: 'q-08-fetch-vs-pull',
        question: 'What is the primary difference between "git fetch" and "git pull"?',
        options: [
          'git fetch downloads commits to remote-tracking branches without touching your working tree; git pull fetches and immediately merges.',
          'git fetch uploads your local commits to GitHub; git pull downloads them.',
          'git fetch permanently deletes obsolete branches; git pull creates new branches.',
          'git fetch is an alias for git status; git pull is an alias for git checkout.'
        ],
        correctIndex: 0,
        explanation: 'Section 8 explains: "git fetch downloads objects and updates remote-tracking refs without altering working files; git pull combines fetch and merge into HEAD."'
      }
    },
    {
      id: 'step-08-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Remote-tracking branches (origin/main) act as read-only bookmarks of remote state.',
            'Use "git fetch" to safely inspect upstream changes without modifying local files.',
            'Use "git branch -r" or "-a" to inspect remote tracking branches.',
            'Use "git pull" to fetch and integrate remote changes in one step.'
          ]
        }
      ]
    }
  ]
};

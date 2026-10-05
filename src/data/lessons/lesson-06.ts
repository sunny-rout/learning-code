import { Lesson } from '@/types/lesson';

export const LESSON_06: Lesson = {
  id: 'lesson-06',
  moduleId: 'module-06',
  number: 6,
  title: 'Cloning and Pushing',
  subtitle: 'Downloading Existing Repositories and Publishing Local Commits with Upstream Tracking',
  pdfSection: 6,
  estimatedMinutes: 16,
  steps: [
    {
      id: 'step-06-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Clone an existing remote repository onto your computer using "git clone <url>".',
            'Understand what git clone automates: repo initialization, remote origin setup, full history download, and default branch checkout.',
            'Publish local commits to GitHub using "git push".',
            'Understand upstream tracking (-u / --set-upstream) and why it simplifies future pushes.',
            'Distinguish working tree changes from committed changes when pushing.'
          ]
        },
        {
          type: 'concept',
          title: 'The Publishing Cycle',
          content: 'Work in Git is local-first. You create files, stage them, and commit them on your machine. When you are ready to share your work with collaborators or back it up to the cloud, you push your commits to the remote repository.'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Local repository pushing commits across to remote GitHub repository'
        }
      ]
    },
    {
      id: 'step-06-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Purchasing an Official Franchise Kit vs Submitting Monthly Reports',
          metaphor: '"git clone" is like ordering a complete starter franchise kit from headquarters. You receive the full company handbook, the inventory, and an active communication line back to headquarters ("origin"). "git push -u origin main" is like sending your first month\'s audited reports to HQ and setting up an automatic delivery schedule so all future reports only require dropping them in the outgoing slot ("git push").',
          takeaway: 'Clone gets everything once; push sends your new commits upstream.'
        }
      ]
    },
    {
      id: 'step-06-commands',
      title: 'Clone & Push Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git clone <url>',
          explanation: 'Downloads an entire remote repository, creating a new local directory with full commit history, an origin remote pointer, and the default branch checked out.'
        },
        {
          type: 'command',
          command: 'git push -u origin main',
          explanation: 'Pushes your local "main" branch commits to "origin" and links the local branch to the remote branch as its upstream tracking reference.',
          flags: [
            { flag: '-u', description: 'Sets upstream tracking so future pushes/pulls only need "git push" or "git pull".' }
          ]
        },
        {
          type: 'command',
          command: 'git push',
          explanation: 'Pushes new commits from the active branch to its configured upstream remote branch.'
        },
        {
          type: 'pitfall',
          warning: 'Pushing uncommitted modifications',
          consequence: '"git push" only sends committed snapshots. Any uncommitted changes in your working tree or staging index are NOT sent to GitHub.',
          solution: 'Always check "git status" to ensure your working tree is clean and your changes are safely committed before pushing.'
        }
      ]
    },
    {
      id: 'step-06-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm the effect of upstream tracking.'
        }
      ],
      knowledgeCheck: {
        id: 'q-06-upstream-tracking',
        question: 'What is the purpose of passing "-u" (or "--set-upstream") during "git push -u origin main"?',
        options: [
          'It forces Git to overwrite any conflicting remote branches.',
          'It links the local branch to the remote branch so future commands only require "git push" or "git pull".',
          'It encrypts your commit messages before sending them to GitHub.',
          'It immediately merges all remote branches into your working directory.'
        ],
        correctIndex: 1,
        explanation: 'Section 6 explains: "The -u flag establishes upstream tracking, allowing subsequent syncs with plain git push and git pull."'
      }
    },
    {
      id: 'step-06-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Use "git clone <url>" to download an existing repository with full history and remote tracking.',
            'Use "git push -u origin main" for the initial push to establish upstream tracking.',
            'Once upstream tracking is set, simply type "git push" to publish future commits.',
            'Remember: Git only pushes committed snapshots, never uncommitted working files.'
          ]
        }
      ]
    }
  ]
};

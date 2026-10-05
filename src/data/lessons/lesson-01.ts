import { Lesson } from '@/types/lesson';

export const LESSON_01: Lesson = {
  id: 'lesson-01',
  moduleId: 'module-01',
  number: 1,
  title: 'Git Fundamentals',
  subtitle: 'Understanding Version Control and the Difference Between Git & GitHub',
  pdfSection: 1,
  estimatedMinutes: 10,
  steps: [
    {
      id: 'step-01-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Define what a Version Control System (VCS) is and why developers use it.',
            'Explain the fundamental difference between Git and GitHub.',
            'Identify key Git terminology: repository, commit, branch, staging area, HEAD, and remotes.',
            'Understand how Git operates locally without an active internet connection.'
          ]
        },
        {
          type: 'concept',
          title: 'What is Git?',
          content: 'Git is a distributed version control system. It records how files change over time so you can review earlier work, compare versions, and collaborate safely without fear of losing code.',
          callout: {
            type: 'info',
            text: 'Git was created by Linus Torvalds in 2005 to manage the Linux kernel development.'
          }
        }
      ]
    },
    {
      id: 'step-01-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Video Game Checkpoints & The Cloud Store',
          metaphor: 'Imagine playing an expansive RPG game. You do not just rely on a single save file that gets overwritten. Instead, before a big boss fight or risky jump, you create a checkpoint. If something goes wrong, you can safely return to that exact checkpoint without losing previous progress. Git is that checkpoint system for your code. GitHub is the cloud multiplayer server where you upload your save games to share with your party members.',
          takeaway: 'Git creates the checkpoints locally on your machine. GitHub is where you share and synchronize checkpoints online.'
        },
        {
          type: 'concept',
          title: 'Git vs GitHub: The Vital Distinction',
          content: 'Git is the command-line tool installed on your computer that manages history offline. GitHub is a web platform owned by Microsoft that hosts Git repositories in the cloud and provides collaboration features like Pull Requests, code review, and issue tracking.',
          callout: {
            type: 'warning',
            text: 'You do NOT need GitHub or an internet connection to use Git. Git works completely offline on your computer.'
          }
        }
      ]
    },
    {
      id: 'step-01-vocabulary',
      title: 'Core Terminology',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Essential Vocabulary from the Guide',
          content: 'Here are the primary terms you will use constantly throughout your Git journey:\n\n• **Repository (repo)**: A project managed by Git, containing all project files and the hidden history database.\n• **Local repository**: The Git project residing directly on your computer.\n• **Remote repository**: A repository hosted elsewhere, such as on GitHub.\n• **Commit**: A saved checkpoint in the project history with a descriptive message and author timestamp.\n• **Branch**: An independent line of development allowing features to be built in isolation.\n• **Staging area**: The preparation zone where changes are reviewed before sealing a commit.\n• **HEAD**: The pointer indicating your current position in the Git history.'
        },
        {
          type: 'command',
          command: 'git --version',
          explanation: 'Checks whether Git is installed on your operating system and prints the active version.',
          flags: [
            { flag: '--version', description: 'Outputs the version number of the git binary.' }
          ]
        },
        {
          type: 'output',
          command: 'git --version',
          output: 'git version 2.44.0.windows.1',
          note: 'If you see an output similar to this, Git is properly installed and accessible in your shell.'
        }
      ]
    },
    {
      id: 'step-01-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Answer the question below to confirm your mental model before concluding this unit.'
        }
      ],
      knowledgeCheck: {
        id: 'q-01-git-vs-github',
        question: 'Can you use Git without having an active internet connection or GitHub account?',
        options: [
          'No, Git requires a connection to GitHub servers for every operation.',
          'Yes, Git is a local version control tool that records history entirely offline.',
          'Only if you have configured SSH keys previously.',
          'No, commits are directly rejected if GitHub is unreachable.'
        ],
        correctIndex: 1,
        explanation: 'Git works locally on your machine. Commits, branch creation, logs, and diffs require no internet connection or GitHub account.'
      }
    },
    {
      id: 'step-01-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Git is a distributed version control system for tracking file changes over time.',
            'GitHub is a remote hosting platform for sharing and collaborating on Git repositories.',
            'Git functions completely offline on your computer.',
            'Commits are immutable checkpoints that never overwrite past history unless explicitly forced.'
          ]
        }
      ]
    }
  ]
};

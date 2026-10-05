import { Lesson } from '@/types/lesson';

export const LESSON_03: Lesson = {
  id: 'lesson-03',
  moduleId: 'module-03',
  number: 3,
  title: 'Creating Your First Repository',
  subtitle: 'Initializing a Project, the Hidden .git Directory, and Status Inspection',
  pdfSection: 4,
  estimatedMinutes: 12,
  steps: [
    {
      id: 'step-03-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Create a project directory and initialize it with git init.',
            'Understand what the hidden .git directory is and why you must never delete it.',
            'Inspect the health and state of your working directory with git status.',
            'Differentiate between starting fresh with git init vs downloading with git clone.'
          ]
        },
        {
          type: 'concept',
          title: 'What Happens During git init?',
          content: 'Running git init in any directory transforms that ordinary folder into a Git repository. It creates a hidden subfolder called .git which houses the object database, references, branch pointers, and commit history.'
        }
      ]
    },
    {
      id: 'step-03-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Architect\'s Secure Black Box',
          metaphor: 'Imagine a blueprint drafting room. On the desk are your current sketches (your working directory). In the corner is a secure, fireproof safe with a ledger (the hidden .git folder). Whenever you say "start tracking this project" (git init), the safe is installed in the room. If you delete that safe, all previous versions and blueprints ever archived are lost forever!',
          takeaway: 'Never manually delete or corrupt the hidden .git directory unless you intentionally want to erase the entire project history.'
        }
      ]
    },
    {
      id: 'step-03-commands',
      title: 'Repository Initialization Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'mkdir my-first-project && cd my-first-project',
          explanation: 'Standard terminal commands to make a new directory and navigate into it.'
        },
        {
          type: 'command',
          command: 'git init',
          explanation: 'Initializes an empty Git repository in the current working directory, creating the hidden .git structure.'
        },
        {
          type: 'output',
          command: 'git init',
          output: 'Initialized empty Git repository in D:/Training/my-first-project/.git/',
          note: 'From this moment forward, Git monitors this folder.'
        },
        {
          type: 'command',
          command: 'git status',
          explanation: 'Displays the state of the working tree and staging area: current branch, untracked files, modified files, and staged changes.'
        },
        {
          type: 'output',
          command: 'git status',
          output: 'On branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use "git add" to track)',
          note: 'A clean repository ready for files.'
        },
        {
          type: 'pitfall',
          warning: 'Running git init inside another Git repository',
          consequence: 'Accidentally nesting repositories creates difficult-to-manage submodules or untracked nested repos.',
          solution: 'Always check "git status" first before running "git init" to ensure you are not already inside an existing repository.'
        }
      ]
    },
    {
      id: 'step-03-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Test your understanding of repository initialization.'
        }
      ],
      knowledgeCheck: {
        id: 'q-03-git-init-purpose',
        question: 'What is the primary action performed by the command "git init"?',
        options: [
          'It connects your project directly to GitHub.',
          'It creates the hidden .git data directory and starts a Git repository in the current folder.',
          'It downloads the latest version of Git from the internet.',
          'It uploads your files to the cloud.'
        ],
        correctIndex: 1,
        explanation: 'Section 4 states clearly: "git init creates the hidden .git data directory and starts a repository in the current folder."'
      }
    },
    {
      id: 'step-03-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Use "git init" to start a new repository locally on your computer.',
            'The hidden ".git" folder stores the complete historical database.',
            'Run "git status" frequently to check the state of your files and branch.',
            'Use "git clone" when obtaining an existing project from GitHub rather than "git init".'
          ]
        }
      ]
    }
  ]
};

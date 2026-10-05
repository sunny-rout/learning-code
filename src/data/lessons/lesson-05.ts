import { Lesson } from '@/types/lesson';

export const LESSON_05: Lesson = {
  id: 'lesson-05',
  moduleId: 'module-05',
  number: 5,
  title: 'Connecting Git with GitHub',
  subtitle: 'Linking Local Repositories to Remote Hosts, Managing Remotes, and Inspecting URLs',
  pdfSection: 6,
  estimatedMinutes: 14,
  steps: [
    {
      id: 'step-05-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand the role of remote repositories on hosting platforms like GitHub.',
            'Connect an existing local repository to GitHub using "git remote add origin <url>".',
            'Inspect configured remote names and URLs with "git remote -v".',
            'Understand the meaning of the standard remote nickname "origin".',
            'Recognize the distinction between configuring a remote and actually pushing code.'
          ]
        },
        {
          type: 'concept',
          title: 'What is a Remote in Git?',
          content: 'A remote is simply a bookmark or alias pointing to a repository hosted on the internet or local network. Rather than typing out the full HTTPS or SSH URL every time, Git assigns a friendly name—by convention, "origin".'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Local repository connected to GitHub remote via origin alias'
        }
      ]
    },
    {
      id: 'step-05-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Speed Dial on a Phone',
          metaphor: 'Typing a long URL like https://github.com/student/git-practice.git every time you want to sync is like dialing an international phone number digit-by-digit. Running "git remote add origin <url>" is like saving that number under the speed-dial contact name "origin". Now you can simply say "call origin" (git push origin main) to reach GitHub.',
          takeaway: 'Remotes are configuration shortcuts. Adding a remote does not upload code by itself.'
        }
      ]
    },
    {
      id: 'step-05-commands',
      title: 'Remote Management Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git remote add origin <url>',
          explanation: 'Links your local repository to a remote repository URL and assigns it the nickname "origin".',
          flags: [
            { flag: 'origin', description: 'The standard default alias for your primary remote repository.' },
            { flag: '<url>', description: 'The HTTPS repository clone URL provided by GitHub.' }
          ]
        },
        {
          type: 'command',
          command: 'git remote -v',
          explanation: 'Lists all registered remote nicknames alongside their full URLs for both fetch (download) and push (upload).'
        },
        {
          type: 'output',
          command: 'git remote -v',
          output: 'origin  https://github.com/student/git-practice.git (fetch)\norigin  https://github.com/student/git-practice.git (push)'
        },
        {
          type: 'pitfall',
          warning: 'Remote "origin" already exists error',
          consequence: 'Running "git remote add origin <url>" when origin is already defined throws: "error: remote origin already exists".',
          solution: 'Run "git remote -v" to check existing remotes, or use "git remote set-url origin <new-url>" to update the URL.'
        }
      ]
    },
    {
      id: 'step-05-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Confirm the purpose and behavior of remote aliases.'
        }
      ],
      knowledgeCheck: {
        id: 'q-05-origin-purpose',
        question: 'What does running "git remote add origin <url>" actually do?',
        options: [
          'It immediately uploads all local commits and branches to GitHub.',
          'It registers a friendly alias ("origin") pointing to the remote repository URL.',
          'It initializes a new empty repository on your computer.',
          'It downloads the repository files from GitHub to your desktop.'
        ],
        correctIndex: 1,
        explanation: 'Section 6 explains: "git remote add origin <url> simply creates a shorthand pointer named origin that maps to the target remote URL."'
      }
    },
    {
      id: 'step-05-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Remotes are pointers to remote copies of your repository on hosts like GitHub.',
            'Use "git remote add origin <url>" to create the connection alias.',
            'Use "git remote -v" to inspect configured fetch and push URLs.',
            'Adding a remote is a local configuration step; no commits are transferred until git push.'
          ]
        }
      ]
    }
  ]
};

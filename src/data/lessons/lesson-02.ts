import { Lesson } from '@/types/lesson';

export const LESSON_02: Lesson = {
  id: 'lesson-02',
  moduleId: 'module-02',
  number: 2,
  title: 'Git Installation & Configuration',
  subtitle: 'Setting Up Your Identity, Global Config, and Verification',
  pdfSection: 3,
  estimatedMinutes: 10,
  steps: [
    {
      id: 'step-02-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Learn how to configure your committer identity using user.name and user.email.',
            'Understand the difference between global configuration and repository-specific configuration.',
            'Inspect existing configuration values with git config --list.',
            'Avoid the common beginner mistake of using a fake email or omitting identity.'
          ]
        },
        {
          type: 'concept',
          title: 'Why Configure Git Identity?',
          content: 'Every single commit created in Git embeds the author name and email address into the commit snapshot forever. This provides accountability and enables team members and tools (like GitHub) to attribute code to the correct person.'
        }
      ]
    },
    {
      id: 'step-02-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Signature Stamp & Seal',
          metaphor: 'Whenever a notary public certifies an official document, they use a customized stamp showing their name, credentials, and contact email. Setting git config --global is creating your personal digital rubber stamp. Every time you seal a commit checkpoint, Git applies your signature stamp automatically.',
          takeaway: 'Without your configuration stamp, Git will warn you or refuse to let you sign commits.'
        }
      ]
    },
    {
      id: 'step-02-commands',
      title: 'Configuration Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git config --global user.name "Your Name"',
          explanation: 'Sets your default author name for all Git repositories on your current computer account.',
          flags: [
            { flag: '--global', description: 'Applies configuration to ~/.gitconfig across all repositories for your operating system user.' }
          ]
        },
        {
          type: 'command',
          command: 'git config --global user.email "you@example.com"',
          explanation: 'Sets the email address that will be tied to your commits and matched with your GitHub account.',
          flags: [
            { flag: '--global', description: 'Sets global user account default.' }
          ]
        },
        {
          type: 'command',
          command: 'git config --list',
          explanation: 'Prints all active configuration keys and values from system, global, and local repository scopes.',
          flags: [
            { flag: '--list', description: 'Lists all current configurations.' }
          ]
        },
        {
          type: 'output',
          command: 'git config --list',
          output: 'user.name=Jane Doe\nuser.email=jane@example.com\ncore.autocrlf=true\ninit.defaultBranch=main',
          note: 'The global configuration values appear in this output.'
        },
        {
          type: 'pitfall',
          warning: 'Omitting --global inside a folder that is not yet a repository',
          consequence: 'Running "git config user.name" outside a repository fails with "fatal: not in a git directory".',
          solution: 'Always pass --global for your primary identity so it works across every new project.'
        }
      ]
    },
    {
      id: 'step-02-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Answer the question below to confirm your configuration knowledge.'
        }
      ],
      knowledgeCheck: {
        id: 'q-02-global-vs-local',
        question: 'What is the effect of the --global flag in git config?',
        options: [
          'It publishes your email address to the public internet.',
          'It applies your settings across all repositories for your current user account.',
          'It requires you to be connected to the internet.',
          'It locks the repository against edits by other developers.'
        ],
        correctIndex: 1,
        explanation: 'As noted in Section 3: "The global settings apply to your user account across repositories. Without --global, settings can be repository-specific."'
      }
    },
    {
      id: 'step-02-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Configure your committer identity once using git config --global user.name and user.email.',
            'Use the same email address as your GitHub account so commits are attributed to your profile.',
            'Inspect settings anytime with git config --list.',
            'Without --global, settings are scoped exclusively to the current repository directory.'
          ]
        }
      ]
    }
  ]
};

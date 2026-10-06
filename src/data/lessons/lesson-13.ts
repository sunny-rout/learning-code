import { Lesson } from '@/types/lesson';

export const LESSON_13: Lesson = {
  id: 'lesson-13',
  moduleId: 'module-13',
  number: 13,
  title: 'Git Ignore & File Management',
  subtitle: 'Writing .gitignore Rules, Untracking Tracked Files, and Renaming with git mv',
  pdfSection: 11,
  estimatedMinutes: 14,
  steps: [
    {
      id: 'step-13-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand why sensitive files, dependencies, and build artifacts must be ignored.',
            'Write ordered rules in .gitignore with wildcards (*), directory prefixes, and negation (!).',
            'Learn rule evaluation: Git evaluates patterns top-to-bottom and the last matching rule wins.',
            'Untrack files already committed in Git history without deleting them from disk using "git rm --cached".',
            'Move and rename files safely in a single atomic step using "git mv".'
          ]
        },
        {
          type: 'concept',
          title: 'The Purpose of .gitignore',
          content: 'A .gitignore file tells Git which untracked files and folders to ignore completely. Ignored files will not appear in "git status" and will be skipped when executing "git add .".'
        },
        {
          type: 'diagram',
          variant: 'pipeline-4stage',
          caption: 'Filtering untracked files through .gitignore rules before the staging area'
        }
      ]
    },
    {
      id: 'step-13-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Mail Sorting Filter',
          metaphor: 'Imagine you run a mail room. You want letters and important packages filed in archival drawers. However, your office generates tons of scratch paper, junk flyers, and temporary receipts every day. Instead of manually inspecting every junk flyer, you post a sorting rule on the wall: "Trash all flyers and receipts automatically" (.gitignore). Your team never accidentally files junk into the permanent vault.',
          takeaway: 'A .gitignore file prevents clutter, credentials, and build binaries from polluting your version control history.'
        }
      ]
    },
    {
      id: 'step-13-syntax',
      title: '.gitignore Pattern Syntax & Precedence',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Ordered Pattern Evaluation',
          content: 'Git reads .gitignore line by line. When multiple rules match a single path, the last matching rule wins. This allows you to broadly ignore a pattern and carve out specific exceptions using negation (!).'
        },
        {
          type: 'command',
          command: '*.log\n!important.log\nnode_modules/\n.env',
          explanation: 'Ignores all .log files except important.log, ignores the entire node_modules directory, and ignores .env files.'
        },
        {
          type: 'pitfall',
          warning: 'Adding an already-tracked file to .gitignore',
          consequence: 'If a file has already been committed to the repository, adding its name to .gitignore has NO effect. Git continues to track changes to it.',
          solution: 'You must explicitly remove the file from Git index tracking using "git rm --cached <file>", then commit the removal.'
        }
      ]
    },
    {
      id: 'step-13-commands',
      title: 'File Management Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git rm --cached <file>',
          explanation: 'Removes the file from Git staging and tracking while keeping the actual file untouched in your working directory.'
        },
        {
          type: 'command',
          command: 'git mv <source> <destination>',
          explanation: 'Renames or moves a tracked file and automatically stages the deletion of the old path and creation of the new path.'
        }
      ]
    },
    {
      id: 'step-13-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Test Your Knowledge',
          content: 'Verify your understanding of untracking files and rule precedence.'
        }
      ],
      knowledgeCheck: {
        id: 'q-13-untrack-file',
        question: 'How do you stop tracking a sensitive config file without deleting it from your local disk?',
        options: [
          'git rm --cached config.env',
          'git rm -f config.env',
          'git restore config.env',
          'git clean -f config.env'
        ],
        correctIndex: 0,
        explanation: 'Section 11 explains: "git rm --cached removes a file from the repository tracking while preserving the actual file on your local disk."'
      }
    },
    {
      id: 'step-13-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            '.gitignore rules evaluate sequentially; the last matching rule takes precedence.',
            'Use "!" negation to whitelist specific files that match a broader wildcard pattern.',
            'Already tracked files must be untracked with "git rm --cached <file>".',
            'Use "git mv" to rename or relocate tracked files cleanly in a single staged step.'
          ]
        }
      ]
    }
  ]
};
export default LESSON_13;

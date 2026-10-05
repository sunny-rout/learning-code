import { Lesson } from '@/types/lesson';

export const LESSON_09: Lesson = {
  id: 'lesson-09',
  moduleId: 'module-09',
  number: 9,
  title: 'Merge Conflicts',
  subtitle: 'Understanding Competing Edits, Conflict Markers, and Resolution Workflow',
  pdfSection: 9,
  estimatedMinutes: 20,
  steps: [
    {
      id: 'step-09-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Understand why merge conflicts occur: competing changes to the exact same lines of a file.',
            'Read and decode standard Git conflict markers (<<<<<<< HEAD, =======, and >>>>>>> branch).',
            'Perform the 4-step manual resolution process: edit, remove markers, stage, and commit.',
            'Know how to safely abort a conflict with "git merge --abort".'
          ]
        },
        {
          type: 'concept',
          title: 'What is a Merge Conflict?',
          content: 'A conflict occurs when Git cannot automatically combine competing edits, often because two branches changed the exact same part of a file differently. A conflict is NOT an error or failure; it simply means Git requires human judgment to determine what the code should be.'
        }
      ]
    },
    {
      id: 'step-09-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Two Editors and One Paragraph',
          metaphor: 'Imagine a book manuscript. Editor A re-writes line 42 to say "The sunset was brilliant crimson." Editor B re-writes that exact same line 42 to say "The evening sky was a deep shade of violet." Git easily merges changes if Editor A touched Chapter 1 and Editor B touched Chapter 2. But when both change line 42, an automated program cannot guess which sentence is intended. The head editor (you) must read both, choose one (or blend them), and strike out the disagreement marks.',
          takeaway: 'Git does not guess when human intentions conflict. It leaves markers and asks you to decide.'
        }
      ]
    },
    {
      id: 'step-09-markers',
      title: 'Conflict Markers & Resolution Workflow',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'How Git Marks Conflicting Areas (Verbatim from Section 9)',
          content: 'When Git flags a conflict, it alters the file to show both versions surrounded by markers:\n\n```javascript\n<<<<<<< HEAD\nconst message = "Hello World";\n=======\nconst message = "Welcome to Git";\n>>>>>>> feature-login\n```\n\n• **<<<<<<< HEAD**: Marks the beginning of the version currently in your active branch.\n• **=======**: The dividing line separating the two competing edits.\n• **>>>>>>> feature-login**: Marks the end of the version coming from the branch being merged.'
        },
        {
          type: 'command',
          command: 'git status',
          explanation: 'Shows "both modified: filename.js" under Unmerged paths, identifying exactly which files have conflicts.'
        },
        {
          type: 'command',
          command: 'git add filename.js',
          explanation: 'After you edit the file and delete the marker lines (<<<<<<<, =======, >>>>>>>), running "git add" marks the conflict as resolved.'
        },
        {
          type: 'command',
          command: 'git commit -m "Resolve merge conflict"',
          explanation: 'Finalizes the merge and creates the merge commit checkpoint.'
        },
        {
          type: 'command',
          command: 'git merge --abort',
          explanation: 'Cancels the merge in progress and returns your files and branch to the exact state before "git merge" was executed.',
          flags: [
            { flag: '--abort', description: 'Safely resets the merge process back to pre-merge state.' }
          ]
        },
        {
          type: 'pitfall',
          warning: 'Leaving conflict markers (<<<<<<<, =======, >>>>>>>) inside your source code',
          consequence: 'Your code will fail to compile or throw runtime syntax errors.',
          solution: 'Always search for "<<<<<<" in your editor before committing to make sure all marker lines have been cleaned up.'
        }
      ]
    },
    {
      id: 'step-09-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Verify Your Understanding',
          content: 'Answer the question below regarding conflict markers.'
        }
      ],
      knowledgeCheck: {
        id: 'q-09-conflict-cancel',
        question: 'If you encounter a merge conflict and want to cancel the entire merge attempt without making changes, which command should you run?',
        options: [
          'git reset --hard origin/main',
          'git merge --abort',
          'git restore .',
          'git clean -f'
        ],
        correctIndex: 1,
        explanation: 'Section 9 advises: "To cancel an in-progress merge instead, use git merge --abort. A conflict is not necessarily a code error; Git needs a human decision."'
      }
    },
    {
      id: 'step-09-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Conflicts occur when competing edits target the exact same lines.',
            'Git inserts <<<<<<< HEAD, =======, and >>>>>>> branch markers.',
            'Resolve by editing the file, deleting the markers, running "git add", and committing.',
            'Cancel any stuck merge anytime using "git merge --abort".'
          ]
        }
      ]
    }
  ]
};

import { Lesson } from '@/types/lesson';

export const LESSON_14: Lesson = {
  id: 'lesson-14',
  moduleId: 'module-14',
  number: 14,
  title: 'Tags and Git Aliases',
  subtitle: 'Marking Release Milestones, Managing Annotated Tags, and Configuring Workflow Aliases',
  pdfSection: 11,
  estimatedMinutes: 12,
  steps: [
    {
      id: 'step-14-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Distinguish between lightweight tags and annotated tags.',
            'Create annotated tags for production release milestones (e.g. v1.0.0).',
            'Inspect tag metadata and commit snapshots using "git show <tag>".',
            'Publish tags to remote repositories using "git push origin --tags".',
            'Understand remote tag immutability: Git rejects attempts to overwrite existing remote tags.',
            'Create productivity shortcuts using Git aliases.'
          ]
        },
        {
          type: 'concept',
          title: 'What are Git Tags?',
          content: 'Tags are permanent, fixed milestone pointers to specific commits in Git history. Unlike branches—which advance automatically whenever a new commit is created—tags never move.'
        },
        {
          type: 'diagram',
          variant: 'commit-graph',
          caption: 'Fixed milestone tags marking release points along a branch DAG'
        }
      ]
    },
    {
      id: 'step-14-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'Sticky Bookmark vs Museum Plaque',
          metaphor: 'A lightweight tag is like a plain paper bookmark ("v1.0-alpha") placed in a book: it simply points to a page with no extra info. An annotated tag is an engraved brass museum plaque ("v1.0.0"): it records who installed it, the timestamp, an official description ("Release version 1.0.0"), and its permanent checksum.',
          takeaway: 'Use annotated tags ("git tag -a -m") for public releases and production milestones.'
        }
      ]
    },
    {
      id: 'step-14-commands',
      title: 'Tagging Commands',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git tag -a v1.0.0 -m "Release version 1.0.0"',
          explanation: 'Creates an annotated release tag pointing to the current HEAD commit with author metadata and a descriptive message.'
        },
        {
          type: 'command',
          command: 'git tag v1.0.0-beta',
          explanation: 'Creates a lightweight tag pointing directly to the current commit without storing tagger metadata.'
        },
        {
          type: 'command',
          command: 'git tag',
          explanation: 'Lists all tags in the repository in alphabetical order.'
        },
        {
          type: 'command',
          command: 'git show v1.0.0',
          explanation: 'Displays the tagger information, date, release message, and the full commit snapshot and diff.'
        },
        {
          type: 'command',
          command: 'git push origin --tags',
          explanation: 'Pushes all local tags to the remote repository. Ordinary "git push" does not transfer tags.'
        },
        {
          type: 'pitfall',
          warning: 'Remote Tag Collision Rejection',
          consequence: 'If a tag already exists on the remote pointing to a different commit, Git strictly rejects the push with "! [rejected] tag (already exists)".',
          solution: 'Tags are intended to be immutable release points. Never silently overwrite remote release tags.'
        }
      ]
    },
    {
      id: 'step-14-aliases',
      title: 'Configuring Git Aliases',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Workflow Speedups with Aliases',
          content: 'You can configure custom shortcuts for repetitive Git commands in your configuration file using "git config --global alias.<shortcut> <command>".'
        },
        {
          type: 'command',
          command: 'git config --global alias.st status\ngit config --global alias.co checkout\ngit config --global alias.br branch',
          explanation: 'Creates short aliases allowing you to run "git st" for status, "git co" for checkout, and "git br" for branch.'
        }
      ]
    },
    {
      id: 'step-14-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Test Your Knowledge',
          content: 'Verify your understanding of tag synchronization.'
        }
      ],
      knowledgeCheck: {
        id: 'q-14-push-tags',
        question: 'Does running a normal "git push origin main" push your local release tags to GitHub?',
        options: [
          'Yes, Git pushes all branches and tags automatically on every push',
          'No, Git push by default does not transfer tags; you must use "git push origin --tags" or specify the tag name',
          'Only lightweight tags are pushed automatically',
          'Tags are local-only and can never be pushed to a remote'
        ],
        correctIndex: 1,
        explanation: 'Section 11 explains: "git push does not automatically send tags to remote servers. You must explicitly push tags using git push origin <tag> or git push origin --tags."'
      }
    },
    {
      id: 'step-14-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Tags are immutable pointers to specific commits, ideal for version releases (e.g. v1.0.0).',
            'Annotated tags ("git tag -a -m") store author metadata, timestamp, and release notes.',
            'Inspect tags and unified commit diffs using "git show <tag>".',
            'Synchronize tags with GitHub using "git push origin --tags".',
            'Configure Git aliases to streamline your everyday command-line workflows.'
          ]
        }
      ]
    }
  ]
};
export default LESSON_14;

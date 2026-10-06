import { Lesson } from '@/types/lesson';

export const LESSON_16: Lesson = {
  id: 'lesson-16',
  moduleId: 'module-16',
  number: 16,
  title: 'Troubleshooting & Best Practices',
  subtitle: 'Diagnosing Common Errors, Avoiding Destructive Force Pushes, and History Safety Principles',
  pdfSection: 14,
  estimatedMinutes: 18,
  steps: [
    {
      id: 'step-16-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Diagnose non-fast-forward push rejection errors when the remote branch has moved ahead.',
            'Resolve diverged branch histories safely by pulling remote updates before attempting to push.',
            'Understand why force pushing (--force) is dangerous and destroys teammate work on shared remotes.',
            'Learn the Golden Rule of Rebasing conceptually: never rewrite history that has been shared publicly.',
            'Utilize Git diagnostic inspection tools (git status, git log) to assess repository health.'
          ]
        },
        {
          type: 'concept',
          title: 'Understanding Push Rejections',
          content: 'When Git outputs "! [rejected] (fetch first) - Updates were rejected because the remote contains work that you do not have locally", it is protecting your project. It prevents you from accidentally overwriting commits pushed by your teammates.'
        },
        {
          type: 'diagram',
          variant: 'branch-divergence',
          caption: 'Local and remote branches diverging after independent commits'
        }
      ]
    },
    {
      id: 'step-16-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Shared Ledger Book',
          metaphor: 'Imagine a physical accounting ledger kept in a central safe. While you were at your desk writing three new entries on a duplicate page, a colleague entered two new lines into the official book. If you walked up and glued your page directly over theirs, their entries would be obliterated (--force). Instead, you must read their new entries first, reconcile both sets of work ("git pull"), and then safely record the combined total.',
          takeaway: 'Git requires you to integrate existing remote changes before adding new commits.'
        }
      ]
    },
    {
      id: 'step-16-diagnostics',
      title: 'Diagnostic Commands & Safe Resolution',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'command',
          command: 'git status',
          explanation: 'Reveals whether your local branch is ahead, behind, or has diverged from its upstream tracking branch.'
        },
        {
          type: 'command',
          command: 'git log --oneline --graph -n 5',
          explanation: 'Visually shows the recent commit sequence and clarifies where your local HEAD sits relative to origin.'
        },
        {
          type: 'command',
          command: 'git pull origin main',
          explanation: 'Fetches the new remote commits and safely integrates them into your current local branch using standard merge.'
        },
        {
          type: 'pitfall',
          warning: 'Using "git push --force" on shared branches',
          consequence: 'Force pushing rewrites remote branch pointers, permanently erasing commits pushed by your collaborators and corrupting their history.',
          solution: 'Never use --force on shared branches (such as main or develop). Always fetch and integrate incoming changes before pushing.'
        }
      ]
    },
    {
      id: 'step-16-rebase-concept',
      title: 'Conceptual Understanding: Rebase & Its Golden Rule',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Conceptual Note: Merge vs Rebase',
          content: 'While "git merge" preserves the exact chronological history by creating a two-parent merge commit, "git rebase" replays your commits one-by-one on top of another branch to create a linear history. Rebasing creates completely new commit hashes for every replayed commit.'
        },
        {
          type: 'concept',
          title: 'The Golden Rule of Rebasing',
          content: 'THE GOLDEN RULE: Never rebase commits that exist outside your private repository and that other people have based work on.\n\nIf you rewrite shared commits that teammates have already cloned, their local branches will diverge catastrophically, forcing difficult manual recoveries.'
        }
      ]
    },
    {
      id: 'step-16-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Test Your Knowledge',
          content: 'Verify your understanding of push rejection handling and the Golden Rule of Rebasing.'
        }
      ],
      knowledgeCheck: {
        id: 'q-16-push-rejection',
        question: 'What is the correct, safe response when Git rejects your push because the remote has newer commits?',
        options: [
          'Run "git push --force" immediately to overwrite the remote',
          'Run "git pull" to fetch and integrate remote commits locally, resolve any conflicts, and then push',
          'Delete your entire local .git directory and start over',
          'Rename your local branch to main-fixed and push'
        ],
        correctIndex: 1,
        explanation: 'Section 14 instructs: When a push is rejected because the remote is ahead, pull and integrate the remote changes first, then push your combined work.'
      }
    },
    {
      id: 'step-16-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Non-fast-forward push rejections protect collaborative work from accidental loss.',
            'Resolve push rejections by pulling and integrating remote commits before pushing.',
            'Avoid "git push --force" on shared team branches.',
            'Remember the Golden Rule of Rebasing: never rewrite history that has been shared publicly.',
            'Rely on "git status" and "git log" as your primary diagnostic tools.'
          ]
        }
      ]
    }
  ]
};
export default LESSON_16;

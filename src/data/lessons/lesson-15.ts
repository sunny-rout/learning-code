import { Lesson } from '@/types/lesson';

export const LESSON_15: Lesson = {
  id: 'lesson-15',
  moduleId: 'module-15',
  number: 15,
  title: 'Complete Practical Workflow',
  subtitle: 'The Real-World 10-Step Feature Lifecycle: From Branch Creation to Pull Request, Merge, and Cleanup',
  pdfSection: 13,
  estimatedMinutes: 20,
  steps: [
    {
      id: 'step-15-objectives',
      title: 'Learning Objectives',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'objective',
          items: [
            'Master the standard 10-step development workflow used across professional engineering teams.',
            'Follow industry branch naming conventions (feature/*, bugfix/*, hotfix/*).',
            'Isolate all feature development away from the main production branch.',
            'Publish topic branches to GitHub with upstream tracking (-u).',
            'Perform safe post-merge repository cleanup by deleting merged feature branches.'
          ]
        },
        {
          type: 'concept',
          title: 'The Production Feature Lifecycle',
          content: 'Modern software development relies on feature branch isolation. You never commit experimental work directly to "main". Every enhancement or bug fix lives on its own branch until reviewed, verified, and merged.'
        },
        {
          type: 'diagram',
          variant: 'commit-graph',
          caption: 'Isolating feature commits and integrating them back into main'
        }
      ]
    },
    {
      id: 'step-15-analogy',
      title: 'The Real-World Analogy',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'analogy',
          title: 'The Chef’s Prep Station',
          metaphor: 'In a busy restaurant, chefs do not chop onions and raw meat directly on the customer buffet table ("main"). Instead, each cook has an isolated cutting board ("feature/salad", "feature/dessert"). They prepare the dish, taste-test it (code review / CI tests), and once it is perfected, plate it onto the main buffet table for customers.',
          takeaway: 'Branch isolation guarantees the main branch is always stable, deployable, and protected from broken code.'
        }
      ]
    },
    {
      id: 'step-15-steps',
      title: 'The 10-Step Standard Workflow',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Steps 1 through 5: Local Development',
          content: '1. Update main: "git switch main && git pull origin main"\n2. Create feature branch: "git switch -c feature/login"\n3. Write and test code changes\n4. Review workspace state: "git status" and "git diff"\n5. Stage changes: "git add <files>"'
        },
        {
          type: 'concept',
          title: 'Steps 6 through 10: Remote Collaboration & Cleanup',
          content: '6. Commit changes: "git commit -m \'Add login module\'"\n7. Push with upstream: "git push -u origin feature/login"\n8. Open a Pull Request on GitHub for team review\n9. Merge the PR on GitHub into the main branch\n10. Clean up locally: "git switch main", "git pull", and "git branch -d feature/login"'
        },
        {
          type: 'command',
          command: 'git branch -d feature/login',
          explanation: 'Safely deletes the local feature branch after its commits have been incorporated into main.'
        },
        {
          type: 'pitfall',
          warning: 'Leaving stale feature branches indefinitely',
          consequence: 'Repositories accumulate dozens of abandoned branches, confusing teammates about which features are active.',
          solution: 'Always delete feature branches immediately after they are merged into main.'
        }
      ]
    },
    {
      id: 'step-15-conventions',
      title: 'Branch Naming Best Practices',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Industry Prefix Conventions',
          content: 'Professional teams use standard branch prefixes to communicate intent:\n• feature/user-profile (new capability)\n• bugfix/login-null-pointer (fixing an existing bug)\n• hotfix/payment-gateway (urgent production patch)\n• docs/readme-setup (documentation improvements)'
        }
      ]
    },
    {
      id: 'step-15-check',
      title: 'Knowledge Check',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'concept',
          title: 'Test Your Knowledge',
          content: 'Verify your understanding of post-merge cleanup.'
        }
      ],
      knowledgeCheck: {
        id: 'q-15-branch-cleanup',
        question: 'What is the correct way to clean up after your feature branch has been successfully merged into main?',
        options: [
          'Switch back to main, pull the merge commit, and delete the feature branch with "git branch -d"',
          'Run "git reset --hard" on the feature branch',
          'Immediately delete the main branch',
          'Leave the feature branch active forever'
        ],
        correctIndex: 0,
        explanation: 'Section 13 outlines Step 10: Once a feature is merged, switch to main, pull updates from origin, and delete the local feature branch using "git branch -d <branch>".'
      }
    },
    {
      id: 'step-15-summary',
      title: 'Unit Summary',
      isRequiredForCompletion: true,
      blocks: [
        {
          type: 'summary',
          points: [
            'Always start features from an up-to-date main branch.',
            'Use standard branch prefixes (feature/*, bugfix/*) for clarity.',
            'Push feature branches with "-u" to establish upstream tracking.',
            'Collaborate and verify via Pull Requests before merging into production.',
            'Delete merged feature branches to keep the repository tidy and maintainable.'
          ]
        }
      ]
    }
  ]
};
export default LESSON_15;

import { Lesson } from '@/types/lesson';
import { LESSON_01 } from './lesson-01';
import { LESSON_02 } from './lesson-02';
import { LESSON_03 } from './lesson-03';
import { LESSON_04 } from './lesson-04';
import { LESSON_07 } from './lesson-07';
import { LESSON_09 } from './lesson-09';

export interface LessonMeta {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  subtitle: string;
  pdfSection: number;
  estimatedMinutes: number;
}

export const ALL_LESSON_METADATA: LessonMeta[] = [
  { id: 'lesson-01', moduleId: 'module-01', number: 1, title: 'Git Fundamentals', subtitle: 'Version Control Architecture, Distributed Systems, and Local History', pdfSection: 1, estimatedMinutes: 10 },
  { id: 'lesson-02', moduleId: 'module-02', number: 2, title: 'Git Installation & Configuration', subtitle: 'Global vs Local Config, Identity Setup, and System Defaults', pdfSection: 3, estimatedMinutes: 10 },
  { id: 'lesson-03', moduleId: 'module-03', number: 3, title: 'Creating Your First Repository', subtitle: 'Repository Initialization, .git Anatomy, and Working Tree States', pdfSection: 4, estimatedMinutes: 12 },
  { id: 'lesson-04', moduleId: 'module-04', number: 4, title: 'Staging and Committing', subtitle: 'The Three-Area Lifecycle, Diff Inspection, and Atomic Commits', pdfSection: 5, estimatedMinutes: 15 },
  { id: 'lesson-05', moduleId: 'module-05', number: 5, title: 'Connecting Git with GitHub', subtitle: 'Linking Local Repositories to Remote Hosts, Managing Remotes, and Inspecting URLs', pdfSection: 6, estimatedMinutes: 14 },
  { id: 'lesson-06', moduleId: 'module-06', number: 6, title: 'Cloning and Pushing', subtitle: 'Downloading Existing Repositories and Publishing Local Commits with Upstream Tracking', pdfSection: 6, estimatedMinutes: 16 },
  { id: 'lesson-07', moduleId: 'module-07', number: 7, title: 'Branching and Merging', subtitle: 'Isolating Feature Development, Switching Contexts, and Safe Branch Cleanup', pdfSection: 7, estimatedMinutes: 18 },
  { id: 'lesson-08', moduleId: 'module-08', number: 8, title: 'Fetching and Pulling', subtitle: 'Synchronizing with Remote Repositories, Remote-Tracking Branches, and Integration', pdfSection: 8, estimatedMinutes: 20 },
  { id: 'lesson-09', moduleId: 'module-09', number: 9, title: 'Resolving Merge Conflicts', subtitle: 'Dissecting Conflict Markers, Deciding Integration Paths, and Safe Abort Rules', pdfSection: 9, estimatedMinutes: 20 },
  { id: 'lesson-10', moduleId: 'module-10', number: 10, title: 'Comparing Changes', subtitle: 'Understanding Unified Diffs, Inspecting Workspaces, and Exploring Commit Details', pdfSection: 5, estimatedMinutes: 18 },
  { id: 'lesson-11', moduleId: 'module-11', number: 11, title: 'Undoing Changes Safely', subtitle: 'Mastering git restore, git revert, and git reset (--soft, --mixed, --hard)', pdfSection: 10, estimatedMinutes: 22 },
  { id: 'lesson-12', moduleId: 'module-12', number: 12, title: 'Stashing Changes', subtitle: 'Temporarily Shelving Work-in-Progress, Managing the Stash Stack, and Safe Restoration', pdfSection: 11, estimatedMinutes: 16 },
  { id: 'lesson-13', moduleId: 'module-13', number: 13, title: 'Git Ignore & File Management', subtitle: 'Writing .gitignore Rules, Untracking Tracked Files, and Renaming with git mv', pdfSection: 11, estimatedMinutes: 14 },
  { id: 'lesson-14', moduleId: 'module-14', number: 14, title: 'Tags and Git Aliases', subtitle: 'Marking Release Milestones, Managing Annotated Tags, and Configuring Workflow Aliases', pdfSection: 11, estimatedMinutes: 12 },
  { id: 'lesson-15', moduleId: 'module-15', number: 15, title: 'Complete Practical Workflow', subtitle: 'The Real-World 10-Step Feature Lifecycle: From Branch Creation to Pull Request, Merge, and Cleanup', pdfSection: 13, estimatedMinutes: 20 },
  { id: 'lesson-16', moduleId: 'module-16', number: 16, title: 'Troubleshooting & Best Practices', subtitle: 'Diagnosing Common Errors, Avoiding Destructive Force Pushes, and History Safety Principles', pdfSection: 14, estimatedMinutes: 18 },
  { id: 'lesson-17', moduleId: 'module-17', number: 17, title: 'Advanced Concepts: Reflog & Clean', subtitle: 'Recovering Lost Commits with git reflog and Safely Pruning Workspaces with git clean', pdfSection: 12, estimatedMinutes: 20 },
];

export const FOUNDATIONAL_LESSONS: Lesson[] = [
  LESSON_01,
  LESSON_02,
  LESSON_03,
  LESSON_04,
  LESSON_07,
  LESSON_09,
];

const STATIC_LESSONS_BY_ID: Record<string, Lesson> = {
  'lesson-01': LESSON_01,
  'lesson-02': LESSON_02,
  'lesson-03': LESSON_03,
  'lesson-04': LESSON_04,
  'lesson-07': LESSON_07,
  'lesson-09': LESSON_09,
};

const STATIC_LESSONS_BY_MODULE_ID: Record<string, Lesson> = {
  'module-01': LESSON_01,
  'module-02': LESSON_02,
  'module-03': LESSON_03,
  'module-04': LESSON_04,
  'module-07': LESSON_07,
  'module-09': LESSON_09,
};

// Dynamic loaders for Phase 5 & 6 lessons (Modules 05, 06, 08, 10, 11, 12, 13, 14, 15, 16, 17)
export const DYNAMIC_LESSONS: Record<string, () => Promise<{ [key: string]: any }>> = {
  'lesson-05': () => import('./lesson-05'),
  'lesson-06': () => import('./lesson-06'),
  'lesson-08': () => import('./lesson-08'),
  'lesson-10': () => import('./lesson-10'),
  'lesson-11': () => import('./lesson-11'),
  'lesson-12': () => import('./lesson-12'),
  'lesson-13': () => import('./lesson-13'),
  'lesson-14': () => import('./lesson-14'),
  'lesson-15': () => import('./lesson-15'),
  'lesson-16': () => import('./lesson-16'),
  'lesson-17': () => import('./lesson-17'),
};

const DYNAMIC_CACHE: Record<string, Lesson> = {};

export function getLessonMetadata(lessonId: string): LessonMeta | undefined {
  return ALL_LESSON_METADATA.find((m) => m.id === lessonId);
}

export function getLessonMetadataForModule(moduleId: string): LessonMeta | undefined {
  return ALL_LESSON_METADATA.find((m) => m.moduleId === moduleId);
}

export function isLessonAvailable(lessonId: string): boolean {
  return Boolean(STATIC_LESSONS_BY_ID[lessonId] || DYNAMIC_LESSONS[lessonId] || DYNAMIC_CACHE[lessonId]);
}

export function isModuleLessonAvailable(moduleId: string): boolean {
  return ALL_LESSON_METADATA.some((m) => m.moduleId === moduleId);
}

export function getLessonForModule(moduleId: string): Lesson | undefined {
  if (STATIC_LESSONS_BY_MODULE_ID[moduleId]) {
    return STATIC_LESSONS_BY_MODULE_ID[moduleId];
  }
  const meta = getLessonMetadataForModule(moduleId);
  if (meta && DYNAMIC_CACHE[meta.id]) {
    return DYNAMIC_CACHE[meta.id];
  }
  return undefined;
}

export function getLessonById(lessonId: string): Lesson | undefined {
  if (STATIC_LESSONS_BY_ID[lessonId]) {
    return STATIC_LESSONS_BY_ID[lessonId];
  }
  if (DYNAMIC_CACHE[lessonId]) {
    return DYNAMIC_CACHE[lessonId];
  }
  return undefined;
}

export async function loadLesson(lessonId: string): Promise<Lesson | undefined> {
  const sync = getLessonById(lessonId);
  if (sync) return sync;

  const loader = DYNAMIC_LESSONS[lessonId];
  if (!loader) return undefined;

  const mod = await loader();
  // Find exported Lesson object
  const key = Object.keys(mod).find((k) => k.startsWith('LESSON_'));
  const lesson: Lesson | undefined = key ? mod[key] : mod.default;

  if (lesson) {
    DYNAMIC_CACHE[lessonId] = lesson;
    DYNAMIC_CACHE[lesson.moduleId] = lesson;
    return lesson;
  }
  return undefined;
}

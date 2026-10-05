import { Lesson } from '@/types/lesson';
import { LESSON_01 } from './lesson-01';
import { LESSON_02 } from './lesson-02';
import { LESSON_03 } from './lesson-03';
import { LESSON_04 } from './lesson-04';
import { LESSON_07 } from './lesson-07';
import { LESSON_09 } from './lesson-09';

export const FOUNDATIONAL_LESSONS: Lesson[] = [
  LESSON_01,
  LESSON_02,
  LESSON_03,
  LESSON_04,
  LESSON_07,
  LESSON_09,
];

export const LESSONS_BY_ID: Record<string, Lesson> = {
  'lesson-01': LESSON_01,
  'lesson-02': LESSON_02,
  'lesson-03': LESSON_03,
  'lesson-04': LESSON_04,
  'lesson-07': LESSON_07,
  'lesson-09': LESSON_09,
};

export const LESSONS_BY_MODULE_ID: Record<string, Lesson> = {
  'module-01': LESSON_01,
  'module-02': LESSON_02,
  'module-03': LESSON_03,
  'module-04': LESSON_04,
  'module-07': LESSON_07,
  'module-09': LESSON_09,
};

export function getLessonForModule(moduleId: string): Lesson | undefined {
  return LESSONS_BY_MODULE_ID[moduleId];
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return LESSONS_BY_ID[lessonId];
}

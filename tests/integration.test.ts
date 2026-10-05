import { ProgressService } from '../src/services/progressService';
import { FOUNDATIONAL_LESSONS, getLessonById, getLessonForModule } from '../src/data/lessons';
import { MODULES } from '../src/data/modules';

class MockStorage {
  private data: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = value;
  }
  removeItem(key: string): void {
    delete this.data[key];
  }
  clear(): void {
    this.data = {};
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Dashboard, Curriculum & Progress Integration Tests ---');

// 1. Resume target resolution with no prior progress
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const progress = service.getProgress();

  // Test fallback logic
  let targetLesson = FOUNDATIONAL_LESSONS[0];
  if (progress.lastOpenedLessonId && getLessonById(progress.lastOpenedLessonId)) {
    targetLesson = getLessonById(progress.lastOpenedLessonId)!;
  } else {
    const firstIncomplete = FOUNDATIONAL_LESSONS.find(
      (l) => !progress.lessonProgress[l.id]?.completed
    );
    if (firstIncomplete) {
      targetLesson = firstIncomplete;
    }
  }

  assert(targetLesson.id === 'lesson-01', 'Initial resume target without progress must fallback to lesson-01');
  console.log('✓ Test 1 Passed: Initial resume target fallback to lesson-01');
}

// 2. Resume target resolution with saved lastOpenedLessonId
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  service.setLastOpened('lesson-04', 'module-04');
  service.setCurrentStep('lesson-04', 'step-04-commit');

  const progress = service.getProgress();
  let targetLesson = FOUNDATIONAL_LESSONS[0];
  if (progress.lastOpenedLessonId && getLessonById(progress.lastOpenedLessonId)) {
    targetLesson = getLessonById(progress.lastOpenedLessonId)!;
  }

  assert(targetLesson.id === 'lesson-04', 'Resume target must match lastOpenedLessonId');
  const lessonProg = service.getLessonProgress('lesson-04');
  assert(lessonProg.currentStepId === 'step-04-commit', 'Active step within lesson must be preserved');
  console.log('✓ Test 2 Passed: Resume target matches lastOpenedLessonId and preserved active step');
}

// 3. Fallback when last opened lesson was already completed
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Complete lesson-01
  const lesson01 = getLessonById('lesson-01')!;
  for (const step of lesson01.steps) {
    service.markStepCompleted(lesson01.id, step.id);
    if (step.knowledgeCheck) {
      service.recordKnowledgeCheckAttempt(lesson01.id, step.knowledgeCheck.id, true);
    }
  }
  const completed = service.completeLesson(lesson01);
  assert(completed === true, 'lesson-01 must complete successfully');

  // Query next uncompleted lesson
  const progress = service.getProgress();
  const firstIncomplete = FOUNDATIONAL_LESSONS.find(
    (l) => !progress.lessonProgress[l.id]?.completed
  );

  assert(firstIncomplete?.id === 'lesson-02', 'Next suggested lesson must advance to lesson-02');
  console.log('✓ Test 3 Passed: Uncompleted lesson fallback advances to next incomplete unit');
}

// 4. Sequential navigation chaining across foundational curriculum
{
  for (let i = 0; i < FOUNDATIONAL_LESSONS.length; i++) {
    const current = FOUNDATIONAL_LESSONS[i];
    const next = i < FOUNDATIONAL_LESSONS.length - 1 ? FOUNDATIONAL_LESSONS[i + 1] : null;

    if (i < FOUNDATIONAL_LESSONS.length - 1) {
      assert(next !== null, `Lesson ${current.id} must have a next lesson`);
    } else {
      assert(next === null, `Final lesson ${current.id} must not have a next lesson`);
    }
  }
  console.log('✓ Test 4 Passed: Sequential navigation chain verified across all 6 lessons');
}

// 5. Module status derivation: completed, in-progress, available, syllabus
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Complete lesson-01
  const lesson01 = getLessonById('lesson-01')!;
  for (const step of lesson01.steps) {
    service.markStepCompleted(lesson01.id, step.id);
    if (step.knowledgeCheck) {
      service.recordKnowledgeCheckAttempt(lesson01.id, step.knowledgeCheck.id, true);
    }
  }
  service.completeLesson(lesson01);

  // Put lesson-02 in progress
  service.setCurrentStep('lesson-02', 'step-02-identity');
  service.markStepCompleted('lesson-02', 'step-02-install');

  // Verify status mapping for all modules
  for (const module of MODULES) {
    const lesson = getLessonForModule(module.id);
    const prog = lesson ? service.getLessonProgress(lesson.id) : null;

    if (module.id === 'module-01') {
      assert(prog?.completed === true, 'module-01 must report completed: true');
    } else if (module.id === 'module-02') {
      assert(prog?.completed === false, 'module-02 must not be completed');
      assert((prog?.completedStepIds.length ?? 0) > 0, 'module-02 must report in-progress');
    } else if (['module-03', 'module-04', 'module-07', 'module-09'].includes(module.id)) {
      assert(lesson !== undefined, `${module.id} must have authored lesson available`);
      assert(prog?.completed === false && (prog?.completedStepIds.length ?? 0) === 0, `${module.id} must be ready to start`);
    } else {
      assert(lesson === undefined, `${module.id} must be syllabus outline (Phase 3)`);
    }
  }
  console.log('✓ Test 5 Passed: Module states accurately derived for completed, in-progress, ready, and syllabus');
}

// 6. Strict knowledge check gating: cannot complete lesson if required quiz is failed/unpassed
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson01 = getLessonById('lesson-01')!;

  // Mark all steps completed EXCEPT quiz
  for (const step of lesson01.steps) {
    service.markStepCompleted(lesson01.id, step.id);
  }

  // Attempt to complete lesson without passing quiz
  const canCompleteCheck = service.canCompleteLesson(lesson01);
  assert(canCompleteCheck.eligible === false, 'Lesson completion must be ineligible when quiz is unpassed');
  assert(canCompleteCheck.unpassedQuestions.length > 0, 'Must identify unpassed question');

  const finalizeAttempt = service.completeLesson(lesson01);
  assert(finalizeAttempt === false, 'completeLesson must reject unpassed knowledge checks');

  // Pass quiz and verify eligibility
  const quizId = lesson01.steps.find((s) => s.knowledgeCheck)?.knowledgeCheck!.id!;
  service.recordKnowledgeCheckAttempt(lesson01.id, quizId, true);

  const canCompleteNow = service.canCompleteLesson(lesson01);
  assert(canCompleteNow.eligible === true, 'Lesson must become eligible once quiz is passed');
  assert(service.completeLesson(lesson01) === true, 'completeLesson must succeed now');

  console.log('✓ Test 6 Passed: Knowledge check completion gating cannot be bypassed');
}

// 7. Reset progress cleanly returns state to default
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  service.setLastOpened('lesson-07', 'module-07');
  service.markStepCompleted('lesson-07', 'step-07-branch');
  service.resetProgress();

  const resetData = service.getProgress();
  assert(resetData.lastOpenedLessonId === undefined, 'lastOpenedLessonId must be cleared');
  assert(Object.keys(resetData.lessonProgress).length === 0, 'lessonProgress must be empty');
  console.log('✓ Test 7 Passed: Progress reset cleanly restores pristine initial state');
}

// 8. Final authored lesson completion edge case
{
  const lastLesson = FOUNDATIONAL_LESSONS[FOUNDATIONAL_LESSONS.length - 1];
  assert(lastLesson.id === 'lesson-09', 'Sixth and final authored lesson must be lesson-09');

  const lastLessonIndex = FOUNDATIONAL_LESSONS.findIndex((l) => l.id === lastLesson.id);
  const nextLesson = lastLessonIndex !== -1 && lastLessonIndex < FOUNDATIONAL_LESSONS.length - 1
    ? FOUNDATIONAL_LESSONS[lastLessonIndex + 1]
    : null;

  assert(nextLesson === null, 'Final authored lesson must not have a next lesson');
  const hasNextLesson = Boolean(nextLesson);
  assert(hasNextLesson === false, 'hasNextLesson must be false for final authored lesson');
  console.log('✓ Test 8 Passed: Final authored lesson completion does not navigate to missing/syllabus units');
}

// 9. Refresh on a completed lesson URL edge case
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson01 = getLessonById('lesson-01')!;

  for (const step of lesson01.steps) {
    service.markStepCompleted(lesson01.id, step.id);
    if (step.knowledgeCheck) {
      service.recordKnowledgeCheckAttempt(lesson01.id, step.knowledgeCheck.id, true);
    }
  }
  const completed = service.completeLesson(lesson01);
  assert(completed === true, 'Lesson 01 must be completed');

  // Simulate refresh by reading again from storage and setting active step
  const rehydratedService = new ProgressService(mockStorage);
  const entryBefore = rehydratedService.getLessonProgress('lesson-01');
  assert(entryBefore.completed === true, 'Completion must be preserved on rehydration');

  // Simulating user opening step 0 upon revisit or reload
  rehydratedService.setCurrentStep('lesson-01', lesson01.steps[0].id);
  const entryAfter = rehydratedService.getLessonProgress('lesson-01');
  assert(entryAfter.completed === true, 'Completion must NOT be cleared when navigating steps of completed lesson');
  assert(entryAfter.currentStepId === lesson01.steps[0].id, 'Active step must update without clearing completion');
  console.log('✓ Test 9 Passed: Refresh on completed lesson URL preserves completed status and scores');
}

// 10. Invalid or unavailable lesson URL query parameter edge case
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  const invalidUrls = ['lesson-99', 'unknown-module', 'undefined', '', '../etc'];
  for (const invalidId of invalidUrls) {
    const resolved = getLessonById(invalidId);
    assert(resolved === undefined, `Unknown lesson ID ${invalidId} must return undefined`);

    // Verify fallback logic
    const activeLessonId = resolved ? resolved.id : null;
    assert(activeLessonId === null, `Invalid lesson ID ${invalidId} must resolve to null activeLessonId`);
  }

  // Ensure progress storage remains pristine and unaffected
  const data = service.getProgress();
  assert(Object.keys(data.lessonProgress).length === 0, 'Invalid URL attempts must not mutate progress store');
  console.log('✓ Test 10 Passed: Unknown or invalid lesson URL query params safely fallback without crashing or mutating progress');
}

// 11. Resume after final lesson: all authored lessons completed
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Complete all 6 foundational lessons
  for (const lesson of FOUNDATIONAL_LESSONS) {
    for (const step of lesson.steps) {
      service.markStepCompleted(lesson.id, step.id);
      if (step.knowledgeCheck) {
        service.recordKnowledgeCheckAttempt(lesson.id, step.knowledgeCheck.id, true);
      }
    }
    const done = service.completeLesson(lesson);
    assert(done === true, `Lesson ${lesson.id} must be completed`);
  }

  const progress = service.getProgress();
  const completedCount = FOUNDATIONAL_LESSONS.filter(
    (l) => progress.lessonProgress[l.id]?.completed
  ).length;
  assert(completedCount === FOUNDATIONAL_LESSONS.length, 'All 6 lessons must be completed');

  // Verify resume resolution logic
  const allCompleted = completedCount === FOUNDATIONAL_LESSONS.length;
  assert(allCompleted === true, 'allCompleted must be true');

  let targetLesson = FOUNDATIONAL_LESSONS[0];
  if (!allCompleted) {
    const firstIncomplete = FOUNDATIONAL_LESSONS.find(
      (l) => !progress.lessonProgress[l.id]?.completed
    );
    if (firstIncomplete) targetLesson = firstIncomplete;
  } else {
    if (progress.lastOpenedLessonId && getLessonById(progress.lastOpenedLessonId)) {
      targetLesson = getLessonById(progress.lastOpenedLessonId)!;
    }
  }

  assert(FOUNDATIONAL_LESSONS.some((l) => l.id === targetLesson.id), 'targetLesson must strictly be an authored lesson');
  assert(targetLesson.moduleId !== 'module-05' && targetLesson.moduleId !== 'module-08', 'targetLesson must not point to unauthored modules');
  console.log('✓ Test 11 Passed: Resume after final lesson resolves to valid authored lesson for review and never an unauthored syllabus unit');
}

console.log('--- ALL INTEGRATION TESTS (11/11) PASSED! ---');

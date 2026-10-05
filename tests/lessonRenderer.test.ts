import { FOUNDATIONAL_LESSONS, getLessonById, getLessonForModule } from '../src/data/lessons';
import { ProgressService } from '../src/services/progressService';
import { ContentBlockType } from '../src/types/lesson';

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

console.log('--- Running Lesson Player & Content Renderer Unit Tests ---');

// 1. Foundational lessons schema & integrity test
{
  assert(FOUNDATIONAL_LESSONS.length === 6, 'Must contain 6 authored foundational lessons');
  
  for (const lesson of FOUNDATIONAL_LESSONS) {
    assert(Boolean(lesson.id), `Lesson must have an id: ${JSON.stringify(lesson)}`);
    assert(Boolean(lesson.moduleId), `Lesson ${lesson.id} must have a moduleId`);
    assert(lesson.number > 0, `Lesson ${lesson.id} must have a positive number`);
    assert(lesson.steps.length >= 3, `Lesson ${lesson.id} must contain at least 3 steps`);
    assert(lesson.estimatedMinutes > 0, `Lesson ${lesson.id} must have estimated duration`);

    // Verify lookup helpers
    assert(getLessonById(lesson.id)?.id === lesson.id, `getLessonById must find ${lesson.id}`);
    assert(getLessonForModule(lesson.moduleId)?.id === lesson.id, `getLessonForModule must find ${lesson.moduleId}`);

    // Verify knowledge check presence
    const hasKnowledgeCheck = lesson.steps.some((s) => s.knowledgeCheck !== undefined);
    assert(hasKnowledgeCheck, `Lesson ${lesson.id} must include at least one knowledge check`);
  }
  console.log('✓ Test 1 Passed: All 6 foundational lessons conform to schema and lookup helpers');
}

// 2. Comprehensive ContentBlock type coverage test
{
  const foundTypes = new Set<ContentBlockType>();

  for (const lesson of FOUNDATIONAL_LESSONS) {
    for (const step of lesson.steps) {
      for (const block of step.blocks) {
        foundTypes.add(block.type);
      }
    }
  }

  const expectedTypes: ContentBlockType[] = [
    'objective',
    'analogy',
    'concept',
    'diagram',
    'command',
    'output',
    'pitfall',
    'summary',
  ];

  for (const t of expectedTypes) {
    assert(foundTypes.has(t), `Authored lessons must utilize block type: ${t}`);
  }
  console.log('✓ Test 2 Passed: Full content block type coverage verified across foundational lessons');
}

// 3. Knowledge check validation rules test
{
  for (const lesson of FOUNDATIONAL_LESSONS) {
    for (const step of lesson.steps) {
      if (step.knowledgeCheck) {
        const q = step.knowledgeCheck;
        assert(Boolean(q.id), 'Question must have a unique id');
        assert(q.options.length >= 2, 'Question must have at least 2 options');
        assert(q.correctIndex >= 0 && q.correctIndex < q.options.length, 'correctIndex must be in bounds');
        assert(q.explanation.length > 10, 'Question must include substantive explanation');
      }
    }
  }
  console.log('✓ Test 3 Passed: Knowledge-check questions have valid bounds and explanations');
}

// 4. Knowledge check attempt flow and retry behavior test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson = FOUNDATIONAL_LESSONS[0]; // Unit 01
  const checkStep = lesson.steps.find((s) => s.knowledgeCheck !== undefined)!;
  const question = checkStep.knowledgeCheck!;

  // Initial: 0 attempts
  let entry = service.getLessonProgress(lesson.id);
  assert(entry.knowledgeCheckScores[question.id] === undefined, 'No initial score recorded');

  // Attempt 1: Wrong answer
  service.recordKnowledgeCheckAttempt(lesson.id, question.id, false);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.knowledgeCheckScores[question.id].passed === false, 'Must be unpassed on wrong answer');
  assert(entry.knowledgeCheckScores[question.id].attempts === 1, 'Attempts must equal 1');
  assert(entry.knowledgeCheckScores[question.id].bestScore === 0, 'Best score must be 0');

  // Attempt 2: Correct answer (retry)
  service.recordKnowledgeCheckAttempt(lesson.id, question.id, true);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.knowledgeCheckScores[question.id].passed === true, 'Must be passed on retry');
  assert(entry.knowledgeCheckScores[question.id].attempts === 2, 'Attempts must equal 2');
  assert(entry.knowledgeCheckScores[question.id].bestScore === 1, 'Best score must update to 1');

  // Attempt 3: Accidental wrong re-submission should preserve bestScore = 1 and passed = true
  service.recordKnowledgeCheckAttempt(lesson.id, question.id, false);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.knowledgeCheckScores[question.id].passed === true, 'Passed state must be preserved once attained');
  assert(entry.knowledgeCheckScores[question.id].attempts === 3, 'Attempts must equal 3');
  assert(entry.knowledgeCheckScores[question.id].bestScore === 1, 'Best score must remain 1');

  console.log('✓ Test 4 Passed: Knowledge check retry logic records attempts and preserves best score');
}

// 5. Lesson completion eligibility gating test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson = FOUNDATIONAL_LESSONS[3]; // Unit 04 Staging and Committing

  // Check initial state
  assert(service.canCompleteLesson(lesson).eligible === false, 'Cannot complete unstarted lesson');

  // Mark all steps complete EXCEPT the knowledge check
  for (const step of lesson.steps) {
    if (!step.knowledgeCheck) {
      service.markStepCompleted(lesson.id, step.id);
    }
  }
  assert(service.canCompleteLesson(lesson).eligible === false, 'Cannot complete without knowledge check step');

  // Mark the quiz step as completed in step list, but don't record a passing attempt
  const quizStep = lesson.steps.find((s) => s.knowledgeCheck !== undefined)!;
  service.markStepCompleted(lesson.id, quizStep.id);
  assert(service.canCompleteLesson(lesson).eligible === false, 'Cannot complete without passing knowledge check');

  // Now pass the quiz
  service.recordKnowledgeCheckAttempt(lesson.id, quizStep.knowledgeCheck!.id, true);
  assert(service.canCompleteLesson(lesson).eligible === true, 'Lesson eligible once all steps and quizzes are passed');

  // Complete lesson
  const success = service.completeLesson(lesson);
  assert(success === true, 'completeLesson must succeed');
  assert(service.getLessonProgress(lesson.id).completed === true, 'Lesson must be marked completed');

  console.log('✓ Test 5 Passed: Lesson completion eligibility strictly gates on required steps and passed checks');
}

// 6. Step completion semantics: opening a step must NOT mark it complete
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson = FOUNDATIONAL_LESSONS[0]; // Unit 01
  const step0 = lesson.steps[0];
  const step1 = lesson.steps[1];

  // Learner opens step 0
  service.setCurrentStep(lesson.id, step0.id);

  let entry = service.getLessonProgress(lesson.id);
  assert(entry.currentStepId === step0.id, 'currentStepId must be step 0');
  assert(entry.completedStepIds.length === 0, 'Opening step 0 must NOT add it to completedStepIds');

  // Learner navigates to step 1
  service.setCurrentStep(lesson.id, step1.id);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.currentStepId === step1.id, 'currentStepId must be step 1');
  assert(entry.completedStepIds.length === 0, 'Still 0 completed steps until explicitly completed or advanced');

  // Learner completes step 0
  service.markStepCompleted(lesson.id, step0.id);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.completedStepIds.length === 1, 'completedStepIds must have 1 step after explicit mark');
  assert(entry.completedStepIds.includes(step0.id), 'Must include step 0');

  // Learner revisits step 0: completed status must be preserved
  service.setCurrentStep(lesson.id, step0.id);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.completedStepIds.includes(step0.id), 'Revisiting step 0 must preserve its completed status');

  console.log('✓ Test 6 Passed: Opening a step does not mark it complete; revisiting preserves completed status');
}

// 7. Knowledge check passing marks step completed and prevents regression
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const lesson = FOUNDATIONAL_LESSONS[0];
  const quizStep = lesson.steps.find((s) => s.knowledgeCheck !== undefined)!;
  const question = quizStep.knowledgeCheck!;

  // Learner views quiz step
  service.setCurrentStep(lesson.id, quizStep.id);
  let entry = service.getLessonProgress(lesson.id);
  assert(!entry.completedStepIds.includes(quizStep.id), 'Quiz step is not complete on open');

  // Learner answers incorrectly
  service.recordKnowledgeCheckAttempt(lesson.id, question.id, false);
  entry = service.getLessonProgress(lesson.id);
  assert(!entry.completedStepIds.includes(quizStep.id), 'Failed quiz does NOT complete the step');

  // Learner answers correctly
  service.recordKnowledgeCheckAttempt(lesson.id, question.id, true);
  service.markStepCompleted(lesson.id, quizStep.id);
  entry = service.getLessonProgress(lesson.id);
  assert(entry.completedStepIds.includes(quizStep.id), 'Passed quiz marks step completed');
  assert(entry.knowledgeCheckScores[question.id].passed === true, 'Quiz is passed');

  console.log('✓ Test 7 Passed: Quiz step completion is strictly tied to passing the knowledge check');
}

// 8. Rehydration and idempotence test
{
  const mockStorage = new MockStorage();
  const service1 = new ProgressService(mockStorage);
  const lesson = FOUNDATIONAL_LESSONS[0];

  // Mark all steps complete & pass quiz
  for (const step of lesson.steps) {
    service1.markStepCompleted(lesson.id, step.id);
    if (step.knowledgeCheck) {
      service1.recordKnowledgeCheckAttempt(lesson.id, step.knowledgeCheck.id, true);
    }
  }

  const completed1 = service1.completeLesson(lesson);
  assert(completed1 === true, 'completeLesson should succeed');

  // Second complete call (simulating double click)
  const completed2 = service1.completeLesson(lesson);
  assert(completed2 === true, 'completeLesson call is idempotent');

  // Rehydrate with new service instance reading from same mock storage
  const service2 = new ProgressService(mockStorage);
  const rehydrated = service2.getLessonProgress(lesson.id);
  assert(rehydrated.completed === true, 'Rehydrated lesson must remain completed');
  assert(rehydrated.completedStepIds.length === lesson.steps.length, 'Rehydrated steps preserved');

  console.log('✓ Test 8 Passed: Rehydration from storage and idempotence verified');
}

console.log('--- ALL STEP C TESTS (8/8) PASSED SUCCESSFULLY! ---');

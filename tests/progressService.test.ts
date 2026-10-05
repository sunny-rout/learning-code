import { 
  ProgressService, 
  PROGRESS_STORAGE_KEY, 
  CURRENT_SCHEMA_VERSION, 
  isValidProgressData, 
  createDefaultProgress 
} from '../src/services/progressService';
import { LESSON_01 } from '../src/data/lessons/lesson-01';
import { UserProgressData } from '../src/types/progress';

class MockStorage {
  private data: Record<string, string> = {};
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) throw new Error('Storage disabled / quota exceeded');
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) throw new Error('Storage write failed');
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

console.log('--- Running ProgressService Unit Tests ---');

// 1. Default progress state test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);
  const data = service.getProgress();

  assert(data.schemaVersion === CURRENT_SCHEMA_VERSION, 'Default schemaVersion must equal 1');
  assert(Object.keys(data.lessonProgress).length === 0, 'Initial lessonProgress must be empty');
  assert(data.activityDates.length === 0, 'Initial activityDates must be empty');
  console.log('✓ Test 1 Passed: Default progress state initialized correctly');
}

// 2. Corrupt storage recovery test
{
  const mockStorage = new MockStorage();
  mockStorage.setItem(PROGRESS_STORAGE_KEY, '{ malformed json: true, ...');
  const service = new ProgressService(mockStorage);
  const data = service.getProgress();

  assert(data.schemaVersion === CURRENT_SCHEMA_VERSION, 'Corrupt JSON must safely fallback to default schema');
  assert(Object.keys(data.lessonProgress).length === 0, 'Corrupt JSON fallback has empty lessons');
  console.log('✓ Test 2 Passed: Corrupt storage string handled gracefully without crash');
}

// 3. Invalid schema version recovery test
{
  const mockStorage = new MockStorage();
  mockStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({ schemaVersion: 999, lessonProgress: {}, activityDates: [] })
  );
  const service = new ProgressService(mockStorage);
  const data = service.getProgress();

  assert(data.schemaVersion === CURRENT_SCHEMA_VERSION, 'Outdated/future schemaVersion must fallback to default');
  console.log('✓ Test 3 Passed: Invalid schema version rejected and reset to default');
}

// 4. Unavailable storage exception handling test
{
  const mockStorage = new MockStorage();
  mockStorage.shouldThrowOnGet = true;
  const service = new ProgressService(mockStorage);
  const data = service.getProgress();

  assert(data.schemaVersion === CURRENT_SCHEMA_VERSION, 'Storage exceptions must return default progress');
  console.log('✓ Test 4 Passed: Unavailable storage exception caught safely');
}

// 5. Schema validator function test
{
  const validData: UserProgressData = {
    schemaVersion: 1,
    lessonProgress: {
      'lesson-01': {
        completed: false,
        completedStepIds: ['step-01-objectives'],
        knowledgeCheckScores: {
          'q-01-git-vs-github': {
            passed: true,
            bestScore: 1,
            attempts: 1,
            lastAttemptAt: new Date().toISOString(),
          },
        },
      },
    },
    activityDates: ['2026-10-04'],
    updatedAt: new Date().toISOString(),
  };

  assert(isValidProgressData(validData) === true, 'Valid data must return true');
  assert(isValidProgressData(null) === false, 'null must return false');
  assert(isValidProgressData({ schemaVersion: 1 }) === false, 'Incomplete data must return false');
  console.log('✓ Test 5 Passed: Schema validation function behaves accurately');
}

// 6. Step completion tracking test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  service.markStepCompleted('lesson-01', 'step-01-objectives');
  service.markStepCompleted('lesson-01', 'step-01-analogy');

  const entry = service.getLessonProgress('lesson-01');
  assert(entry.completedStepIds.length === 2, 'Must record 2 completed steps');
  assert(entry.completedStepIds.includes('step-01-objectives'), 'Must include step-01-objectives');
  assert(entry.completedStepIds.includes('step-01-analogy'), 'Must include step-01-analogy');
  assert(entry.currentStepId === 'step-01-analogy', 'currentStepId must be step-01-analogy');
  assert(entry.completed === false, 'Lesson must not be complete merely because steps are completed');
  console.log('✓ Test 6 Passed: Step completion tracked with stable IDs and distinct from lesson completion');
}

// 7. Knowledge check scoring and retry test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Attempt 1: Failed
  service.recordKnowledgeCheckAttempt('lesson-01', 'q-01-git-vs-github', false);
  let entry = service.getLessonProgress('lesson-01');
  let score = entry.knowledgeCheckScores['q-01-git-vs-github'];
  assert(score.passed === false, 'Score should be unpassed on first wrong attempt');
  assert(score.attempts === 1, 'Attempts should equal 1');
  assert(score.bestScore === 0, 'Best score should be 0');

  // Attempt 2: Passed
  service.recordKnowledgeCheckAttempt('lesson-01', 'q-01-git-vs-github', true);
  entry = service.getLessonProgress('lesson-01');
  score = entry.knowledgeCheckScores['q-01-git-vs-github'];
  assert(score.passed === true, 'Score should be passed on correct attempt');
  assert(score.attempts === 2, 'Attempts should equal 2');
  assert(score.bestScore === 1, 'Best score should be updated to 1');
  console.log('✓ Test 7 Passed: Knowledge check records multiple attempts and preserves best score');
}

// 8. Completion requirement derivation test (cannot complete without all required steps + passed quiz)
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Mark all steps except the quiz
  service.markStepCompleted('lesson-01', 'step-01-objectives');
  service.markStepCompleted('lesson-01', 'step-01-analogy');
  service.markStepCompleted('lesson-01', 'step-01-vocabulary');

  let canComplete = service.canCompleteLesson(LESSON_01);
  assert(canComplete.eligible === false, 'Cannot complete without completing step-01-check and step-01-summary');

  // Complete remaining steps
  service.markStepCompleted('lesson-01', 'step-01-check');
  service.markStepCompleted('lesson-01', 'step-01-summary');

  canComplete = service.canCompleteLesson(LESSON_01);
  assert(canComplete.eligible === false, 'Cannot complete if quiz was never passed');

  // Now pass the quiz
  service.recordKnowledgeCheckAttempt('lesson-01', 'q-01-git-vs-github', true);
  canComplete = service.canCompleteLesson(LESSON_01);
  assert(canComplete.eligible === true, 'Should be eligible once all required steps and quizzes are passed');

  const completed = service.completeLesson(LESSON_01);
  assert(completed === true, 'completeLesson must return true');
  assert(service.getLessonProgress('lesson-01').completed === true, 'Lesson completed status must be true');
  console.log('✓ Test 8 Passed: Lesson completion requires both all steps and passed knowledge checks');
}

// 9. Module completion derived from required lessons test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  assert(service.isModuleCompleted('module-01', ['lesson-01']) === false, 'Module 01 is not complete initially');

  // Complete lesson-01
  LESSON_01.steps.forEach(s => service.markStepCompleted('lesson-01', s.id));
  service.recordKnowledgeCheckAttempt('lesson-01', 'q-01-git-vs-github', true);
  service.completeLesson(LESSON_01);

  assert(service.isModuleCompleted('module-01', ['lesson-01']) === true, 'Module 01 is complete when lesson-01 is complete');
  console.log('✓ Test 9 Passed: Module completion correctly derived from required lesson completion');
}

// 10. Streak derivation from activity dates test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  const refDate = new Date('2026-10-04T12:00:00Z');
  service.recordActivity(new Date('2026-10-02T10:00:00Z'));
  service.recordActivity(new Date('2026-10-03T10:00:00Z'));
  service.recordActivity(new Date('2026-10-04T10:00:00Z'));

  const streak = service.getStreakInfo(refDate);
  assert(streak.currentStreak === 3, `Current streak must be 3, got ${streak.currentStreak}`);
  assert(streak.longestStreak === 3, `Longest streak must be 3, got ${streak.longestStreak}`);
  assert(streak.activeToday === true, 'Must report activeToday true');
  console.log('✓ Test 10 Passed: Streak derived accurately from activity dates');
}

// 11. Reset progress test
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  service.markStepCompleted('lesson-01', 'step-01-objectives');
  service.resetProgress();

  const data = service.getProgress();
  assert(Object.keys(data.lessonProgress).length === 0, 'After reset, lessonProgress must be empty');
  console.log('✓ Test 11 Passed: resetProgress cleanly restores defaults');
}

console.log('--- ALL 11 TESTS PASSED SUCCESSFULLY! ---');

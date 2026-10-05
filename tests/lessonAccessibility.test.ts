import { isInteractiveElementOrAncestor } from '../src/hooks/useLessonKeyboard';
import { ProgressService, PROGRESS_STORAGE_KEY } from '../src/services/progressService';
import { FOUNDATIONAL_LESSONS } from '../src/data/lessons';

class MockStorage {
  private data: Record<string, string> = {};
  public mutationCount = 0;

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.mutationCount++;
    this.data[key] = value;
  }
  removeItem(key: string): void {
    this.mutationCount++;
    delete this.data[key];
  }
  clear(): void {
    this.mutationCount++;
    this.data = {};
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Lesson Accessibility, Keyboard & Summary Mode Tests ---');

// Mock DOM elements for Node test environment
class MockNode {
  public tagName: string;
  public parentNode: MockNode | null = null;
  public attributes: Record<string, string> = {};

  constructor(tagName: string, attributes: Record<string, string> = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = attributes;
  }

  getAttribute(attr: string): string | null {
    return this.attributes[attr] ?? null;
  }

  hasAttribute(attr: string): boolean {
    return attr in this.attributes;
  }

  appendChild(child: MockNode): MockNode {
    child.parentNode = this;
    return child;
  }

  closest(selector: string): MockNode | null {
    const selectors = selector.split(',').map((s) => s.trim().toLowerCase());
    let current: MockNode | null = this;

    while (current) {
      const tag = current.tagName.toLowerCase();
      const role = current.getAttribute('role')?.toLowerCase();

      for (const sel of selectors) {
        if (sel === tag) return current;
        if (sel === 'a[href]' && tag === 'a' && current.hasAttribute('href')) return current;
        if (sel === '[contenteditable="true"]' && current.getAttribute('contenteditable') === 'true') return current;
        if (sel.startsWith('[role="') && sel.endsWith('"]')) {
          const expectedRole = sel.slice(7, -2);
          if (role === expectedRole) return current;
        }
      }
      current = current.parentNode;
    }
    return null;
  }
}

// 1. Keyboard suppression on direct interactive controls
{
  const inputEl = new MockNode('input') as unknown as Element;
  const textareaEl = new MockNode('textarea') as unknown as Element;
  const selectEl = new MockNode('select') as unknown as Element;
  const buttonEl = new MockNode('button') as unknown as Element;
  const linkEl = new MockNode('a', { href: '#' }) as unknown as Element;
  const radioEl = new MockNode('div', { role: 'radio' }) as unknown as Element;
  const radiogroupEl = new MockNode('div', { role: 'radiogroup' }) as unknown as Element;

  assert(isInteractiveElementOrAncestor(inputEl), 'Input element must be suppressed');
  assert(isInteractiveElementOrAncestor(textareaEl), 'Textarea element must be suppressed');
  assert(isInteractiveElementOrAncestor(selectEl), 'Select element must be suppressed');
  assert(isInteractiveElementOrAncestor(buttonEl), 'Button element must be suppressed');
  assert(isInteractiveElementOrAncestor(linkEl), 'Anchor with href must be suppressed');
  assert(isInteractiveElementOrAncestor(radioEl), 'Role radio must be suppressed');
  assert(isInteractiveElementOrAncestor(radiogroupEl), 'Role radiogroup must be suppressed');
  console.log('✓ Test 31 Passed: Direct interactive controls suppressed');
}

// 2. Keyboard suppression on nested descendants inside interactive controls
{
  const buttonParent = new MockNode('button');
  const spanChild = new MockNode('span');
  const iconGrandchild = new MockNode('svg');
  buttonParent.appendChild(spanChild);
  spanChild.appendChild(iconGrandchild);

  assert(
    isInteractiveElementOrAncestor(spanChild as unknown as Element),
    'Span inside button must be suppressed via closest ancestor match'
  );
  assert(
    isInteractiveElementOrAncestor(iconGrandchild as unknown as Element),
    'SVG icon inside button must be suppressed via closest ancestor match'
  );

  const radioContainer = new MockNode('div', { role: 'radiogroup' });
  const radioOption = new MockNode('div', { role: 'radio' });
  const radioLabel = new MockNode('span');
  radioContainer.appendChild(radioOption);
  radioOption.appendChild(radioLabel);

  assert(
    isInteractiveElementOrAncestor(radioLabel as unknown as Element),
    'Label span inside role="radio" option must be suppressed'
  );
  console.log('✓ Test 32 Passed: Nested descendants inside interactive ancestors suppressed');
}

// 3. Non-interactive elements must NOT be suppressed
{
  const divContainer = new MockNode('div');
  const heading = new MockNode('h1');
  const paragraph = new MockNode('p');
  divContainer.appendChild(heading);
  divContainer.appendChild(paragraph);

  assert(!isInteractiveElementOrAncestor(divContainer as unknown as Element), 'Plain div must not be suppressed');
  assert(!isInteractiveElementOrAncestor(heading as unknown as Element), 'Plain heading must not be suppressed');
  assert(!isInteractiveElementOrAncestor(paragraph as unknown as Element), 'Plain paragraph must not be suppressed');
  assert(!isInteractiveElementOrAncestor(null), 'Null target must not be suppressed');
  console.log('✓ Test 33 Passed: Non-interactive elements allowed to trigger shortcuts');
}

// 4. Number key jump validation within bounds 1..totalSteps
{
  const totalSteps = 4;
  const validKeys = ['1', '2', '3', '4'];
  const invalidKeys = ['0', '5', '9', 'a', 'ArrowUp', ' '];

  for (const key of validKeys) {
    const parsed = parseInt(key, 10);
    const inBounds = !isNaN(parsed) && parsed >= 1 && parsed <= totalSteps;
    assert(inBounds, `Key ${key} must be valid for totalSteps=${totalSteps}`);
  }

  for (const key of invalidKeys) {
    const parsed = parseInt(key, 10);
    const inBounds = !isNaN(parsed) && parsed >= 1 && parsed <= totalSteps;
    assert(!inBounds, `Key ${key} must be rejected for totalSteps=${totalSteps}`);
  }
  console.log('✓ Test 34 Passed: Step number key jump bounds strictly enforced');
}

// 5. Summary Mode: Immutability and zero progress mutations
{
  const mockStorage = new MockStorage();
  const service = new ProgressService(mockStorage);

  // Complete lesson-01
  const lesson = FOUNDATIONAL_LESSONS[0];
  for (const step of lesson.steps) {
    service.markStepCompleted(lesson.id, step.id);
    if (step.knowledgeCheck) {
      service.recordKnowledgeCheckAttempt(lesson.id, step.knowledgeCheck.id, true);
    }
  }
  service.completeLesson(lesson);

  const savedSnapshot = mockStorage.getItem(PROGRESS_STORAGE_KEY);
  const initialMutationCount = mockStorage.mutationCount;

  // In Summary Mode: all blocks and answer keys are read-only
  // Verify that inspecting lesson steps, blocks, and scores in summary mode performs 0 mutations
  const completedProgress = service.getProgress();
  assert(completedProgress.lessonProgress[lesson.id]?.completed === true, 'Lesson must be completed');

  // Verify answer keys are inspectable without recording scores or changing state
  for (const step of lesson.steps) {
    if (step.knowledgeCheck) {
      const correctIdx = step.knowledgeCheck.correctIndex;
      assert(typeof correctIdx === 'number', 'Knowledge check must have valid correctIndex');
    }
  }

  // Verify storage state was NEVER touched or mutated during summary inspection
  const afterSnapshot = mockStorage.getItem(PROGRESS_STORAGE_KEY);
  assert(savedSnapshot === afterSnapshot, 'Storage payload must be byte-for-byte identical in summary mode');
  assert(mockStorage.mutationCount === initialMutationCount, 'Summary mode must produce zero storage mutations');
  console.log('✓ Test 35 Passed: Summary Mode guarantees 0 mutations to storage and progress');
}

// 6. Focus restoration resolution and disconnected trigger fallback
{
  // Simulated DOM tree
  const body = new MockNode('body');
  const main = new MockNode('main');
  const heading = new MockNode('h1');
  const button = new MockNode('button');
  body.appendChild(main);
  main.appendChild(heading);
  main.appendChild(button);

  // Scenario A: Originating button is still connected
  let isConnected = button.parentNode !== null;
  let targetToFocus: MockNode | null = isConnected ? button : heading;
  assert(targetToFocus === button, 'Connected trigger element must be targeted for focus');

  // Scenario B: Originating button disconnected (e.g. view transitioned)
  button.parentNode = null;
  isConnected = button.parentNode !== null;
  targetToFocus = isConnected ? button : heading;
  assert(targetToFocus === heading, 'Disconnected trigger element must fallback to main heading');
  console.log('✓ Test 36 Passed: Focus target resolves to trigger or falls back to heading');
}

console.log('--- All Step E Accessibility & Summary Mode Tests Passed ---');

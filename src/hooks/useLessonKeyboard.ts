import { useEffect } from 'react';

export interface UseLessonKeyboardOptions {
  currentStepIndex: number;
  totalSteps: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onStepJump: (index: number) => void;
  onExitLesson: () => void;
  hasActiveChildDialog?: boolean;
  enabled?: boolean;
}

/**
 * Checks whether an element or any of its ancestors is an interactive control,
 * input field, or composite widget where arrow keys and typing must be preserved.
 */
export function isInteractiveElementOrAncestor(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') {
    return false;
  }

  // Check self and ancestors
  const interactiveSelector = [
    'input',
    'textarea',
    'select',
    'button',
    'a[href]',
    '[contenteditable="true"]',
    '[role="radio"]',
    '[role="radiogroup"]',
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="dialog"]',
    '[role="combobox"]',
    '[role="listbox"]',
  ].join(',');

  return Boolean((target as Element).closest(interactiveSelector));
}

/**
 * Custom hook for keyboard navigation within the active lesson player.
 * - ArrowRight / ArrowLeft to move between steps (suppressed inside interactive controls)
 * - Digits 1..N to jump directly to steps (where N = totalSteps; invalid numbers ignored)
 * - Escape to exit lesson (suppressed if child dialog/overlay is active)
 */
export function useLessonKeyboard({
  currentStepIndex,
  totalSteps,
  onNextStep,
  onPrevStep,
  onStepJump,
  onExitLesson,
  hasActiveChildDialog = false,
  enabled = true,
}: UseLessonKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser and system modifiers (Cmd+K, Alt+Left, Ctrl+R, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Handle Escape key
      if (e.key === 'Escape') {
        if (hasActiveChildDialog) {
          // Let the child dialog consume Escape to dismiss itself
          return;
        }
        e.preventDefault();
        onExitLesson();
        return;
      }

      // Suppress step shortcuts if target or ancestor is interactive (e.g. quiz radio, inputs, buttons)
      if (isInteractiveElementOrAncestor(e.target)) {
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowRight') {
        if (currentStepIndex < totalSteps - 1) {
          e.preventDefault();
          onNextStep();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          e.preventDefault();
          onPrevStep();
        }
        return;
      }

      // Number keys 1..totalSteps for direct section jump
      // Ignore keys outside the range or 0
      const parsedNum = parseInt(e.key, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= totalSteps) {
        e.preventDefault();
        onStepJump(parsedNum - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    currentStepIndex,
    totalSteps,
    onNextStep,
    onPrevStep,
    onStepJump,
    onExitLesson,
    hasActiveChildDialog,
  ]);
}

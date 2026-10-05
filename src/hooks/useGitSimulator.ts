import { useState, useCallback, useRef } from 'react';
import { GitRepoState, StateChangeSummary } from '@/types/simulator';
import { createPristineRepoState } from '@/services/simulator/defaultState';
import { executeCommand } from '@/services/simulator/gitEngine';
import { PRACTICE_SCENARIOS } from '@/services/simulator/scenarioService';

export interface ConsoleOutputEntry {
  id: string;
  command?: string;
  stdout: string[];
  stderr: string[];
  explanation?: StateChangeSummary;
}

export function useGitSimulator(initialScenarioId: number | null = null) {
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(initialScenarioId);

  const [repoState, setRepoState] = useState<GitRepoState>(() => {
    if (initialScenarioId && PRACTICE_SCENARIOS[initialScenarioId]) {
      return PRACTICE_SCENARIOS[initialScenarioId].initialState;
    }
    return createPristineRepoState();
  });

  const [outputHistory, setOutputHistory] = useState<ConsoleOutputEntry[]>([
    {
      id: 'welcome-banner',
      stdout: [
        '# Welcome to GitLearn Simulated Git Command Console',
        '# Sourced from beginner Git operations (W3Schools & git-scm.com)',
        '# Type "help" to view supported commands, or "git status" to inspect repository.',
      ],
      stderr: [],
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const runCommand = useCallback((rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Add to command history buffer
    setCommandHistory((prev) => [...prev, trimmed]);
    historyIndexRef.current = -1; // reset cursor

    // Handle pure clear
    if (trimmed.toLowerCase() === 'clear') {
      setOutputHistory([]);
      return;
    }

    setRepoState((prevState) => {
      const result = executeCommand(prevState, trimmed);

      const entry: ConsoleOutputEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        command: trimmed,
        stdout: result.stdout,
        stderr: result.stderr,
        explanation: result.explanation,
      };

      setOutputHistory((prev) => [...prev, entry]);
      return result.nextState;
    });
  }, []);

  const resetSandbox = useCallback((scenarioId: number | null = null) => {
    setActiveScenarioId(scenarioId);
    let freshState: GitRepoState;

    if (scenarioId && PRACTICE_SCENARIOS[scenarioId]) {
      freshState = PRACTICE_SCENARIOS[scenarioId].initialState;
    } else {
      freshState = createPristineRepoState();
    }

    setRepoState(freshState);
    setOutputHistory([
      {
        id: `reset-${Date.now()}`,
        stdout: [
          scenarioId
            ? `# Repository reset to starting state for ${PRACTICE_SCENARIOS[scenarioId]?.title}.`
            : '# Repository reset. Working tree and Git repository restored to pristine clean state.',
          '# Type "help" or "git status" to begin.',
        ],
        stderr: [],
      },
    ]);
  }, []);

  const activeScenario = activeScenarioId ? PRACTICE_SCENARIOS[activeScenarioId] : null;
  const isScenarioCompleted = activeScenario ? activeScenario.isCompleted(repoState) : false;

  return {
    repoState,
    outputHistory,
    commandHistory,
    runCommand,
    resetSandbox,
    activeScenarioId,
    activeScenario,
    isScenarioCompleted,
  };
}

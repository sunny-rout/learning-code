# Post-v1.0 Improvement Backlog & Baseline Freeze

## 1. Verified v1.0 Baseline

- **Milestone Version**: `v1.0.0`
- **Baseline Commit**: `d1a314bc59e3bb69156777542694ae584137ce99`
- **Branch**: `develop` / `origin/develop`
- **Test Suite**: 10 suites passing (100% pass rate; 0 failures)
- **TypeScript Status**: Clean compilation (`tsc --noEmit` exitCode 0)
- **Bundle Metrics**:
  - Main JS: `363.37 kB` (ceiling: $\le 380\text{ kB}$, +16.63 kB headroom)
  - Main JS gzip: `102.98 kB` (ceiling: $\le 105\text{ kB}$, +2.02 kB headroom)
  - CSS: `38.61 kB` (gzip: `7.24 kB`)
- **Curriculum Scope**: Complete 17 modules (Modules 01–17)
- **Practice Scenarios**: Exercises 1 through 7 (Capstone) with deterministic state evaluators

---

## 2. Core Freezing & Governance Principles

1. **Immutable Core**:
   - The verified v1.0 engine (`src/services/simulator/gitEngine.ts`), curriculum modules (`src/data/lessons/`), and state management logic are frozen as the baseline.
   - Any future changes must not regress existing test coverage or increase the bundle size beyond the established budget.
2. **Feature Branching for Backlog Items**:
   - All post-v1.0 work should be developed in isolated feature branches (`feature/post-v1-...`) and undergo the full 10-suite regression run prior to integration.

---

## 3. Post-v1.0 Improvement Backlog

### Category A: Advanced Simulator Extensions (Non-Breaking)
- [ ] **Interactive Rebase Simulator (`git rebase -i`)**:
  - Implement a dedicated visual rebase sandbox allowing interactive squashing, rewording, and dropping commits.
  - *Note*: Ensure rebase logic remains isolated and does not complicate the base DAG reducer.
- [ ] **Cherry-Pick Simulator (`git cherry-pick`)**:
  - Support cherry-picking single or range commits between divergent branches with automatic conflict detection.
- [ ] **Multi-Remote Simulation**:
  - Extend remote registry to support secondary remotes (e.g. `upstream` vs `origin` fork workflows).

### Category B: Curriculum & Learning Enhancements
- [ ] **Git Hooks & Pre-commit Automation**:
  - Optional mini-module covering client-side hooks (`pre-commit`, `commit-msg`) with executable linting checks.
- [ ] **Submodules & Monorepos Overview**:
  - Conceptual and diagnostic guide to managing sub-repositories and monorepo branching models.
- [ ] **Certificate & Assessment Mode**:
  - Generate a downloadable/printable completion certificate upon finishing all 17 modules and 7 exercises.

### Category C: Developer Experience & Platform
- [ ] **PWA Offline Mode**:
  - Add Service Worker caching for complete offline operation in classroom or restricted network environments.
- [ ] **Command History Autocompletion**:
  - Terminal tab-completion suggestions based on current repository state (e.g., active branch names, modified files).
- [ ] **State Import / Export**:
  - Ability to export sandbox state as JSON and share custom scenarios with peers.

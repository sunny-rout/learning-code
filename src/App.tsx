import React, { useState } from 'react';
import { Layout } from './app/components/layout/Layout';
import { NavigationTab } from './types';
import { DashboardView } from './app/features/dashboard/DashboardView';
import { ModulesView } from './app/features/modules/ModulesView';
import { PlaygroundView } from './app/features/playground/PlaygroundView';
import { PracticeView } from './app/features/practice/PracticeView';
import { QuizView } from './app/features/quiz/QuizView';
import { ProgressView } from './app/features/progress/ProgressView';
import { CheatSheetView } from './app/features/cheat-sheet/CheatSheetView';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
      {activeTab === 'learn' && <ModulesView />}
      {activeTab === 'playground' && <PlaygroundView />}
      {activeTab === 'practice' && <PracticeView />}
      {activeTab === 'quiz' && <QuizView />}
      {activeTab === 'progress' && <ProgressView />}
      {activeTab === 'cheat-sheet' && <CheatSheetView />}
    </Layout>
  );
}

export default App;

import { useState, useEffect } from 'react';
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
  const [selectedModuleId, setSelectedModuleId] = useState<string>('module-01');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('cheat-sheet');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectModuleAndNavigate = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveTab('learn');
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardView 
          onNavigate={setActiveTab} 
          onSelectModule={handleSelectModuleAndNavigate} 
        />
      )}
      {activeTab === 'learn' && (
        <ModulesView 
          selectedModuleId={selectedModuleId} 
          onSelectModuleId={setSelectedModuleId}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'playground' && <PlaygroundView />}
      {activeTab === 'practice' && <PracticeView onNavigate={setActiveTab} />}
      {activeTab === 'quiz' && <QuizView onNavigate={setActiveTab} />}
      {activeTab === 'progress' && <ProgressView onNavigate={setActiveTab} />}
      {activeTab === 'cheat-sheet' && <CheatSheetView />}
    </Layout>
  );
}

export default App;

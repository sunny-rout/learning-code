export type ContentBlockType =
  | 'objective'
  | 'analogy'
  | 'concept'
  | 'diagram'
  | 'command'
  | 'output'
  | 'pitfall'
  | 'summary';

export interface ObjectiveBlock {
  type: 'objective';
  items: string[];
}

export interface AnalogyBlock {
  type: 'analogy';
  title: string;
  metaphor: string;
  takeaway: string;
}

export interface ConceptBlock {
  type: 'concept';
  title?: string;
  content: string;
  callout?: {
    type: 'info' | 'warning' | 'tip';
    text: string;
  };
}

export interface DiagramBlock {
  type: 'diagram';
  variant: 
    | 'pipeline-4stage' 
    | 'commit-graph' 
    | 'conflict-split' 
    | 'undo-matrix' 
    | 'branch-divergence'
    | 'config-hierarchy';
  caption: string;
  highlightStages?: ('working' | 'staging' | 'local' | 'remote')[];
}

export interface CommandBlock {
  type: 'command';
  command: string;
  explanation: string;
  flags?: {
    flag: string;
    description: string;
  }[];
}

export interface OutputBlock {
  type: 'output';
  command: string;
  output: string;
  note?: string;
}

export interface PitfallBlock {
  type: 'pitfall';
  warning: string;
  consequence: string;
  solution: string;
}

export interface SummaryBlock {
  type: 'summary';
  points: string[];
}

export type ContentBlock =
  | ObjectiveBlock
  | AnalogyBlock
  | ConceptBlock
  | DiagramBlock
  | CommandBlock
  | OutputBlock
  | PitfallBlock
  | SummaryBlock;

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonStep {
  id: string;
  title: string;
  description?: string;
  blocks: ContentBlock[];
  knowledgeCheck?: KnowledgeCheckQuestion;
  isRequiredForCompletion: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  subtitle: string;
  pdfSection: number;
  estimatedMinutes: number;
  steps: LessonStep[];
}

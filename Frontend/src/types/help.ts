// ============================================
// Help Center Type Definitions
// ============================================

export interface WorkflowStep {
  step: number;
  title: string;
  description?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  steps?: WorkflowStep[];
  tips?: string[];
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  features: string[];
  workflow: WorkflowStep[];
  articles: HelpArticle[];
  troubleshooting: TroubleshootingItem[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
}

export interface TroubleshootingCategory {
  id: string;
  title: string;
  icon: string;
  items: TroubleshootingItem[];
}

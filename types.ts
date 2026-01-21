
export enum Category {
  GENERAL_INFO = "General Information",
  NUMERICAL = "Numerical Ability",
  VERBAL = "Verbal Ability",
  ANALYTICAL = "Analytical Ability"
}

export type AppView = 'menu' | 'test' | 'reviewer' | 'strategies';

export interface Question {
  id: string;
  category: Category;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: number;
}

export interface QuizResults {
  score: number;
  total: number;
  weightedRating: number;
  categoryBreakdown: Record<Category, { score: number; total: number; percentage: number }>;
  isSubtest: boolean;
  subtestCategory?: Category;
}

export interface ReviewerNote {
  category: Category;
  title: string;
  content: string[];
}

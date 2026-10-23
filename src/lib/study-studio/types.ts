export type StudySourceType = "TEXT" | "PDF" | "IMAGE" | "AUDIO";

export type BloomTaxonomyLevel =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE";

export type QuizQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export type CardDifficulty = "EASY" | "MEDIUM" | "HARD";

/**
 * رتبه‌بندی الگوریتم SM-2:
 * ۱ = دوباره (Again - <1 min)
 * ۲ = سخت (Hard)
 * ۳ = خوب (Good)
 * ۴ = آسان (Easy)
 */
export type CardRating = 1 | 2 | 3 | 4;

export interface GeneratedSummary {
  overview: string;
  keyTakeaways: string[];
  glossary: Array<{
    term: string;
    definition: string;
  }>;
}

export interface GeneratedFlashcard {
  front: string; // با پشتیبانی کامل از فرمول‌های ریاضی و شیمی KaTeX
  back: string;
  hint?: string;
  topicTag: string;
  difficulty: CardDifficulty;
}

export interface GeneratedQuizQuestion {
  questionText: string; // با فرمول KaTeX
  type: QuizQuestionType;
  options?: string[]; // ۴ گزینه برای سوالات تستی
  correctAnswer: string;
  explanation: string; // توضیح جامع آموزشی (چرا این گزینه درسته/غلطه)
  bloomLevel: BloomTaxonomyLevel;
  topicTag: string;
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  timeLimitMinutes: number;
  questions: GeneratedQuizQuestion[];
}

export interface GeneratedMindMapNode {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

export interface GeneratedMindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface GeneratedMindMap {
  nodes: GeneratedMindMapNode[];
  edges: GeneratedMindMapEdge[];
}

export interface GeneratedStudyPackContent {
  title: string;
  description: string;
  topicTag: string;
  gradeLevel: number;
  summary: GeneratedSummary;
  flashcards: GeneratedFlashcard[];
  quiz: GeneratedQuiz;
  mindMap: GeneratedMindMap;
}

export interface ParsedInputMedia {
  sourceType: StudySourceType;
  mimeType: string;
  base64Data?: string;
  rawText?: string;
  fileName?: string;
}

export interface StudyPackDetail {
  id: string;
  title: string;
  description?: string | null;
  topicTag: string;
  gradeLevel?: number | null;
  summary?: GeneratedSummary | null;
  summaryJson?: string | null;
  mindMap?: GeneratedMindMap | null;
  mindMapJson?: string | null;
  flashcards?: any[];
  quizzes?: Array<{
    id: string;
    title: string;
    description?: string | null;
    timeLimitMinutes?: number | null;
    questions: Array<{
      id: string;
      questionText: string;
      optionsJson?: string | null;
      correctAnswer: string;
      explanation?: string | null;
      bloomLevel?: string | null;
      topicTag?: string | null;
      orderIndex?: number | null;
    }>;
  }>;
  createdAt?: string | Date;
}


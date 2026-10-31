export type BloomTaxonomy =
  | "REMEMBER"
  | "UNDERSTAND"
  | "APPLY"
  | "ANALYZE"
  | "EVALUATE"
  | "CREATE";

export type AdaptiveItemType =
  | "multiple_choice"
  | "cloze_deletion"
  | "speed_match"
  | "spot_error"
  | "feynman_prompt"
  | "flashcard_mnemonic";

export interface IsomorphicQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface SpeedMatchPair {
  term: string;
  definition: string;
}

export interface SpotErrorSegment {
  text: string;
  isError: boolean;
}

export interface AdaptiveAssessmentItem {
  id: string;
  type: AdaptiveItemType;
  prompt: string;
  bloomLevel: BloomTaxonomy;
  conceptKey: string;
  
  // برای چهارگزینه‌ای مفهومی
  options?: string[];
  correctAnswer?: string;
  distractorNotes?: Record<string, string>;

  // برای جای خالی هوشمند (Smart Cloze Deletion)
  sentenceWithBlank?: string; // شامل [BLANK]
  choices?: string[];

  // برای جفت‌سازی سریع (Speed Matching - زیر ۳۰ ثانیه)
  pairs?: SpeedMatchPair[]; // ۴ جفت

  // برای شکار خطا (Spot the Error)
  fullStatement?: string;
  segments?: SpotErrorSegment[];
  errorCorrection?: string;

  // برای اتاق فاینمن (Teach the AI)
  rubricKeywords?: string[]; // ۳ کلیدواژه یا مفهوم کلیدی الزامی
  sampleAnswer?: string;

  // برای فلش‌کارت با کد رمز حافظه (Mnemonic Hint)
  front?: string;
  back?: string;
  mnemonicClue?: string;

  // داده‌های ارجاع مستقیم به جزوه (Grounded Remediation Loop)
  sourceQuote: string;
  pageNumber: number;
  remediationExplanation: string;
  isomorphicQuestion?: IsomorphicQuestion;
}

export interface AdaptiveLearningNode {
  id: string;
  nodeNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  isBossFight: boolean;
  xpReward: number;
  minPassingScore: number;
  keyConcepts: string[];
  items: AdaptiveAssessmentItem[];
}

export interface AdaptiveCourseStructure {
  title: string;
  description: string;
  topicTag: string;
  gradeLevel: number;
  summary: string;
  contentHash?: string;
  ocrUsed?: boolean;
  nodes: AdaptiveLearningNode[];
  bossFight: AdaptiveLearningNode;
}

// ==========================================
// نوع‌های الگوریتم FSRS نسل جدید
// ==========================================

export type FSRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type FSRSState = "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";

export interface FSRSCardData {
  itemId: string;
  conceptKey: string;
  stability: number; // S (روزها)
  difficulty: number; // D (۱ تا ۱۰)
  reps: number;
  lapses: number;
  state: FSRSState;
  lastReviewedAt?: string | null;
  nextReviewDate: string;
  lastRating?: FSRSRating | null;
}

export interface FSRSReviewResult {
  updatedCard: FSRSCardData;
  intervalDays: number;
  retrievability: number; // R (۰ تا ۱)
  scheduledDate: Date;
}

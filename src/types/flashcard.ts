/**
 * Flashcard System Type Definitions
 * Extracted from FlashcardSystem.tsx for better modularity
 */

export interface Flashcard {
  id: string;
  cardId?: string; // Workspace card ID that owns this flashcard
  front: string;
  back: string;
  type: "text" | "image" | "audio" | "video";
  mediaUrl?: string;
  difficulty: number; // 1-5 scale
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  lastReviewed?: Date;
  tags: string[];
  category: string;
}

export interface StudySession {
  id: string;
  startTime: Date;
  cardsStudied: number;
  correctAnswers: number;
  averageResponseTime: number;
  sessionDuration: number;
  sessionDate: Date;
}

export interface FlashcardStats {
  id: string;
  totalCards: number;
  cardsDue: number;
  averageDifficulty: number;
  studyStreak: number;
  totalStudyTime: number;
  accuracy: number;
  lastUpdated: Date;
}

export interface FlashcardSystemProps {
  cardId?: string;
}

export interface FlashcardFormState {
  front: string;
  back: string;
  type: "text" | "image" | "audio" | "video";
  category: string;
  tags: string;
  mediaFile: File | null;
  mediaPreview: string;
}

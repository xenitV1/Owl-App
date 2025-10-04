// AI Content Generation Type Definitions

export type ContentType = 'flashcards' | 'questions' | 'notes';
export type AgeGroup = 'elementary' | 'middle' | 'high' | 'university';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'open_ended';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

// Request Types
export interface AIGenerateRequest {
  contentType: ContentType;
  documentContent: string;
  ageGroup: AgeGroup;
  language: string; // Support any language
  subject?: string;
  cardCount?: number; // Number of cards to generate (max 20)
}

export interface ParseDocumentRequest {
  file: File;
}

// Content Types
export interface Flashcard {
  id?: string;
  front: string;
  back: string;
  difficulty: number; // 1-5
  tags: string[];
  category?: string;
}

export interface Question {
  id?: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple_choice
  correctAnswer: string;
  explanation: string;
  difficulty: number; // 1-5
  bloomLevel: BloomLevel;
}

export interface StudyNote {
  title: string;
  content: string; // Markdown format
  sections?: {
    heading: string;
    content: string;
  }[];
}

// Generated Content
export interface GeneratedContent {
  type: ContentType;
  title: string;
  content: Flashcard[] | Question[] | StudyNote;
  metadata: {
    ageGroup: AgeGroup;
    language: string;
    subject?: string;
    generatedAt: Date;
    sourceDocument?: string;
  };
}

// API Response Types
export interface AIGenerateResponse {
  success: boolean;
  data?: GeneratedContent;
  error?: string;
}

export interface ParseDocumentResponse {
  success: boolean;
  data?: {
    text: string;
    filename: string;
    fileType: string;
  };
  error?: string;
}

// Gemini API Types
export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}


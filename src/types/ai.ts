// AI Content Generation Type Definitions

export type ContentType = "flashcards" | "questions" | "notes";
export type AgeGroup = "elementary" | "middle" | "high" | "university";
export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "open_ended";
export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

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

export interface StudyNoteContent {
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
  content: Flashcard[] | Question[] | StudyNoteContent;
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

// PDF Processing Types (Client-Side)
export interface PDFProcessingOptions {
  convertToMarkdown?: boolean; // Default: true
  preserveFormatting?: boolean; // Smart formatting
  optimizeSize?: boolean; // Remove duplicates, whitespace
  extractImages?: boolean; // Future: image extraction
  enableOCR?: boolean; // If true, try OCR when text extraction is empty
  ocrLanguages?: string; // Tesseract language(s), e.g., 'eng+tur'
  onProgress?: (progress: PDFProcessingProgress) => void;
}

export interface PDFProcessingProgress {
  stage:
    | "loading"
    | "extracting"
    | "ocr"
    | "converting"
    | "optimizing"
    | "complete"
    | "error";
  currentPage: number;
  totalPages: number;
  percentage: number;
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface PDFProcessingResult {
  success: boolean;
  content: string; // Markdown or plain text
  metadata: PDFMetadata;
  originalSize: number; // bytes
  processedSize: number; // bytes
  compressionRatio: number; // percentage
  processingTime: number; // milliseconds
  error?: string;
}

export interface PDFMetadata {
  fileName: string;
  fileType: string;
  totalPages: number;
  extractedAt: Date;
  format: "markdown" | "text";
  structure: {
    hasHeadings: boolean;
    hasLists: boolean;
    hasTables: boolean;
    paragraphCount: number;
  };
}

// Markdown Conversion Types
export interface MarkdownStructure {
  headings: HeadingInfo[];
  lists: ListInfo[];
  tables: TableInfo[];
  paragraphs: string[];
}

export interface HeadingInfo {
  level: number; // 1-6
  text: string;
  pageNumber: number;
}

export interface ListInfo {
  type: "bullet" | "numbered";
  items: string[];
  pageNumber: number;
}

export interface TableInfo {
  headers: string[];
  rows: string[][];
  pageNumber: number;
}

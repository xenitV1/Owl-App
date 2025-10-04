// API-specific AI Types

export interface AIGenerateRequestBody {
  contentType: 'flashcards' | 'questions' | 'notes';
  documentContent: string;
  ageGroup: 'elementary' | 'middle' | 'high' | 'university';
  language: string; // Support any language
  subject?: string;
  cardCount?: number; // Number of cards to generate (max 20, only for flashcards/questions)
}

export interface AIGenerateResponseBody {
  success: boolean;
  data?: {
    type: string;
    title: string;
    content: any;
    metadata: {
      ageGroup: string;
      language: string;
      subject?: string;
      generatedAt: string;
    };
  };
  error?: string;
  message?: string;
}

export interface ParseDocumentResponseBody {
  success: boolean;
  data?: {
    text: string;
    filename: string;
    fileType: string;
    size: number;
  };
  error?: string;
  message?: string;
}


export interface AppStudyNote {
  id: string;
  title: string;
  content: string; // Markdown
  subject?: string;
  ageGroup: "elementary" | "middle" | "high" | "university";
  language?: string;
  sourceDocument?: string; // original filename
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppCreateStudyNoteRequest {
  title: string;
  content: string;
  subject?: string;
  ageGroup: "elementary" | "middle" | "high" | "university";
  language?: string;
  sourceDocument?: string;
  isPublic?: boolean;
}

export interface AppUpdateStudyNoteRequest {
  title?: string;
  content?: string;
  subject?: string;
  ageGroup?: "elementary" | "middle" | "high" | "university";
  language?: string;
  isPublic?: boolean;
}

// Study Note Types
export interface StudyNote {
  id: string;
  title: string;
  content: string; // Markdown content
  subject?: string;
  ageGroup: "elementary" | "middle" | "high" | "university";
  language: string;
  sourceDocument?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudyNoteRequest {
  title: string;
  content: string;
  subject?: string;
  ageGroup: "elementary" | "middle" | "high" | "university";
  language: string;
  sourceDocument?: string;
  isPublic?: boolean;
}

export interface UpdateStudyNoteRequest {
  title?: string;
  content?: string;
  subject?: string;
  isPublic?: boolean;
}

export interface StudyNoteListResponse {
  notes: StudyNote[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateFromNoteRequest {
  noteId: string;
  contentType: "flashcards" | "questions";
  cardCount?: number;
  language?: string;
  ageGroup?: "elementary" | "middle" | "high" | "university";
}

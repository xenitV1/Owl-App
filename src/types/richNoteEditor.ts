/**
 * Rich Note Editor Type Definitions
 * Contains all interface and type definitions for the Rich Note Editor component
 */

export interface RichNoteEditorProps {
  cardId: string;
  initialContent?: string;
  onClose?: () => void;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  children: NoteFolder[];
  notes: string[];
}

export interface CrossReference {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  label: string;
}

export interface CardConnection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  sourceSize: { width: number; height: number };
  targetSize: { width: number; height: number };
}

export type VideoType = "youtube" | "direct" | "file" | "spotify";

export interface BlockNoteBlock {
  type: string;
  props?: Record<string, any>;
  content?: any;
  id?: string;
}

'use client';

// A lightweight utility to keep Rich Note logic out of large components/stores

export interface WorkspaceCardLike {
  id: string;
  type: 'platformContent' | 'richNote' | string;
  title: string;
  content?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  richContent?: {
    markdown: string;
    html: string;
    versionHistory: Array<{ timestamp: number; content: string; author?: string }>;
    lastSaved: number;
    // optional split view metadata allowed in content body
  };
}

export interface ConnectionLike {
  id: string;
  sourceCardId: string;
  sourceAnchor: 'top' | 'right' | 'bottom' | 'left';
  targetCardId: string;
  targetAnchor: 'top' | 'right' | 'bottom' | 'left';
  createdAt: number;
}

export type AddCardFn = (card: WorkspaceCardLike) => Promise<void> | void;
export type AddConnectionFn = (conn: ConnectionLike) => Promise<void> | void;
export type SaveRichNoteVersionFn = (cardId: string, content: string, author?: string) => Promise<void> | void;

// Returns the rich note id where the note was appended/created
export async function addNoteToRichNote(params: {
  sourceCardId: string;
  noteText: string;
  noteTitle?: string;
  cards: WorkspaceCardLike[];
  connections: ConnectionLike[];
  addCard: AddCardFn;
  addConnection: AddConnectionFn;
  saveRichNoteVersion: SaveRichNoteVersionFn;
}): Promise<string | null> {
  try {
    const { sourceCardId, noteText, noteTitle, cards, connections, addCard, addConnection, saveRichNoteVersion } = params;

    const source = cards.find(c => c.id === sourceCardId);
    if (!source) return null;

    // Find existing connection from source to a richNote card
    const existingConn = connections.find(c => c.sourceCardId === sourceCardId && cards.find(x => x.id === c.targetCardId)?.type === 'richNote');
    let richNote = existingConn ? cards.find(c => c.id === existingConn.targetCardId) : undefined;

    const block = {
      type: 'paragraph',
      content: [
        { type: 'text', text: `"${noteText}"`, styles: { italic: true } },
        ...(noteTitle ? [{ type: 'text', text: ' - ' }, { type: 'text', text: noteTitle, styles: { bold: true } }] : [])
      ],
      id: `note-${Date.now()}`
    } as any;

    const toSplitStructure = (content: string): { left: any[]; right?: any[]; splitView: boolean } => {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && parsed.leftContent !== undefined) {
          return {
            left: JSON.parse(parsed.leftContent || '[]'),
            right: parsed.rightContent ? JSON.parse(parsed.rightContent) : [],
            splitView: !!parsed.splitView
          };
        }
        return { left: Array.isArray(parsed) ? parsed : [], splitView: false } as any;
      } catch {
        return { left: [], splitView: false } as any;
      }
    };

    const fromSplitStructure = (left: any[], right?: any[], splitView: boolean = false): string => {
      if (splitView) {
        return JSON.stringify({ leftContent: JSON.stringify(left), rightContent: JSON.stringify(right || []), splitView });
      }
      return JSON.stringify(left);
    };

    if (richNote) {
      const { left, right, splitView } = toSplitStructure(richNote.richContent?.markdown || richNote.content || '[]');
      left.push(block);
      const newContent = fromSplitStructure(left, right, splitView);
      await saveRichNoteVersion(richNote.id, newContent);
      return richNote.id;
    }

    // Create new rich note for this source
    const noteBlocks = [block, { type: 'paragraph', content: [], id: `note-${Date.now()}-2` }];
    const content = JSON.stringify(noteBlocks);
    const newCard: WorkspaceCardLike = {
      id: `rich-note-${Date.now()}`,
      type: 'richNote',
      title: noteTitle || 'Rich Note',
      content,
      position: { x: source.position.x + source.size.width + 50, y: source.position.y },
      size: { width: 600, height: 400 },
      zIndex: Math.max(...cards.map(c => c.zIndex), 0) + 1,
      richContent: {
        markdown: content,
        html: '',
        versionHistory: [{ timestamp: Date.now(), content, author: 'system' }],
        lastSaved: Date.now()
      }
    };
    await addCard(newCard);

    await addConnection({
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      sourceCardId,
      sourceAnchor: 'right',
      targetCardId: newCard.id,
      targetAnchor: 'left',
      createdAt: Date.now()
    });

    return newCard.id;
  } catch (e) {
    console.error('richNoteManager.addNoteToRichNote error:', e);
    return null;
  }
}



'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Highlighter, StickyNote, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { addNoteToRichNote as addNoteToRichNoteUtil } from '@/lib/richNoteManager';

interface HighlightData {
  id: string;
  text: string;
  note?: string;
  title?: string; // Auto-generated title from news/article context
  startOffset: number;
  endOffset: number;
  elementId: string;
  color: string;
  createdAt: Date;
  isRichNote?: boolean;
  connectedTo?: any; // Card connection data
}

interface TextHighlighterProps {
  children: React.ReactNode;
  contentId: string; // Unique identifier for the content being highlighted
  onHighlightSave?: (highlight: HighlightData) => void;
  onHighlightDelete?: (highlightId: string) => void;
  existingHighlights?: HighlightData[];
  className?: string;
  articleTitle?: string; // News headline to auto-use as note title
  connectedTo?: any; // Card connection data
}

// Returns palette depending on active theme
function getHighlightColors(): string[] {
  const isRetroLight = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('retro-light');

  if (isRetroLight) {
    // Retro Light: stronger, warmer mid-tones for better legibility
    return [
      '#F5CC66', // mustard-mid (from --primary)
      '#F29B85', // coral-mid (from --secondary)
      '#E37D74', // brick-mid (from --accent)
      '#C26474', // berry-mid (from --destructive)
      '#B07AA6', // plum-mid (from chart-5)
      '#E6D9BF', // warm beige (background accent)
    ];
  }

  // Default soft pastels
  return [
    '#fef3c7', // yellow-100
    '#dbeafe', // blue-100
    '#dcfce7', // green-100
    '#fce7f3', // pink-100
    '#fed7d7', // red-100
    '#e0e7ff', // indigo-100
  ];
}

// Generate unique highlight ID with better collision resistance
function generateUniqueHighlightId(existingIds: string[]): string {
  let id: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Use crypto.getRandomValues if available for better randomness
    const randomBytes = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(8))
      : new Uint8Array(8).map(() => Math.floor(Math.random() * 256));

    const randomString = Array.from(randomBytes)
      .map(b => b.toString(36))
      .join('')
      .substr(0, 9);

    id = `highlight_${Date.now()}_${randomString}`;
    attempts++;

    if (attempts >= maxAttempts) {
      // Fallback to even more unique ID if we can't find a unique one
      id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${attempts}`;
      break;
    }
  } while (existingIds.includes(id));

  return id;
}

// Generate automatic title from highlighted text and context
const generateAutoTitle = (selectedText: string, contextElement?: Element): string => {
  // Extract first meaningful sentence or key phrase
  const cleanText = selectedText.trim();

  // If text is short, use it as title
  if (cleanText.length <= 50) {
    return cleanText;
  }

  // Try to extract first sentence
  const firstSentence = cleanText.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length <= 80) {
    return firstSentence;
  }

  // Extract key phrase (first 60 characters with word boundary)
  const words = cleanText.split(' ');
  let title = '';
  for (const word of words) {
    if ((title + ' ' + word).length > 60) break;
    title += (title ? ' ' : '') + word;
  }

  return title || cleanText.substring(0, 50) + '...';
};

export const TextHighlighter = React.forwardRef<{
  removeHighlightFromDOM: (highlightId: string) => void;
}, TextHighlighterProps>(function TextHighlighter({
  children,
  contentId,
  onHighlightSave,
  onHighlightDelete,
  existingHighlights = [],
  className,
  articleTitle,
  connectedTo
}, ref) {
  const [highlights, setHighlights] = useState<HighlightData[]>(existingHighlights);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(getHighlightColors()[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addCard, cards, addConnection, connections, saveRichNoteVersion } = useWorkspaceStore() as any;

  // Sync with external highlights changes
  useEffect(() => {
    setHighlights(existingHighlights);
  }, [existingHighlights]);

  // Load highlights from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`highlights_${contentId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHighlights(parsed.map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt)
        })));
      }
    } catch (error) {
      console.warn('Failed to load highlights:', error);
    }
  }, [contentId]);

  // Save highlights to localStorage
  const saveHighlights = useCallback((newHighlights: HighlightData[]) => {
    try {
      localStorage.setItem(`highlights_${contentId}`, JSON.stringify(newHighlights));
    } catch (error) {
      console.warn('Failed to save highlights:', error);
    }
  }, [contentId]);

  // Handle text selection
  const handleSelection = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectedText('');
        setSelectionRange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (selectedText.length > 0 && containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(selectedText);
        setSelectionRange(range);

        // Text selected for highlighting
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    }, 10);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    handleSelection();
  }, [handleSelection]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handleSelection();
  }, [handleSelection]);



  // Add highlight
  const saveHighlight = useCallback(() => {
    if (!selectionRange || !selectedText) return;

    // Check for duplicate highlights with same text in same position
    const existingHighlight = highlights.find(h =>
      h.text === selectedText &&
      h.elementId === contentId &&
      h.startOffset === (() => {
        const range = selectionRange.cloneRange();
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(containerRef.current!);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        return preCaretRange.toString().length;
      })()
    );

    if (existingHighlight) {
      console.warn('Highlight already exists for this selection');
      return;
    }

    const existingIds = highlights.map(h => h.id);
    const highlightId = generateUniqueHighlightId(existingIds);

    // Get text offsets for persistence
    const range = selectionRange.cloneRange();
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(containerRef.current!);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preCaretRange.toString().length;

    const highlight: HighlightData = {
      id: highlightId,
      text: selectedText,
      note: '', // Empty note - regular highlight
      title: generateAutoTitle(selectedText),
      startOffset,
      endOffset: startOffset + selectedText.length,
      elementId: contentId,
      color: selectedColor,
      createdAt: new Date(),
      isRichNote: false, // Regular highlight, not a rich note
      connectedTo: connectedTo
    };

    const newHighlights = [...highlights, highlight];
    setHighlights(newHighlights);
    saveHighlights(newHighlights);

    // Apply visual highlight
    applyHighlightToDOM(highlight);

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionRange(null);

    // Notify parent
    onHighlightSave?.(highlight);
  }, [selectionRange, selectedText, selectedColor, highlights, saveHighlights, contentId, connectedTo, onHighlightSave, generateAutoTitle]);

  // Apply highlight to DOM
  const applyHighlightToDOM = useCallback((highlight: HighlightData) => {
    if (!containerRef.current) return;

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let nodes: { node: Text; start: number; end: number }[] = [];

    let node = walker.nextNode();
    while (node) {
      const textLength = node.textContent?.length || 0;
      const nodeStart = currentOffset;
      const nodeEnd = currentOffset + textLength;

      if (nodeStart < highlight.endOffset && nodeEnd > highlight.startOffset) {
        nodes.push({
          node: node as Text,
          start: Math.max(0, highlight.startOffset - nodeStart),
          end: Math.min(textLength, highlight.endOffset - nodeStart)
        });
      }

      currentOffset += textLength;
      node = walker.nextNode();
    }

    // Apply highlights to found nodes
    nodes.forEach(({ node, start, end }) => {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);

      const mark = document.createElement('mark');
      mark.style.backgroundColor = highlight.color;
      mark.style.padding = '2px 0';
      mark.style.borderRadius = '2px';
      mark.className = `highlight-${highlight.id}`;
      mark.title = highlight.note || highlight.text;

      try {
        range.surroundContents(mark);
      } catch (error) {
        // Fallback: insert before and remove original text
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
    });
  }, []);

  // Remove highlight
  const removeHighlight = useCallback((highlightId: string) => {
    const newHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(newHighlights);
    saveHighlights(newHighlights);

    // Remove from DOM
    const marks = containerRef.current?.querySelectorAll(`.highlight-${highlightId}`);
    marks?.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        // Replace mark with its contents
        const fragment = document.createDocumentFragment();
        while (mark.firstChild) {
          fragment.appendChild(mark.firstChild);
        }
        parent.replaceChild(fragment, mark);
      }
    });

    onHighlightDelete?.(highlightId);
  }, [highlights, saveHighlights, onHighlightDelete]);

  // Create a rich note card with selected text and article title
  const createRichNote = useCallback(async () => {
    if (!selectionRange || !selectedText) return;

    try {
      // Get current card position for positioning the rich note
      const currentCard = cards.find(c => c.id === contentId);
      if (!currentCard) {
        console.error('Source card not found for rich note creation');
        return;
      }

      // Create rich note title from article title or selected text
      const noteTitle = articleTitle || generateAutoTitle(selectedText);
      
      // Create rich note content with selected text
      const richNoteContent = JSON.stringify([
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `"${selectedText}"`, styles: { italic: true } },
            { type: 'text', text: ' - ' },
            { type: 'text', text: noteTitle, styles: { bold: true } }
          ],
          id: `note-${Date.now()}`
        },
        {
          type: 'paragraph',
          content: [],
          id: `note-${Date.now()}-2`
        }
      ]);

      // Create rich note card
      const richNoteCard = {
        id: `rich-note-${Date.now()}`,
        type: 'richNote' as const,
        title: noteTitle,
        content: richNoteContent,
        position: {
          x: currentCard.position.x + currentCard.size.width + 50, // Position to the right
          y: currentCard.position.y,
        },
        size: { width: 600, height: 400 },
        zIndex: Math.max(...cards.map(c => c.zIndex), 0) + 1,
        richContent: {
          markdown: richNoteContent,
          html: '',
          versionHistory: [{
            timestamp: Date.now(),
            content: richNoteContent,
            author: 'system'
          }],
          lastSaved: Date.now(),
        }
      };

      // Instead of always creating a new card, append to existing per-source rich note
      const richId = await addNoteToRichNoteUtil({
        sourceCardId: contentId,
        noteText: selectedText,
        noteTitle: noteTitle,
        cards: cards as any,
        connections: connections as any,
        addCard: addCard as any,
        addConnection: addConnection as any,
        saveRichNoteVersion: saveRichNoteVersion as any,
      });

      // Also create a highlight for visual reference
      const existingIds = highlights.map(h => h.id);
      const highlightId = generateUniqueHighlightId(existingIds);

      const range = selectionRange.cloneRange();
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(containerRef.current!);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preCaretRange.toString().length;

      const highlight: HighlightData = {
        id: highlightId,
        text: selectedText,
        note: `Connected to Rich Note: ${noteTitle}`,
        title: noteTitle,
        startOffset,
        endOffset: startOffset + selectedText.length,
        elementId: contentId,
        color: selectedColor,
        createdAt: new Date(),
        isRichNote: true, // Mark as rich note highlight
        connectedTo: richId ? { type: 'richNote', cardId: richId, title: noteTitle } : undefined
      };

      const newHighlights = [...highlights, highlight];
      setHighlights(newHighlights);
      saveHighlights(newHighlights);

      // Apply visual highlight
      applyHighlightToDOM(highlight);

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setSelectionRange(null);

      // Notify parent
      onHighlightSave?.(highlight);

      console.log('✅ Rich Note created successfully:', richNoteCard);

    } catch (error) {
      console.error('❌ Error creating rich note:', error);
    }
  }, [selectionRange, selectedText, articleTitle, selectedColor, highlights, saveHighlights, contentId, connectedTo, onHighlightSave, generateAutoTitle, generateUniqueHighlightId, addCard, cards, applyHighlightToDOM]);

  // Apply existing highlights on mount
  useEffect(() => {
    highlights.forEach(highlight => {
      applyHighlightToDOM(highlight);
    });
  }, [highlights, applyHighlightToDOM]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    removeHighlightFromDOM: (highlightId: string) => {
      // Remove from DOM
      const marks = containerRef.current?.querySelectorAll(`.highlight-${highlightId}`);
      marks?.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          // Replace mark with its contents
          const fragment = document.createDocumentFragment();
          while (mark.firstChild) {
            fragment.appendChild(mark.firstChild);
          }
          parent.replaceChild(fragment, mark);
        }
      });
    }
  }), []);

  // Global selection listener as fallback
  useEffect(() => {
    const handleGlobalSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (selectedText.length > 0 && containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(selectedText);
        setSelectionRange(range);
      }
    };

    document.addEventListener('selectionchange', handleGlobalSelection);
    return () => document.removeEventListener('selectionchange', handleGlobalSelection);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={handleTouchEnd}
        className="relative select-text cursor-text"
      >
        {children}
      </div>

      {/* Selection Toolbar */}
      {selectedText && (
        <div className="fixed z-[9999] bg-background border rounded-lg shadow-xl p-2 flex flex-wrap items-center gap-2 animate-in fade-in-0 zoom-in-95 max-w-md"
             style={{
               left: '50%',
               top: '35%',
               transform: 'translate(-50%, -50%)',
               boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
             }}>
          <div className="flex items-center gap-2 w-full">
            <Highlighter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium flex-1">Highlight selected text</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 flex-wrap justify-center w-full">
            {getHighlightColors().map((color) => (
              <button
                key={color}
                className={cn(
                  'w-6 h-6 rounded border-2 transition-all',
                  selectedColor === color ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={`Select ${color} color`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 w-full justify-center">
            <Button size="sm" onClick={() => {
              // Create rich note with selected text and article title
              createRichNote();
            }}>
              <StickyNote className="h-4 w-4 mr-1" />
              Add Note
            </Button>

            <Button size="sm" variant="outline" onClick={saveHighlight}>
              <Highlighter className="h-4 w-4 mr-1" />
              Highlight
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.getSelection()?.removeAllRanges();
                setSelectedText('');
                setSelectionRange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}


    </div>
  );
});

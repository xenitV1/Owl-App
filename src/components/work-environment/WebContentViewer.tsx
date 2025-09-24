'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Globe,
  Clock
} from 'lucide-react';
import { useWebTypography } from '@/hooks/useWebTypography';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { addNoteToRichNote as addNoteToRichNoteUtil } from '@/lib/richNoteManager';
import { TextHighlighter } from './TextHighlighter';
import { HighlightsPanel } from './HighlightsPanel';
import { useLoadingMessages } from '@/hooks/useLoadingMessages';
import { useTranslations } from 'next-intl';
import { AISummary } from './AISummary';

// Web Content Viewer Component
interface WebContentViewerProps {
  url: string;
  title?: string;
  cardId: string;
  connectedTo?: any;
}


function WebContentViewer({ url, title, cardId, connectedTo }: WebContentViewerProps) {
  const t = useTranslations();

  // Typography hook
  const {
    textSpacing,
    fontSize,
    selectedFont,
    wordSpacing,
    setTextSpacing,
    setFontSize,
    setSelectedFont,
    setWordSpacing,
    getTypographyStyles,
    FONT_OPTIONS
  } = useWebTypography();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAISummary, setShowAISummary] = useState(true);
  const [highlights, setHighlights] = useState<any[]>([]);
  const textHighlighterRef = useRef<any>(null);
  const { addCard, cards, addConnection, connections, saveRichNoteVersion } = useWorkspaceStore() as any;

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: ['connecting', 'fetching', 'analyzing', 'preparing', 'optimizing'],
    interval: 1200
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/web-content?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        setContent(data);
      } catch (err: any) {
        console.error('Error fetching web content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url]);

  // Load highlights from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`highlights_${cardId}`);
      if (saved) {
        const parsed = JSON.parse(saved).map((h: any) => ({
          ...h,
          createdAt: new Date(h.createdAt)
        }));
        setHighlights(parsed);
      }
    } catch (error) {
      console.warn('Failed to load highlights:', error);
    }
  }, [cardId]);

  // Save highlights to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(`highlights_${cardId}`, JSON.stringify(highlights));
    } catch (error) {
      console.warn('Failed to save highlights:', error);
    }
  }, [highlights, cardId]);

  // Highlight management functions
  const handleHighlightSave = useCallback((highlight: any) => {
    setHighlights(prev => [...prev, highlight]);
  }, []);

  const handleHighlightDelete = useCallback((highlightId: string) => {
    // Remove from state
    setHighlights(prev => prev.filter(h => h.id !== highlightId));

    // Remove from DOM
    textHighlighterRef.current?.removeHighlightFromDOM(highlightId);
  }, []);

  const handleAddNote = useCallback(async (highlightId?: string) => {
    if (highlightId) {
      // Find the highlight and create a rich note from it
      const highlight = highlights.find(h => h.id === highlightId);
      if (!highlight) return;

      try {
        // Get current card position for positioning the rich note
        const currentCard = cards.find(c => c.id === cardId);
        if (!currentCard) {
          console.error('Source card not found for rich note creation');
          return;
        }

        // Create rich note title from article title or highlight text
        const noteTitle = title || highlight.title || highlight.text.substring(0, 50) + '...';

        // Create rich note content with highlight text
        const richNoteContent = JSON.stringify([
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: `"${highlight.text}"`, styles: { italic: true } },
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

        // Append to existing per-source rich note or create one if absent
        await addNoteToRichNoteUtil({
          sourceCardId: cardId,
          noteText: highlight.text,
          noteTitle: noteTitle,
          cards: cards as any,
          connections: connections as any,
          addCard: addCard as any,
          addConnection: addConnection as any,
          saveRichNoteVersion: saveRichNoteVersion as any,
        });

        // Update the highlight to mark it as connected to rich note
        setHighlights(prev => prev.map(h =>
          h.id === highlightId
            ? {
                ...h,
                isRichNote: true,
                note: `Connected to Rich Note: ${noteTitle}`,
                connectedTo: {
                  type: 'richNote',
                  cardId: richNoteCard.id,
                  title: noteTitle
                }
              }
            : h
        ));

        console.log('✅ Rich Note updated from highlight');

      } catch (error) {
        console.error('❌ Error creating rich note from highlight:', error);
      }
    } else {
      // Show a brief message to guide the user
      alert('Please select text in the article to create a highlight and add a note.');
    }
  }, [highlights, title, cardId, addCard, cards]);

  // Render structured content
  const renderStructuredContent = (structuredContent: any[], isFullContent: boolean) => {
    if (!structuredContent) return null;

    const elements: React.ReactElement[] = [];
    let itemCount = 0;
    const maxItems = isFullContent ? structuredContent.length : 8; // Show first 8 items initially

    for (const item of structuredContent) {
      if (itemCount >= maxItems) break;

      switch (item.type) {
        case 'heading':
          const headingLevel = Math.min(item.level || 1, 4);
          const headingFontSize = headingLevel === 1 ? fontSize + 8 :
                                   headingLevel === 2 ? fontSize + 4 :
                                   headingLevel === 3 ? fontSize + 2 : fontSize;

          const headingStyles = getTypographyStyles('heading');
          headingStyles.fontSize = `${headingFontSize}px`;
          headingStyles.wordSpacing = `${wordSpacing * 0.5}px`; // Headings have less word spacing

          const HeadingComponent = React.createElement(
            `h${headingLevel}`,
            {
              key: itemCount,
              className: `font-bold mt-6 mb-3 text-foreground`,
              style: headingStyles
            },
            item.content
          );
          elements.push(HeadingComponent);
          break;

        case 'paragraph':
          elements.push(
            <p
              key={itemCount}
              className="text-foreground/90 mb-4"
              style={getTypographyStyles('paragraph')}
            >
              {item.content}
            </p>
          );
          break;

        case 'list':
          elements.push(
            <ul key={itemCount} className="list-disc list-inside mb-4 space-y-1 text-foreground/90">
              {item.items?.map((listItem: string, listIndex: number) => (
                <li
                  key={listIndex}
                  style={getTypographyStyles('paragraph')}
                >
                  {listItem}
                </li>
              ))}
            </ul>
          );
          break;

        case 'quote':
          elements.push(
            <blockquote
              key={itemCount}
              className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4"
              style={getTypographyStyles('quote')}
            >
              {item.content}
            </blockquote>
          );
          break;

        case 'image':
          elements.push(
            <div key={itemCount} className="mb-6">
              <img
                src={item.src}
                alt={item.alt || item.content}
                className="w-full max-w-lg h-auto rounded-lg shadow-sm mx-auto block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {item.alt && (
                <p className="text-xs text-muted-foreground mt-2 italic text-center">{item.alt}</p>
              )}
            </div>
          );
          break;
      }

      itemCount++;
    }

    return elements;
  };

  // Format content into readable paragraphs (fallback for non-structured content)
  const formatContent = (text: string, isFullContent: boolean = false) => {
    if (!text) return [];

    // Split by double newlines or periods followed by capital letters (simple sentence detection)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return paragraphs.map((para, index) => {
      // Clean up the paragraph
      const cleaned = para.trim();

      // If not showing full content and this is beyond the first few paragraphs, skip
      if (!isFullContent && index >= 3 && cleaned.length > 100) {
        return null;
      }

      return cleaned;
    }).filter(Boolean);
  };

  const displayContent = content?.content || '';
  const hasStructuredContent = content?.structuredContent && content.structuredContent.length > 0;
  const structuredElements = hasStructuredContent ? renderStructuredContent(content.structuredContent, showFullContent) : null;
  const paragraphs = !hasStructuredContent ? formatContent(displayContent, showFullContent) : [];
  const hasMoreContent = hasStructuredContent
    ? (content?.structuredContent?.length || 0) > 8
    : formatContent(displayContent, true).length > paragraphs.length;

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">🌐</span>
              {title || (loading ? currentMessage : t('common.loading'))}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Web Content
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{currentMessage || t('loading.loadingContent')}</p>
          </div>
        </CardContent>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">🌐</span>
              {title || 'Web Page'}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Web Content
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Unable to load content
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Browser
            </Button>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{content?.title || title || 'Web Page'}</div>
              {content?.siteName && (
                <div className="text-xs text-muted-foreground truncate">{content.siteName}</div>
              )}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Web Content
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="p-4 space-y-4 min-w-[280px]">
                  {/* AI Summary Toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">AI Summary</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAISummary(v => !v)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-7 px-2 text-xs"
                    >
                      {showAISummary ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {/* Font Selection */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Font Family
                    </label>
                    <Select
                      value={selectedFont}
                      onValueChange={(value) => setSelectedFont(value)}
                    >
                      <SelectTrigger
                        className="w-full h-8"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.css }}>{font.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Font Size: {fontSize}px
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="10"
                        max="24"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10px</span>
                        <span className="font-medium">{fontSize}px</span>
                        <span>24px</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Line Spacing: {textSpacing.toFixed(1)}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1.2"
                        max="2.5"
                        step="0.1"
                        value={textSpacing}
                        onChange={(e) => setTextSpacing(parseFloat(e.target.value))}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Narrow</span>
                        <span className="font-medium">{textSpacing.toFixed(1)}</span>
                        <span>Wide</span>
                      </div>
                    </div>
                  </div>

                  {/* Word Spacing */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Word Spacing: {wordSpacing}px
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="-2"
                        max="8"
                        step="0.5"
                        value={wordSpacing}
                        onChange={(e) => setWordSpacing(parseFloat(e.target.value))}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tight</span>
                        <span className="font-medium">{wordSpacing}px</span>
                        <span>Wide</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {content?.author && (
          <div className="text-xs text-muted-foreground">
            By {content.author}
            {content?.publishedTime && (
              <span className="ml-2">
                • {new Date(content.publishedTime).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <div className="flex gap-6 h-full">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto space-y-6">
            {/* Featured Image */}
            {content?.image && (
              <div className="w-full">
                <img
                  src={content.image}
                  alt={content.title}
                  className="w-full h-auto max-h-64 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Article Excerpt */}
            {showAISummary && (
              <AISummary text={content?.content || ''} sentenceCount={5} minChars={500} />
            )}

            {/* Main Content */}
            <div className="space-y-4">
              <TextHighlighter
                ref={textHighlighterRef}
                contentId={cardId}
                onHighlightSave={handleHighlightSave}
                onHighlightDelete={handleHighlightDelete}
                existingHighlights={highlights}
                className="space-y-4"
                articleTitle={title}
                connectedTo={connectedTo}
              >
                {hasStructuredContent && structuredElements ? (
                  <div className="max-w-none">
                    {structuredElements}

                    {/* Show More/Less Button */}
                    {hasMoreContent && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFullContent(!showFullContent)}
                          className="text-primary hover:text-primary/80"
                        >
                          {showFullContent ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Read More
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : paragraphs.length > 0 ? (
                  <div className="space-y-4 max-w-none">
                    {paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-foreground/90"
                        style={getTypographyStyles('paragraph')}
                      >
                        {paragraph}
                      </p>
                    ))}

                    {/* Show More/Less Button */}
                    {hasMoreContent && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFullContent(!showFullContent)}
                          className="text-primary hover:text-primary/80"
                        >
                          {showFullContent ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Read More
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No readable content available</p>
                  </div>
                )}
              </TextHighlighter>
            </div>

            {/* Article Meta Information */}
            <div className="pt-6 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {content?.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{content.author}</span>
                  </div>
                )}
                {content?.publishedTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(content.publishedTime).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate flex-1"
                >
                  {content?.siteName || new URL(url).hostname}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Highlights Panel */}
          <HighlightsPanel
            highlights={highlights}
            onRemoveHighlight={handleHighlightDelete}
            onAddNote={handleAddNote}
          />
        </div>
      </CardContent>
    </div>
  );
}

export { WebContentViewer };
export type { WebContentViewerProps };

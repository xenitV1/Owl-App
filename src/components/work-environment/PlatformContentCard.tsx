'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  Hash,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Bookmark,
  ExternalLink,
  Filter,
  Play,
  Edit,
  User,
  Globe
} from 'lucide-react';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { useWebTypography } from '@/hooks/useWebTypography';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';
import { addNoteToRichNote as addNoteToRichNoteUtil } from '@/lib/richNoteManager';
import { TextHighlighter } from './TextHighlighter';
import { HighlightsPanel } from './HighlightsPanel';
import { useLoadingMessages } from '@/hooks/useLoadingMessages';
import { useTranslations } from 'next-intl';

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
  const [showSettings, setShowSettings] = useState(false);
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
            {content?.excerpt && content.excerpt !== content.content && (
              <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary/20">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {content.excerpt}
                </p>
              </div>
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

interface PlatformContentCardProps {
  cardId: string;
  cardData?: any; // Card data from workspace store
  config?: {
    contentType: 'posts' | 'communities' | 'users' | 'trending' | 'following' | 'discover';
    filters?: {
      subject?: string;
      communityId?: string;
      userId?: string;
      search?: string;
    };
    refreshInterval?: number; // in minutes
    autoRefresh?: boolean;
  };
}

interface Post {
  id: string;
  title: string;
  content?: string;
  subject?: string;
  image?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    school?: string;
    grade?: string;
  };
  community?: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
    pools: number;
  };
}

interface Community {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  _count: {
    members: number;
    posts: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface ApiResponse {
  type: string;
  data: Post[] | Community[] | User[] | any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function PlatformContentCard({ cardId, cardData, config }: PlatformContentCardProps) {
  const t = useTranslations();

  const [contentType, setContentType] = useState(config?.contentType || 'posts');
  const [data, setData] = useState<Post[] | Community[] | User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(config?.filters || {});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(config?.autoRefresh || false);
  const [refreshInterval, setRefreshInterval] = useState(config?.refreshInterval || 5);

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: ['fetching', 'processing', 'analyzing', 'preparing', 'optimizing'],
    interval: 1000
  });

  // Check if this card contains video content
  const isVideoCard = cardData?.content && typeof cardData.content === 'string' &&
    (() => {
      try {
        const parsed = JSON.parse(cardData.content);
        return parsed.videoType && (parsed.videoUrl || parsed.videoFile);
      } catch {
        return false;
      }
    })();

  // Check if this card contains web content
  const isWebCard = cardData?.content && typeof cardData.content === 'string' &&
    (() => {
      try {
        const parsed = JSON.parse(cardData.content);
        return parsed.webUrl && parsed.webTitle;
      } catch {
        return false;
      }
    })();

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: contentType,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Only add filters if they have values
      if (filters.search) params.append('search', filters.search);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.communityId) params.append('communityId', filters.communityId);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(`/api/platform-content?${params}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result: ApiResponse = await response.json();
      
      // Handle different data structures
      let dataArray: any[] = [];
      if (Array.isArray(result.data)) {
        dataArray = result.data;
      } else if (result.data && typeof result.data === 'object') {
        // For discover type, we might have nested data
        if (result.type === 'discover' && result.data.recentPosts) {
          dataArray = result.data.recentPosts;
        } else {
          dataArray = [];
        }
      }
      
      setData(dataArray);
      setPagination(result.pagination);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [contentType, pagination.limit, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh with proper cleanup
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchData(pagination.page);
    }, refreshInterval * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, pagination.page, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleContentTypeChange = (newType: string) => {
    setContentType(newType as any);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{post.author.name}</span>
              {post.author.role !== 'STUDENT' && (
                <Badge variant="secondary" className="text-xs">
                  {post.author.role}
                </Badge>
              )}
              {post.community && (
                <Badge variant="outline" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {post.community.name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
            {post.content && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {post.content}
              </p>
            )}
            {post.subject && (
              <Badge variant="outline" className="text-xs mb-2">
                {post.subject}
              </Badge>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post._count.comments}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                {post._count.pools}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCommunity = (community: Community) => (
    <Card key={community.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={community.avatar} />
            <AvatarFallback>
              <Hash className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{community.name}</h3>
            {community.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {community.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {community._count.members} members
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {community._count.posts} posts
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(community.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUser = (user: User) => (
    <Card key={user.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{user.name}</span>
              {user.role !== 'STUDENT' && (
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              )}
              {user.isVerified && (
                <Badge variant="default" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            {user.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              {user.school && <span>{user.school}</span>}
              {user.grade && <span>{user.grade}</span>}
              {user.favoriteSubject && (
                <Badge variant="outline" className="text-xs">
                  {user.favoriteSubject}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{user._count.posts} posts</span>
              <span>{user._count.followers} followers</span>
              <span>{user._count.following} following</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If no pattern matches, try to extract from query parameters
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v');
    } catch {
      return null;
    }
  };

  // Extract Spotify embed URL from Spotify URL
  const extractSpotifyEmbedUrl = (url: string): string | null => {
    const patterns = [
      /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const [, type, id] = match;
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    }

    return null;
  };

  const renderVideoContent = () => {
    if (!isVideoCard || !cardData?.content) return null;

    try {
      const mediaData = JSON.parse(cardData.content);
      const { videoType, videoUrl, videoFile, videoTitle, connectedTo } = mediaData;

      return (
        <div className="w-full h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">
                  {videoType === 'spotify' ? '🎵' :
                   videoType === 'youtube' ? '▶️' : '🎬'}
                </span>
                {videoTitle || (videoType === 'spotify' ? 'Spotify' :
                               videoType === 'youtube' ? 'YouTube Video' : 'Video')}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {videoType === 'spotify' ? 'Spotify' :
                 videoType === 'youtube' ? 'YouTube' :
                 videoType === 'direct' ? 'Video URL' : 'Local File'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="w-full bg-muted rounded-md overflow-hidden relative" style={{ height: videoType === 'spotify' ? '352px' : 'auto', aspectRatio: videoType === 'spotify' ? 'auto' : '16/9' }}>
              {videoType === 'youtube' && videoUrl && (
                <>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeVideoId(videoUrl) || 'dQw4w9WgXcQ'}?rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title="YouTube Video"
                    onError={(e) => {
                      const target = e.target as HTMLIFrameElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.youtube-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                  <div className="youtube-fallback absolute inset-0 items-center justify-center bg-muted/50 hidden flex-col">
                    <div className="text-center p-4">
                      <Play className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        YouTube Video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Video may be blocked by privacy settings
                      </p>
                      <a
                        href={videoUrl.startsWith('http') ? videoUrl : `https://www.youtube.com/watch?v=${videoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Open in YouTube
                      </a>
                    </div>
                  </div>
                </>
              )}
              {videoType === 'spotify' && videoUrl && (
                <iframe
                  src={extractSpotifyEmbedUrl(videoUrl) || 'https://open.spotify.com/embed/playlist/2VLBh9qpGUB7a6hQxIdGtw'}
                  className="w-full h-full"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify"
                />
              )}
              {videoType === 'direct' && videoUrl && (
                <VideoPlayer src={videoUrl} />
              )}
              {videoType === 'file' && videoFile && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Play className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Local video file: {videoFile}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Local file playback not supported in this view
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      );
    } catch (error) {
      console.error('Error parsing video data:', error);
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-500">Error loading video content</p>
          </div>
        </div>
      );
    }
  };

  const renderWebContent = () => {
    if (!isWebCard || !cardData?.content) return null;

    try {
      const webData = JSON.parse(cardData.content);
      const { webUrl, webTitle, connectedTo } = webData;

      return (
        <WebContentViewer
          url={webUrl}
          title={webTitle}
          cardId={cardId}
          connectedTo={connectedTo}
        />
      );
    } catch (error) {
      console.error('Error parsing web data:', error);
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-500">Error loading web content</p>
          </div>
        </div>
      );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">{currentMessage || t('common.loading')}</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(pagination.page)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-2">No content found</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchData(pagination.page)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.map((item: any) => {
          if (contentType === 'posts') return renderPost(item);
          if (contentType === 'communities') return renderCommunity(item);
          if (contentType === 'users') return renderUser(item);
          return null;
        })}
        
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchData(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchData(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  // If this is a video card, render video content instead
  if (isVideoCard) {
    return renderVideoContent();
  }

  // If this is a web card, render web content instead
  if (isWebCard) {
    return renderWebContent();
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Platform Content</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fetchData(pagination.page)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={contentType} onValueChange={handleContentTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="posts">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Posts
                </div>
              </SelectItem>
              <SelectItem value="communities">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Communities
                </div>
              </SelectItem>
              <SelectItem value="users">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </div>
              </SelectItem>
              <SelectItem value="following">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </div>
              </SelectItem>
              <SelectItem value="discover">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Discover
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showSettings && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Search:</label>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-2 py-1 text-xs border rounded"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            {contentType === 'posts' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Subject:</label>
                <input
                  type="text"
                  placeholder="Subject filter..."
                  className="flex-1 px-2 py-1 text-xs border rounded"
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Auto Refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="text-xs"
              />
            </div>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Interval (min):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border rounded"
                />
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {renderContent()}
      </CardContent>
    </div>
  );
}

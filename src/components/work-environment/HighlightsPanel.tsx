'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Highlighter, FileText, X, ChevronLeft, ChevronRight, StickyNote, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightData {
  id: string;
  text: string;
  note?: string;
  title?: string;
  startOffset: number;
  endOffset: number;
  elementId: string;
  color: string;
  createdAt: Date;
  isRichNote?: boolean;
}

interface HighlightsPanelProps {
  highlights: HighlightData[];
  onRemoveHighlight: (highlightId: string) => void;
  onEditHighlight?: (highlightId: string) => void;
  onAddNote?: (highlightId: string) => void;
  className?: string;
}

export function HighlightsPanel({
  highlights,
  onRemoveHighlight,
  onEditHighlight,
  onAddNote,
  className
}: HighlightsPanelProps) {
  // Filter out duplicate highlights by ID to prevent React key errors
  const uniqueHighlights = highlights.filter((highlight, index, self) =>
    index === self.findIndex(h => h.id === highlight.id)
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Always show panel, but show different content when no highlights
  const hasHighlights = uniqueHighlights.length > 0;

  return (
    <div className={cn('relative h-full', className)}>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 bg-background border shadow-sm h-8 w-8 p-0"
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Panel */}
      <Card className={cn(
        'h-full transition-all duration-300 ease-in-out border-l shadow-lg',
        isCollapsed ? 'w-12' : 'w-80'
      )}>
        <CardHeader className={cn(
          'pb-3 transition-opacity duration-300',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            Highlights {hasHighlights && `(${highlights.length})`}
          </CardTitle>
        </CardHeader>

        <CardContent className={cn(
          'flex-1 transition-opacity duration-300',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}>
          {/* Ensure both vertical and horizontal scroll when content overflows */}
          <div className="max-h-[70vh] overflow-auto overflow-x-hidden overscroll-contain pr-1">
          {hasHighlights ? (
            <div className="space-y-3 pb-3">
              {uniqueHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <div className="flex-1 min-w-0">
                      {highlight.title && (
                        <h5 className="text-sm font-medium text-foreground whitespace-pre-wrap break-words break-all mb-1">
                          {highlight.title}
                        </h5>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words break-all mb-1">"{highlight.text}"</p>
                      {highlight.note && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words break-all mb-2">
                          {highlight.note}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {highlight.createdAt.toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {onAddNote && !highlight.isRichNote && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAddNote(highlight.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Add to Rich Note"
                            >
                              <StickyNote className="h-3 w-3" />
                            </Button>
                          )}
                          {onEditHighlight && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditHighlight(highlight.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              title="Edit note"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveHighlight(highlight.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            title="Remove highlight"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Highlighter className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                No Highlights Yet
              </h4>
              <p className="text-xs text-muted-foreground">
                Select text in the article to create highlights and notes
              </p>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
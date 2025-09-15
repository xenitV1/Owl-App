'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  X,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichNoteEditor } from './RichNoteEditor';
import { PomodoroTimer } from './PomodoroTimer';
import { TaskBoard } from './TaskBoard';
import { CalendarView } from './CalendarView';
import FlashcardSystem from './FlashcardSystem';
import { PlatformContentCard } from './PlatformContentCard';
import { useDragDrop } from '@/hooks/useDragDrop';
import { RssFeedCard } from './RssFeedCard';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface WorkspaceCardType {
  id: string;
  type: 'platformContent' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards' | 'rssFeed';
  title: string;
  content?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  // Rich Note specific fields
  richContent?: {
    markdown: string;
    html: string;
    versionHistory: Array<{
      timestamp: number;
      content: string;
      author?: string;
    }>;
    lastSaved: number;
  };
  // Calendar specific fields
  calendarData?: {
    events: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      description?: string;
      color: string;
      recurring?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        interval: number;
        endDate?: Date;
      };
    }>;
    view: 'month' | 'week' | 'day';
    currentDate: Date;
  };
  // Pomodoro specific fields
  pomodoroData?: {
    workDuration: number; // minutes
    breakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    currentSession: number;
    isRunning: boolean;
    isBreak: boolean;
    timeLeft: number; // seconds
    cyclesCompleted: number;
    totalFocusTime: number; // minutes
    lastStartTime?: number;
    statistics: {
      totalSessions: number;
      totalFocusTime: number;
      averageSession: number;
      longestSession: number;
    };
  };
  // Task Board specific fields
  taskBoardData?: {
    columns: Array<{
      id: string;
      title: string;
      color: string;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        dueDate?: Date;
        assignees?: string[];
        subtasks: Array<{
          id: string;
          title: string;
          completed: boolean;
        }>;
        labels: string[];
        created: Date;
        updated: Date;
      }>;
    }>;
  };
  // Flashcard specific fields
  flashcardData?: {
    totalCards: number;
    cardsDue: number;
    studyStreak: number;
    averageAccuracy: number;
    categories: string[];
    lastStudyDate?: Date;
  };
  // Platform Content specific fields
  platformContentConfig?: {
    contentType: 'posts' | 'communities' | 'users' | 'trending' | 'following' | 'discover';
    filters?: {
      subject?: string;
      communityId?: string;
      userId?: string;
      search?: string;
    };
    refreshInterval?: number;
    autoRefresh?: boolean;
  };
}

interface WorkspaceCardProps {
  card: WorkspaceCardType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorkspaceCardType>) => void;
  onDelete: () => void;
  gridSnap: boolean;
  onHover?: (isHovering: boolean) => void;
  pan?: { x: number; y: number };
  zoom?: number;
}

export const WorkspaceCard = memo(function WorkspaceCard({
  card,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  gridSnap,
  onHover,
  pan,
  zoom
}: WorkspaceCardProps) {
  const t = useTranslations('workEnvironment');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { startLinking, completeLinking, linking, connections, removeConnectionsAt } = useWorkspaceStore();

  // Use optimized drag & drop hook
  const {
    isDragging,
    style,
    handleDragStart,
  } = useDragDrop({
    id: card.id,
    position: card.position,
    onUpdate,
    gridSnap,
    gridSize: 20,
    disabled: isFullscreen,
    pan,
    zoom,
  });

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Only select if clicking on the card itself, not on buttons or content
    if (e.target === e.currentTarget) {
      onSelect();
    }
  }, [onSelect]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(false);
  }, [onHover]);

  const handleResize = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = card.size.width;
    const startHeight = card.size.height;
    const startPosX = card.position.x;
    const startPosY = card.position.y;

    const snapToGrid = (value: number) => {
      if (!gridSnap) return value;
      const gridSize = 20;
      return Math.round(value / gridSize) * gridSize;
    };

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes('right')) {
        newWidth = Math.max(200, startWidth + deltaX);
      }
      if (direction.includes('left')) {
        newWidth = Math.max(200, startWidth - deltaX);
        newX = startPosX + (startWidth - newWidth);
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(150, startHeight + deltaY);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(150, startHeight - deltaY);
        newY = startPosY + (startHeight - newHeight);
      }

      onUpdate({
        size: { 
          width: snapToGrid(newWidth), 
          height: snapToGrid(newHeight) 
        },
        position: { 
          x: snapToGrid(newX), 
          y: snapToGrid(newY) 
        }
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [card.size, card.position, onUpdate, onSelect, gridSnap]);

  const renderCardContent = useCallback(() => {
    switch (card.type) {

      case 'platformContent':
        return (
          <PlatformContentCard
            cardId={card.id}
            cardData={card}
            config={card.platformContentConfig}
          />
        );

      case 'richNote':
        return (
          <RichNoteEditor
            cardId={card.id}
            initialContent={card.richContent?.markdown || ''}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            cardId={card.id}
          />
        );

      case 'pomodoro':
        return (
          <PomodoroTimer
            cardId={card.id}
          />
        );

      case 'taskBoard':
        return (
          <TaskBoard
            cardId={card.id}
          />
        );

      case 'flashcards':
        return (
          <FlashcardSystem cardId={card.id} />
        );

      case 'rssFeed':
        return (
          <RssFeedCard cardId={card.id} cardData={card} onUpdate={onUpdate} />
        );

      default:
        return null;
    }
  }, [card.type, card.id, card.content, card.richContent?.markdown, card.platformContentConfig]);

  const renderAnchors = () => {
    const sides: Array<{ side: 'top' | 'right' | 'bottom' | 'left'; style: React.CSSProperties }> = [
      { side: 'top', style: { left: '50%', top: 0, transform: 'translate(-50%, -50%)' } },
      { side: 'right', style: { right: 0, top: '50%', transform: 'translate(50%, -50%)' } },
      { side: 'bottom', style: { left: '50%', bottom: 0, transform: 'translate(-50%, 50%)' } },
      { side: 'left', style: { left: 0, top: '50%', transform: 'translate(-50%, -50%)' } },
    ];

    const hasConn = (anchor: 'top' | 'right' | 'bottom' | 'left') =>
      connections.some(c => (c.sourceCardId === card.id && c.sourceAnchor === anchor) || (c.targetCardId === card.id && c.targetAnchor === anchor));

    const getArc = (side: 'top' | 'right' | 'bottom' | 'left') => {
      const r = 10; // radius
      switch (side) {
        case 'top':
          return `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;
        case 'bottom':
          return `M ${-r} 0 A ${r} ${r} 0 0 0 ${r} 0`;
        case 'left':
          return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r}`;
        case 'right':
          return `M 0 ${-r} A ${r} ${r} 0 0 0 0 ${r}`;
      }
    };

    return (
      <>
        {/* Neon filter once per card */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id={`neon-${card.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        {sides.map(({ side, style }) => {
          const active = hasConn(side);
          const color = active ? 'hsl(140 70% 45%)' : 'hsl(270 90% 60%)'; // green when connected, purple otherwise
          const arc = getArc(side);
          return (
            <div key={side} style={{ position: 'absolute', zIndex: 5, ...style }}>
              <svg
                width={24}
                height={24}
                viewBox="-12 -12 24 24"
                data-anchor="true"
                className="pointer-events-auto"
                style={{ filter: `url(#neon-${card.id})` }}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (linking.isActive) {
                    await completeLinking(card.id, side);
                  } else {
                    startLinking(card.id, side);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  removeConnectionsAt(card.id, side);
                }}
                role="button"
                aria-label="Connect"
              >
                <path d={arc} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
              </svg>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <Card
      ref={cardRef}
      data-workspace-card="true"
      data-card-id={card.id}
      data-dragging={isDragging ? 'true' : undefined}
      className={cn(
        'absolute bg-background border-2 transition-all duration-200 overflow-hidden',
        isSelected ? 'border-primary shadow-lg' : 'border-border',
        isDragging ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-auto',
        isFullscreen && 'fixed inset-4 z-50',
        isResizing && 'cursor-resize',
        'hover:shadow-md hover:border-primary/50'
      )}
      style={{
        left: isFullscreen ? undefined : card.position.x,
        top: isFullscreen ? undefined : card.position.y,
        width: isFullscreen ? undefined : card.size.width,
        height: isFullscreen ? undefined : card.size.height,
        zIndex: isFullscreen ? 9999 : card.zIndex,
        ...style,
      }}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
        <div 
          className="drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-move select-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <Move className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{card.title}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="h-6 w-6 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Anchors */}
      {renderAnchors()}

      {/* Card Body */}
      <div className="w-full h-full">
        {renderCardContent()}
      </div>

      {/* Resize Handles */}
      {isSelected && !isFullscreen && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-background cursor-nw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize('top-left', e)}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-background cursor-ne-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize('top-right', e)}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-background cursor-sw-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize('bottom-left', e)}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-background cursor-se-resize hover:bg-primary/80 transition-colors"
            onMouseDown={(e) => handleResize('bottom-right', e)}
          />

          {/* Edge handles */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-primary/80 cursor-n-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleResize('top', e)}
          />
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-primary/80 cursor-s-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleResize('bottom', e)}
          />
          <div
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-primary/80 cursor-w-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleResize('left', e)}
          />
          <div
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-primary/80 cursor-e-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleResize('right', e)}
          />
        </>
      )}
    </Card>
  );
});
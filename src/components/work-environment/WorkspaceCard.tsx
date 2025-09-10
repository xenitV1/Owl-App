'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

interface WorkspaceCardType {
  id: string;
  type: 'platformContent' | 'note' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards';
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
}

interface WorkspaceCardProps {
  card: WorkspaceCardType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorkspaceCardType>) => void;
  onDelete: () => void;
  gridSnap: boolean;
}

export function WorkspaceCard({
  card,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  gridSnap
}: WorkspaceCardProps) {
  const t = useTranslations('workEnvironment');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);

  const snapToGrid = useCallback((value: number) => {
    if (!gridSnap) return value;
    const gridSize = 20;
    return Math.round(value / gridSize) * gridSize;
  }, [gridSnap]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      e.preventDefault();
      onSelect();
      setIsDragging(true);
      
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  }, [onSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && cardRef.current) {
      const parent = cardRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const newX = snapToGrid(e.clientX - parentRect.left - dragOffset.x);
      const newY = snapToGrid(e.clientY - parentRect.top - dragOffset.y);

      onUpdate({
        position: { x: newX, y: newY }
      });
    }
  }, [isDragging, dragOffset, onUpdate, snapToGrid]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
  }, [card.size, card.position, onUpdate, onSelect, snapToGrid]);


  const renderCardContent = () => {
    switch (card.type) {
      case 'note':
        return (
          <div className="w-full h-full p-4 overflow-auto">
            <div className="prose prose-sm max-w-none">
              {card.content || 'Empty note'}
            </div>
          </div>
        );

      case 'platformContent':
        return (
          <div className="w-full h-full p-4 overflow-auto">
            <div className="text-sm text-muted-foreground text-center">
              Platform content integration coming soon...
            </div>
          </div>
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
          <FlashcardSystem />
        );

      default:
        return null;
    }
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'absolute bg-background border-2 transition-all duration-200 overflow-hidden',
        isSelected ? 'border-primary shadow-lg' : 'border-border',
        isDragging ? 'cursor-grabbing' : 'cursor-auto',
        isFullscreen && 'fixed inset-4 z-50'
      )}
      style={{
        left: isFullscreen ? undefined : card.position.x,
        top: isFullscreen ? undefined : card.position.y,
        width: isFullscreen ? undefined : card.size.width,
        height: isFullscreen ? undefined : card.size.height,
        zIndex: isFullscreen ? 9999 : card.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Card Header */}
      <div className="drag-handle flex items-center justify-between p-2 bg-muted/30 border-b cursor-move">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Move className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{card.title}</span>
        </div>
        
        <div className="flex items-center gap-1">
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
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
            onClick={onDelete}
            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 relative" style={{ height: 'calc(100% - 45px)' }}>
        {renderCardContent()}
      </div>

      {/* Resize Handles */}
      {isSelected && !isFullscreen && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-background cursor-nw-resize"
            onMouseDown={(e) => handleResize('top-left', e)}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-background cursor-ne-resize"
            onMouseDown={(e) => handleResize('top-right', e)}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-background cursor-sw-resize"
            onMouseDown={(e) => handleResize('bottom-left', e)}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-background cursor-se-resize"
            onMouseDown={(e) => handleResize('bottom-right', e)}
          />

          {/* Edge handles */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-primary/80 cursor-n-resize"
            onMouseDown={(e) => handleResize('top', e)}
          />
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-primary/80 cursor-s-resize"
            onMouseDown={(e) => handleResize('bottom', e)}
          />
          <div
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-primary/80 cursor-w-resize"
            onMouseDown={(e) => handleResize('left', e)}
          />
          <div
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-primary/80 cursor-e-resize"
            onMouseDown={(e) => handleResize('right', e)}
          />
        </>
      )}
    </Card>
  );
}

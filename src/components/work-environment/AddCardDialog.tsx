'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Newspaper, BookOpen, Calendar, Timer, Kanban, Brain } from 'lucide-react';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (cardData: {
    type: 'platformContent' | 'note' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards';
    title: string;
    content?: string;
    // Additional data for specific card types
    richContent?: any;
    calendarData?: any;
    pomodoroData?: any;
    taskBoardData?: any;
    flashcardData?: any;
  }) => void;
}

export function AddCardDialog({ open, onOpenChange, onAddCard }: AddCardDialogProps) {
  const t = useTranslations('workEnvironment');
  const [cardType, setCardType] = useState<'platformContent' | 'note' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const baseCardData = {
      type: cardType,
      title: title.trim(),
    };

    // Add type-specific initial data
    let cardData: any = { ...baseCardData };

    switch (cardType) {
      case 'note':
        if (content.trim()) {
          cardData.content = content.trim();
        }
        break;
      case 'richNote':
        cardData.richContent = {
          markdown: content || '',
          html: '',
          versionHistory: [],
          lastSaved: Date.now(),
        };
        break;
      case 'calendar':
        cardData.calendarData = {
          events: [],
          view: 'month',
          currentDate: new Date(),
        };
        break;
      case 'pomodoro':
        cardData.pomodoroData = {
          workDuration: 25, // minutes
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsUntilLongBreak: 4,
          currentSession: 1,
          isRunning: false,
          isBreak: false,
          timeLeft: 25 * 60, // seconds
          cyclesCompleted: 0,
          totalFocusTime: 0,
          lastStartTime: undefined,
          statistics: {
            totalSessions: 0,
            totalFocusTime: 0,
            averageSession: 0,
            longestSession: 0,
          },
        };
        break;
      case 'taskBoard':
        cardData.taskBoardData = {
          columns: [
            {
              id: 'todo',
              title: 'To Do',
              color: '#ef4444',
              tasks: [],
            },
            {
              id: 'in-progress',
              title: 'In Progress',
              color: '#f59e0b',
              tasks: [],
            },
            {
              id: 'done',
              title: 'Done',
              color: '#10b981',
              tasks: [],
            },
          ],
        };
        break;
      case 'flashcards':
        cardData.flashcardData = {
          totalCards: 0,
          cardsDue: 0,
          studyStreak: 0,
          averageAccuracy: 0,
          categories: [],
        };
        break;
    }

    onAddCard(cardData);

    // Reset form
    setTitle('');
    setContent('');
    setCardType('note');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setTitle('');
    setContent('');
    setCardType('note');
  };

  const isValidForm = () => {
    return title.trim() !== '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('addCard')}</DialogTitle>
          <DialogDescription>
            Create a new card for your workspace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Card Type</Label>
            <RadioGroup
              value={cardType}
              onValueChange={(value) => setCardType(value as any)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="note" />
                <Label
                  htmlFor="note"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{t('cardTypes.note')}</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="platformContent" id="platformContent" />
                <Label
                  htmlFor="platformContent"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Newspaper className="w-4 h-4" />
                  <span className="text-sm">{t('cardTypes.platformContent')}</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="richNote" id="richNote" />
                <Label
                  htmlFor="richNote"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Rich Note</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calendar" id="calendar" />
                <Label
                  htmlFor="calendar"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Calendar</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pomodoro" id="pomodoro" />
                <Label
                  htmlFor="pomodoro"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-sm">Pomodoro</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="taskBoard" id="taskBoard" />
                <Label
                  htmlFor="taskBoard"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Kanban className="w-4 h-4" />
                  <span className="text-sm">Task Board</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flashcards" id="flashcards" />
                <Label
                  htmlFor="flashcards"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-sm">Flashcards</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Card Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('cardTitle')}</Label>
            <Input
              id="title"
              type="text"
              placeholder={t('enterTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>


          {/* Note Content (only for note cards) */}
          {cardType === 'note' && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your note content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Platform Content Info */}
          {cardType === 'platformContent' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Platform content integration allows you to embed feeds, posts, and other content from this platform directly into your workspace.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValidForm()}
              className="flex-1"
            >
              {t('saveCard')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

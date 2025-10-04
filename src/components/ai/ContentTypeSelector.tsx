'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileQuestion, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentType } from '@/types/ai';

interface ContentTypeSelectorProps {
  selected?: ContentType;
  onSelect: (type: ContentType) => void;
}

export function ContentTypeSelector({ selected, onSelect }: ContentTypeSelectorProps) {
  const t = useTranslations('ai.contentTypes');

  const contentTypes: Array<{
    type: ContentType;
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = [
    {
      type: 'flashcards',
      icon: <Brain className="h-6 w-6" />,
      label: t('flashcards'),
      description: t('flashcardsDescription'),
    },
    {
      type: 'questions',
      icon: <FileQuestion className="h-6 w-6" />,
      label: t('questions'),
      description: t('questionsDescription'),
    },
    {
      type: 'notes',
      icon: <BookOpen className="h-6 w-6" />,
      label: t('notes'),
      description: t('notesDescription'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {contentTypes.map((item) => (
        <Card
          key={item.type}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selected === item.type
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/50'
          )}
          onClick={() => onSelect(item.type)}
        >
          <CardContent className="p-6">
            <div
              className={cn(
                'mb-4 p-3 rounded-lg w-fit',
                selected === item.type
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {item.icon}
            </div>
            <h3 className="font-semibold mb-2">{item.label}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


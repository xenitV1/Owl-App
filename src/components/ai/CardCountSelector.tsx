'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hash } from 'lucide-react';

interface CardCountSelectorProps {
  selected: number;
  onSelect: (count: number) => void;
  contentType: 'flashcards' | 'questions' | 'notes';
}

export function CardCountSelector({ selected, onSelect, contentType }: CardCountSelectorProps) {
  const t = useTranslations('ai.cardCount');

  // Card count options (max 20)
  const countOptions = [5, 10, 15, 20];

  // Notes don't have card count
  if (contentType === 'notes') {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Hash className="h-4 w-4" />
        {t('label')}
      </Label>
      <Select value={selected.toString()} onValueChange={(val) => onSelect(Number(val))}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {countOptions.map((count) => (
            <SelectItem key={count} value={count.toString()}>
              {count} {t('cards')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t('hint')}</p>
    </div>
  );
}


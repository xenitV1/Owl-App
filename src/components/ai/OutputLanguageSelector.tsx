'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface OutputLanguageSelectorProps {
  selected?: string;
  onSelect: (language: string) => void;
}

export function OutputLanguageSelector({ selected, onSelect }: OutputLanguageSelectorProps) {
  const t = useTranslations('ai.outputLanguage');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const commonLanguages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' },
    { value: 'custom', label: t('customLanguage') },
  ];

  const handleLanguageChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onSelect(value);
    }
  };

  const handleCustomLanguageChange = (value: string) => {
    setCustomLanguage(value);
    onSelect(value);
  };

  return (
    <div className="space-y-2">
      <Label>{t('label')}</Label>
      <Select value={isCustom ? 'custom' : selected} onValueChange={handleLanguageChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {commonLanguages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isCustom && (
        <Input
          placeholder={t('customPlaceholder')}
          value={customLanguage}
          onChange={(e) => handleCustomLanguageChange(e.target.value)}
          className="mt-2"
        />
      )}
      
      <p className="text-xs text-muted-foreground">
        {t('hint')}
      </p>
    </div>
  );
}


'use client';

import React, { useMemo } from 'react';
import { summarizeText } from '@/lib/ai/readingMode';
import { Badge } from '@/components/ui/badge';

interface AISummaryProps {
  text: string;
  sentenceCount?: number;
  minChars?: number;
}

export function AISummary({ text, sentenceCount = 3, minChars = 500 }: AISummaryProps) {
  const summary = useMemo(() => {
    // Try increasing sentence counts until reaching minChars
    const candidateCounts = Array.from(new Set([sentenceCount, 5, 8, 12, 16, 20]));
    for (const c of candidateCounts) {
      const s = summarizeText(text, c);
      if (s && s.replace(/\s+/g, ' ').trim().length >= minChars) return s;
    }

    // Fallback: extend with leading text up to nearest sentence end >= minChars
    const base = summarizeText(text, candidateCounts[candidateCounts.length - 1]);
    const combined = (base ? base + ' ' : '') + text;
    if (!combined) return '';
    const truncated = combined.substring(0, Math.min(Math.max(minChars, 500), 1200));
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    if (lastSentenceEnd > minChars * 0.6) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    return truncated;
  }, [text, sentenceCount, minChars]);

  if (!summary || summary.trim().length === 0) return null;

  return (
    <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-[10px]">AI Summary</Badge>
        <span className="text-xs text-muted-foreground">Auto-generated</span>
      </div>
      <p className="text-sm text-muted-foreground italic leading-relaxed">{summary}</p>
    </div>
  );
}



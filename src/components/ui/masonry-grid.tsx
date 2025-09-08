'use client';

import React from 'react';
import { Masonry } from 'react-plock';
import { cn } from '@/lib/utils';

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
  columns?: number | number[];
  gap?: number | number[];
  media?: number[];
  className?: string;
  useBalancedLayout?: boolean;
}

export function MasonryGrid<T>({
  items,
  renderItem,
  columns = [1, 2, 3],
  gap = [16, 16, 16],
  media = [640, 768, 1024],
  className,
  useBalancedLayout = true,
}: MasonryGridProps<T>) {
  return (
    <div className={cn("w-full", className)}>
      <Masonry
        items={items}
        config={{
          columns: columns,
          gap: gap,
          media: media,
          useBalancedLayout: useBalancedLayout,
        }}
        render={(item, idx) => renderItem(item, idx)}
      />
    </div>
  );
}

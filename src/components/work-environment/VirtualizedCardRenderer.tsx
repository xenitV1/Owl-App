'use client';

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { WorkspaceCard } from './WorkspaceCard';

interface WorkspaceCardType {
  id: string;
  type: 'platformContent' | 'richNote' | 'calendar' | 'pomodoro' | 'taskBoard' | 'flashcards' | 'rssFeed' | 'owlSearch';
  title: string;
  content?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  // ... other properties
}

interface VirtualizedCardRendererProps {
  cards: WorkspaceCardType[];
  zoom: number;
  pan: { x: number; y: number };
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
  onUpdate: (cardId: string, updates: Partial<WorkspaceCardType>) => void;
  onDelete: (cardId: string) => void;
  gridSnap: boolean;
  onCardHover: (isHovering: boolean) => void;
}

// Viewport bounds calculation
const getViewportBounds = (zoom: number, pan: { x: number; y: number }, containerSize: { width: number; height: number }) => {
  const padding = 200; // Extra padding to render cards slightly outside viewport
  return {
    left: (-pan.x - padding) / zoom,
    top: (-pan.y - padding) / zoom,
    right: (containerSize.width - pan.x + padding) / zoom,
    bottom: (containerSize.height - pan.y + padding) / zoom,
  };
};

// Check if card is in viewport
const isCardInViewport = (card: WorkspaceCardType, viewportBounds: ReturnType<typeof getViewportBounds>) => {
  const cardRight = card.position.x + card.size.width;
  const cardBottom = card.position.y + card.size.height;
  
  return !(
    cardRight < viewportBounds.left ||
    card.position.x > viewportBounds.right ||
    cardBottom < viewportBounds.top ||
    card.position.y > viewportBounds.bottom
  );
};

// Check if card is media (video/music) that should stay mounted for background playback
const isMediaCard = (card: WorkspaceCardType) => {
  if (card.type !== 'platformContent' || typeof card.content !== 'string') return false;
  try {
    const parsed = JSON.parse(card.content as unknown as string);
    return !!parsed?.videoType && (parsed.videoUrl || parsed.videoFile);
  } catch {
    return false;
  }
};

export const VirtualizedCardRenderer = memo(function VirtualizedCardRenderer({
  cards,
  zoom,
  pan,
  selectedCardId,
  onSelect,
  onUpdate,
  onDelete,
  gridSnap,
  onCardHover,
}: VirtualizedCardRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Memoize visible cards to prevent unnecessary re-renders
  const visibleCards = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return cards; // Show all cards if container size not available
    }

    const viewportBounds = getViewportBounds(zoom, pan, containerSize);
    return cards.filter(card => isMediaCard(card) || isCardInViewport(card, viewportBounds));
  }, [cards, zoom, pan, containerSize]);

  // Sort cards by z-index for proper layering
  const sortedVisibleCards = useMemo(() => {
    return [...visibleCards].sort((a, b) => a.zIndex - b.zIndex);
  }, [visibleCards]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {sortedVisibleCards.map((card) => (
        <WorkspaceCard
          key={card.id}
          card={card}
          isSelected={selectedCardId === card.id}
          onSelect={() => onSelect(card.id)}
          onUpdate={(updates) => onUpdate(card.id, updates)}
          onDelete={() => onDelete(card.id)}
          gridSnap={gridSnap}
          onHover={onCardHover}
          pan={pan}
          zoom={zoom}
        />
      ))}
    </div>
  );
});

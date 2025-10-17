"use client";

import { memo, useMemo, useRef, useEffect, useState } from "react";
import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspaceCardType {
  id: string;
  type:
    | "platformContent"
    | "richNote"
    | "calendar"
    | "pomodoro"
    | "taskBoard"
    | "flashcards"
    | "rssFeed"
    | "owlSearch"
    | "spotify";
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

// Optimized viewport bounds calculation with better performance
const getViewportBounds = (
  zoom: number,
  pan: { x: number; y: number },
  containerSize: { width: number; height: number },
) => {
  const padding = 200; // Extra padding to render cards slightly outside viewport

  // Use faster calculations
  const invZoom = 1 / zoom;
  const left = (-pan.x - padding) * invZoom;
  const top = (-pan.y - padding) * invZoom;
  const right = (containerSize.width - pan.x + padding) * invZoom;
  const bottom = (containerSize.height - pan.y + padding) * invZoom;

  return { left, top, right, bottom };
};

// Optimized card viewport check with early returns
const isCardInViewport = (
  card: WorkspaceCardType,
  viewportBounds: ReturnType<typeof getViewportBounds>,
) => {
  const { x, y } = card.position;
  const { width, height } = card.size;
  const { left, top, right, bottom } = viewportBounds;

  // Early return if card is completely outside viewport
  if (x + width < left || x > right || y + height < top || y > bottom) {
    return false;
  }

  return true;
};

// Check if card is media (video/music) that should stay mounted for background playback
const isMediaCard = (card: WorkspaceCardType) => {
  if (card.type !== "platformContent" || typeof card.content !== "string")
    return false;
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

  // Optimized container size tracking with ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // Use offsetWidth/Height for better performance and accuracy
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        // Only update if size actually changed to prevent unnecessary re-renders
        setContainerSize((prev) => {
          if (prev.width !== width || prev.height !== height) {
            return { width, height };
          }
          return prev;
        });
      }
    };

    // Initial size update
    updateSize();

    // Use ResizeObserver for better performance than resize event
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback to resize event
      window.addEventListener("resize", updateSize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateSize);
      }
    };
  }, []);

  // Optimized visible cards calculation with better memoization
  const visibleCards = useMemo(() => {
    // If container size not available, show all cards but limit for performance
    if (containerSize.width === 0 || containerSize.height === 0) {
      return cards.length > 20 ? cards.slice(0, 20) : cards;
    }

    const viewportBounds = getViewportBounds(zoom, pan, containerSize);

    // Use for loop for better performance than filter
    const visible: WorkspaceCardType[] = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (isMediaCard(card) || isCardInViewport(card, viewportBounds)) {
        visible.push(card);
      }
    }

    return visible;
  }, [cards, zoom, pan, containerSize]);

  // Optimized card sorting with stable sort for better performance
  const sortedVisibleCards = useMemo(() => {
    if (visibleCards.length <= 1) return visibleCards;

    // Use insertion sort for small arrays (better performance)
    if (visibleCards.length <= 10) {
      const sorted = [...visibleCards];
      for (let i = 1; i < sorted.length; i++) {
        const key = sorted[i];
        let j = i - 1;
        while (j >= 0 && sorted[j].zIndex > key.zIndex) {
          sorted[j + 1] = sorted[j];
          j--;
        }
        sorted[j + 1] = key;
      }
      return sorted;
    }

    // Use native sort for larger arrays
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

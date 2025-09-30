'use client';

import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface MiniMapProps {
  cards: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    type: string;
  }>;
  pan: { x: number; y: number };
  zoom: number;
  onNavigate?: (position: { x: number; y: number }) => void;
}

const MINIMAP_SIZE = 220;
const MINIMAP_PADDING = 15;

export const MiniMap = memo(function MiniMap({ cards, pan, zoom, onNavigate }: MiniMapProps) {
  const [miniMapZoom, setMiniMapZoom] = useState(1);
  const [miniMapPan, setMiniMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Calculate bounds of all cards
  const bounds = useMemo(() => {
    if (cards.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    cards.forEach(card => {
      minX = Math.min(minX, card.position.x);
      minY = Math.min(minY, card.position.y);
      maxX = Math.max(maxX, card.position.x + card.size.width);
      maxY = Math.max(maxY, card.position.y + card.size.height);
    });

    // Add padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [cards]);

  // Calculate scale to fit all cards in minimap (with minimap zoom)
  const scale = useMemo(() => {
    const availableWidth = MINIMAP_SIZE - MINIMAP_PADDING * 2;
    const availableHeight = MINIMAP_SIZE - MINIMAP_PADDING * 2;
    
    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    
    return Math.min(scaleX, scaleY) * miniMapZoom;
  }, [bounds, miniMapZoom]);

  // Calculate viewport rectangle (with minimap pan)
  const viewport = useMemo(() => {
    const viewportWidth = window.innerWidth / zoom;
    const viewportHeight = window.innerHeight / zoom;
    const viewportX = -pan.x / zoom;
    const viewportY = -pan.y / zoom;

    return {
      x: (viewportX - bounds.minX) * scale + MINIMAP_PADDING + miniMapPan.x,
      y: (viewportY - bounds.minY) * scale + MINIMAP_PADDING + miniMapPan.y,
      width: viewportWidth * scale,
      height: viewportHeight * scale,
    };
  }, [pan, zoom, bounds, scale, miniMapPan]);

  // Handle click on minimap to navigate
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate || isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - MINIMAP_PADDING - miniMapPan.x;
    const clickY = e.clientY - rect.top - MINIMAP_PADDING - miniMapPan.y;

    // Convert minimap coordinates to world coordinates
    const worldX = (clickX / scale) + bounds.minX;
    const worldY = (clickY / scale) + bounds.minY;

    // Calculate new pan to center clicked point
    const newPan = {
      x: window.innerWidth / 2 - worldX * zoom,
      y: window.innerHeight / 2 - worldY * zoom,
    };

    onNavigate(newPan);
  };

  // Handle mouse wheel for minimap zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setMiniMapZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  // Handle drag for minimap pan
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - miniMapPan.x, y: e.clientY - miniMapPan.y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setMiniMapPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (cards.length === 0) return null;

  return (
    <Card 
      className="absolute bottom-4 left-4 z-50 p-0 bg-background/95 backdrop-blur-sm border-2 border-primary/30 shadow-lg overflow-hidden"
      style={{ width: MINIMAP_SIZE + 4, height: MINIMAP_SIZE + 4 }}
    >
      <div 
        className="relative bg-muted/20 cursor-crosshair select-none"
        style={{ 
          width: MINIMAP_SIZE, 
          height: MINIMAP_SIZE 
        }}
        onClick={handleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        {/* Cards */}
        {cards.map(card => {
          const x = (card.position.x - bounds.minX) * scale + MINIMAP_PADDING + miniMapPan.x;
          const y = (card.position.y - bounds.minY) * scale + MINIMAP_PADDING + miniMapPan.y;
          const w = card.size.width * scale;
          const h = card.size.height * scale;

          // Color based on card type
          const getCardColor = (type: string) => {
            switch (type) {
              case 'platformContent': return 'bg-blue-500';
              case 'richNote': return 'bg-green-500';
              case 'calendar': return 'bg-purple-500';
              case 'pomodoro': return 'bg-red-500';
              case 'taskBoard': return 'bg-yellow-500';
              case 'flashcards': return 'bg-pink-500';
              case 'rssFeed': return 'bg-orange-500';
              case 'owlSearch': return 'bg-cyan-500';
              case 'spotify': return 'bg-emerald-500';
              default: return 'bg-gray-500';
            }
          };

          return (
            <div
              key={card.id}
              className={`absolute ${getCardColor(card.type)} opacity-70 rounded-sm`}
              style={{
                left: x,
                top: y,
                width: Math.max(w, 3),
                height: Math.max(h, 2),
              }}
            />
          );
        })}

        {/* Viewport Rectangle */}
        <div
          className="absolute border-2 border-primary bg-primary/10 rounded pointer-events-none shadow-sm"
          style={{
            left: viewport.x,
            top: viewport.y,
            width: viewport.width,
            height: viewport.height,
          }}
        />

        {/* Info overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] text-foreground/60 font-medium pointer-events-none">
          <span className="bg-background/80 px-1.5 py-0.5 rounded">{cards.length} cards</span>
          <span className="bg-background/80 px-1.5 py-0.5 rounded">{Math.round(miniMapZoom * 100)}%</span>
        </div>

        {/* Instructions hint */}
        <div className="absolute bottom-1 left-2 right-2 text-center text-[8px] text-muted-foreground pointer-events-none">
          Scroll: Zoom | Drag: Pan | Click: Go
        </div>
      </div>
    </Card>
  );
});

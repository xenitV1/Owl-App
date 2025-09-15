import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Connection, AnchorSide } from '@/hooks/useWorkspaceStore';

interface ConnectionsOverlayProps {
  cards: Array<{ id: string; position: { x: number; y: number }; size: { width: number; height: number } }>;
  connections: Connection[];
  linking: { isActive: boolean; sourceCardId?: string; sourceAnchor?: AnchorSide; cursor?: { x: number; y: number } };
  pan: { x: number; y: number };
  zoom: number;
}

function getAnchorPoint(card: { position: { x: number; y: number }; size: { width: number; height: number } }, side: AnchorSide) {
  const { x, y } = card.position;
  const { width, height } = card.size;
  switch (side) {
    case 'top':
      return { x: x + width / 2, y: y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x: x, y: y + height / 2 };
  }
}

function elasticQPath(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  // Control point halfway with offset for elastic curve
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // normal
  const ny = dx / len;
  const tension = Math.min(80, len * 0.25);
  const cx = (p1.x + p2.x) / 2 + nx * tension;
  const cy = (p1.y + p2.y) / 2 + ny * tension;
  return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
}

function getLiveWorldRect(cardId: string, pan: { x: number; y: number }, zoom: number) {
  const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement | null;
  const container = document.querySelector('[data-workspace-container]') as HTMLElement | null;
  if (!el || !container) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  // Convert to world coordinates within transformed canvas
  const worldX = (rect.left - containerRect.left - pan.x) / zoom;
  const worldY = (rect.top - containerRect.top - pan.y) / zoom;
  const worldW = rect.width / zoom;
  const worldH = rect.height / zoom;
  return { position: { x: worldX, y: worldY }, size: { width: worldW, height: worldH } };
}

export const ConnectionsOverlay = memo(function ConnectionsOverlay({ cards, connections, linking, pan, zoom }: ConnectionsOverlayProps) {
  // rAF ticker while dragging for smooth updates
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const isAnyDragging = () => document.querySelector('[data-card-id][data-dragging="true"]') !== null;

    const loop = () => {
      if (isAnyDragging()) {
        setTick(t => (t + 1) % 1000000);
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };

    const handleStart = () => {
      if (rafRef.current == null && isAnyDragging()) rafRef.current = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', handleStart, { passive: true });
    document.addEventListener('mouseup', handleStart, { passive: true });
    document.addEventListener('touchmove', handleStart, { passive: true });
    document.addEventListener('touchend', handleStart, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleStart as any);
      document.removeEventListener('mouseup', handleStart as any);
      document.removeEventListener('touchmove', handleStart as any);
      document.removeEventListener('touchend', handleStart as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Prefer live DOM rects only for cards being dragged; fallback to stored state otherwise
  const cardMap = useMemo(() => {
    const map = new Map<string, { position: { x: number; y: number }; size: { width: number; height: number } }>();
    for (const c of cards) {
      const el = typeof document !== 'undefined' ? (document.querySelector(`[data-card-id="${c.id}"]`) as HTMLElement | null) : null;
      const isDragging = !!el && el.getAttribute('data-dragging') === 'true';
      if (isDragging) {
        const live = getLiveWorldRect(c.id, pan, zoom);
        if (live) {
          map.set(c.id, live);
          continue;
        }
      }
      map.set(c.id, { position: c.position, size: c.size });
    }
    return map;
  }, [cards, pan, zoom, tick]);

  const paths = useMemo(() => {
    return connections
      .map(conn => {
        const source = cardMap.get(conn.sourceCardId);
        const target = cardMap.get(conn.targetCardId);
        if (!source || !target) return null;
        const p1 = getAnchorPoint(source, conn.sourceAnchor);
        const p2 = getAnchorPoint(target, conn.targetAnchor);
        return { id: conn.id, d: elasticQPath(p1, p2) };
      })
      .filter(Boolean) as Array<{ id: string; d: string }>;
  }, [connections, cardMap]);

  const tempPath = useMemo(() => {
    if (!(linking.isActive && linking.sourceCardId && linking.sourceAnchor && linking.cursor)) return null;
    const source = cardMap.get(linking.sourceCardId);
    if (!source) return null;
    const p1 = getAnchorPoint(source, linking.sourceAnchor);
    const p2 = linking.cursor;
    return elasticQPath(p1, p2);
  }, [linking, cardMap]);

  return (
    // Render UNDER cards: lower zIndex; still above grid background
    <svg className="absolute inset-0 pointer-events-none text-primary" style={{ overflow: 'visible', zIndex: 1 }}>
      {paths.map(path => (
        <path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          opacity={0.95}
        />
      ))}
      {tempPath && (
        <path d={tempPath} fill="none" stroke="currentColor" strokeDasharray="6 4" strokeWidth={2} opacity={0.8} />
      )}
    </svg>
  );
});

export default ConnectionsOverlay;

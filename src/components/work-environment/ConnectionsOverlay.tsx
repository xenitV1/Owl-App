import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Connection, AnchorSide } from "@/types/connection";

interface ConnectionsOverlayProps {
  cards: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  connections: Connection[];
  linking: {
    isActive: boolean;
    sourceCardId?: string;
    sourceAnchor?: AnchorSide;
    cursor?: { x: number; y: number };
  };
  pan: { x: number; y: number };
  zoom: number;
}

function getAnchorPoint(
  card: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  },
  side: AnchorSide,
) {
  const { x, y } = card.position;
  const { width, height } = card.size;

  switch (side) {
    case "top":
      return { x: x + width / 2, y: y };
    case "right":
      return { x: x + width, y: y + height / 2 };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x: x, y: y + height / 2 };
  }
}

// Simple spring-based control point for rubber-like feel
function baseControlPoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // normal
  const ny = dx / len;
  const tension = Math.min(80, len * 0.25);
  const cx = (p1.x + p2.x) / 2 + nx * tension;
  const cy = (p1.y + p2.y) / 2 + ny * tension;
  return { cx, cy };
}

type Spring = { cx: number; cy: number; vx: number; vy: number };

function springStep(
  prev: Spring,
  target: { cx: number; cy: number },
  dt = 1 / 60,
) {
  const k = 12; // spring stiffness
  const c = 6; // damping
  const ax = k * (target.cx - prev.cx) - c * prev.vx;
  const ay = k * (target.cy - prev.cy) - c * prev.vy;
  prev.vx += ax * dt;
  prev.vy += ay * dt;
  prev.cx += prev.vx * dt;
  prev.cy += prev.vy * dt;
}

function elasticQPathWithSpring(
  key: string,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  springs: Map<string, Spring>,
) {
  const target = baseControlPoint(p1, p2);
  let s = springs.get(key);
  if (!s) {
    s = { cx: target.cx, cy: target.cy, vx: 0, vy: 0 };
    springs.set(key, s);
  }
  // If target is effectively unchanged, lock spring to target to avoid idle wobble
  const dx = target.cx - s.cx;
  const dy = target.cy - s.cy;
  const eps = 0.5;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) {
    s.cx = target.cx;
    s.cy = target.cy;
    s.vx = 0;
    s.vy = 0;
  } else {
    springStep(s, target);
  }
  return `M ${p1.x} ${p1.y} Q ${s.cx} ${s.cy} ${p2.x} ${p2.y}`;
}

function getLiveWorldRect(
  cardId: string,
  pan: { x: number; y: number },
  zoom: number,
) {
  const el = document.querySelector(
    `[data-card-id="${cardId}"]`,
  ) as HTMLElement | null;
  const container = document.querySelector(
    "[data-workspace-container]",
  ) as HTMLElement | null;
  if (!el || !container) return null;
  const rect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  // Convert to world coordinates within transformed canvas
  const worldX = (rect.left - containerRect.left - pan.x) / zoom;
  const worldY = (rect.top - containerRect.top - pan.y) / zoom;
  const worldW = rect.width / zoom;
  const worldH = rect.height / zoom;
  return {
    position: { x: worldX, y: worldY },
    size: { width: worldW, height: worldH },
  };
}

export const ConnectionsOverlay = memo(function ConnectionsOverlay({
  cards,
  connections,
  linking,
  pan,
  zoom,
}: ConnectionsOverlayProps) {
  // rAF ticker while dragging for smooth updates
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const springsRef = useRef<
    Map<string, { cx: number; cy: number; vx: number; vy: number }>
  >(new Map());
  const [animating, setAnimating] = useState(false);

  // Listen for drag updates to force tick update for smooth connection rendering
  useEffect(() => {
    const handleDragUpdate = () => {
      // Force re-render to update connections based on live DOM positions
      setTick((t) => (t + 1) % 1000000);
    };

    window.addEventListener("workspace:dragUpdate", handleDragUpdate);

    return () => {
      window.removeEventListener("workspace:dragUpdate", handleDragUpdate);
    };
  }, []);

  useEffect(() => {
    const isActive = () =>
      document.querySelector('[data-card-id][data-dragging="true"]') !== null ||
      linking.isActive;

    const loop = () => {
      if (isActive()) {
        setTick((t) => (t + 1) % 1000000);
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };

    const handleStart = () => {
      if (rafRef.current == null && isActive())
        rafRef.current = requestAnimationFrame(loop);
    };

    document.addEventListener("mousemove", handleStart, { passive: true });
    document.addEventListener("mouseup", handleStart, { passive: true });
    document.addEventListener("touchmove", handleStart, { passive: true });
    document.addEventListener("touchend", handleStart, { passive: true });

    return () => {
      document.removeEventListener("mousemove", handleStart as any);
      document.removeEventListener("mouseup", handleStart as any);
      document.removeEventListener("touchmove", handleStart as any);
      document.removeEventListener("touchend", handleStart as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [linking.isActive]);

  useEffect(() => {
    const start = () => setAnimating(true);
    const end = () => setAnimating(false);
    window.addEventListener("workspace:positionsAnimating-start", start as any);
    window.addEventListener("workspace:positionsAnimating-end", end as any);
    return () => {
      window.removeEventListener(
        "workspace:positionsAnimating-start",
        start as any,
      );
      window.removeEventListener(
        "workspace:positionsAnimating-end",
        end as any,
      );
    };
  }, []);

  // Recompute once on pan/zoom changes without starting continuous loop
  useEffect(() => {
    setTick((t) => (t + 1) % 1000000);
  }, [pan.x, pan.y, zoom]);

  // Prefer live DOM rects for all cards during rendering; fallback to stored state if not available
  const cardMap = useMemo(() => {
    const map = new Map<
      string,
      {
        position: { x: number; y: number };
        size: { width: number; height: number };
      }
    >();
    for (const c of cards) {
      // Try to get live position from DOM (includes all transforms)
      const live =
        typeof document !== "undefined"
          ? getLiveWorldRect(c.id, pan, zoom)
          : null;

      if (live) {
        // Use live position - it already includes all CSS transforms
        map.set(c.id, live);
      } else {
        // Fallback: use stored position
        map.set(c.id, { position: c.position, size: c.size });
      }
    }
    return map;
  }, [cards, pan, zoom, tick]);

  const paths = useMemo(() => {
    return connections
      .map((conn) => {
        const source = cardMap.get(conn.sourceCardId);
        const target = cardMap.get(conn.targetCardId);
        if (!source || !target) return null;
        const p1 = getAnchorPoint(source, conn.sourceAnchor);
        const p2 = getAnchorPoint(target, conn.targetAnchor);
        return {
          id: conn.id,
          d: elasticQPathWithSpring(conn.id, p1, p2, springsRef.current),
        };
      })
      .filter(Boolean) as Array<{ id: string; d: string }>;
  }, [connections, cardMap]);

  const tempPath = useMemo(() => {
    if (
      !(
        linking.isActive &&
        linking.sourceCardId &&
        linking.sourceAnchor &&
        linking.cursor
      )
    )
      return null;
    const source = cardMap.get(linking.sourceCardId);
    if (!source) return null;
    const p1 = getAnchorPoint(source, linking.sourceAnchor);
    const p2 = linking.cursor;
    return elasticQPathWithSpring("temp", p1, p2, springsRef.current);
  }, [linking, cardMap]);

  return (
    // Render UNDER cards: lower zIndex; still above grid background
    <svg
      className="absolute inset-0 pointer-events-none text-primary"
      style={{ overflow: "visible", zIndex: 1 }}
    >
      {paths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={animating ? 2.5 : 2}
          opacity={0.95}
          strokeLinecap="round"
        />
      ))}
      {tempPath && (
        <path
          d={tempPath}
          fill="none"
          stroke="currentColor"
          strokeDasharray="6 4"
          strokeWidth={2}
          opacity={0.8}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
});

export default ConnectionsOverlay;

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDragDropOptions {
  id: string;
  position: { x: number; y: number };
  onUpdate: (updates: { position: { x: number; y: number } }) => void;
  gridSnap?: boolean;
  gridSize?: number;
  disabled?: boolean;
  pan?: { x: number; y: number };
  zoom?: number;
}

export function useDragDrop({
  id,
  position,
  onUpdate,
  gridSnap = true,
  gridSize = 20,
  disabled = false,
  pan = { x: 0, y: 0 },
  zoom = 1,
}: UseDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [visualDelta, setVisualDelta] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef<{ x: number; y: number } | null>(null);

  const snapToGrid = useCallback((value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [gridSnap, gridSize]);

  const flushVisualDelta = useCallback(() => {
    if (pendingDeltaRef.current === null) return;
    const next = pendingDeltaRef.current;
    pendingDeltaRef.current = null;
    setVisualDelta(next);
    rafRef.current = null;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    // Calculate offset from mouse position to card's current position (world coords)
    const parent = document.querySelector('[data-workspace-container]');
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const worldMouseX = (clientX - parentRect.left - pan.x) / zoom;
    const worldMouseY = (clientY - parentRect.top - pan.y) / zoom;
    const offset = {
      x: worldMouseX - position.x,
      y: worldMouseY - position.y,
    };
    
    setDragOffset(offset);
    setVisualDelta({ x: 0, y: 0 });
  }, [disabled, position, pan, zoom]);

  // Handle drag move with rAF-synced visual updates
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || disabled) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const parent = document.querySelector('[data-workspace-container]');
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    
    // Convert to world space under current pan/zoom
    const worldMouseX = (clientX - parentRect.left - pan.x) / zoom;
    const worldMouseY = (clientY - parentRect.top - pan.y) / zoom;
    const newX = snapToGrid(worldMouseX - dragOffset.x);
    const newY = snapToGrid(worldMouseY - dragOffset.y);

    // Update only visual delta to keep element under pointer
    pendingDeltaRef.current = { x: newX - position.x, y: newY - position.y };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushVisualDelta);
    }
  }, [isDragging, dragOffset, snapToGrid, disabled, pan, zoom, position.x, position.y, flushVisualDelta]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Commit final snapped position
    const finalX = snapToGrid(position.x + visualDelta.x);
    const finalY = snapToGrid(position.y + visualDelta.y);
    if (finalX !== position.x || finalY !== position.y) {
      onUpdate({ position: { x: finalX, y: finalY } });
    }
    setVisualDelta({ x: 0, y: 0 });
  }, [snapToGrid, position.x, position.y, visualDelta.x, visualDelta.y, onUpdate]);

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleDragMove(e);
      };
      const handleTouchEnd = () => handleDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const style = {
    transition: isDragging ? 'none' : 'transform 200ms ease',
    transform: isDragging ? `translate3d(${visualDelta.x}px, ${visualDelta.y}px, 0)` : undefined,
    willChange: isDragging ? 'transform' : undefined,
  } as React.CSSProperties;

  return {
    isDragging,
    style,
    handleDragStart,
  };
}
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDragDropOptions {
  id: string;
  position: { x: number; y: number };
  onUpdate: (updates: { position: { x: number; y: number } }) => void;
  gridSnap?: boolean;
  gridSize?: number;
  disabled?: boolean;
}

export function useDragDrop({
  id,
  position,
  onUpdate,
  gridSnap = true,
  gridSize = 20,
  disabled = false,
}: UseDragDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const snapToGrid = useCallback((value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [gridSnap, gridSize]);

  // Throttled update for better performance
  const throttledUpdate = useCallback((newPosition: { x: number; y: number }) => {
    onUpdate({ position: newPosition });
  }, [onUpdate]);

  // Handle drag start
  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    // Calculate offset from mouse position to card's current position
    const parent = document.querySelector('[data-workspace-container]');
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const offset = {
      x: clientX - parentRect.left - position.x,
      y: clientY - parentRect.top - position.y,
    };
    
    setDragOffset(offset);
  }, [disabled, position]);

  // Handle drag move with throttling
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || disabled) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const parent = document.querySelector('[data-workspace-container]');
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    
    // Calculate new position: mouse position minus the offset we calculated at start
    const newX = snapToGrid(clientX - parentRect.left - dragOffset.x);
    const newY = snapToGrid(clientY - parentRect.top - dragOffset.y);

    // Allow infinite movement like the canvas - no bounds constraints
    throttledUpdate({ x: newX, y: newY });
  }, [isDragging, dragOffset, snapToGrid, throttledUpdate, disabled]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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
  };

  return {
    isDragging,
    style,
    handleDragStart,
  };
}
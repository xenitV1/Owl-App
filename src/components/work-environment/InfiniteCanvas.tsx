'use client';

import { forwardRef, useCallback, useRef, useEffect, useState, ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface InfiniteCanvasProps {
  zoom: number;
  pan: { x: number; y: number };
  panMode: boolean;
  gridSnap: boolean;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  className?: string;
  children: ReactNode;
}

export const InfiniteCanvas = forwardRef<HTMLDivElement, InfiniteCanvasProps>(
  ({ zoom, pan, panMode, gridSnap, onPanChange, onZoomChange, className, children }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);
    const zoomPanRafRef = useRef<number | null>(null);

    // Memoize grid calculations to prevent recalculation on every render
    const gridConfig = useMemo(() => {
      const gridSize = 40 * zoom;
      const shouldShowGrid = zoom > 0.3;
      return { gridSize, shouldShowGrid };
    }, [zoom]);

    // Throttled pan update to prevent excessive re-renders
    const throttledPanUpdate = useCallback((newPan: { x: number; y: number }) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        onPanChange(newPan);
      });
    }, [onPanChange]);

    // Handle mouse down for panning
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      // Check if the target is a card or its children
      const target = e.target as HTMLElement;
      const isCardElement = target.closest('[data-workspace-card="true"]');
      
      // If clicking on a card, don't handle panning
      if (isCardElement) {
        return;
      }

      if (e.button === 0) { // Left click drag for panning
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPanStart(pan);
      }
    }, [pan]);

    // Handle mouse move for panning with throttling
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        throttledPanUpdate({
          x: panStart.x + deltaX,
          y: panStart.y + deltaY,
        });
      }
    }, [isDragging, dragStart, panStart, throttledPanUpdate]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }, []);

    // Handle wheel for zooming with throttling
    const handleWheel = useCallback((e: WheelEvent) => {
      // Check if the target is a card or its children
      const target = e.target as HTMLElement;
      const isCardElement = target.closest('[data-workspace-card="true"]');
      
      // If hovering over a card, don't handle zoom/pan
      if (isCardElement) {
        return;
      }

      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the point under the mouse in world coordinates
      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      // Smooth zoom factor using an exponential scale for trackpads and wheels
      const scaleFactor = Math.exp(-e.deltaY * 0.0015);
      const targetZoom = Math.max(0.1, Math.min(5, zoom * scaleFactor));

      // Calculate new pan to keep the point under the mouse stationary
      const targetPan = {
        x: mouseX - worldX * targetZoom,
        y: mouseY - worldY * targetZoom,
      };

      // Coalesce zoom + pan updates into a single animation frame to avoid jitter
      if (zoomPanRafRef.current) {
        cancelAnimationFrame(zoomPanRafRef.current);
      }
      zoomPanRafRef.current = requestAnimationFrame(() => {
        onZoomChange(targetZoom);
        onPanChange(targetPan);
      });
    }, [zoom, pan, onZoomChange, onPanChange]);

    // Setup mouse and wheel event listeners with proper cleanup
    useEffect(() => {
      const handleMouseMoveEvent = (e: MouseEvent) => handleMouseMove(e);
      const handleMouseUpEvent = () => handleMouseUp();
      const container = containerRef.current;

      document.addEventListener('mousemove', handleMouseMoveEvent);
      document.addEventListener('mouseup', handleMouseUpEvent);
      // Attach wheel listener to the container only, with passive:false to allow preventDefault
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false });
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveEvent);
        document.removeEventListener('mouseup', handleMouseUpEvent);
        if (container) {
          container.removeEventListener('wheel', handleWheel as EventListener);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (zoomPanRafRef.current) {
          cancelAnimationFrame(zoomPanRafRef.current);
        }
      };
    }, [handleMouseMove, handleMouseUp, handleWheel]);

    // Memoize grid pattern to prevent recreation on every render
    const gridPattern = useMemo(() => {
      if (!gridConfig.shouldShowGrid) return null;
      
      return (
        <defs>
          <pattern
            id="grid"
            width={gridConfig.gridSize}
            height={gridConfig.gridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Main center dot - more prominent but not overwhelming */}
            <circle
              cx={gridConfig.gridSize / 2}
              cy={gridConfig.gridSize / 2}
              r="2.5"
              fill="currentColor"
              opacity="0.12"
            />
            {/* Subtle corner accent dots */}
            <circle
              cx={gridConfig.gridSize * 0.25}
              cy={gridConfig.gridSize * 0.25}
              r="1"
              fill="currentColor"
              opacity="0.06"
            />
            <circle
              cx={gridConfig.gridSize * 0.75}
              cy={gridConfig.gridSize * 0.25}
              r="1"
              fill="currentColor"
              opacity="0.06"
            />
            <circle
              cx={gridConfig.gridSize * 0.25}
              cy={gridConfig.gridSize * 0.75}
              r="1"
              fill="currentColor"
              opacity="0.06"
            />
            <circle
              cx={gridConfig.gridSize * 0.75}
              cy={gridConfig.gridSize * 0.75}
              r="1"
              fill="currentColor"
              opacity="0.06"
            />
          </pattern>
        </defs>
      );
    }, [gridConfig]);

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden',
          isDragging ? 'cursor-grabbing' : 'cursor-auto',
          className
        )}
        onMouseDown={handleMouseDown}
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        data-workspace-container="true"
      >
        {/* Grid Background - only render when needed */}
        {gridConfig.shouldShowGrid && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-muted-foreground"
            style={{
              transform: `translate(${pan.x % gridConfig.gridSize}px, ${pan.y % gridConfig.gridSize}px)`,
            }}
          >
            {gridPattern}
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {/* Canvas Content */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {children}
        </div>

        {/* Canvas Info */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur-sm">
            Zoom: {Math.round(zoom * 100)}% | Pan: {Math.round(pan.x)}, {Math.round(pan.y)}
          </div>
        </div>
      </div>
    );
  }
);

InfiniteCanvas.displayName = 'InfiniteCanvas';

'use client';

import { forwardRef, useCallback, useRef, useEffect, useState, ReactNode } from 'react';
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

    // Grid size calculation
    const gridSize = 40 * zoom;
    const shouldShowGrid = zoom > 0.3;

    // Handle mouse down for panning
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (panMode || e.button === 1) { // Middle mouse button or pan mode
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPanStart(pan);
      }
    }, [panMode, pan]);

    // Handle mouse move for panning
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        onPanChange({
          x: panStart.x + deltaX,
          y: panStart.y + deltaY,
        });
      }
    }, [isDragging, dragStart, panStart, onPanChange]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate the point under the mouse in world coordinates
      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      // Calculate new zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

      // Calculate new pan to keep the point under the mouse stationary
      const newPan = {
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      };

      onZoomChange(newZoom);
      onPanChange(newPan);
    }, [zoom, pan, onZoomChange, onPanChange]);

    // Setup mouse event listeners
    useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    // Create minimal modern dot pattern
    const gridPattern = shouldShowGrid ? (
      <defs>
        <pattern
          id="grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          {/* Main center dot - more prominent but not overwhelming */}
          <circle
            cx={gridSize / 2}
            cy={gridSize / 2}
            r="2.5"
            fill="currentColor"
            opacity="0.12"
          />
          {/* Subtle corner accent dots */}
          <circle
            cx={gridSize * 0.25}
            cy={gridSize * 0.25}
            r="1"
            fill="currentColor"
            opacity="0.06"
          />
          <circle
            cx={gridSize * 0.75}
            cy={gridSize * 0.25}
            r="1"
            fill="currentColor"
            opacity="0.06"
          />
          <circle
            cx={gridSize * 0.25}
            cy={gridSize * 0.75}
            r="1"
            fill="currentColor"
            opacity="0.06"
          />
          <circle
            cx={gridSize * 0.75}
            cy={gridSize * 0.75}
            r="1"
            fill="currentColor"
            opacity="0.06"
          />
        </pattern>
      </defs>
    ) : null;

    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden',
          panMode || isDragging ? 'cursor-grabbing' : 'cursor-auto',
          className
        )}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        {/* Grid Background */}
        {shouldShowGrid && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-muted-foreground"
            style={{
              transform: `translate(${pan.x % gridSize}px, ${pan.y % gridSize}px)`,
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

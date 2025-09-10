'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  cardCount: number;
  isAccurate: boolean;
  browserSupport: string;
}

export function PerformanceMonitor({ cardCount }: { cardCount: number }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    cardCount: 0,
    isAccurate: false,
    browserSupport: 'unknown',
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const measurePerformance = () => {
      const frameStart = performance.now();
      frameCountRef.current++;
      
      // Measure frame time
      const frameTime = performance.now() - frameStart;
      renderTimesRef.current.push(frameTime);
      
      // Keep only last 60 frames for average calculation
      if (renderTimesRef.current.length > 60) {
        renderTimesRef.current.shift();
      }
      
      const now = performance.now();
      
      if (now - lastTimeRef.current >= 1000) {
        // More accurate FPS calculation
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // Calculate average render time per frame (more accurate)
        const avgRenderTime = renderTimesRef.current.length > 0 
          ? renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length
          : 0;
        
        // Get memory usage - performance.memory is non-standard and deprecated
        // Only works in Chrome with --enable-precise-memory-info flag
        let memoryUsage = 0;
        let isAccurate = false;
        let browserSupport = 'estimated';
        
        try {
          if ((performance as any).memory && (performance as any).memory.usedJSHeapSize) {
            memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
            isAccurate = true;
            browserSupport = 'chrome-precise';
          } else {
            // Fallback: estimate memory usage based on card count and complexity
            memoryUsage = Math.round(cardCount * 2.5 + 50); // Rough estimate
            browserSupport = 'estimated';
          }
        } catch (e) {
          // Fallback: estimate memory usage based on card count and complexity
          memoryUsage = Math.round(cardCount * 2.5 + 50); // Rough estimate
          browserSupport = 'estimated';
        }
        
        setMetrics({
          fps,
          memoryUsage,
          renderTime: Math.round(avgRenderTime * 100) / 100,
          cardCount,
          isAccurate,
          browserSupport,
        });
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    const rafId = requestAnimationFrame(measurePerformance);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [cardCount]);

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (memory: number) => {
    if (memory < 100) return 'text-green-500';
    if (memory < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRenderTimeColor = (renderTime: number) => {
    if (renderTime < 16.67) return 'text-green-500'; // 60 FPS
    if (renderTime < 33.33) return 'text-yellow-500'; // 30 FPS
    return 'text-red-500';
  };

  const getBrowserSupportColor = (support: string) => {
    switch (support) {
      case 'chrome-precise': return 'text-green-500';
      case 'estimated': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getBrowserSupportText = (support: string) => {
    switch (support) {
      case 'chrome-precise': return '✓ Precise';
      case 'estimated': return '⚠ Est.';
      default: return '✗ Unknown';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 p-3 bg-background/90 backdrop-blur-sm border border-border/50 z-50">
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">FPS:</span>
          <span className={`font-mono ${getPerformanceColor(metrics.fps)}`}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">RAM:</span>
          <span className={`font-mono ${getMemoryColor(metrics.memoryUsage)}`}>
            {metrics.memoryUsage}MB
          </span>
          <span className={`text-xs ${getBrowserSupportColor(metrics.browserSupport)}`}>
            {getBrowserSupportText(metrics.browserSupport)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Render:</span>
          <span className={`font-mono ${getRenderTimeColor(metrics.renderTime)}`}>
            {metrics.renderTime}ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Cards:</span>
          <span className="font-mono text-purple-500">
            {metrics.cardCount}
          </span>
        </div>
      </div>
    </Card>
  );
}

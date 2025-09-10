'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MiniChartProps {
  type: 'line' | 'bar';
  data: number[];
  className?: string;
  color?: string;
}

export function MiniChart({ type, data, className, color = 'currentColor' }: MiniChartProps) {
  // Handle edge cases for data
  if (!data || data.length === 0) {
    data = [0];
  }
  
  const maxValue = Math.max(...data);
  // Prevent division by zero or infinity
  const safeMaxValue = maxValue > 0 ? maxValue : 1;
  const normalizedData = data.map(value => (value / safeMaxValue) * 20); // Scale to max height of 20px

  if (type === 'line') {
    const points = normalizedData.map((value, index) => 
      `${(index / (data.length - 1)) * 24},${20 - value}`
    ).join(' ');

    return (
      <svg 
        width="24" 
        height="20" 
        viewBox="0 0 24 20" 
        className={cn("inline-block", className)}
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  }

  // Bar chart
  return (
    <svg 
      width="24" 
      height="20" 
      viewBox="0 0 24 20" 
      className={cn("inline-block", className)}
    >
      {normalizedData.map((value, index) => (
        <rect
          key={index}
          x={index * 4}
          y={20 - value}
          width="3"
          height={value}
          fill={color}
          opacity="0.8"
        />
      ))}
    </svg>
  );
}

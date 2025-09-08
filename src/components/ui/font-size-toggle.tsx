'use client';

import React from 'react';
import { Minus, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFontSize } from '@/contexts/FontSizeContext';

export const FontSizeToggle: React.FC = () => {
  const { fontSize, setFontSize } = useFontSize();

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setFontSize(size);
  };

  const getSizeIcon = () => {
    switch (fontSize) {
      case 'small':
        return <Minus className="h-4 w-4" />;
      case 'large':
        return <Plus className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const getSizeLabel = () => {
    switch (fontSize) {
      case 'small':
        return 'Small';
      case 'large':
        return 'Large';
      default:
        return 'Normal';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          {getSizeIcon()}
          <span className="sr-only">Font size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleFontSizeChange('small')}>
          <Minus className="mr-2 h-4 w-4" />
          <span>Small</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFontSizeChange('normal')}>
          <Type className="mr-2 h-4 w-4" />
          <span>Normal</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFontSizeChange('large')}>
          <Plus className="mr-2 h-4 w-4" />
          <span>Large</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
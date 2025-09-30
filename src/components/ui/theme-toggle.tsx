'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Palette, Sparkles, GlassWater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass') => {
    setTheme(newTheme);
    // Save theme preference to user profile
    saveThemePreference(newTheme);
  };

  const saveThemePreference = async (theme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass') => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const getIcon = () => {
    if (!mounted) {
      return <Sun className="h-4 w-4" />;
    }
    if (theme === 'system') {
      return resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
    }
    if (theme === 'retro-light' || theme === 'retro-dark') {
      return <Sparkles className="h-4 w-4" />;
    }
    if (theme === 'glass') {
      return <GlassWater className="h-4 w-4" />;
    }
    return theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme})`;
    }
    if (theme === 'retro-light') {
      return 'Retro Light';
    }
    if (theme === 'retro-dark') {
      return 'Retro Dark';
    }
    if (theme === 'glass') {
      return 'Glass';
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('retro-light')}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Retro Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('retro-dark')}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Retro Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('glass')}>
          <GlassWater className="mr-2 h-4 w-4" />
          <span>Glass</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
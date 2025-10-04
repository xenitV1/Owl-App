'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark';
  setTheme: (theme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') => void;
  resolvedTheme: 'light' | 'dark' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'system' as const,
      setTheme: () => {},
      resolvedTheme: 'light' as const
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const InnerThemeBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme: nextResolvedTheme } = useNextTheme();
  const [customTheme, setCustomTheme] = useState<'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark' | null>(null);

  const customThemeClasses = new Set(['retro-light', 'retro-dark', 'glass-light', 'glass-dark']);

  // Handle custom class-based themes (retro-* and glass-*)
  const isCustomTheme = !!customTheme || customThemeClasses.has((nextTheme as string));
  const currentTheme = isCustomTheme ? (customTheme || nextTheme as 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') : nextTheme;
  const resolvedTheme = isCustomTheme ? (customTheme || nextTheme as 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') : nextResolvedTheme;

  // Initialize from localStorage on mount (supports custom themes)
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('theme')) as
      | 'light'
      | 'dark'
      | 'system'
      | 'retro-light'
      | 'retro-dark'
      | 'glass-light'
      | 'glass-dark'
      | null;
    if (stored && customThemeClasses.has(stored)) {
      setCustomTheme(stored as 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark');
      // Ensure class applied immediately
      document.documentElement.classList.remove('light', 'dark', 'retro-light', 'retro-dark', 'glass-light', 'glass-dark');
      document.documentElement.classList.add(stored);
    }
  }, []);

  // Apply theme classes to document when a custom theme is active
  useEffect(() => {
    if (isCustomTheme) {
      const cls = (customTheme || (nextTheme as string)) as 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark';
      document.documentElement.classList.remove('light', 'dark', 'retro-light', 'retro-dark', 'glass-light', 'glass-dark');
      document.documentElement.classList.add(cls);
      // Persist custom theme to localStorage
      try { localStorage.setItem('theme', cls); } catch {}
    } else {
      // Clean custom classes; allow next-themes to manage light/dark/system
      document.documentElement.classList.remove('retro-light', 'retro-dark', 'glass-light', 'glass-dark');
    }
  }, [isCustomTheme, customTheme, nextTheme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') => {
    if (typeof newTheme === 'string' && (newTheme.startsWith('retro-') || newTheme.startsWith('glass-'))) {
      setCustomTheme(newTheme as 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark');
      // Persist explicitly so it survives reloads
      try { localStorage.setItem('theme', newTheme); } catch {}
      // Keep next-themes in a neutral state
      setNextTheme('light');
    } else {
      setCustomTheme(null);
      try { localStorage.setItem('theme', newTheme); } catch {}
      setNextTheme(newTheme);
    }
  };

  const contextValue: ThemeContextType = {
    theme: (currentTheme as 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') ?? 'system',
    setTheme,
    resolvedTheme: (resolvedTheme as 'light' | 'dark' | 'retro-light' | 'retro-dark' | 'glass-light' | 'glass-dark') ?? 'light',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <InnerThemeBridge>{children}</InnerThemeBridge>
    </NextThemesProvider>
  );
};
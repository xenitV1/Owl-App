'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark';
  setTheme: (theme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark') => void;
  resolvedTheme: 'light' | 'dark' | 'retro-light' | 'retro-dark';
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
  const [customTheme, setCustomTheme] = useState<'retro-light' | 'retro-dark' | null>(null);

  // Handle retro themes separately
  const isRetroTheme = customTheme || (nextTheme as string)?.startsWith('retro-');
  const currentTheme = isRetroTheme ? (customTheme || nextTheme as 'retro-light' | 'retro-dark') : nextTheme;
  const resolvedTheme = isRetroTheme ? (customTheme || nextTheme as 'retro-light' | 'retro-dark') : nextResolvedTheme;

  // Initialize from localStorage on mount (supports retro themes)
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('theme')) as
      | 'light'
      | 'dark'
      | 'system'
      | 'retro-light'
      | 'retro-dark'
      | null;
    if (stored === 'retro-light' || stored === 'retro-dark') {
      setCustomTheme(stored);
      // Ensure class applied immediately
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(stored);
    }
  }, []);

  // Apply theme classes to document when retro is active
  useEffect(() => {
    if (isRetroTheme) {
      const cls = (customTheme || (nextTheme as string)) as 'retro-light' | 'retro-dark';
      document.documentElement.classList.remove('light', 'dark', 'retro-light', 'retro-dark');
      document.documentElement.classList.add(cls);
      // Persist retro to localStorage
      try { localStorage.setItem('theme', cls); } catch {}
    } else {
      // Clean retro classes; allow next-themes to manage light/dark/system
      document.documentElement.classList.remove('retro-light', 'retro-dark');
    }
  }, [isRetroTheme, customTheme, nextTheme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark') => {
    if (newTheme.startsWith('retro-')) {
      setCustomTheme(newTheme as 'retro-light' | 'retro-dark');
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
    theme: (currentTheme as 'light' | 'dark' | 'system' | 'retro-light' | 'retro-dark') ?? 'system',
    setTheme,
    resolvedTheme: (resolvedTheme as 'light' | 'dark' | 'retro-light' | 'retro-dark') ?? 'light',
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
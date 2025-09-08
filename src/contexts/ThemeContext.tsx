'use client';

import React, { createContext, useContext } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
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
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  // Fallbacks to keep types happy during initial hydration
  const contextValue: ThemeContextType = {
    theme: (theme as 'light' | 'dark' | 'system') ?? 'system',
    setTheme: setTheme as (t: 'light' | 'dark' | 'system') => void,
    resolvedTheme: (resolvedTheme as 'light' | 'dark') ?? 'light',
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
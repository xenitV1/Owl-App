'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type FontSize = 'small' | 'normal' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    // Instead of throwing, return a default implementation
    // This allows components to work during SSR or initial render
    return {
      fontSize: 'normal' as const,
      setFontSize: () => {}
    };
  }
  return context;
};

interface FontSizeProviderProps {
  children: React.ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    // Save font size preference to user profile only if authenticated
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fontSize: size }),
        });
        // Don't throw error if it fails, just continue with local state
      } catch (error) {
        console.error('Error saving font size preference:', error);
      }
    }
  };

  const loadUserFontSize = async () => {
    // Only try to load user preferences if authenticated
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const preferences = await response.json();
          if (preferences.fontSize) {
            setFontSizeState(preferences.fontSize);
          }
        }
      } catch (error) {
        console.error('Error loading user font size:', error);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    loadUserFontSize();
  }, [isAuthenticated]);

  useEffect(() => {
    if (mounted) {
      // Apply font size to the root element
      const root = document.documentElement;
      root.classList.remove('text-sm', 'text-base', 'text-lg');
      
      switch (fontSize) {
        case 'small':
          root.classList.add('text-sm');
          break;
        case 'normal':
          root.classList.add('text-base');
          break;
        case 'large':
          root.classList.add('text-lg');
          break;
      }
    }
  }, [fontSize, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};
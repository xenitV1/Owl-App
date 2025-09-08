'use client';

import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export const ThemeLoader: React.FC = () => {
  const { setTheme } = useTheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    const loadUserTheme = async () => {
      if (!loading && user) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const preferences = await response.json();
            if (preferences && typeof preferences.theme === 'string') {
              setTheme(preferences.theme);
            }
          }
        } catch (error) {
          console.error('Error loading user theme:', error);
        }
      }
    };

    loadUserTheme();
  }, [user, loading, setTheme]);

  return null;
};
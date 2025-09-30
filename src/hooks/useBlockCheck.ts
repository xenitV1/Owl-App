'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BlockCheckResult {
  isBlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBlockCheck(targetUserId: string): BlockCheckResult {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dbUser, isGuest, user } = useAuth();

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!targetUserId || !dbUser || isGuest || dbUser.id === targetUserId) {
        setIsBlocked(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use NextAuth session (cookie-based, no token needed)
        const response = await fetch(`/api/blocks/status/${targetUserId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to check block status');
        }

        const data = await response.json();
        setIsBlocked(data.isBlocked || false);
      } catch (err) {
        console.error('Error checking block status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsBlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlockStatus();
  }, [targetUserId, dbUser, isGuest, user]);

  return {
    isBlocked,
    isLoading,
    error
  };
}

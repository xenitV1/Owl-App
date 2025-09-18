'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Chrome, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle } from '@/lib/firebase';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLoadingMessages } from '@/hooks/useLoadingMessages';

export const LoginButton: React.FC = () => {
  const { loading } = useAuth();
  const t = useTranslations();

  const { currentMessage } = useLoadingMessages({
    isLoading: loading,
    messageKeys: ['authenticating', 'connecting', 'processing'],
    interval: 1000
  });

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        toast.error(
          'This domain is not authorized for Firebase authentication. Please check the Firebase console settings.',
          {
            duration: 5000,
            action: {
              label: 'Learn More',
              onClick: () => {
                window.open('https://console.firebase.google.com/', '_blank');
              }
            }
          }
        );
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    }
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Chrome className="h-4 w-4" />
      {loading ? (currentMessage || t('common.loading')) : 'Sign in with Google'}
    </Button>
  );
};
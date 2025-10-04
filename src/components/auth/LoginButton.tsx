'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLoadingMessages } from '@/hooks/useLoadingMessages';

export const LoginButton: React.FC = () => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const buttonClickSoundRef = React.useRef<HTMLAudioElement | null>(null);

  const { currentMessage } = useLoadingMessages({
    isLoading: isLoading,
    messageKeys: ['authenticating', 'connecting', 'processing'],
    interval: 1000
  });

  // Initialize button click sound
  React.useEffect(() => {
    buttonClickSoundRef.current = new Audio('/api/sounds/button-click.mp3');
    buttonClickSoundRef.current.volume = 0.4;
    buttonClickSoundRef.current.preload = 'auto';
    buttonClickSoundRef.current.load();
  }, []);

  const handleLogin = async () => {
    // Play button click sound
    if (buttonClickSoundRef.current) {
      buttonClickSoundRef.current.currentTime = 0;
      buttonClickSoundRef.current.play().catch(err => {
        console.warn('[LoginButton] Failed to play click sound:', err);
      });
    }

    try {
      setIsLoading(true);
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        toast.success('Successfully signed in!');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle NextAuth errors
      if (error.message?.includes('OAuthAccountNotLinked')) {
        toast.error('This email is already associated with another sign-in method.');
      } else if (error.message?.includes('OAuthCallback')) {
        toast.error('Authentication failed. Please try again.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Chrome className="h-4 w-4" />
      {isLoading ? (currentMessage || t('common.loading')) : 'Sign in with Google'}
    </Button>
  );
};
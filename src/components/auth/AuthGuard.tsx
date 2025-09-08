'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginButton } from './LoginButton';
import { UserProfile } from './UserProfile';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  return user ? <>{children}</> : <LoginButton />;
};
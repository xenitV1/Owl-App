'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoginButton } from './LoginButton';
import { Eye, Lock, BookOpen } from 'lucide-react';

interface GuestAccessProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export const GuestAccess: React.FC<GuestAccessProps> = ({ 
  children, 
  requireAuth = false,
  fallback 
}) => {
  const { isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, show content
  if (!requireAuth || !isGuest) {
    return <>{children}</>;
  }

  // Show fallback if provided, otherwise show default guest access message
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Eye className="h-5 w-5" />
          Sign In Required
        </CardTitle>
        <CardDescription>
          You need to sign in to access this feature. Join Owl to start sharing and learning with fellow students!
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>Free forever • No credit card required</span>
        </div>
        <LoginButton />
      </CardContent>
    </Card>
  );
};
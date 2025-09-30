'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Shield, AlertTriangle } from 'lucide-react';

// Force dynamic rendering to prevent build issues
export const dynamic = 'force-dynamic';

export default function ModerationPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && dbUser) {
        try {
          setIsAdmin(dbUser.role === 'ADMIN');
        } catch (error) {
          console.error('Error checking admin status:', error);
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, dbUser, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <div>Loading...</div>
      </AuthGuard>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ModerationDashboard />
    </div>
  );
}
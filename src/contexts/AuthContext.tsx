'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChangedListener } from '@/lib/firebase';

interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  school?: string;
  grade?: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DatabaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  isAuthenticated: false,
  isGuest: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser?.email) {
        // Only fetch database user info if not on coming soon page
        const isComingSoonPage = window.location.pathname.includes('/coming-soon');
        
        if (!isComingSoonPage) {
          try {
            const token = await firebaseUser.getIdToken();
            const response = await fetch('/api/users/profile', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const userData = await response.json();
              setDbUser(userData);
            } else {
              console.warn('Failed to fetch user profile:', response.status);
              setDbUser(null);
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setDbUser(null);
          }
        } else {
          // On coming soon page, don't try to fetch user profile
          setDbUser(null);
        }
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    dbUser,
    loading,
    isAuthenticated: !!user,
    isGuest: !user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { User as NextAuthUser } from "next-auth";

interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  username?: string; // Add username field
  avatar?: string;
  role?: string;
  school?: string;
  grade?: string;
}

interface AuthContextType {
  user: NextAuthUser | null;
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);

  const loading = status === "loading";

  useEffect(() => {
    // If user is authenticated, fetch their profile from database
    if (session?.user?.email && !loading) {
      // Only fetch database user info if not on coming soon page
      const isComingSoonPage =
        window.location.pathname.includes("/coming-soon");

      if (!isComingSoonPage) {
        // Since we added user profile to session in auth.ts, we can use it directly
        const sessionUser = session.user as any;
        if (sessionUser.id && sessionUser.email) {
          setDbUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            username: sessionUser.username, // Add username field
            avatar: sessionUser.avatar,
            role: sessionUser.role,
            school: sessionUser.school,
            grade: sessionUser.grade,
          });
        } else {
          // Fallback to API call if session doesn't have profile data
          fetch("/api/users/profile")
            .then((response) => (response.ok ? response.json() : null))
            .then((userData) => {
              setDbUser(userData);
            })
            .catch((error) => {
              console.error("Failed to fetch user profile:", error);
              setDbUser(null);
            });
        }
      } else {
        // On coming soon page, don't try to fetch user profile
        setDbUser(null);
      }
    } else {
      setDbUser(null);
    }
  }, [session, loading]);

  const value = {
    user: session?.user || null,
    dbUser,
    loading,
    isAuthenticated: !!session?.user,
    isGuest: !session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

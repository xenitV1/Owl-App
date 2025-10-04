'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect } from 'react';

interface ClientProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, any>;
}

export function ClientProviders({ children, locale, messages }: ClientProvidersProps) {
  // Suppress linkifyjs warnings globally (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      // Filter out linkify warnings from BlockNote
      if (message.includes('linkifyjs') || message.includes('linkify')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.warn = originalWarn;
    };
  }, []);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <AuthProvider>
          <ThemeProvider>
            <FontSizeProvider>
              {children}
            </FontSizeProvider>
          </ThemeProvider>
        </AuthProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}

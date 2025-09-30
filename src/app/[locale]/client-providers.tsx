'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';

interface ClientProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, any>;
}

export function ClientProviders({ children, locale, messages }: ClientProvidersProps) {
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

import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import AnalyticsListener from "@/components/AnalyticsListener";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeLoader } from "@/components/ui/theme-loader";
import { Navigation } from "@/components/layout/Navigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { SkipLinks } from '@/lib/accessibility';
import DebugPanel from '@/components/DebugPanel';
import { ResizeObserverErrorHandler } from '@/components/ResizeObserverErrorHandler';

// Conditionally load Google Fonts only when not in Docker build
let geistSans: any;
let geistMono: any;

if (process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES !== '1') {
  try {
    // Dynamic import to load fonts conditionally
    const loadFonts = async () => {
      const { Geist, Geist_Mono } = await import("next/font/google");

      geistSans = Geist({
        variable: "--font-geist-sans",
        subsets: ["latin"],
        preload: false,
        display: 'swap',
        fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      });

      geistMono = Geist_Mono({
        variable: "--font-geist-mono",
        subsets: ["latin"],
        preload: false,
        display: 'swap',
        fallback: ['monospace'],
      });
    };

    // Execute the font loading
    loadFonts().catch((error) => {
      console.warn('Failed to load Google Fonts, using fallbacks:', error);
      geistSans = { variable: "--font-geist-sans", className: "" };
      geistMono = { variable: "--font-geist-mono", className: "" };
    });
  } catch (error) {
    console.warn('Failed to load Google Fonts, using fallbacks:', error);
    // Create fallback font objects
    geistSans = {
      variable: "--font-geist-sans",
      className: ""
    };
    geistMono = {
      variable: "--font-geist-mono",
      className: ""
    };
  }
} else {
  // Docker build environment - use fallbacks
  geistSans = {
    variable: "--font-geist-sans",
    className: ""
  };
  geistMono = {
    variable: "--font-geist-mono",
    className: ""
  };
}

import { ClientProviders } from './client-providers';

const locales = ['en', 'tr'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "OWL-App - Academic Social Learning Platform",
    description: "OWL-App is an academic social platform for sharing study notes, materials, and educational content.",
    keywords: ["OWL-App", "Education", "Social", "Study Notes", "Students", "Learning"],
    authors: [{ name: "OWL-App Team" }],
    metadataBase: new URL('https://owl-app.com'),
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon.png', sizes: '32x32' }
      ],
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
    openGraph: {
      title: "OWL-App - Academic Social Learning Platform",
      description: "Share study notes and learn together with OWL-App",
      url: "https://owl-app.com",
      siteName: "OWL-App",
      type: "website",
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'Owl Logo',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "OWL-App - Academic Social Learning Platform",
      description: "Share study notes and learn together with OWL-App",
      images: ['/logo.png'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Load messages explicitly based on the route param to avoid undefined locale issues
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <ClientProviders locale={locale} messages={messages}>
      <ThemeLoader />
      <div className="min-h-screen flex flex-col">
        <SkipLinks
          links={[
            { href: '#main-content', label: 'Skip to main content' },
            { href: '#navigation', label: 'Skip to navigation' }
          ]}
        />
        <header role="banner">
          <Navigation />
        </header>
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 pb-16 md:pb-0 focus:outline-none"
        >
          {children}
        </main>
        <footer role="contentinfo" className="border-t bg-background">
          <MobileNavigation />
        </footer>
      </div>
      <Toaster />
      <DebugPanel />
      <ResizeObserverErrorHandler />
      {isProduction && (
        <>
          <Analytics />
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { send_page_view: false });
            `}
          </Script>
          <AnalyticsListener />
        </>
      )}
    </ClientProviders>
  );
}

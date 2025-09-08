import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { ThemeLoader } from "@/components/ui/theme-loader";
import { Navigation } from "@/components/layout/Navigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { SkipLinks } from '@/lib/accessibility';
import DebugPanel from '@/components/DebugPanel';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const locales = ['en', 'tr'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Owl - Educational Social Media Platform",
    description: "A social media platform designed for students to share study notes, exam materials, and educational content.",
    keywords: ["Owl", "Education", "Social Media", "Study Notes", "Students", "Learning"],
    authors: [{ name: "Owl Team" }],
    metadataBase: new URL('http://localhost:3000'),
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
    openGraph: {
      title: "Owl - Educational Social Media Platform",
      description: "Share study notes and learn together with Owl",
      url: "https://owl-platform.com",
      siteName: "Owl",
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
      title: "Owl - Educational Social Media Platform",
      description: "Share study notes and learn together with Owl",
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <ThemeProvider>
          <FontSizeProvider>
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
          </FontSizeProvider>
        </ThemeProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

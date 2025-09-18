import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { ThemeLoader } from "@/components/ui/theme-loader";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { SkipLinks } from '@/lib/accessibility';
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

const locales = ['en', 'tr'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "OWL-App - Coming Soon",
    description: "OWL-App is coming soon! Join our waitlist to be notified when we launch.",
    keywords: ["OWL-App", "Coming Soon", "Waitlist", "Education", "Social Learning"],
    authors: [{ name: "OWL-App Team" }],
    metadataBase: new URL('https://owl-app.com'),
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    openGraph: {
      title: "OWL-App - Coming Soon",
      description: "Join our waitlist to be notified when we launch",
      url: "https://owl-app.com/coming-soon",
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
      title: "OWL-App - Coming Soon",
      description: "Join our waitlist to be notified when we launch",
      images: ['/logo.png'],
    },
  };
}

export default async function ComingSoonLayout({
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
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <FontSizeProvider>
          <ThemeLoader />
          <div className="min-h-screen flex flex-col">
            <SkipLinks
              links={[
                { href: '#main-content', label: 'Skip to main content' }
              ]}
            />
            <main
              id="main-content"
              role="main"
              tabIndex={-1}
              className="flex-1 focus:outline-none"
            >
              {children}
            </main>
          </div>
          <Toaster />
          <ResizeObserverErrorHandler />
        </FontSizeProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
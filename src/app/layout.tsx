import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnalyticsListener from "@/components/AnalyticsListener";
import "./globals.css";

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

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        {isProduction && (
          <>
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
            <Suspense fallback={null}>
              <AnalyticsListener />
            </Suspense>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
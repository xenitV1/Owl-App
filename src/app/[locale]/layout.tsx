import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import AnalyticsListener from "@/components/AnalyticsListener";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeLoader } from "@/components/ui/theme-loader";
import { Navigation } from "@/components/layout/Navigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { SkipLinks } from "@/lib/accessibility";
import DebugPanel from "@/components/DebugPanel";
import { ResizeObserverErrorHandler } from "@/components/ResizeObserverErrorHandler";
import { WebSiteSchema } from "@/components/seo/StructuredData";
import { getLocaleMetadata } from "@/lib/seo";

// Conditionally load Google Fonts only when not in Docker build
let geistSans: any;
let geistMono: any;

if (process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES !== "1") {
  try {
    // Dynamic import to load fonts conditionally
    const loadFonts = async () => {
      const { Geist, Geist_Mono } = await import("next/font/google");

      geistSans = Geist({
        variable: "--font-geist-sans",
        subsets: ["latin"],
        preload: false,
        display: "swap",
        fallback: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      });

      geistMono = Geist_Mono({
        variable: "--font-geist-mono",
        subsets: ["latin"],
        preload: false,
        display: "swap",
        fallback: ["monospace"],
      });
    };

    // Execute the font loading
    loadFonts().catch((error) => {
      console.warn("Failed to load Google Fonts, using fallbacks:", error);
      geistSans = { variable: "--font-geist-sans", className: "" };
      geistMono = { variable: "--font-geist-mono", className: "" };
    });
  } catch (error) {
    console.warn("Failed to load Google Fonts, using fallbacks:", error);
    // Create fallback font objects
    geistSans = {
      variable: "--font-geist-sans",
      className: "",
    };
    geistMono = {
      variable: "--font-geist-mono",
      className: "",
    };
  }
} else {
  // Docker build environment - use fallbacks
  geistSans = {
    variable: "--font-geist-sans",
    className: "",
  };
  geistMono = {
    variable: "--font-geist-mono",
    className: "",
  };
}

import { ClientProviders } from "./client-providers";

const locales = ["en", "tr"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const localeMetadata = getLocaleMetadata(locale, "home");

  return {
    title: localeMetadata.title,
    description: localeMetadata.description,
    keywords: localeMetadata.keywords,
    authors: [{ name: "OWL-App Team" }],
    creator: "OWL-App",
    publisher: "OWL-App",
    metadataBase: new URL("https://owl-app.com"),
    verification: {
      google: "Mj4j6hgqi3y1yRlfCmghAPCvgenSnn2jHnv81FR0ZSM",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `https://owl-app.com/${locale}`,
      languages: {
        en: "https://owl-app.com/en",
        tr: "https://owl-app.com/tr",
        "x-default": "https://owl-app.com",
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
        { url: "/favicon-128x128.png", sizes: "128x128", type: "image/png" },
        { url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" },
        { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/favicon.svg",
          color: "#3b82f6",
        },
      ],
    },
    openGraph: {
      title: localeMetadata.title,
      description: localeMetadata.description,
      url: `https://owl-app.com/${locale}`,
      siteName: "OWL-App",
      type: "website",
      locale: locale === "tr" ? "tr_TR" : "en_US",
      images: [
        {
          url: "https://owl-app.com/logo.png",
          width: 1200,
          height: 630,
          alt: "OWL-App Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localeMetadata.title,
      description: localeMetadata.description,
      images: ["https://owl-app.com/logo.png"],
      creator: "@owlapp_",
      site: "@owlapp_",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Load messages explicitly based on the route param to avoid undefined locale issues
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const isProduction = process.env.NODE_ENV === "production";

  return (
    <ClientProviders locale={locale} messages={messages}>
      <WebSiteSchema locale={locale} />
      <ThemeLoader />
      <div className="min-h-screen flex flex-col">
        <SkipLinks
          links={[
            { href: "#main-content", label: "Skip to main content" },
            { href: "#navigation", label: "Skip to navigation" },
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

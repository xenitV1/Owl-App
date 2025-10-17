import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnalyticsListener from "@/components/AnalyticsListener";
import { OrganizationSchema } from "@/components/seo/StructuredData";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "OWL-App - Academic Social Learning Platform",
  description:
    "OWL-App is an academic social platform for sharing study notes, materials, and educational content.",
  keywords: [
    "OWL-App",
    "Education",
    "Social",
    "Study Notes",
    "Students",
    "Learning",
  ],
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
    canonical: "https://owl-app.com",
    languages: {
      en: "https://owl-app.com/en",
      tr: "https://owl-app.com/tr",
      "x-default": "https://owl-app.com",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
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
    title: "OWL-App - Academic Social Learning Platform",
    description: "Share study notes and learn together with OWL-App",
    url: "https://owl-app.com",
    siteName: "OWL-App",
    type: "website",
    locale: "en_US",
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
    title: "OWL-App - Academic Social Learning Platform",
    description: "Share study notes and learn together with OWL-App",
    images: ["https://owl-app.com/logo.png"],
    creator: "@owlapp_",
    site: "@owlapp_",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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

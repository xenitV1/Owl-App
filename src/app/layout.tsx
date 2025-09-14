import type { Metadata } from "next";
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
  title: "Owl - Educational Social Media Platform",
  description: "A social media platform designed for students to share study notes, exam materials, and educational content.",
  keywords: ["Owl", "Education", "Social Media", "Study Notes", "Students", "Learning"],
  authors: [{ name: "Owl Team" }],
  metadataBase: new URL('http://localhost:3000'),
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
  display: 'swap',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
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
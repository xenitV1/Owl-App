import type { Metadata } from "next";
import "../../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

const locales = ['en', 'tr'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "OWL-App - Coming Soon",
    description: "OWL-App is coming soon! Join our waitlist to be the first to know when we launch.",
    keywords: ["OWL-App", "Coming Soon", "Education", "Social", "Study Notes", "Students"],
    authors: [{ name: "OWL-App Team" }],
    metadataBase: new URL('https://owl-app.com'),
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    openGraph: {
      title: "OWL-App - Coming Soon",
      description: "Join our waitlist for OWL-App, the academic social platform",
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
      title: "OWL-App - Coming Soon",
      description: "Join our waitlist for OWL-App, the academic social platform",
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
      <div className="min-h-screen">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const metadata = {
    tr: {
      title: 'OWL Platform - Akademik Sosyal Öğrenme Platformu | Yakında',
      description: 'Öğrenciler için tasarlanmış yeni nesil akademik çalışma platformu. Ders notları paylaşın, AI destekli içerik oluşturun, etkili çalışma grupları kurun ve verimli öğrenin. Ücretsiz erken erişim için kayıt olun!',
      keywords: 'owl platform, akademik platform, ders notu paylaşımı, çalışma ortamı, öğrenci platformu, eğitim platformu, AI destekli öğrenme, flashcard, not yönetimi, çalışma grupları',
    },
    en: {
      title: 'OWL Platform - Academic Social Learning Platform | Coming Soon',
      description: 'Next-generation academic platform designed for students. Share study notes, create AI-powered content, form effective study groups, and learn efficiently. Register for free early access!',
      keywords: 'owl platform, academic platform, study notes sharing, work environment, student platform, education platform, AI-powered learning, flashcards, note management, study groups',
    },
  };

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.tr;

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    keywords: currentMetadata.keywords,
    metadataBase: new URL('https://owl-app.com'),
    alternates: {
      canonical: `/coming-soon`,
      languages: {
        'tr': '/tr/coming-soon',
        'en': '/en/coming-soon',
      },
    },
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      url: `https://owl-app.com/${locale}/coming-soon`,
      siteName: 'OWL Platform',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'OWL Platform Logo',
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: currentMetadata.title,
      description: currentMetadata.description,
      images: ['/logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

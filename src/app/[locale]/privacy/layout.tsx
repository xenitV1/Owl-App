import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const metadata = {
    tr: {
      title: 'Gizlilik Politikası - OWL Platform',
      description: 'OWL Platform gizlilik politikası. Verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi.',
    },
    en: {
      title: 'Privacy Policy - OWL Platform',
      description: 'OWL Platform privacy policy. Information about how your data is collected, used, and protected.',
    },
  };

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.tr;

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


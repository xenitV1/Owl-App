import type { Metadata } from "next";
import { getLocaleMetadata } from "@/lib/seo";
import { WebPageSchema } from "@/components/seo/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const localeMetadata = getLocaleMetadata(locale, "coming-soon");

  return {
    title: localeMetadata.title,
    description: localeMetadata.description,
    keywords: localeMetadata.keywords,
    authors: [{ name: "OWL-App Team" }],
    creator: "OWL-App",
    publisher: "OWL-App",
    metadataBase: new URL("https://owl-app.com"),
    alternates: {
      canonical: `https://owl-app.com/${locale}/coming-soon`,
      languages: {
        en: "https://owl-app.com/en/coming-soon",
        tr: "https://owl-app.com/tr/coming-soon",
        "x-default": "https://owl-app.com/coming-soon",
      },
    },
    openGraph: {
      title: localeMetadata.title,
      description: localeMetadata.description,
      url: `https://owl-app.com/${locale}/coming-soon`,
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

export default async function ComingSoonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localeMetadata = getLocaleMetadata(locale, "coming-soon");

  return (
    <>
      <WebPageSchema
        title={localeMetadata.title}
        description={localeMetadata.description}
        url={`https://owl-app.com/${locale}/coming-soon`}
        locale={locale}
        datePublished={new Date("2024-10-01").toISOString()}
        dateModified={new Date().toISOString()}
      />
      {children}
    </>
  );
}

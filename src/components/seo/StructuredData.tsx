/**
 * Structured Data Component
 * Enhanced Schema.org markup for 2025 SEO
 */

interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization Schema - Root level
 */
export function OrganizationSchema() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OWL-App",
    alternateName: "OWL Platform",
    url: "https://owl-app.com",
    logo: "https://owl-app.com/logo.png",
    description:
      "Academic social platform for sharing study notes, materials, and educational content.",
    foundingDate: "2024",
    sameAs: ["https://x.com/owlapp_", "https://www.linkedin.com/in/apaydinm"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "mehmet.apaydin0@outlook.com",
      availableLanguage: ["English", "Turkish"],
    },
  };

  return <StructuredData data={organizationData} />;
}

/**
 * WebSite Schema with Search Action
 */
export function WebSiteSchema({ locale = "en" }: { locale?: string }) {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OWL-App",
    url: `https://owl-app.com/${locale}`,
    description:
      locale === "tr"
        ? "Ders notları, materyaller ve eğitim içeriği paylaşmak için akademik sosyal platform."
        : "Academic social platform for sharing study notes, materials, and educational content.",
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://owl-app.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "OWL-App",
      logo: {
        "@type": "ImageObject",
        url: "https://owl-app.com/logo.png",
      },
    },
  };

  return <StructuredData data={websiteData} />;
}

/**
 * WebPage Schema - For individual pages
 */
interface WebPageSchemaProps {
  title: string;
  description: string;
  url: string;
  locale?: string;
  datePublished?: string;
  dateModified?: string;
}

export function WebPageSchema({
  title,
  description,
  url,
  locale = "en",
  datePublished,
  dateModified,
}: WebPageSchemaProps) {
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
    url: url,
    inLanguage: locale,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    isPartOf: {
      "@type": "WebSite",
      name: "OWL-App",
      url: "https://owl-app.com",
    },
  };

  return <StructuredData data={webPageData} />;
}

/**
 * FAQPage Schema - For FAQ pages
 */
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  faqs: FAQItem[];
}

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={faqData} />;
}

/**
 * Article Schema - For blog posts and articles
 */
interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  locale?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName = "OWL-App Team",
  locale = "en",
}: ArticleSchemaProps) {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    url: url,
    inLanguage: locale,
    datePublished: datePublished,
    ...(dateModified && { dateModified }),
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    }),
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "OWL-App",
      logo: {
        "@type": "ImageObject",
        url: "https://owl-app.com/logo.png",
      },
    },
  };

  return <StructuredData data={articleData} />;
}

/**
 * Breadcrumb Schema
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData data={breadcrumbData} />;
}

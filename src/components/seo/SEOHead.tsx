/**
 * SEO Head Component
 * Comprehensive SEO meta tags for 2025 standards
 */

import { getCanonicalUrl, getHreflangLinks, getOGImageUrl } from "@/lib/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  locale: string;
  keywords?: string[];
  imageUrl?: string;
  imageAlt?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogType?: "website" | "article";
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}

/**
 * Comprehensive SEO Head component with all meta tags
 * Usage: Add this component to your page layouts
 */
export function SEOMetaTags({
  title,
  description,
  path,
  locale,
  keywords = [],
  imageUrl = "/logo.png",
  imageAlt = "OWL-App Logo",
  noindex = false,
  nofollow = false,
  ogType = "website",
  datePublished,
  dateModified,
  authorName,
}: SEOHeadProps) {
  const canonicalUrl = getCanonicalUrl(path, locale);
  const hreflangLinks = getHreflangLinks(path);
  const ogImage = getOGImageUrl(imageUrl);

  // Robots meta content
  const robotsContent = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
  ].join(", ");

  return {
    title,
    description,
    keywords: keywords.join(", "),

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        hreflangLinks.map((link) => [link.hreflang, link.href]),
      ),
    },

    // Robots
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "OWL-App",
      type: ogType,
      locale: locale === "tr" ? "tr_TR" : "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      ...(ogType === "article" && {
        publishedTime: datePublished,
        modifiedTime: dateModified,
        authors: authorName ? [authorName] : undefined,
      }),
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@owlapp_",
      site: "@owlapp_",
    },

    // Additional meta tags
    authors: authorName ? [{ name: authorName }] : [{ name: "OWL-App Team" }],
    creator: "OWL-App",
    publisher: "OWL-App",

    // Language
    language: locale,

    // Other important meta tags
    other: {
      "revisit-after": "7 days",
      distribution: "global",
      rating: "general",
      "format-detection": "telephone=no",
    },
  };
}

/**
 * Generate metadata for Next.js 14+ generateMetadata
 */
export function generateSEOMetadata(props: SEOHeadProps) {
  return SEOMetaTags(props);
}

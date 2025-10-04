/**
 * SEO Utility Functions
 * 2025 Google SEO best practices implementation
 */

export interface SEOConfig {
  baseUrl: string;
  siteName: string;
  defaultLocale: string;
  locales: string[];
}

export const seoConfig: SEOConfig = {
  baseUrl: "https://owl-app.com",
  siteName: "OWL-App",
  defaultLocale: "en",
  locales: ["en", "tr"],
};

/**
 * Generate canonical URL for a page
 */
export function getCanonicalUrl(path: string, locale?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = seoConfig.baseUrl;

  if (locale && locale !== seoConfig.defaultLocale) {
    return `${baseUrl}/${locale}${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate hreflang links for multilingual pages
 */
export function getHreflangLinks(
  path: string,
): Array<{ hreflang: string; href: string }> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const links: Array<{ hreflang: string; href: string }> = [];

  // Add each locale
  seoConfig.locales.forEach((locale) => {
    links.push({
      hreflang: locale,
      href: `${seoConfig.baseUrl}/${locale}${cleanPath}`,
    });
  });

  // Add x-default (fallback)
  links.push({
    hreflang: "x-default",
    href: `${seoConfig.baseUrl}${cleanPath}`,
  });

  return links;
}

/**
 * Generate Open Graph image URL
 */
export function getOGImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${seoConfig.baseUrl}${cleanPath}`;
}

/**
 * Get locale-specific title and description
 */
export interface LocaleMetadata {
  title: string;
  description: string;
  keywords?: string[];
}

export function getLocaleMetadata(
  locale: string,
  pageType: "home" | "coming-soon" | "faq" | "privacy" | "terms",
): LocaleMetadata {
  const metadata: Record<string, Record<string, LocaleMetadata>> = {
    en: {
      home: {
        title: "OWL-App - Academic Social Learning Platform",
        description:
          "OWL-App is an academic social platform for sharing study notes, materials, and educational content. Join thousands of students learning together.",
        keywords: [
          "OWL-App",
          "Education",
          "Social Learning",
          "Study Notes",
          "Students",
          "Academic Platform",
        ],
      },
      "coming-soon": {
        title: "OWL-App - Coming Soon | Academic Social Learning Platform",
        description:
          "OWL-App is launching soon! Be the first to experience the future of academic social learning. Join our waitlist today.",
        keywords: [
          "OWL-App",
          "Coming Soon",
          "Education Platform",
          "Study Notes",
          "Academic Social Network",
        ],
      },
      faq: {
        title: "FAQ - Frequently Asked Questions | OWL-App",
        description:
          "Find answers to frequently asked questions about OWL-App, the academic social learning platform.",
        keywords: ["FAQ", "Questions", "Help", "Support", "OWL-App"],
      },
      privacy: {
        title: "Privacy Policy | OWL-App",
        description:
          "Learn about how OWL-App protects your privacy and handles your personal data.",
        keywords: ["Privacy Policy", "Data Protection", "GDPR", "OWL-App"],
      },
      terms: {
        title: "Terms of Service | OWL-App",
        description:
          "Read the terms of service and user agreement for OWL-App platform.",
        keywords: ["Terms of Service", "User Agreement", "Legal", "OWL-App"],
      },
    },
    tr: {
      home: {
        title: "OWL-App - Akademik Sosyal Öğrenme Platformu",
        description:
          "OWL-App, ders notları, materyaller ve eğitim içeriği paylaşmak için akademik sosyal bir platformdur. Binlerce öğrenci ile birlikte öğrenin.",
        keywords: [
          "OWL-App",
          "Eğitim",
          "Sosyal Öğrenme",
          "Ders Notları",
          "Öğrenciler",
          "Akademik Platform",
        ],
      },
      "coming-soon": {
        title: "OWL-App - Yakında | Akademik Sosyal Öğrenme Platformu",
        description:
          "OWL-App yakında başlıyor! Akademik sosyal öğrenmenin geleceğini ilk deneyimleyen siz olun. Bugün bekleme listemize katılın.",
        keywords: [
          "OWL-App",
          "Yakında",
          "Eğitim Platformu",
          "Ders Notları",
          "Akademik Sosyal Ağ",
        ],
      },
      faq: {
        title: "SSS - Sıkça Sorulan Sorular | OWL-App",
        description:
          "OWL-App akademik sosyal öğrenme platformu hakkında sıkça sorulan soruların cevaplarını bulun.",
        keywords: ["SSS", "Sorular", "Yardım", "Destek", "OWL-App"],
      },
      privacy: {
        title: "Gizlilik Politikası | OWL-App",
        description:
          "OWL-App'in gizliliğinizi nasıl koruduğunu ve kişisel verilerinizi nasıl işlediğini öğrenin.",
        keywords: ["Gizlilik Politikası", "Veri Koruma", "KVKK", "OWL-App"],
      },
      terms: {
        title: "Kullanım Koşulları | OWL-App",
        description:
          "OWL-App platformu için kullanım koşullarını ve kullanıcı sözleşmesini okuyun.",
        keywords: [
          "Kullanım Koşulları",
          "Kullanıcı Sözleşmesi",
          "Yasal",
          "OWL-App",
        ],
      },
    },
  };

  return metadata[locale]?.[pageType] || metadata["en"][pageType];
}

/**
 * Validate and clean URL for SEO
 */
export function cleanUrlForSEO(url: string): string {
  return url
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_/]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate breadcrumb schema data
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

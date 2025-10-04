import Head from "next/head";

interface FaviconHeadProps {
  locale?: string;
}

/**
 * FaviconHead Component
 * Google'ın favicon'u daha iyi tanıyabilmesi için ek HTML head tag'leri sağlar
 */
export function FaviconHead({ locale = "en" }: FaviconHeadProps) {
  return (
    <Head>
      {/* Temel favicon tanımları */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="48x48"
        href="/favicon-48x48.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="64x64"
        href="/favicon-64x64.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="128x128"
        href="/favicon-128x128.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="180x180"
        href="/favicon-180x180.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/favicon-192x192.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="512x512"
        href="/favicon-512x512.png"
      />

      {/* Apple Touch Icon */}
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />

      {/* SVG Favicon (modern tarayıcılar için) */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {/* Mask icon (Safari için) */}
      <link rel="mask-icon" href="/favicon.svg" color="#3b82f6" />

      {/* Shortcut icon (eski tarayıcılar için) */}
      <link rel="shortcut icon" href="/favicon.ico" />

      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Theme color */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />

      {/* Microsoft Tiles */}
      <meta name="msapplication-TileImage" content="/favicon-192x192.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Google-specific meta tags */}
      <meta
        name="google-site-verification"
        content="Mj4j6hgqi3y1yRlfCmghAPCvgenSnn2jHnv81FR0ZSM"
      />

      {/* Favicon için ek meta tag'ler */}
      <meta name="application-name" content="OWL-App" />
      <meta name="apple-mobile-web-app-title" content="OWL-App" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Open Graph image (favicon için fallback) */}
      <meta property="og:image" content="/favicon-192x192.png" />
      <meta property="og:image:width" content="192" />
      <meta property="og:image:height" content="192" />
      <meta property="og:image:type" content="image/png" />

      {/* Twitter Card image (favicon için fallback) */}
      <meta name="twitter:image" content="/favicon-192x192.png" />
    </Head>
  );
}

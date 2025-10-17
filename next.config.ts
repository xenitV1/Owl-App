import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: process.env.NODE_ENV === "production",
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"],
  },
  webpack: (config, { isServer }) => {
    // Externalize packages that should only run on server
    if (isServer) {
      config.externals = [...(config.externals || []), "mammoth"];
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "development",
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  serverExternalPackages: ["sharp", "mammoth"],
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  async headers() {
    const headers = [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];

    if (process.env.NODE_ENV === "production") {
      headers[0].headers.push(
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://analytics.google.com",
            "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.google.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.googleapis.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net wss: https:",
            "media-src 'self' https: blob:",
            "worker-src 'self' blob:",
            // Allow embedding trusted providers (Spotify, YouTube, Vimeo)
            "frame-src 'self' https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
            "child-src 'self' https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      );
    } else {
      headers[0].headers.push({
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://analytics.google.com",
          "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.google.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob: https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
          "font-src 'self' data:",
          "connect-src 'self' https://*.googleapis.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net wss: https:",
          "media-src 'self' https: blob:",
          "worker-src 'self' blob:",
          // Allow embedding trusted providers (Spotify, YouTube, Vimeo)
          "frame-src 'self' https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
          "child-src 'self' https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      });
    }

    return headers;
  },
};

export default withNextIntl(nextConfig);

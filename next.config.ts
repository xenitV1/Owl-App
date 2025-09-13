import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: process.env.NODE_ENV === 'production',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
  // Font optimization for Docker builds
  optimizeFonts: process.env.NODE_ENV === 'production' && !process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES,
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime.js': 'react/jsx-runtime.js',
        'react/jsx-dev-runtime.js': 'react/jsx-dev-runtime.js',
      });
    }

    // Comprehensive fallbacks for server-side builds
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        util: false,
        querystring: false,
        punycode: false,
        domain: false,
        dns: false,
        dgram: false,
        child_process: false,
        cluster: false,
        module: false,
        vm: false,
        constants: false,
        events: false,
        string_decoder: false,
        timers: false,
        tty: false,
        readline: false,
        repl: false,
        v8: false,
        inspector: false,
        perf_hooks: false,
        worker_threads: false,
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  serverExternalPackages: ['sharp'],
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      headers[0].headers.push(
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseio.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss: https:",
            "media-src 'self' https: blob:",
            "worker-src 'self' blob:",
            "child-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        }
      );
    } else {
      headers[0].headers.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseio.com https://www.gstatic.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss: https:",
          "media-src 'self' https: blob:",
          "worker-src 'self' blob:",
          "child-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; '),
      });
    }

    return headers;
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
  },
};

export default withNextIntl(nextConfig);

import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'tr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Changed from 'always' to 'as-needed' to prevent undefined locale
});

// Security headers middleware
export async function middleware(request: NextRequest) {
  // First, let next-intl resolve the locale and rewrite as needed
  const url = new URL(request.url);
  const path = url.pathname;
  const acceptLanguage = request.headers.get('accept-language');
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const pathLocaleMatch = path.match(/^\/([a-z]{2})(?:\/|$)/);
  const pathLocale = pathLocaleMatch ? pathLocaleMatch[1] : undefined;
  console.log('[middleware] incoming', { path, acceptLanguage, cookieLocale, pathLocale });

  // Check if this is a coming-soon redirect scenario
  const isApiRoute = path.startsWith('/api/');
  const isStaticFile = path.includes('.') && !path.includes('/api/');
  const isComingSoonPage = path.includes('/coming-soon');
  const isRootPage = path === '/' || path === '/en' || path === '/tr';
  const isHealthCheck = path === '/api/health';
  
  // Allow access to legal/info pages
  const isAllowedPage = path.includes('/privacy') || 
                        path.includes('/terms') || 
                        path.includes('/faq') ||
                        path.includes('/coming-soon');

  // Only redirect to coming-soon based on environment and variable
  const isProduction = (process.env.NODE_ENV === 'production' &&
                       process.env.NEXT_PUBLIC_COMING_SOON_ENABLED !== 'false') ||
                      process.env.NEXT_PUBLIC_COMING_SOON_ENABLED === 'true';

  // Redirect to coming-soon if:
  // 1. It's the root page OR
  // 2. It's not an API route AND not a static file AND not an allowed page
  // 3. AND it's production environment
  if (isProduction && (isRootPage || (!isApiRoute && !isStaticFile && !isAllowedPage && !isHealthCheck)) && !path.startsWith('/_next')) {
    // Determine locale for redirect
    const locale = pathLocale || cookieLocale || (acceptLanguage?.includes('tr') ? 'tr' : 'en');
    const comingSoonUrl = `/${locale}/coming-soon`;
    console.log('[middleware] redirecting to coming-soon', { from: path, to: comingSoonUrl, env: process.env.NODE_ENV });
    return NextResponse.redirect(new URL(comingSoonUrl, request.url));
  }

  const response = intlMiddleware(request);

  const resolvedLocaleHeader = response.headers.get('x-middleware-next-intl-locale');
  console.log('[middleware] intl resolved', {
    resolvedLocaleHeader,
    finalPath: response.headers.get('Location') || path
  });
  
  // Check if this is the work-environment page
  const isWorkEnvironment = path.includes('/work-environment');
  
  // Apply security headers
  const securityHeaders = {
    // Frame options to prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Content Security Policy - more permissive for work environment
    'Content-Security-Policy': isWorkEnvironment ? [
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: https: http:",
      "script-src * 'unsafe-inline' 'unsafe-eval' data: blob: https: http: 'self'",
      "style-src * 'unsafe-inline' data: blob: https: http: 'self'",
      "img-src * data: blob: https: http: 'self'",
      "font-src * data: blob: https: http: 'self'",
      "connect-src * data: blob: https: http: ws: wss: 'self'",
      "media-src * data: blob: https: http: 'self'",
      "frame-src * data: blob: https: http: 'self'",
      "child-src * data: blob: https: http: 'self'",
      "worker-src * blob: 'self'",
      "object-src * data: blob: https: http: 'self'",
      "base-uri 'self' https: http:",
      "form-action 'self' https: http:",
      "frame-ancestors 'self' https: http:"
    ].join('; ') : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://analytics.google.com",
      "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.google.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://www.googleapis.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net wss: https:",
      "media-src 'self' https: blob:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.google.com https://*.gstatic.com https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  
  // Apply headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Special handling for admin panel routes
  if (request.nextUrl.pathname.startsWith('/admin') || 
      request.nextUrl.pathname.startsWith('/api/admin')) {
    
    // Add additional security headers for admin routes
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Log admin access attempts (in production, this would go to a security log)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || // Cloudflare
               request.headers.get('x-client-ip') || // General proxy
               'unknown';
    console.log(`Admin access attempt: ${request.method} ${request.nextUrl.pathname} - IP: ${ip}`);
  }
  
  return response;
}

export const config = {
  matcher: [
    // next-intl recommended matcher plus excludes
    '/((?!api|_next|.*\\..*).*)',
  ],
};
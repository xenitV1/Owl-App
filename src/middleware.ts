import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'tr'],
  defaultLocale: 'en',
  localePrefix: 'always'
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

  const response = intlMiddleware(request);

  const resolvedLocaleHeader = response.headers.get('x-middleware-next-intl-locale');
  console.log('[middleware] intl resolved', {
    resolvedLocaleHeader,
    finalPath: response.headers.get('Location') || path
  });
  
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
    // Content Security Policy (allow Firebase/Google for auth)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com wss: https:",
      "media-src 'self' https: blob:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.google.com https://*.firebaseapp.com https://*.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
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
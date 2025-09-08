import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export function rateLimit({
  windowMs = 60000, // 1 minute
  max = 100, // limit each IP to 100 requests per windowMs
}: {
  windowMs?: number;
  max?: number;
} = {}) {
  return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
    // Get client IP from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || // Cloudflare
               request.headers.get('x-client-ip') || // General proxy
               'unknown';
    
    // Create a unique key for this IP and endpoint
    const endpoint = request.nextUrl.pathname;
    const key = createHash('sha256').update(`${ip}:${endpoint}`).digest('hex');
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get current rate limit data
    let data = rateLimitStore.get(key);
    
    // Reset if window has passed
    if (!data || data.resetTime < windowStart) {
      data = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, data);
    }
    
    // Increment count
    data.count++;
    
    // Check if limit exceeded
    if (data.count > max) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((data.resetTime - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': data.resetTime.toString(),
            'Retry-After': Math.ceil((data.resetTime - now) / 1000).toString(),
          },
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, max - data.count).toString());
    response.headers.set('X-RateLimit-Reset', data.resetTime.toString());
    
    return null; // Continue to the next handler
  };
}

// Clean up expired rate limit entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
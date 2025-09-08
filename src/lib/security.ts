import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rateLimit';

export interface SecurityConfig {
  enableRateLimit?: boolean;
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
  requireAuth?: boolean;
  allowedMethods?: string[];
  validateInput?: (data: any) => { isValid: boolean; errors: string[] };
}

export function createSecurityHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Check HTTP method
      if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // Apply rate limiting
      if (config.enableRateLimit) {
        const rateLimitResponse = rateLimit({
          windowMs: config.rateLimitWindowMs || 60000,
          max: config.rateLimitMax || 100,
        })(request);
        
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Validate content type for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return NextResponse.json(
            { error: 'Content-Type must be application/json' },
            { status: 400 }
          );
        }
      }

      // Parse and validate body for POST/PUT/PATCH
      let body;
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const rawBody = await request.text();
          body = JSON.parse(rawBody);
          
          // Basic size limit
          if (rawBody.length > 1024 * 1024) { // 1MB
            return NextResponse.json(
              { error: 'Request body too large' },
              { status: 413 }
            );
          }
          
          // Custom validation
          if (config.validateInput) {
            const validation = config.validateInput(body);
            if (!validation.isValid) {
              return NextResponse.json(
                { error: 'Validation failed', errors: validation.errors },
                { status: 400 }
              );
            }
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON' },
            { status: 400 }
          );
        }
      }

      // Add security headers
      const response = await handler(request, context);
      
      // Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function createAuthenticatedHandler(
  handler: (request: NextRequest, userId: string, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return createSecurityHandler(
    async (request: NextRequest, context?: any) => {
      // Get authorization header
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }
      
      const token = authHeader.substring(7);
      
      try {
        // Verify token (this should be implemented with your auth system)
        const userId = await verifyAuthToken(token);
        
        if (!userId) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
        
        return await handler(request, userId, context);
        
      } catch (error) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    },
    { ...config, requireAuth: true }
  );
}

// Placeholder for token verification - implement with your auth system
async function verifyAuthToken(token: string): Promise<string | null> {
  // This should be implemented with Firebase Admin SDK or your auth system
  try {
    // For now, return a dummy implementation
    // In production, this would verify the Firebase token
    return token.length > 10 ? 'user-id' : null;
  } catch (error) {
    return null;
  }
}
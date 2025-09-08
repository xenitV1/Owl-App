import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken, verifyPassword, hashPassword } from './encryption';

interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
}

interface UserSession {
  userId: string;
  sessions: Session[];
  failedAttempts: number;
  lockedUntil?: number;
  requires2FA: boolean;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
}

const sessionStore = new Map<string, Session>();
const userSessionStore = new Map<string, UserSession>();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export class SessionManager {
  static createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Session {
    const sessionToken = generateSecureToken();
    const sessionId = generateSecureToken(16);
    const now = Date.now();
    
    const session: Session = {
      id: sessionId,
      userId,
      token: sessionToken,
      createdAt: now,
      expiresAt: now + SESSION_TIMEOUT,
      userAgent,
      ipAddress,
      isActive: true,
    };
    
    sessionStore.set(sessionId, session);
    
    // Update user session store
    let userSession = userSessionStore.get(userId);
    if (!userSession) {
      userSession = {
        userId,
        sessions: [],
        failedAttempts: 0,
        requires2FA: false,
        twoFactorEnabled: false,
      };
      userSessionStore.set(userId, userSession);
    }
    
    userSession.sessions.push(session);
    
    return session;
  }
  
  static validateSession(sessionId: string, token: string): { isValid: boolean; userId?: string } {
    const session = sessionStore.get(sessionId);
    
    if (!session || !session.isActive) {
      return { isValid: false };
    }
    
    if (session.token !== token) {
      return { isValid: false };
    }
    
    if (Date.now() > session.expiresAt) {
      this.invalidateSession(sessionId);
      return { isValid: false };
    }
    
    // Extend session expiration
    session.expiresAt = Date.now() + SESSION_TIMEOUT;
    
    return { isValid: true, userId: session.userId };
  }
  
  static invalidateSession(sessionId: string): boolean {
    const session = sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      sessionStore.delete(sessionId);
      
      // Remove from user session store
      const userSession = userSessionStore.get(session.userId);
      if (userSession) {
        userSession.sessions = userSession.sessions.filter(s => s.id !== sessionId);
      }
      
      return true;
    }
    return false;
  }
  
  static invalidateAllUserSessions(userId: string, exceptSessionId?: string): number {
    const userSession = userSessionStore.get(userId);
    if (!userSession) return 0;
    
    let invalidatedCount = 0;
    userSession.sessions.forEach(session => {
      if (session.id !== exceptSessionId && session.isActive) {
        this.invalidateSession(session.id);
        invalidatedCount++;
      }
    });
    
    return invalidatedCount;
  }
  
  static recordFailedAttempt(userId: string): { isLocked: boolean; remainingAttempts: number } {
    let userSession = userSessionStore.get(userId);
    if (!userSession) {
      userSession = {
        userId,
        sessions: [],
        failedAttempts: 0,
        requires2FA: false,
        twoFactorEnabled: false,
      };
      userSessionStore.set(userId, userSession);
    }
    
    userSession.failedAttempts++;
    
    if (userSession.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      userSession.lockedUntil = Date.now() + LOCKOUT_DURATION;
      return { isLocked: true, remainingAttempts: 0 };
    }
    
    const remainingAttempts = MAX_FAILED_ATTEMPTS - userSession.failedAttempts;
    return { isLocked: false, remainingAttempts };
  }
  
  static resetFailedAttempts(userId: string): void {
    const userSession = userSessionStore.get(userId);
    if (userSession) {
      userSession.failedAttempts = 0;
      userSession.lockedUntil = undefined;
    }
  }
  
  static isAccountLocked(userId: string): { isLocked: boolean; remainingTime?: number } {
    const userSession = userSessionStore.get(userId);
    if (!userSession || !userSession.lockedUntil) {
      return { isLocked: false };
    }
    
    if (Date.now() > userSession.lockedUntil) {
      userSession.lockedUntil = undefined;
      userSession.failedAttempts = 0;
      return { isLocked: false };
    }
    
    const remainingTime = userSession.lockedUntil - Date.now();
    return { isLocked: true, remainingTime };
  }
  
  static enable2FA(userId: string, secret: string): void {
    let userSession = userSessionStore.get(userId);
    if (!userSession) {
      userSession = {
        userId,
        sessions: [],
        failedAttempts: 0,
        requires2FA: false,
        twoFactorEnabled: false,
      };
      userSessionStore.set(userId, userSession);
    }
    
    userSession.twoFactorSecret = secret;
    userSession.twoFactorEnabled = true;
  }
  
  static disable2FA(userId: string): void {
    const userSession = userSessionStore.get(userId);
    if (userSession) {
      userSession.twoFactorEnabled = false;
      userSession.twoFactorSecret = undefined;
      userSession.requires2FA = false;
    }
  }
  
  static require2FAForNewSessions(userId: string): void {
    const userSession = userSessionStore.get(userId);
    if (userSession) {
      userSession.requires2FA = true;
    }
  }
  
  static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of sessionStore.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        sessionStore.delete(sessionId);
        
        // Remove from user session store
        const userSession = userSessionStore.get(session.userId);
        if (userSession) {
          userSession.sessions = userSession.sessions.filter(s => s.id !== sessionId);
        }
      }
    }
  }
}

// Cleanup expired sessions periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    SessionManager.cleanupExpiredSessions();
  }, 60 * 60 * 1000); // Clean up every hour
}

export function createAuthMiddleware() {
  return async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Get session token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing authorization header' },
          { status: 401 }
        );
      }
      
      const token = authHeader.substring(7);
      
      // Get session ID from custom header
      const sessionId = request.headers.get('x-session-id');
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Missing session ID' },
          { status: 401 }
        );
      }
      
      // Validate session
      const sessionValidation = SessionManager.validateSession(sessionId, token);
      if (!sessionValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        );
      }
      
      // Add user info to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-id', sessionValidation.userId!);
      
      return null; // Continue to the next handler
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function createRateLimitingAuthMiddleware() {
  const authMiddleware = createAuthMiddleware();
  
  return async function rateLimitingAuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // First, apply rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || // Cloudflare
               request.headers.get('x-client-ip') || // General proxy
               'unknown';
    
    const ipKey = `auth_rate_limit_${ip}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Simple in-memory rate limiting for auth attempts
    const attempts = (global as any)[ipKey] || [];
    const recentAttempts = attempts.filter((time: number) => time > windowStart);
    
    if (recentAttempts.length >= 10) { // 10 attempts per minute
      return NextResponse.json(
        { error: 'Too many authentication attempts' },
        { status: 429 }
      );
    }
    
    recentAttempts.push(now);
    (global as any)[ipKey] = recentAttempts;
    
    // Then apply regular authentication
    return await authMiddleware(request);
  };
}
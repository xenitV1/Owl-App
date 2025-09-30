/**
 * API Route Debug Utility for Owl Educational Social Media Platform
 * Provides comprehensive logging for server-side API routes
 */

import { NextRequest } from 'next/server';

export interface ApiDebugConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logPerformance: boolean;
  includeHeaders: boolean;
  includeBody: boolean;
  sanitizeSensitiveData: boolean;
}

export interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  headers?: Record<string, string>;
  body?: any;
  response?: any;
  error?: any;
  userId?: string;
}

class ApiDebugLogger {
  private config: ApiDebugConfig;
  private logs: ApiLogEntry[] = [];

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      logRequests: true,
      logResponses: true,
      logErrors: true,
      logPerformance: true,
      includeHeaders: false,
      includeBody: true,
      sanitizeSensitiveData: true
    };

    // Load config from environment variables
    if (process.env.API_DEBUG_ENABLED === 'true') {
      this.config.enabled = true;
    }
    if (process.env.API_DEBUG_LOG_HEADERS === 'true') {
      this.config.includeHeaders = true;
    }
    if (process.env.API_DEBUG_LOG_BODY === 'false') {
      this.config.includeBody = false;
    }
  }

  private sanitizeData(data: any): any {
    if (!this.config.sanitizeSensitiveData) {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'cookie', 'session', 'credit', 'card', 'ssn', 'social'
    ];

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private extractHeaders(request: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (!this.config.includeHeaders) {
      return headers;
    }

    request.headers.forEach((value, key) => {
      // Skip sensitive headers
      if (!['authorization', 'cookie', 'set-cookie'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    return headers;
  }

  private async extractBody(request: NextRequest): Promise<any> {
    if (!this.config.includeBody) {
      return undefined;
    }

    try {
      // Avoid parsing body for GET/HEAD requests
      if (request.method === 'GET' || request.method === 'HEAD') {
        return undefined;
      }
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        return this.sanitizeData(body);
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const body: Record<string, string> = {};
        formData.forEach((value, key) => {
          // Only include string values, skip File objects
          if (typeof value === 'string') {
            body[key] = value;
          }
        });
        return this.sanitizeData(body);
      }
    } catch (error) {
      // Failed to parse body, continue without it
      console.warn('Failed to parse request body:', error);
    }

    return undefined;
  }

  private extractUserId(request: NextRequest): string | undefined {
    // Try to extract user ID from various sources
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // You might want to decode a JWT token here
      // For now, just indicate there's an auth header
      return '[AUTHENTICATED]';
    }

    // Check for user ID in headers (custom implementation)
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader) {
      return userIdHeader;
    }

    return undefined;
  }

  private logToConsole(entry: ApiLogEntry): void {
    if (!this.config.enabled) return;

    const logData = {
      method: entry.method,
      url: entry.url,
      statusCode: entry.statusCode,
      duration: entry.duration,
      userId: entry.userId,
      headers: entry.headers,
      body: entry.body,
      response: entry.response,
      error: entry.error
    };

    if (entry.error) {
      console.error(`🚨 API Error: ${entry.method} ${entry.url}`, logData);
    } else if (entry.statusCode && entry.statusCode >= 400) {
      console.warn(`⚠️ API Warning: ${entry.method} ${entry.url} - ${entry.statusCode}`, logData);
    } else {
      console.log(`📡 API: ${entry.method} ${entry.url}`, logData);
    }
  }

  async logRequest(request: NextRequest): Promise<ApiLogEntry> {
    if (!this.config.enabled || !this.config.logRequests) {
      return {} as ApiLogEntry;
    }

    const entry: ApiLogEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: this.extractHeaders(request),
      body: await this.extractBody(request),
      userId: this.extractUserId(request)
    };

    this.logs.push(entry);
    this.logToConsole(entry);

    return entry;
  }

  logResponse(entry: ApiLogEntry, statusCode: number, response?: any, duration?: number): void {
    if (!this.config.enabled || !this.config.logResponses) {
      return;
    }

    entry.statusCode = statusCode;
    entry.response = response ? this.sanitizeData(response) : undefined;
    entry.duration = duration;

    // Update the log entry
    const index = this.logs.findIndex(log => 
      log.method === entry.method && log.url === entry.url && log.timestamp === entry.timestamp
    );
    
    if (index !== -1) {
      this.logs[index] = entry;
    }

    this.logToConsole(entry);
  }

  logError(entry: ApiLogEntry, error: any): void {
    if (!this.config.enabled || !this.config.logErrors) {
      return;
    }

    entry.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };

    // Update the log entry
    const index = this.logs.findIndex(log => 
      log.method === entry.method && log.url === entry.url && log.timestamp === entry.timestamp
    );
    
    if (index !== -1) {
      this.logs[index] = entry;
    }

    this.logToConsole(entry);
  }

  // Middleware function for Next.js API routes
  middleware() {
    return async (request: NextRequest, handler: (req: NextRequest) => Promise<Response>) => {
      if (!this.config.enabled) {
        return handler(request);
      }

      const startTime = performance.now();
      const logEntry = await this.logRequest(request);

      try {
        const response = await handler(request);
        const endTime = performance.now();
        const duration = endTime - startTime;

        let responseData;
        if (this.config.includeBody && response.headers.get('content-type')?.includes('application/json')) {
          try {
            responseData = await response.clone().json();
          } catch (error) {
            // Failed to parse response body
          }
        }

        this.logResponse(logEntry, response.status, responseData, duration);
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.logError(logEntry, error);
        throw error;
      }
    };
  }

  // Decorator for API route handlers
  decorateHandler(handler: (req: NextRequest) => Promise<Response>) {
    return async (request: NextRequest): Promise<Response> => {
      if (!this.config.enabled) {
        return handler(request);
      }

      const startTime = performance.now();
      const logEntry = await this.logRequest(request);

      try {
        const response = await handler(request);
        const endTime = performance.now();
        const duration = endTime - startTime;

        let responseData;
        if (this.config.includeBody && response.headers.get('content-type')?.includes('application/json')) {
          try {
            responseData = await response.clone().json();
          } catch (error) {
            // Failed to parse response body
          }
        }

        this.logResponse(logEntry, response.status, responseData, duration);
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.logError(logEntry, error);
        throw error;
      }
    };
  }

  // Utility methods
  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  updateConfig(newConfig: Partial<ApiDebugConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    if (!this.config.enabled || !this.config.logPerformance) {
      return () => {};
    }

    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      console.log(`⏱️ Performance [${label}]: ${duration.toFixed(2)}ms`);
    };
  }
}

// Create and export singleton instance
const apiDebugLogger = new ApiDebugLogger();

export default apiDebugLogger;

// Export utility functions
export const withApiDebug = (handler: (req: NextRequest) => Promise<Response>) => {
  return apiDebugLogger.decorateHandler(handler);
};

export const logApiRequest = (request: NextRequest) => {
  return apiDebugLogger.logRequest(request);
};

export const logApiResponse = (entry: any, statusCode: number, response?: any, duration?: number) => {
  return apiDebugLogger.logResponse(entry, statusCode, response, duration);
};

export const logApiError = (entry: any, error: any) => {
  return apiDebugLogger.logError(entry, error);
};
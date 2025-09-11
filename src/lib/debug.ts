/**
 * Debug Utility for Owl Educational Social Media Platform
 * Provides comprehensive logging, error tracking, and performance monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'api' | 'ui' | 'performance' | 'database' | 'network' | 'general';

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  categories: LogCategory[];
  includeTimestamps: boolean;
  includeStackTraces: boolean;
  maxLogEntries: number;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stack?: string;
  context?: string;
}

class DebugLogger {
  private config: DebugConfig;
  private logEntries: LogEntry[] = [];
  private performanceMarks: Map<string, number> = new Map();

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'debug',
      categories: ['auth', 'api', 'ui', 'performance', 'database', 'network', 'general'],
      includeTimestamps: true,
      includeStackTraces: true,
      maxLogEntries: 1000
    };

    // Load config from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedConfig = localStorage.getItem('owl-debug-config');
        if (savedConfig) {
          this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }
      } catch (error) {
        console.warn('Failed to load debug config from localStorage:', error);
      }
    }
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.categories.includes(category)) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private createLogEntry(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    data?: any, 
    context?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: this.config.includeTimestamps ? new Date().toISOString() : '',
      level,
      category,
      message,
      data,
      context
    };

    if (this.config.includeStackTraces && level === 'error') {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (entry.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }
    
    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(`[${entry.category}]`);
    
    if (entry.context) {
      parts.push(`[${entry.context}]`);
    }
    
    parts.push(entry.message);
    
    if (entry.data) {
      parts.push(`\nData: ${JSON.stringify(entry.data, null, 2)}`);
    }
    
    if (entry.stack) {
      parts.push(`\nStack: ${entry.stack}`);
    }
    
    return parts.join(' ');
  }

  private storeLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // Keep only the most recent entries
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any, context?: string): void {
    if (!this.shouldLog(level, category)) return;

    const entry = this.createLogEntry(level, category, message, data, context);
    this.storeLogEntry(entry);
    
    const formattedMessage = this.formatLogEntry(entry);
    
    // Log to console with appropriate method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  // Public logging methods
  debug(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log('debug', category, message, data, context);
  }

  info(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log('info', category, message, data, context);
  }

  warn(category: LogCategory, message: string, data?: any, context?: string): void {
    this.log('warn', category, message, data, context);
  }

  error(category: LogCategory, message: string, error?: any, context?: string): void {
    this.log('error', category, message, error, context);
  }

  // Performance monitoring
  startPerformanceMark(name: string): void {
    if (!this.shouldLog('debug', 'performance')) return;
    this.performanceMarks.set(name, performance.now());
    this.debug('performance', `Started performance mark: ${name}`);
  }

  endPerformanceMark(name: string): void {
    if (!this.shouldLog('debug', 'performance')) return;
    
    const startTime = this.performanceMarks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.performanceMarks.delete(name);
      this.debug('performance', `Ended performance mark: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    } else {
      this.warn('performance', `Performance mark not found: ${name}`);
    }
  }

  // Network request logging
  logNetworkRequest(method: string, url: string, data?: any): void {
    this.debug('network', `API Request: ${method} ${url}`, data);
  }

  logNetworkResponse(method: string, url: string, status: number, data?: any): void {
    this.debug('network', `API Response: ${method} ${url} - ${status}`, data);
  }

  logNetworkError(method: string, url: string, error: any): void {
    this.error('network', `API Error: ${method} ${url}`, error);
  }

  // API route logging
  logApiRoute(route: string, method: string, params?: any): void {
    this.info('api', `API Route accessed: ${method} ${route}`, params);
  }

  logApiError(route: string, method: string, error: any): void {
    this.error('api', `API Route error: ${method} ${route}`, error);
  }

  // Authentication logging
  logAuthAction(action: string, userId?: string, data?: any): void {
    this.info('auth', `Auth action: ${action}`, { userId, ...data });
  }

  logAuthError(action: string, error: any, userId?: string): void {
    this.error('auth', `Auth error: ${action}`, error, userId);
  }

  // UI component logging
  logComponentMount(componentName: string, props?: any): void {
    this.debug('ui', `Component mounted: ${componentName}`, props);
  }

  logComponentUnmount(componentName: string): void {
    this.debug('ui', `Component unmounted: ${componentName}`);
  }

  logComponentError(componentName: string, error: any): void {
    this.error('ui', `Component error: ${componentName}`, error);
  }

  // Database logging
  logDatabaseOperation(operation: string, table: string, data?: any): void {
    this.debug('database', `Database operation: ${operation} on ${table}`, data);
  }

  logDatabaseError(operation: string, table: string, error: any): void {
    this.error('database', `Database error: ${operation} on ${table}`, error);
  }

  // Configuration methods
  updateConfig(newConfig: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('owl-debug-config', JSON.stringify(this.config));
      } catch (error) {
        console.warn('Failed to save debug config to localStorage:', error);
      }
    }
    
    this.info('general', 'Debug configuration updated', this.config);
  }

  getLogEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  clearLogs(): void {
    this.logEntries = [];
    this.info('general', 'Debug logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify({
      config: this.config,
      logs: this.logEntries,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Development helper methods
  enableDebugMode(): void {
    this.updateConfig({ enabled: true, level: 'debug' });
  }

  disableDebugMode(): void {
    this.updateConfig({ enabled: false });
  }

  // Global error handler setup
  setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('general', 'Unhandled promise rejection', event.reason);
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      // Filter out ResizeObserver errors as they are harmless browser quirks
      if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        // Silently ignore ResizeObserver errors - they are not actual errors
        return;
      }
      
      this.error('general', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
  }
}

// Create and export singleton instance
const debugLogger = new DebugLogger();

// Initialize global error handlers in development
if (process.env.NODE_ENV === 'development') {
  debugLogger.setupGlobalErrorHandlers();
}

export default debugLogger;

// Export types for external use
export type { LogLevel, LogCategory, DebugConfig, LogEntry };
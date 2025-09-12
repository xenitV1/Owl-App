/**
 * ResizeObserver utility with error handling
 * Provides a wrapper around ResizeObserver that handles common browser quirks
 */

// Import React hooks for the hook function
import { useRef, useEffect } from 'react';

// Lazy initialization of OriginalResizeObserver to avoid SSR issues
let OriginalResizeObserver: typeof ResizeObserver | undefined;

function getOriginalResizeObserver(): typeof ResizeObserver | undefined {
  if (typeof window === 'undefined') return undefined;
  if (!OriginalResizeObserver) {
    OriginalResizeObserver = window.ResizeObserver;
  }
  return OriginalResizeObserver;
}

/**
 * Safe ResizeObserver implementation that handles browser quirks
 */
export class SafeResizeObserver {
  private observer: ResizeObserver | null = null;
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    
    // Only create observer on client side
    if (typeof window !== 'undefined') {
      const ResizeObserverClass = getOriginalResizeObserver();
      if (ResizeObserverClass) {
        this.observer = new ResizeObserverClass((entries, observer) => {
          try {
            callback(entries, observer);
          } catch (error) {
            // Handle ResizeObserver errors gracefully
            if (error instanceof Error && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
              // This is a harmless browser quirk, ignore it
              return;
            }
            // Re-throw other errors
            throw error;
          }
        });
      }
    }
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    if (this.observer) {
      this.observer.observe(target, options);
    }
  }

  unobserve(target: Element): void {
    if (this.observer) {
      this.observer.unobserve(target);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Global error handler for ResizeObserver errors
 * This should be called once during app initialization
 */
export function setupResizeObserverErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Override the global error handler to filter ResizeObserver errors
  const originalErrorHandler = window.onerror;
  
  window.onerror = (message, source, lineno, colno, error) => {
    // Check if this is a ResizeObserver error
    if (typeof message === 'string' && message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Silently ignore ResizeObserver errors
      return true; // Prevent default error handling
    }
    
    // Call original error handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.call(window, message, source, lineno, colno, error);
    }
    
    return false;
  };

  // Also handle unhandled promise rejections that might contain ResizeObserver errors
  const originalRejectionHandler = window.onunhandledrejection;
  
  window.onunhandledrejection = (event) => {
    // Check if the rejection is related to ResizeObserver
    if (event.reason && 
        typeof event.reason === 'object' && 
        event.reason.message && 
        event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Prevent the unhandled rejection
      event.preventDefault();
      return;
    }
    
    // Call original handler for other rejections
    if (originalRejectionHandler) {
      return originalRejectionHandler.call(window, event);
    }
  };
}

/**
 * Hook to use ResizeObserver safely in React components
 */
export function useSafeResizeObserver(callback: ResizeObserverCallback) {
  const observerRef = useRef<SafeResizeObserver | null>(null);

  useEffect(() => {
    observerRef.current = new SafeResizeObserver(callback);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback]);

  return observerRef.current;
}

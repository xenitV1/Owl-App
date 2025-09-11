'use client';

import { useEffect } from 'react';
import { setupResizeObserverErrorHandling } from '@/lib/resizeObserver';

/**
 * Component that sets up ResizeObserver error handling globally
 * This should be mounted once in the app to handle ResizeObserver errors
 */
export function ResizeObserverErrorHandler() {
  useEffect(() => {
    // Set up global ResizeObserver error handling
    setupResizeObserverErrorHandling();
  }, []);

  // This component doesn't render anything
  return null;
}

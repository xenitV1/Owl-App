'use client';

import React, { useState, useEffect, useRef, lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading components for different use cases
export const CardSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[300px]" />
    <Skeleton className="h-[200px] w-full rounded-lg" />
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
    ))}
  </div>
);

export const PostSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[300px]" />
    <Skeleton className="h-[300px] w-full rounded-lg" />
    <div className="flex justify-between">
      <div className="flex space-x-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col items-center space-y-4">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-6 w-[150px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-[50px] mx-auto mb-2" />
          <Skeleton className="h-4 w-[80px] mx-auto" />
        </div>
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-[100px]" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded" />
        ))}
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loaded component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || (() => (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-semibold">Component failed to load</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      ));
      
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Lazy loading wrapper with suspense and error boundary
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<any>,
  fallback: ComponentType = () => <CardSkeleton />,
  errorFallback?: ComponentType<{ error: Error }>
): LazyExoticComponent<T> {
  const LazyComponent = lazy(async () => {
    const importedModule = await importFn();
    // Handle both default exports and named exports
    if ('default' in importedModule) {
      return { default: importedModule.default as T };
    } else {
      // For named exports, we need to find the component
      // This assumes the module has only one component export
      const componentKey = Object.keys(importedModule).find(key => typeof importedModule[key] === 'function');
      if (componentKey) {
        return { default: importedModule[componentKey] as T };
      }
      // Fallback: try to use any export that looks like a component
      for (const key in importedModule) {
        if (typeof importedModule[key] === 'function' && importedModule[key].prototype?.isReactComponent) {
          return { default: importedModule[key] as T };
        }
      }
      throw new Error('No component found in module');
    }
  });
  
  const WrappedComponent = (props: any) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={React.createElement(fallback)}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  return WrappedComponent as LazyExoticComponent<T>;
}

// Route-based lazy loading
export function createLazyPage<T extends ComponentType<any>>(
  importFn: () => Promise<any>
): LazyExoticComponent<T> {
  return createLazyComponent(
    importFn,
    () => (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-8 w-96" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  );
}

// Intersection Observer based lazy loading for components
export function useIntersectionObserver(
  elementRef: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Component for viewport-based lazy loading
interface LazyComponentProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyComponent({
  children,
  placeholder = <div className="h-32 bg-muted animate-pulse rounded" />,
  rootMargin = '50px',
  threshold = 0.1
}: LazyComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin, threshold });

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  );
}

// Prefetching utility
export class ComponentPrefetcher {
  private static prefetchedComponents = new Set<string>();

  static async prefetch<T>(
    componentName: string,
    importFn: () => Promise<any>
  ): Promise<void> {
    if (this.prefetchedComponents.has(componentName)) {
      return;
    }

    try {
      await importFn();
      this.prefetchedComponents.add(componentName);
    } catch (error) {
      console.error(`Failed to prefetch component ${componentName}:`, error);
    }
  }

  static isPrefetched(componentName: string): boolean {
    return this.prefetchedComponents.has(componentName);
  }

  static clearPrefetchCache(): void {
    this.prefetchedComponents.clear();
  }
}

// Bundle analyzer utilities
export const BundleAnalyzer = {
  // Get estimated bundle size for a component
  async getComponentSize<T>(importFn: () => Promise<any>): Promise<number> {
    try {
      const start = performance.now();
      await importFn();
      const end = performance.now();
      return Math.round(end - start);
    } catch (error) {
      console.error('Failed to analyze component size:', error);
      return 0;
    }
  },

  // Check if component should be lazy loaded based on size
  shouldLazyLoad<T>(importFn: () => Promise<any>, threshold: number = 50): Promise<boolean> {
    return this.getComponentSize(importFn).then(size => size > threshold);
  }
};

// Performance monitoring for lazy loaded components
export function useLazyComponentPerformance(componentName: string) {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
    };
  }, [componentName]);

  const trackRender = () => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    };
  };

  return { loadTime, renderTime, trackRender };
}
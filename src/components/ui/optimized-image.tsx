'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  imageMetadata?: {
    width: number;
    height: number;
    placeholder?: string;
    responsive?: Record<string, {
      width: number;
      height: number;
      filename: string;
    }>;
  };
  fallback?: string;
  onClick?: () => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  imageMetadata,
  fallback,
  onClick,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!imageMetadata?.responsive) return undefined;
    
    return Object.entries(imageMetadata.responsive)
      .map(([size, data]) => `/api/images/${src}/${size} ${data.width}w`)
      .join(', ');
  };

  // Generate sizes attribute
  const generateSizes = () => {
    if (!imageMetadata?.responsive) return undefined;
    
    return `(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px`;
  };

  // Handle image load
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    setHasError(false);
    
    // Call external onLoad handler if provided
    if (onLoad) {
      onLoad(e);
    }
  };

  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    setHasError(true);
    if (fallback) {
      setCurrentSrc(fallback);
    }
    // Call the custom onError handler if provided
    if (onError) {
      onError(e);
    }
  };

  // Use placeholder while loading
  const placeholder = imageMetadata?.placeholder;

  // Calculate aspect ratio
  const aspectRatio = imageMetadata 
    ? imageMetadata.width / imageMetadata.height 
    : width && height 
      ? width / height 
      : 1;

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{
        aspectRatio: aspectRatio,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto'
      }}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-r from-muted/50 to-muted/30 animate-shimmer" />
        </div>
      )}

      {/* Placeholder blur effect */}
      {placeholder && isLoading && (
        <div 
          className="absolute inset-0 blur-sm scale-110"
          style={{
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Main image */}
      {!hasError && (
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          priority={priority}
          sizes={generateSizes()}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={false}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm text-muted-foreground">Image not available</p>
          </div>
        </div>
      )}

      {/* Accessibility attributes */}
      <div 
        className="sr-only"
        role="img"
        aria-label={alt}
      />
    </div>
  );
}

// Lazy load wrapper component
interface LazyOptimizedImageProps extends Omit<OptimizedImageProps, 'priority'> {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function LazyOptimizedImage({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  ...props
}: LazyOptimizedImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [actualHeight, setActualHeight] = useState<number | null>(null);

  // Calculate dynamic aspect ratio
  const aspectRatio = useMemo(() => {
    // First, try to use the imageMetadata if available
    if (props.imageMetadata) {
      return props.imageMetadata.width / props.imageMetadata.height;
    }
    // Second, use width and height if provided
    else if (props.width && props.height) {
      return props.width / props.height;
    }
    // Default to a standard aspect ratio (16:9)
    return 16/9;
  }, [props.imageMetadata, props.width, props.height]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  // Handle image loaded event to adjust height if needed
  const handleImageLoaded = (height: number) => {
    setActualHeight(height);
  };

  return (
    <div 
      ref={imgRef} 
      className="relative"
      style={{
        // If we know the actual height, use it, otherwise use aspect ratio
        height: actualHeight ? `${actualHeight}px` : 'auto',
        // Ensure minimum height until image loads
        minHeight: !actualHeight ? '100px' : undefined
      }}
    >
      {isInView ? (
        <OptimizedImage 
          {...props} 
          onLoad={(e) => {
            // Get actual rendered height when image loads
            if (e.currentTarget) {
              setActualHeight(e.currentTarget.clientHeight);
            }
          }}
        />
      ) : (
        <div 
          className={cn(
            'relative overflow-hidden bg-muted animate-pulse',
            props.className
          )}
          style={{
            aspectRatio: aspectRatio,
            width: props.width ? `${props.width}px` : '100%',
            height: props.height ? `${props.height}px` : 'auto'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30 animate-shimmer" />
        </div>
      )}
    </div>
  );
}

// Gallery component for multiple images
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    imageMetadata?: OptimizedImageProps['imageMetadata'];
  }>;
  className?: string;
  onImageClick?: (index: number) => void;
}

export function ImageGallery({ images, className, onImageClick }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main image */}
      <div className="relative">
        <OptimizedImage
          src={images[selectedImage]?.src}
          alt={images[selectedImage]?.alt || 'Gallery image'}
          className="w-full h-96 rounded-lg"
          imageMetadata={images[selectedImage]?.imageMetadata}
          onClick={() => onImageClick?.(selectedImage)}
        />
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                'relative overflow-hidden rounded border-2 transition-all',
                index === selectedImage 
                  ? 'border-primary scale-105' 
                  : 'border-transparent hover:border-muted-foreground'
              )}
              onClick={() => setSelectedImage(index)}
            >
              <OptimizedImage
                src={image.src}
                alt={image.alt || `Thumbnail ${index + 1}`}
                className="w-full h-20"
                imageMetadata={image.imageMetadata}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
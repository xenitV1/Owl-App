'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageData {
  src: string;
  alt: string;
  title?: string;
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
}

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  initialIndex?: number;
  className?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  className,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageLoadTime, setImageLoadTime] = useState<number | null>(null);
  const [lightboxOpenTime, setLightboxOpenTime] = useState<number | null>(null);
  
  // Pan state for dragging zoomed images
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  
  // Window boyutu state'i
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  
  const { toast } = useToast();
  const t = useTranslations('imageViewer');

  const currentImage = images[currentIndex];

  // Debug logging utility (disabled - no-op to avoid console output)
  const logAction = (_action: string, _details?: any) => {};

  // Reset zoom, rotation when image changes
  useEffect(() => {
    logAction('IMAGE_CHANGED', {
      'Previous Index': currentIndex,
      'New Index': currentIndex,
      'Image Source': currentImage?.src,
      'Reset Zoom': '1x',
      'Reset Rotation': '0°',
      'Reset Pan': '(0, 0)'
    });
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setImageLoadTime(null);
  }, [currentIndex]);

  // Window boyutu değişikliklerini takip et
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setWindowSize(newSize);
      
      logAction('WINDOW_RESIZE', {
        'New Width': `${newSize.width}px`,
        'New Height': `${newSize.height}px`,
        'Aspect Ratio': (newSize.width / newSize.height).toFixed(2),
        'Screen Type': newSize.width < 640 ? 'Mobile' : 
                      newSize.width < 1024 ? 'Tablet' : 'Desktop'
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      const openStart = performance.now();
      setLightboxOpenTime(openStart);
      setCurrentIndex(initialIndex);
      
      // Lightbox açılırken tüm state'i resetle
      setZoom(1);
      setRotation(0);
      setPanX(0);
      setPanY(0);
      
      logAction('LIGHTBOX_OPENED', {
        'Initial Index': initialIndex,
        'Total Images': images.length,
        'Open Time': new Date().toLocaleTimeString(),
        'Performance Start': `${openStart.toFixed(2)}ms`,
        'Window Size': `${windowSize.width}x${windowSize.height}`,
        'Device Type': windowSize.width < 640 ? 'Mobile' : 
                      windowSize.width < 1024 ? 'Tablet' : 'Desktop',
        'Initial State': 'All settings reset to default'
      });
    } else if (lightboxOpenTime) {
      const totalTime = performance.now() - lightboxOpenTime;
      logAction('LIGHTBOX_CLOSED', {
        'Total Open Duration': `${totalTime.toFixed(2)}ms`,
        'Close Time': new Date().toLocaleTimeString()
      });
      setLightboxOpenTime(null);
    }
  }, [isOpen, initialIndex, windowSize]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey) {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'Shift+ArrowLeft', 'Action': 'Continuous Rotate CCW' });
            handleContinuousRotate(-15);
          } else {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'ArrowLeft', 'Action': 'Previous Image' });
            goToPrevious();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'Shift+ArrowRight', 'Action': 'Continuous Rotate CW' });
            handleContinuousRotate(15);
          } else {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'ArrowRight', 'Action': 'Next Image' });
            goToNext();
          }
          break;
        case 'Escape':
          logAction('KEYBOARD_NAVIGATION', { 'Key': 'Escape', 'Action': 'Close Lightbox' });
          onClose();
          break;
        case '+':
        case '=':
          logAction('KEYBOARD_NAVIGATION', { 'Key': e.key, 'Action': 'Zoom In' });
          handleZoomIn();
          break;
        case '-':
          logAction('KEYBOARD_NAVIGATION', { 'Key': '-', 'Action': 'Zoom Out' });
          handleZoomOut();
          break;
        case 'r':
          if (e.shiftKey) {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'Shift+R', 'Action': 'Continuous Rotate CCW' });
            handleContinuousRotate(-15);
          } else {
            logAction('KEYBOARD_NAVIGATION', { 'Key': 'R', 'Action': 'Rotate 90° CW' });
            handleRotate();
          }
          break;
        case 'R':
          logAction('KEYBOARD_NAVIGATION', { 'Key': 'Shift+R', 'Action': 'Continuous Rotate CW' });
          handleContinuousRotate(15);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoom]);

  // Touch gesture handling for mobile (navigation and double tap)
  useEffect(() => {
    if (!isOpen) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchTime = 0;
    let hasMoved = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't handle navigation gestures when over the image (to prevent conflicts with drag)
      const target = e.target as HTMLElement;
      if (target.closest('[data-image-container]')) {
        return;
      }
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastTouchTime = Date.now();
      hasMoved = false;
      logAction('TOUCH_NAVIGATION_START', {
        'Touch X': touchStartX.toFixed(2),
        'Touch Y': touchStartY.toFixed(2),
        'Timestamp': new Date().toLocaleTimeString()
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientX - touchStartX) > 10 || 
          Math.abs(e.touches[0].clientY - touchStartY) > 10) {
        hasMoved = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Don't handle navigation gestures when over the image (to prevent conflicts with drag)
      const target = e.target as HTMLElement;
      if (target.closest('[data-image-container]')) {
        return;
      }
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const currentTime = Date.now();
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = currentTime - lastTouchTime;
      
      // Only handle swipe navigation when not zoomed in and for significant movements
      if (!hasMoved && deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        // Double tap to reset
        logAction('TOUCH_GESTURE', {
          'Gesture': 'Double Tap',
          'Duration': `${deltaTime}ms`,
          'Action': 'Reset Transform'
        });
        resetTransform();
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Swipe navigation (works when not directly over image)
        if (deltaX > 0) {
          logAction('TOUCH_GESTURE', {
            'Gesture': 'Swipe Right',
            'Delta X': deltaX.toFixed(2),
            'Action': 'Previous Image',
            'Duration': `${deltaTime}ms`
          });
          goToPrevious();
        } else {
          logAction('TOUCH_GESTURE', {
            'Gesture': 'Swipe Left',
            'Delta X': deltaX.toFixed(2),
            'Action': 'Next Image',
            'Duration': `${deltaTime}ms`
          });
          goToNext();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, currentIndex, zoom]);

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    logAction('NAVIGATION', {
      'Direction': 'Previous',
      'From Index': currentIndex,
      'To Index': prevIndex,
      'Image': images[prevIndex]?.alt || 'Unknown'
    });
    setCurrentIndex(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    logAction('NAVIGATION', {
      'Direction': 'Next',
      'From Index': currentIndex,
      'To Index': nextIndex,
      'Image': images[nextIndex]?.alt || 'Unknown'
    });
    setCurrentIndex(nextIndex);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3);
    logAction('ZOOM_CHANGE', {
      'Action': 'Zoom In',
      'Previous Zoom': `${(zoom * 100).toFixed(0)}%`,
      'New Zoom': `${(newZoom * 100).toFixed(0)}%`,
      'Max Reached': newZoom === 3
    });
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    logAction('ZOOM_CHANGE', {
      'Action': 'Zoom Out',
      'Previous Zoom': `${(zoom * 100).toFixed(0)}%`,
      'New Zoom': `${(newZoom * 100).toFixed(0)}%`,
      'Min Reached': newZoom === 0.5
    });
    setZoom(newZoom);
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    logAction('ROTATION_CHANGE', {
      'Previous Rotation': `${rotation}°`,
      'New Rotation': `${newRotation}°`,
      'Direction': 'Clockwise 90°'
    });
    setRotation(newRotation);
  };

  const handleContinuousRotate = (delta: number) => {
    const newRotation = (rotation + delta) % 360;
    logAction('CONTINUOUS_ROTATION', {
      'Previous Rotation': `${rotation}°`,
      'New Rotation': `${newRotation}°`,
      'Delta': `${delta}°`
    });
    setRotation(newRotation);
  };

  // Mouse wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel (fine control)
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
      
      logAction('WHEEL_ZOOM_FINE', {
        'Previous Zoom': `${(zoom * 100).toFixed(0)}%`,
        'New Zoom': `${(newZoom * 100).toFixed(0)}%`,
        'Mode': 'Fine Control (Ctrl+Wheel)'
      });
      setZoom(newZoom);
    } else if (e.shiftKey) {
      // Continuous rotation with Shift + wheel
      const rotationDelta = e.deltaY > 0 ? 15 : -15; // 15 degree steps
      handleContinuousRotate(rotationDelta);
    } else {
      // Normal zoom with wheel (standard zoom steps)
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
      
      logAction('WHEEL_ZOOM', {
        'Previous Zoom': `${(zoom * 100).toFixed(0)}%`,
        'New Zoom': `${(newZoom * 100).toFixed(0)}%`,
        'Mode': 'Standard Zoom (Wheel)'
      });
      setZoom(newZoom);
    }
  };

  const resetTransform = () => {
    logAction('TRANSFORM_RESET', {
      'Previous Zoom': `${(zoom * 100).toFixed(0)}%`,
      'Previous Rotation': `${rotation}°`,
      'Previous Pan': `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      'Reset To': 'Zoom: 100%, Rotation: 0°, Pan: (0, 0)'
    });
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging at any zoom level
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPan({ x: panX, y: panY });
    
    logAction('DRAG_START', {
      'Mouse Position': `(${e.clientX}, ${e.clientY})`,
      'Current Pan': `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      'Zoom Level': `${(zoom * 100).toFixed(0)}%`
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setPanX(lastPan.x + deltaX);
    setPanY(lastPan.y + deltaY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    logAction('DRAG_END', {
      'Final Pan': `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      'Drag Distance': `(${(panX - lastPan.x).toFixed(1)}, ${(panY - lastPan.y).toFixed(1)})`
    });
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Allow dragging at any zoom level
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setLastPan({ x: panX, y: panY });
    
    logAction('TOUCH_DRAG_START', {
      'Touch Position': `(${touch.clientX}, ${touch.clientY})`,
      'Current Pan': `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      'Zoom Level': `${(zoom * 100).toFixed(0)}%`
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    setPanX(lastPan.x + deltaX);
    setPanY(lastPan.y + deltaY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    logAction('TOUCH_DRAG_END', {
      'Final Pan': `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      'Drag Distance': `(${(panX - lastPan.x).toFixed(1)}, ${(panY - lastPan.y).toFixed(1)})`
    });
  };


  const handleDownload = async () => {
    const downloadStart = performance.now();
    logAction('DOWNLOAD_START', {
      'Image Source': currentImage.src,
      'Image Alt': currentImage.alt,
      'File Name': currentImage.title || currentImage.alt || 'image',
      'Start Time': new Date().toLocaleTimeString()
    });
    
    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const downloadTime = performance.now() - downloadStart;
      
      logAction('DOWNLOAD_FETCH_COMPLETE', {
        'File Size': `${(blob.size / 1024).toFixed(2)} KB`,
        'MIME Type': blob.type,
        'Fetch Duration': `${downloadTime.toFixed(2)}ms`
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentImage.title || currentImage.alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      const totalTime = performance.now() - downloadStart;
      logAction('DOWNLOAD_SUCCESS', {
        'Total Duration': `${totalTime.toFixed(2)}ms`,
        'Download Complete': 'Successfully saved to device'
      });
      
      toast({
        title: t('downloadSuccess'),
        description: t('downloadSuccessDesc'),
      });
    } catch (error) {
      const errorTime = performance.now() - downloadStart;
      logAction('DOWNLOAD_ERROR', {
        'Error': error instanceof Error ? error.message : 'Unknown error',
        'Failed After': `${errorTime.toFixed(2)}ms`
      });
      
      toast({
        title: t('error'),
        description: t('downloadError'),
        variant: "destructive",
      });
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "p-0 border-none w-[95vw] h-[90vh] sm:w-[90vw] sm:h-[85vh] max-w-[95vw] max-h-[90vh] sm:max-w-[90vw] sm:max-h-[85vh]",
          // Glassmorphism efekti
          "bg-black/20 backdrop-blur-xl",
          // Subtle glass styling
          "shadow-2xl shadow-black/50",
          className
        )}
        showCloseButton={false}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          background: 'rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <VisuallyHidden>
          <DialogTitle>
            {currentImage.title || t('imageViewer')}
          </DialogTitle>
          <DialogDescription>
            {t('imageViewerDesc')}
          </DialogDescription>
        </VisuallyHidden>
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {images.length > 1 && (
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
            {currentImage.title && (
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm max-w-[200px] sm:max-w-md truncate">
                {currentImage.title}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Zoom Out', 'Current Zoom': `${(zoom * 100).toFixed(0)}%` });
                handleZoomOut();
              }}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
            >
              <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <div className="bg-black/50 text-white px-2 py-1 rounded-full text-xs sm:text-sm min-w-[50px] sm:min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Zoom In', 'Current Zoom': `${(zoom * 100).toFixed(0)}%` });
                handleZoomIn();
              }}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
            >
              <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Rotate', 'Current Rotation': `${rotation}°` });
                handleRotate();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                logAction('BUTTON_CONTEXT_MENU', { 'Button': 'Rotate CCW', 'Current Rotation': `${rotation}°` });
                handleContinuousRotate(-15);
              }}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
              title="Left click: 90° CW, Right click: 15° CCW"
            >
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Download', 'Image': currentImage.alt });
                handleDownload();
              }}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Close', 'Action': 'Close Lightbox' });
                onClose();
              }}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Previous Image', 'Current Index': currentIndex });
                goToPrevious();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logAction('BUTTON_CLICK', { 'Button': 'Next Image', 'Current Index': currentIndex });
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </>
        )}

        {/* Image Container */}
        <div className="flex items-center justify-center h-full w-full overflow-hidden">
          <div 
            data-image-container
            className={cn(
              "relative transition-transform duration-300 ease-out cursor-grab",
              isDragging && "cursor-grabbing"
            )}
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`,
              // Container her zaman otomatik boyutlandırılsın
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onDoubleClick={resetTransform}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="object-contain"
              style={{
                // Responsive davranış
                width: 'auto', 
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              onLoad={(e) => {
                if (lightboxOpenTime) {
                  const loadTime = performance.now() - lightboxOpenTime;
                  setImageLoadTime(loadTime);
                  const img = e.target as HTMLImageElement;
                  logAction('IMAGE_LOADED', {
                    'Load Duration': `${loadTime.toFixed(2)}ms`,
                    'Image URL': currentImage.src,
                    'Natural Width': img.naturalWidth,
                    'Natural Height': img.naturalHeight,
                    'File Size Estimate': `~${((img.naturalWidth * img.naturalHeight * 3) / 1024).toFixed(2)} KB`,
                    'Load Speed': loadTime < 500 ? 'Fast' : loadTime < 1000 ? 'Medium' : 'Slow'
                  });
                }
              }}
              onError={(e) => {
                const errorTime = lightboxOpenTime ? performance.now() - lightboxOpenTime : 0;
                logAction('IMAGE_LOAD_ERROR', {
                  'Error Time': `${errorTime.toFixed(2)}ms`,
                  'Image URL': currentImage.src,
                  'Error Type': 'Load Failed'
                });
              }}
            />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm text-center">
            <div className="font-medium">{currentImage.alt}</div>
            {currentImage.imageMetadata && (
              <div className="text-xs text-gray-300 mt-1">
                {currentImage.imageMetadata.width} × {currentImage.imageMetadata.height}
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="absolute bottom-4 right-4 z-50 hidden sm:block">
          <div className="bg-black/50 text-white px-3 py-2 rounded text-xs">
            <div>{t('keyboardHelp1')}</div>
            <div>{t('keyboardHelp2')}</div>
            <div>{t('keyboardHelp3')}</div>
            <div className="mt-1 text-gray-300">
              <div>Mouse Wheel: Zoom</div>
              <div>Ctrl + Wheel: Fine Zoom</div>
              <div>Shift + Wheel: Rotate 15°</div>
              <div>Shift + ←/→: Rotate 15°</div>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-50">
            <div className="flex gap-1 sm:gap-2 bg-black/50 p-1 sm:p-2 rounded-lg max-w-xs sm:max-w-md overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    logAction('THUMBNAIL_CLICK', {
                      'Clicked Index': index,
                      'Previous Index': currentIndex,
                      'Image': images[index]?.alt || 'Unknown'
                    });
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "relative overflow-hidden rounded border-2 transition-all flex-shrink-0",
                    index === currentIndex 
                      ? "border-white scale-110" 
                      : "border-transparent hover:border-gray-400"
                  )}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-8 h-8 sm:w-12 sm:h-12 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple single image lightbox for basic usage
interface SimpleImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
  imageMetadata?: ImageData['imageMetadata'];
}

export function SimpleImageLightbox({
  isOpen,
  onClose,
  src,
  alt,
  title,
  imageMetadata,
}: SimpleImageLightboxProps) {
  const imageData: ImageData = {
    src,
    alt,
    title,
    imageMetadata,
  };

  return (
    <ImageLightbox
      isOpen={isOpen}
      onClose={onClose}
      images={[imageData]}
      initialIndex={0}
    />
  );
}

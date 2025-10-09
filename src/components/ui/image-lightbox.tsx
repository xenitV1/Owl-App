"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { ImageData, ImageLightboxProps } from "@/components/ui/lightbox/types";
import { useTransform } from "@/components/ui/lightbox/use-transform";
import { useIndexNavigation } from "@/components/ui/lightbox/use-navigation";
import {
  BottomInfo,
  HeaderControls,
  HelpText,
  ImageStage,
  NavButtons,
  Thumbnails,
} from "@/components/ui/lightbox/subcomponents";

// types moved to lightbox/types

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  className,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoadTime, setImageLoadTime] = useState<number | null>(null);
  const [lightboxOpenTime, setLightboxOpenTime] = useState<number | null>(null);
  const {
    zoom,
    rotation,
    panX,
    panY,
    isDragging,
    dragStart,
    lastPan,
    setZoom,
    setRotation,
    setPanX,
    setPanY,
    setIsDragging,
    setDragStart,
    setLastPan,
    resetTransform,
    zoomIn,
    zoomOut,
    rotate,
    rotateBy,
  } = useTransform();

  // Window boyutu state'i
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });

  const { toast } = useToast();
  const t = useTranslations("imageViewer");

  const currentImage = images[currentIndex];

  // Debug logging utility (disabled - no-op to avoid console output)
  const logAction = (_action: string, _details?: any) => {};

  // Reset zoom, rotation when image changes
  useEffect(() => {
    logAction("IMAGE_CHANGED", {
      "Previous Index": currentIndex,
      "New Index": currentIndex,
      "Image Source": currentImage?.src,
      "Reset Zoom": "1x",
      "Reset Rotation": "0°",
      "Reset Pan": "(0, 0)",
    });
    resetTransform();
    setImageLoadTime(null);
  }, [currentIndex]);

  // Window boyutu değişikliklerini takip et
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setWindowSize(newSize);

      logAction("WINDOW_RESIZE", {
        "New Width": `${newSize.width}px`,
        "New Height": `${newSize.height}px`,
        "Aspect Ratio": (newSize.width / newSize.height).toFixed(2),
        "Screen Type":
          newSize.width < 640
            ? "Mobile"
            : newSize.width < 1024
              ? "Tablet"
              : "Desktop",
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
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

      logAction("LIGHTBOX_OPENED", {
        "Initial Index": initialIndex,
        "Total Images": images.length,
        "Open Time": new Date().toLocaleTimeString(),
        "Performance Start": `${openStart.toFixed(2)}ms`,
        "Window Size": `${windowSize.width}x${windowSize.height}`,
        "Device Type":
          windowSize.width < 640
            ? "Mobile"
            : windowSize.width < 1024
              ? "Tablet"
              : "Desktop",
        "Initial State": "All settings reset to default",
      });
    } else if (lightboxOpenTime) {
      const totalTime = performance.now() - lightboxOpenTime;
      logAction("LIGHTBOX_CLOSED", {
        "Total Open Duration": `${totalTime.toFixed(2)}ms`,
        "Close Time": new Date().toLocaleTimeString(),
      });
      setLightboxOpenTime(null);
    }
  }, [isOpen, initialIndex, windowSize]);

  // Keyboard navigation via hook
  useIndexNavigation(
    images.length,
    isOpen,
    () => goToPrevious(),
    () => goToNext(),
    onClose,
    () => handleZoomIn(),
    () => handleZoomOut(),
    () => handleRotate(),
    (d) => handleContinuousRotate(d),
  );

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
      if (target.closest("[data-image-container]")) {
        return;
      }

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastTouchTime = Date.now();
      hasMoved = false;
      logAction("TOUCH_NAVIGATION_START", {
        "Touch X": touchStartX.toFixed(2),
        "Touch Y": touchStartY.toFixed(2),
        Timestamp: new Date().toLocaleTimeString(),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        Math.abs(e.touches[0].clientX - touchStartX) > 10 ||
        Math.abs(e.touches[0].clientY - touchStartY) > 10
      ) {
        hasMoved = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Don't handle navigation gestures when over the image (to prevent conflicts with drag)
      const target = e.target as HTMLElement;
      if (target.closest("[data-image-container]")) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const currentTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = currentTime - lastTouchTime;

      // Only handle swipe navigation when not zoomed in and for significant movements
      if (
        !hasMoved &&
        deltaTime < 300 &&
        Math.abs(deltaX) < 10 &&
        Math.abs(deltaY) < 10
      ) {
        // Double tap to reset
        logAction("TOUCH_GESTURE", {
          Gesture: "Double Tap",
          Duration: `${deltaTime}ms`,
          Action: "Reset Transform",
        });
        resetTransform();
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Swipe navigation (works when not directly over image)
        if (deltaX > 0) {
          logAction("TOUCH_GESTURE", {
            Gesture: "Swipe Right",
            "Delta X": deltaX.toFixed(2),
            Action: "Previous Image",
            Duration: `${deltaTime}ms`,
          });
          goToPrevious();
        } else {
          logAction("TOUCH_GESTURE", {
            Gesture: "Swipe Left",
            "Delta X": deltaX.toFixed(2),
            Action: "Next Image",
            Duration: `${deltaTime}ms`,
          });
          goToNext();
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, currentIndex, zoom]);

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    logAction("NAVIGATION", {
      Direction: "Previous",
      "From Index": currentIndex,
      "To Index": prevIndex,
      Image: images[prevIndex]?.alt || "Unknown",
    });
    setCurrentIndex(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    logAction("NAVIGATION", {
      Direction: "Next",
      "From Index": currentIndex,
      "To Index": nextIndex,
      Image: images[nextIndex]?.alt || "Unknown",
    });
    setCurrentIndex(nextIndex);
  };

  const handleZoomIn = () => {
    zoomIn();
  };
  const handleZoomOut = () => {
    zoomOut();
  };
  const handleRotate = () => {
    rotate();
  };
  const handleContinuousRotate = (delta: number) => {
    rotateBy(delta);
  };

  // Mouse wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + wheel (fine control)
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(3, zoom + delta));

      logAction("WHEEL_ZOOM_FINE", {
        "Previous Zoom": `${(zoom * 100).toFixed(0)}%`,
        "New Zoom": `${(newZoom * 100).toFixed(0)}%`,
        Mode: "Fine Control (Ctrl+Wheel)",
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

      logAction("WHEEL_ZOOM", {
        "Previous Zoom": `${(zoom * 100).toFixed(0)}%`,
        "New Zoom": `${(newZoom * 100).toFixed(0)}%`,
        Mode: "Standard Zoom (Wheel)",
      });
      setZoom(newZoom);
    }
  };

  // resetTransform comes from useTransform

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging at any zoom level
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPan({ x: panX, y: panY });

    logAction("DRAG_START", {
      "Mouse Position": `(${e.clientX}, ${e.clientY})`,
      "Current Pan": `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      "Zoom Level": `${(zoom * 100).toFixed(0)}%`,
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
    logAction("DRAG_END", {
      "Final Pan": `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      "Drag Distance": `(${(panX - lastPan.x).toFixed(1)}, ${(panY - lastPan.y).toFixed(1)})`,
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

    logAction("TOUCH_DRAG_START", {
      "Touch Position": `(${touch.clientX}, ${touch.clientY})`,
      "Current Pan": `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      "Zoom Level": `${(zoom * 100).toFixed(0)}%`,
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
    logAction("TOUCH_DRAG_END", {
      "Final Pan": `(${panX.toFixed(1)}, ${panY.toFixed(1)})`,
      "Drag Distance": `(${(panX - lastPan.x).toFixed(1)}, ${(panY - lastPan.y).toFixed(1)})`,
    });
  };

  const handleDownload = async () => {
    const downloadStart = performance.now();
    logAction("DOWNLOAD_START", {
      "Image Source": currentImage.src,
      "Image Alt": currentImage.alt,
      "File Name": currentImage.title || currentImage.alt || "image",
      "Start Time": new Date().toLocaleTimeString(),
    });

    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const downloadTime = performance.now() - downloadStart;

      logAction("DOWNLOAD_FETCH_COMPLETE", {
        "File Size": `${(blob.size / 1024).toFixed(2)} KB`,
        "MIME Type": blob.type,
        "Fetch Duration": `${downloadTime.toFixed(2)}ms`,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = currentImage.title || currentImage.alt || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const totalTime = performance.now() - downloadStart;
      logAction("DOWNLOAD_SUCCESS", {
        "Total Duration": `${totalTime.toFixed(2)}ms`,
        "Download Complete": "Successfully saved to device",
      });

      toast({
        title: t("downloadSuccess"),
        description: t("downloadSuccessDesc"),
      });
    } catch (error) {
      const errorTime = performance.now() - downloadStart;
      logAction("DOWNLOAD_ERROR", {
        Error: error instanceof Error ? error.message : "Unknown error",
        "Failed After": `${errorTime.toFixed(2)}ms`,
      });

      toast({
        title: t("error"),
        description: t("downloadError"),
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
          "bg-transparent backdrop-blur-lg",
          "shadow-2xl",
          className,
        )}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{currentImage.title || t("imageViewer")}</DialogTitle>
          <DialogDescription>{t("imageViewerDesc")}</DialogDescription>
        </VisuallyHidden>
        <HeaderControls
          imagesCount={images.length}
          currentIndex={currentIndex}
          title={currentImage.title}
          zoom={zoom}
          rotation={rotation}
          onZoomIn={() => {
            logAction("BUTTON_CLICK", { Button: "Zoom In" });
            handleZoomIn();
          }}
          onZoomOut={() => {
            logAction("BUTTON_CLICK", { Button: "Zoom Out" });
            handleZoomOut();
          }}
          onRotate={() => {
            logAction("BUTTON_CLICK", { Button: "Rotate" });
            handleRotate();
          }}
          onRotateBy={(d) => {
            logAction("BUTTON_CONTEXT_MENU", { Button: "RotateBy", Delta: d });
            handleContinuousRotate(d);
          }}
          onDownload={() => {
            logAction("BUTTON_CLICK", { Button: "Download" });
            handleDownload();
          }}
          onClose={() => {
            logAction("BUTTON_CLICK", { Button: "Close" });
            onClose();
          }}
        />

        {/* Navigation Buttons */}
        <NavButtons
          show={images.length > 1}
          onPrev={() => {
            logAction("BUTTON_CLICK", { Button: "Previous Image" });
            goToPrevious();
          }}
          onNext={() => {
            logAction("BUTTON_CLICK", { Button: "Next Image" });
            goToNext();
          }}
        />

        {/* Image Container */}
        <ImageStage
          transform={{ panX, panY, zoom, rotation }}
          src={currentImage.src}
          alt={currentImage.alt}
          onDoubleClick={() => {
            logAction("TRANSFORM_RESET_CLICK", {});
            resetTransform();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          isDragging={isDragging as any}
        />

        {/* Bottom Info */}
        <BottomInfo
          alt={currentImage.alt}
          dimensions={
            currentImage.imageMetadata
              ? {
                  width: currentImage.imageMetadata.width,
                  height: currentImage.imageMetadata.height,
                }
              : undefined
          }
        />

        {/* Help Text */}
        <HelpText
          lines={[
            t("keyboardHelp1"),
            t("keyboardHelp2"),
            t("keyboardHelp3"),
            "Mouse Wheel: Zoom",
            "Ctrl + Wheel: Fine Zoom",
            "Shift + Wheel: Rotate 15°",
            "Shift + ←/→: Rotate 15°",
          ]}
        />

        {/* Thumbnail Navigation */}
        <Thumbnails
          images={images}
          currentIndex={currentIndex}
          onSelect={(index) => {
            logAction("THUMBNAIL_CLICK", { "Clicked Index": index });
            setCurrentIndex(index);
          }}
        />
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
  imageMetadata?: ImageData["imageMetadata"];
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

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  imagesCount: number;
  currentIndex: number;
  title?: string;
  zoom: number;
  rotation: number;
  onZoomIn(): void;
  onZoomOut(): void;
  onRotate(): void;
  onRotateBy(delta: number): void;
  onDownload(): void;
  onClose(): void;
}

export function HeaderControls({
  imagesCount,
  currentIndex,
  title,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onRotateBy,
  onDownload,
  onClose,
}: HeaderProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {imagesCount > 1 && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {imagesCount}
          </div>
        )}
        {title && (
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm max-w-[200px] sm:max-w-md truncate">
            {title}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
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
          onClick={onZoomIn}
          disabled={zoom >= 3}
          className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
        >
          <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotate}
          onContextMenu={(e) => {
            e.preventDefault();
            onRotateBy(-15);
          }}
          className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
          title="Left click: 90° CW, Right click: 15° CCW"
        >
          <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 h-8 w-8 p-0 sm:h-10 sm:w-10"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}

interface NavButtonsProps {
  show: boolean;
  onPrev(): void;
  onNext(): void;
}

export function NavButtons({ show, onPrev, onNext }: NavButtonsProps) {
  if (!show) return null;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
      >
        <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12"
      >
        <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
      </Button>
    </>
  );
}

interface ImageStageProps extends React.HTMLAttributes<HTMLDivElement> {
  transform: { panX: number; panY: number; zoom: number; rotation: number };
  src: string;
  alt: string;
  isDragging?: boolean;
}

export function ImageStage({
  transform,
  src,
  alt,
  isDragging,
  ...rest
}: ImageStageProps) {
  return (
    <div className="flex items-center justify-center h-full w-full overflow-hidden">
      <div
        data-image-container
        className={cn(
          "relative transition-transform duration-300 ease-out cursor-grab",
          isDragging && "cursor-grabbing",
        )}
        style={{
          transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.zoom}) rotate(${transform.rotation}deg)`,
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        {...rest}
      >
        <img
          src={src}
          alt={alt}
          className="object-contain"
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </div>
  );
}

export function BottomInfo({
  alt,
  dimensions,
}: {
  alt: string;
  dimensions?: { width: number; height: number };
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm text-center">
        <div className="font-medium">{alt}</div>
        {dimensions && (
          <div className="text-xs text-gray-300 mt-1">
            {dimensions.width} × {dimensions.height}
          </div>
        )}
      </div>
    </div>
  );
}

export function HelpText({ lines }: { lines: string[] }) {
  return (
    <div className="absolute bottom-4 right-4 z-50 hidden sm:block">
      <div className="bg-black/50 text-white px-3 py-2 rounded text-xs">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export function Thumbnails({
  images,
  currentIndex,
  onSelect,
}: {
  images: { src: string; alt: string }[];
  currentIndex: number;
  onSelect(i: number): void;
}) {
  if (images.length <= 1) return null;
  return (
    <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-1 sm:gap-2 bg-black/50 p-1 sm:p-2 rounded-lg max-w-xs sm:max-w-md overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              "relative overflow-hidden rounded border-2 transition-all flex-shrink-0",
              index === currentIndex
                ? "border-white scale-110"
                : "border-transparent hover:border-gray-400",
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
  );
}

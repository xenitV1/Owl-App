export interface ImageMetadata {
  width: number;
  height: number;
  placeholder?: string;
  responsive?: Record<
    string,
    { width: number; height: number; filename: string }
  >;
}

export interface ImageData {
  src: string;
  alt: string;
  title?: string;
  imageMetadata?: ImageMetadata;
}

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  initialIndex?: number;
  className?: string;
}

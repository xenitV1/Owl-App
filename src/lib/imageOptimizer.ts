import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maxSize?: number; // in bytes
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  quality: number;
}

export class ImageOptimizer {
  /**
   * Optimize an image buffer with automatic compression and format conversion
   */
  static async optimizeImage(
    inputBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {
    const {
      quality = 85,
      width,
      height,
      format = 'webp',
      maxSize = 3 * 1024 * 1024 // 3MB default max size
    } = options;

    try {
      // Get original image metadata
      const metadata = await sharp(inputBuffer).metadata();
      
      // Create sharp instance with resize options if provided
      let sharpInstance = sharp(inputBuffer);
      
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimization
      let optimizedBuffer: Buffer;
      let finalQuality = quality;
      let currentFormat = format;

      // Try to optimize with requested quality first
      optimizedBuffer = await this.applyFormatOptimization(sharpInstance, currentFormat, finalQuality);
      
      // If the result is still too large, apply progressive compression
      if (optimizedBuffer.length > maxSize) {
        const compressedResult = await this.progressiveCompression(
          sharp(inputBuffer),
          currentFormat,
          maxSize,
          width,
          height
        );
        optimizedBuffer = compressedResult.buffer;
        finalQuality = compressedResult.quality;
      }

      // Get final metadata
      const finalMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        format: currentFormat,
        width: finalMetadata.width || metadata.width || 0,
        height: finalMetadata.height || metadata.height || 0,
        size: optimizedBuffer.length,
        quality: finalQuality
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Apply format-specific optimization
   */
  private static async applyFormatOptimization(
    sharpInstance: sharp.Sharp,
    format: string,
    quality: number
  ): Promise<Buffer> {
    switch (format) {
      case 'webp':
        return sharpInstance
          .webp({ 
            quality,
            effort: 6, // High effort for better compression
            lossless: false,
            nearLossless: false
          })
          .toBuffer();
      
      case 'jpeg':
        return sharpInstance
          .jpeg({ 
            quality,
            progressive: true,
            mozjpeg: true // Better compression
          })
          .toBuffer();
      
      case 'png':
        return sharpInstance
          .png({ 
            quality,
            progressive: true,
            compressionLevel: 9 // Maximum compression
          })
          .toBuffer();
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Progressive compression to achieve target file size
   */
  private static async progressiveCompression(
    sharpInstance: sharp.Sharp,
    format: string,
    targetSize: number,
    width?: number,
    height?: number
  ): Promise<{ buffer: Buffer; quality: number }> {
    let quality = 85;
    let buffer: Buffer = Buffer.alloc(0); // Initialize with empty buffer
    
    // Try different quality levels until we get under the target size
    for (let attempt = 0; attempt < 10; attempt++) {
      let currentSharp = sharpInstance;
      
      if (width || height) {
        currentSharp = currentSharp.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      buffer = await this.applyFormatOptimization(currentSharp, format, quality);
      
      if (buffer.length <= targetSize) {
        break;
      }
      
      // Reduce quality for next attempt
      quality = Math.max(10, quality - 10);
    }

    // If still too large, try reducing dimensions
    if (buffer.length > targetSize && (width || height)) {
      const scaleFactor = 0.9;
      const newWidth = width ? Math.floor(width * scaleFactor) : undefined;
      const newHeight = height ? Math.floor(height * scaleFactor) : undefined;
      
      return this.progressiveCompression(sharpInstance, format, targetSize, newWidth, newHeight);
    }

    return { buffer, quality };
  }

  /**
   * Generate multiple image sizes for responsive design
   */
  static async generateResponsiveImages(
    inputBuffer: Buffer,
    sizes: Array<{ width: number; height?: number; name: string }> = [
      { width: 320, name: 'small' },
      { width: 640, name: 'medium' },
      { width: 1024, name: 'large' }
    ]
  ): Promise<Record<string, OptimizedImageResult>> {
    const results: Record<string, OptimizedImageResult> = {};

    for (const size of sizes) {
      try {
        const optimized = await this.optimizeImage(inputBuffer, {
          width: size.width,
          height: size.height,
          format: 'webp',
          quality: 80
        });
        results[size.name] = optimized;
      } catch (error) {
        console.error(`Failed to generate ${size.name} size:`, error);
      }
    }

    return results;
  }

  /**
   * Validate image file type and size
   */
  static validateImage(buffer: Buffer, maxSize: number = 8 * 1024 * 1024): { valid: boolean; error?: string } {
    // Check file size
    if (buffer.length > maxSize) {
      return { 
        valid: false, 
        error: `Image size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` 
      };
    }

    // Check file type by magic numbers
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
    };

    const bytes = Array.from(buffer.slice(0, 12));
    let isValid = false;

    for (const [type, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      return { valid: false, error: 'Invalid image file type' };
    }

    return { valid: true };
  }

  /**
   * Get image dimensions without full processing
   */
  static async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Generate placeholder image (blur hash style)
   */
  static async generatePlaceholder(buffer: Buffer): Promise<string> {
    try {
      // Resize to very small dimensions and convert to base64
      const placeholderBuffer = await sharp(buffer)
        .resize(20, 20, { fit: 'inside' })
        .webp({ quality: 50 })
        .toBuffer();
      
      return `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Failed to generate placeholder:', error);
      return '';
    }
  }
}
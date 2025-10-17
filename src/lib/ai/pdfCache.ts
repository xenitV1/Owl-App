// PDF Processing Cache with IndexedDB
// Stores processed PDFs locally to avoid re-processing

interface CachedPDFResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    totalPages: number;
    extractedAt: string;
    format: "markdown" | "text";
    structure: {
      hasHeadings: boolean;
      hasLists: boolean;
      hasTables: boolean;
      paragraphCount: number;
    };
  };
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  processingTime: number;
  fileHash: string; // For cache invalidation
}

/**
 * Generate a simple hash for file content (for cache key)
 */
function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Simple hash based on file size + first 1KB of content
      const content = reader.result as ArrayBuffer;
      const size = content.byteLength;
      const firstKB = new Uint8Array(content.slice(0, Math.min(1024, size)));

      let hash = size.toString();
      for (let i = 0; i < firstKB.length; i += 4) {
        hash += firstKB[i]?.toString(16) || "0";
      }

      resolve(hash);
    };
    reader.readAsArrayBuffer(file.slice(0, 1024)); // Only read first 1KB for hash
  });
}

/**
 * Get cached PDF result if exists
 */
export async function getCachedPDFResult(
  file: File,
): Promise<CachedPDFResult | null> {
  if (typeof window === "undefined") return null;

  try {
    const fileHash = await generateFileHash(file);
    const cacheKey = `pdf_${file.name}_${file.size}_${fileHash}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const result: CachedPDFResult = JSON.parse(cached);

      // Check if cache is still valid (not older than 24 hours)
      const cacheAge =
        Date.now() - new Date(result.metadata.extractedAt).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log("📦 Using cached PDF result:", result.metadata.fileName);
        return result;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn("Cache read error:", error);
  }

  return null;
}

/**
 * Cache PDF result
 */
export async function cachePDFResult(
  file: File,
  result: Omit<CachedPDFResult, "fileHash">,
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const fileHash = await generateFileHash(file);
    const cacheKey = `pdf_${file.name}_${file.size}_${fileHash}`;

    const cacheData: CachedPDFResult = {
      ...result,
      fileHash,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log("💾 Cached PDF result:", result.metadata.fileName);
  } catch (error) {
    console.warn("Cache write error:", error);
  }
}

/**
 * Clear all PDF cache
 */
export function clearPDFCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("pdf_")) {
        localStorage.removeItem(key);
      }
    });
    console.log("🗑️ Cleared PDF cache");
  } catch (error) {
    console.warn("Cache clear error:", error);
  }
}

/**
 * Get cache size info
 */
export function getCacheInfo(): { count: number; totalSize: number } {
  if (typeof window === "undefined") return { count: 0, totalSize: 0 };

  try {
    const keys = Object.keys(localStorage);
    const pdfKeys = keys.filter((key) => key.startsWith("pdf_"));

    let totalSize = 0;
    pdfKeys.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });

    return {
      count: pdfKeys.length,
      totalSize,
    };
  } catch (error) {
    console.warn("Cache info error:", error);
    return { count: 0, totalSize: 0 };
  }
}

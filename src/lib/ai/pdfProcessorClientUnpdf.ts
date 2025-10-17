// Alternative PDF Processor using unpdf (more reliable)
// Fallback implementation if PDF.js fails

import type {
  PDFProcessingOptions,
  PDFProcessingProgress,
  PDFProcessingResult,
  PDFMetadata,
} from "@/types/ai";
import { getCachedPDFResult, cachePDFResult } from "./pdfCache";

/**
 * Process PDF using unpdf (more reliable than PDF.js)
 *
 * @param file - PDF file from user upload
 * @param options - Processing configuration
 * @returns Processing result with markdown content
 */
export async function processPDFWithUnpdf(
  file: File,
  options: PDFProcessingOptions = {},
): Promise<PDFProcessingResult> {
  const startTime = Date.now();
  const originalSize = file.size;

  const {
    convertToMarkdown = true,
    preserveFormatting = true,
    optimizeSize = true,
    enableOCR = false,
    ocrLanguages,
    onProgress,
  } = options;

  try {
    // Stage 0: Check cache first
    const cached = await getCachedPDFResult(file);
    if (cached) {
      onProgress?.({
        stage: "complete",
        currentPage: cached.metadata.totalPages,
        totalPages: cached.metadata.totalPages,
        percentage: 100,
        message: "Cached result loaded!",
      });

      return {
        success: true,
        content: cached.content,
        metadata: {
          ...cached.metadata,
          extractedAt: new Date(cached.metadata.extractedAt),
        },
        originalSize: cached.originalSize,
        processedSize: cached.processedSize,
        compressionRatio: cached.compressionRatio,
        processingTime: cached.processingTime,
      };
    }

    // Stage 1: Load PDF
    onProgress?.({
      stage: "loading",
      currentPage: 0,
      totalPages: 0,
      percentage: 5,
      message: "PDF yükleniyor...",
    });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Stage 2: Initialize unpdf with dynamic PDF.js setup
    onProgress?.({
      stage: "loading",
      currentPage: 0,
      totalPages: 0,
      percentage: 10,
      message: "PDF parser başlatılıyor...",
    });

    // Configure PDF.js for unpdf (uses internal PDF.js)
    const unpdf = await import("unpdf");

    // Setup PDF.js worker for unpdf
    const pdfjsModule = await unpdf.getResolvedPDFJS();
    if (typeof window !== "undefined" && pdfjsModule) {
      pdfjsModule.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsModule.version}/pdf.worker.min.js`;
    }

    // Load PDF document with timeout and better error handling
    const pdfDocument = (await Promise.race([
      unpdf.getDocumentProxy(uint8Array),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("PDF loading timeout after 30 seconds")),
          30000,
        ),
      ),
    ])) as any;

    onProgress?.({
      stage: "extracting",
      currentPage: 0,
      totalPages: 0,
      percentage: 20,
      message: "PDF yüklendi, metin çıkarılıyor...",
    });

    // Stage 3: Extract text (unpdf handles this more reliably)
    onProgress?.({
      stage: "extracting",
      currentPage: 0,
      totalPages: 0,
      percentage: 30,
      message: "Metin çıkarılıyor, lütfen bekleyin...",
    });

    // Add aggressive yielding to prevent UI freeze
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Extract page-wise text for better noise filtering
    const pageExtract = (await unpdf.extractText(pdfDocument, {
      mergePages: false,
    })) as any;
    const totalPages = pageExtract.totalPages;
    const pageArray: string[] = pageExtract.text as string[];
    const { filterNoiseFromPages } = await import("./noiseFilter");
    let extractedText = filterNoiseFromPages(pageArray, {
      excludeReferences: true,
      minLineLength: 3,
    });

    // Yield again after text extraction
    await new Promise((resolve) => setTimeout(resolve, 100));

    onProgress?.({
      stage: "extracting",
      currentPage: totalPages,
      totalPages,
      percentage: 50,
      message: `Metin çıkarıldı: ${totalPages} sayfa`,
    });

    // Optional OCR fallback if extracted text is empty or very short
    if (enableOCR && (!extractedText || extractedText.trim().length < 20)) {
      onProgress?.({
        stage: "ocr",
        currentPage: 0,
        totalPages: totalPages || 0,
        percentage: 60,
        message: "Metin bulunamadı. OCR deneniyor...",
      });

      // Try OCR from original file (client-side)
      const { runOCRFromFile } = await import("./ocr");
      const ocrText = await runOCRFromFile(file, {
        language: ocrLanguages || "eng",
        onProgress: (pct) => {
          onProgress?.({
            stage: "ocr",
            currentPage: 0,
            totalPages: totalPages || 0,
            percentage: 60 + Math.min(35, Math.max(0, Math.floor(pct * 0.35))),
            message: "OCR çalışıyor...",
          });
        },
      });

      if (ocrText && ocrText.trim().length > 0) {
        extractedText = ocrText;
      }
    }

    // Stage 4: Convert to Markdown (if enabled)
    let finalContent = extractedText;
    let format: "markdown" | "text" = "text";

    if (convertToMarkdown) {
      onProgress?.({
        stage: "converting",
        currentPage: totalPages,
        totalPages,
        percentage: 70,
        message: "Markdown formatına dönüştürülüyor...",
      });

      // Yield before heavy processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      const { convertToMarkdown: converter } = await import(
        "./markdownConverter"
      );
      finalContent = await converter(extractedText, { preserveFormatting });
      format = "markdown";

      // Yield after conversion
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Stage 5: Optimize content (if enabled)
    if (optimizeSize) {
      onProgress?.({
        stage: "optimizing",
        currentPage: totalPages,
        totalPages,
        percentage: 90,
        message: "İçerik optimize ediliyor...",
      });

      // Yield before optimization
      await new Promise((resolve) => setTimeout(resolve, 50));

      const { optimizeContent } = await import("./pdfOptimizer");
      finalContent = optimizeContent(finalContent);

      // Yield after optimization
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Stage 6: Calculate metrics
    const processedSize = new Blob([finalContent]).size;
    const compressionRatio =
      ((originalSize - processedSize) / originalSize) * 100;
    const processingTime = Date.now() - startTime;

    // Detect structure
    const structure = detectStructure(finalContent);

    const metadata: PDFMetadata = {
      fileName: file.name,
      fileType: file.type,
      totalPages,
      extractedAt: new Date(),
      format,
      structure,
    };

    onProgress?.({
      stage: "complete",
      currentPage: totalPages,
      totalPages,
      percentage: 100,
      message: "İşlem tamamlandı!",
    });

    const result = {
      success: true,
      content: finalContent,
      metadata: {
        ...metadata,
        extractedAt: metadata.extractedAt.toISOString(), // Convert Date to string for cache
      },
      originalSize,
      processedSize,
      compressionRatio,
      processingTime,
    };

    // Cache the result for future use
    await cachePDFResult(file, result);

    // Return with Date object for API compatibility
    return {
      ...result,
      metadata: {
        ...result.metadata,
        extractedAt: metadata.extractedAt, // Keep original Date object
      },
    };
  } catch (error) {
    console.error("UnPDF Processing Error:", error);

    let errorMessage = "PDF işleme hatası";

    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        errorMessage = "PDF dosyası bozuk veya desteklenmeyen format.";
      } else if (error.message.includes("password")) {
        errorMessage = "PDF şifre korumalı. Şifresiz PDF deneyin.";
      } else {
        errorMessage = error.message;
      }
    }

    onProgress?.({
      stage: "error",
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
      message: errorMessage,
    });

    return {
      success: false,
      content: "",
      metadata: {
        fileName: file.name,
        fileType: file.type,
        totalPages: 0,
        extractedAt: new Date(),
        format: "text",
        structure: {
          hasHeadings: false,
          hasLists: false,
          hasTables: false,
          paragraphCount: 0,
        },
      },
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      processingTime: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Detect content structure in text
 */
function detectStructure(content: string) {
  const hasHeadings = /^#{1,6}\s/m.test(content);
  const hasLists =
    /^[\s]*[-*+]\s/m.test(content) || /^[\s]*\d+\.\s/m.test(content);
  const hasTables = /\|.*\|/.test(content);
  const paragraphCount = content
    .split("\n\n")
    .filter((p) => p.trim().length > 0).length;

  return {
    hasHeadings,
    hasLists,
    hasTables,
    paragraphCount,
  };
}

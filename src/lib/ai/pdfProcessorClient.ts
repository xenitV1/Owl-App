// Client-Side PDF Processing Engine
// Handles large PDFs (50MB+) without file size limits
// Uses streaming approach to prevent memory issues

import type {
  PDFProcessingOptions,
  PDFProcessingProgress,
  PDFProcessingResult,
  PDFMetadata,
} from "@/types/ai";

/**
 * Process PDF file in browser (client-side only)
 * No file size limit - handles 50MB+ files with streaming
 *
 * @param file - PDF file from user upload
 * @param options - Processing configuration
 * @returns Processing result with markdown content
 */
export async function processPDFClientSide(
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

    // Stage 2: Initialize PDF.js with Webpack compatibility
    // Use special webpack entry point for Next.js compatibility
    const pdfjsLib = await import("pdfjs-dist/webpack.mjs");

    // No need to configure worker - webpack.mjs handles it automatically!

    // Load PDF document with error handling
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      // Additional options for large files
      maxImageSize: 16777216, // 16MB
      disableAutoFetch: false,
      disableStream: false,
    });

    const pdfDocument = await loadingTask.promise;
    const totalPages = pdfDocument.numPages;

    onProgress?.({
      stage: "extracting",
      currentPage: 0,
      totalPages,
      percentage: 10,
      message: `PDF yüklendi: ${totalPages} sayfa`,
    });

    // Stage 3: Extract text page by page (streaming)
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text from page
      const pageText = textContent.items.map((item: any) => item.str).join(" ");

      pageTexts.push(pageText);
      // accumulate per page only

      // Clean up page to free memory
      page.cleanup();

      // Update progress
      const percentage = 10 + Math.floor((pageNum / totalPages) * 40);
      onProgress?.({
        stage: "extracting",
        currentPage: pageNum,
        totalPages,
        percentage,
        message: `Sayfa ${pageNum}/${totalPages} işleniyor...`,
        estimatedTimeRemaining: Math.ceil(
          (((Date.now() - startTime) / pageNum) * (totalPages - pageNum)) /
            1000,
        ),
      });

      // Yield to browser to prevent UI freeze
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Apply noise filter on page-wise texts
    const { filterNoiseFromPages } = await import("./noiseFilter");
    let extractedText = filterNoiseFromPages(pageTexts, {
      excludeReferences: true,
      minLineLength: 3,
    });

    // Optional OCR fallback if text is empty (scanned PDFs)
    if (enableOCR && (!extractedText || extractedText.trim().length < 20)) {
      onProgress?.({
        stage: "ocr",
        currentPage: totalPages,
        totalPages,
        percentage: 55,
        message: "Metin bulunamadı. OCR deneniyor...",
      });

      const { runOCRFromFile } = await import("./ocr");
      const ocrText = await runOCRFromFile(file, {
        language: ocrLanguages || "eng",
        onProgress: (pct) => {
          onProgress?.({
            stage: "ocr",
            currentPage: totalPages,
            totalPages,
            percentage: 55 + Math.min(35, Math.max(0, Math.floor(pct * 0.35))),
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
        percentage: 60,
        message: "Markdown formatına dönüştürülüyor...",
      });

      const { convertToMarkdown: converter } = await import(
        "./markdownConverter"
      );
      finalContent = await converter(extractedText, { preserveFormatting });
      format = "markdown";
    }

    // Stage 5: Optimize content (if enabled)
    if (optimizeSize) {
      onProgress?.({
        stage: "optimizing",
        currentPage: totalPages,
        totalPages,
        percentage: 80,
        message: "İçerik optimize ediliyor...",
      });

      const { optimizeContent } = await import("./pdfOptimizer");
      finalContent = optimizeContent(finalContent);
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

    return {
      success: true,
      content: finalContent,
      metadata,
      originalSize,
      processedSize,
      compressionRatio,
      processingTime,
    };
  } catch (error) {
    console.error("PDF Processing Error:", error);

    let errorMessage = "PDF işleme hatası";

    if (error instanceof Error) {
      if (error.message.includes("Object.defineProperty")) {
        errorMessage =
          "PDF.js worker hatası. Lütfen sayfayı yenileyin ve tekrar deneyin.";
      } else if (error.message.includes("Invalid PDF")) {
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

/**
 * Validate if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Get estimated processing time based on file size
 * @param fileSize - File size in bytes
 * @returns Estimated time in seconds
 */
export function getEstimatedProcessingTime(fileSize: number): number {
  // Rough estimate: 1MB = 2 seconds processing time
  const mb = fileSize / (1024 * 1024);
  return Math.ceil(mb * 2);
}

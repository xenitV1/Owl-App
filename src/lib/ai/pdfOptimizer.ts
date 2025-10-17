// PDF Content Optimizer
// Reduces content size while preserving important information
// Removes duplicates, headers/footers, page numbers, excessive whitespace

/**
 * Optimize content for size reduction
 * Applies multiple optimization strategies
 *
 * @param content - Markdown or plain text content
 * @returns Optimized content
 */
export function optimizeContent(content: string): string {
  let optimized = content;

  // Step 1: Remove duplicate content (headers/footers)
  optimized = removeDuplicateContent(optimized);

  // Step 2: Remove page numbers
  optimized = removePageNumbers(optimized);

  // Step 3: Clean whitespace
  optimized = cleanWhitespace(optimized);

  // Step 4: Remove watermarks and common artifacts
  optimized = removeWatermarks(optimized);

  // Step 5: Compress repeated patterns
  optimized = compressRepeatedPatterns(optimized);

  return optimized;
}

/**
 * Remove duplicate content (common headers/footers)
 * Detects repeated text blocks and removes duplicates
 */
function removeDuplicateContent(content: string): string {
  const lines = content.split("\n");
  const lineFrequency = new Map<string, number>();

  // Count line frequencies
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > 10) {
      lineFrequency.set(trimmed, (lineFrequency.get(trimmed) || 0) + 1);
    }
  });

  // Find lines that appear too frequently (likely headers/footers)
  const duplicateLines = new Set<string>();
  const threshold = Math.max(3, Math.floor(lines.length / 20)); // Appears in >5% of pages

  lineFrequency.forEach((count, line) => {
    if (count >= threshold) {
      duplicateLines.add(line);
    }
  });

  // Remove duplicate lines
  const result = lines.filter((line) => {
    const trimmed = line.trim();
    return !duplicateLines.has(trimmed);
  });

  return result.join("\n");
}

/**
 * Remove page numbers
 * Detects and removes various page number formats
 */
function removePageNumbers(content: string): string {
  return (
    content
      // Page X, Page X of Y
      .replace(/^Page\s+\d+(\s+of\s+\d+)?$/gim, "")
      // Standalone numbers (likely page numbers)
      .replace(/^\s*\d+\s*$/gm, "")
      // Roman numerals (i, ii, iii, iv, v, etc.)
      .replace(/^\s*[ivxlcdm]+\s*$/gim, "")
      // Page numbers with dashes (- 1 -, - 2 -)
      .replace(/^\s*-\s*\d+\s*-\s*$/gm, "")
      // Clean up resulting empty lines
      .replace(/\n{3,}/g, "\n\n")
  );
}

/**
 * Clean excessive whitespace
 * Normalizes spacing while preserving structure
 */
function cleanWhitespace(content: string): string {
  return (
    content
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, "")
      // Normalize multiple spaces to single space
      .replace(/[ \t]{2,}/g, " ")
      // Limit consecutive blank lines to maximum 2
      .replace(/\n{3,}/g, "\n\n")
      // Remove spaces before punctuation
      .replace(/\s+([.,;:!?])/g, "$1")
      // Normalize spaces after punctuation
      .replace(/([.,;:!?])([^\s])/g, "$1 $2")
      // Trim start and end
      .trim()
  );
}

/**
 * Remove common watermarks and artifacts
 */
function removeWatermarks(content: string): string {
  // Common watermark patterns
  const watermarkPatterns = [
    /confidential/gi,
    /draft/gi,
    /copyright\s+©?\s*\d{4}/gi,
    /all rights reserved/gi,
    /proprietary and confidential/gi,
    /internal use only/gi,
    /do not distribute/gi,
  ];

  let result = content;

  // Remove watermark lines
  const lines = result.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim().toLowerCase();

    // Skip short lines that match watermark patterns
    if (trimmed.length < 50) {
      return !watermarkPatterns.some((pattern) => pattern.test(trimmed));
    }

    return true;
  });

  return filtered.join("\n");
}

/**
 * Compress repeated patterns
 * Finds and simplifies repeated content
 */
function compressRepeatedPatterns(content: string): string {
  return (
    content
      // Remove excessive dots (........)
      .replace(/\.{4,}/g, "...")
      // Remove excessive dashes (--------)
      .replace(/-{4,}/g, "---")
      // Remove excessive equals (========)
      .replace(/={4,}/g, "===")
      // Remove excessive underscores (________)
      .replace(/_{4,}/g, "___")
      // Remove repeated words (word word word -> word)
      .replace(/\b(\w+)\s+\1\s+\1\b/gi, "$1")
  );
}

/**
 * Calculate compression ratio
 *
 * @param original - Original content
 * @param optimized - Optimized content
 * @returns Compression percentage (0-100)
 */
export function calculateCompressionRatio(
  original: string,
  optimized: string,
): number {
  const originalSize = new Blob([original]).size;
  const optimizedSize = new Blob([optimized]).size;

  if (originalSize === 0) return 0;

  const ratio = ((originalSize - optimizedSize) / originalSize) * 100;
  return Math.max(0, Math.min(100, ratio));
}

/**
 * Smart content summarization (optional aggressive optimization)
 * Use carefully - may lose information
 *
 * @param content - Content to summarize
 * @param maxLength - Maximum character length (0 = no limit)
 * @returns Summarized content
 */
export function summarizeContent(
  content: string,
  maxLength: number = 0,
): string {
  if (maxLength === 0 || content.length <= maxLength) {
    return content;
  }

  // Split into paragraphs
  const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 0);

  // Keep important paragraphs (headings, lists, first paragraph)
  const important: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    // Always keep headings
    if (/^#{1,6}\s/.test(paragraph)) {
      important.push(paragraph);
      currentLength += paragraph.length;
      continue;
    }

    // Keep lists
    if (/^[-*+]|\d+\./.test(paragraph)) {
      if (currentLength + paragraph.length <= maxLength) {
        important.push(paragraph);
        currentLength += paragraph.length;
      }
      continue;
    }

    // Keep other paragraphs if space available
    if (currentLength + paragraph.length <= maxLength) {
      important.push(paragraph);
      currentLength += paragraph.length;
    } else {
      // Space limit reached
      break;
    }
  }

  return important.join("\n\n");
}

/**
 * Remove common academic/textbook artifacts
 * Citations, references, figure captions, etc.
 */
export function removeAcademicArtifacts(content: string): string {
  return (
    content
      // Remove citation references [1], [2], (Smith et al., 2020)
      .replace(/\[\d+\]/g, "")
      .replace(/\([A-Z][a-z]+\s+et\s+al\.,\s+\d{4}\)/g, "")
      // Remove "Figure X:" or "Table X:" captions
      .replace(/^(Figure|Table|Chart|Diagram)\s+\d+[.:]/gim, "")
      // Remove "See page X" references
      .replace(/\(see\s+page\s+\d+\)/gi, "")
      // Remove footnote markers
      .replace(/\[\*+\]/g, "")
      // Clean up
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Advanced token optimization for large documents
 * Applies multiple strategies to reduce token count while preserving meaning
 *
 * @param content - Content to optimize
 * @param targetTokens - Target token count (approximate)
 * @returns Optimized content
 */
export function optimizeForTokens(
  content: string,
  targetTokens: number = 100000,
): string {
  let optimized = content;
  const originalTokens = estimateTokenCount(content);

  // Skip optimization if already under target
  if (originalTokens <= targetTokens) {
    return optimized;
  }

  console.log(
    `Optimizing content: ${originalTokens} tokens → target ${targetTokens} tokens`,
  );

  // Strategy 1: Remove academic artifacts (safe, high impact)
  optimized = removeAcademicArtifacts(optimized);

  // Strategy 2: Extractive summarization (keep important content)
  const currentTokens = estimateTokenCount(optimized);
  if (currentTokens > targetTokens) {
    const compressionRatio = targetTokens / currentTokens;
    const maxLength = Math.floor(content.length * compressionRatio * 0.8); // Conservative estimate
    optimized = extractiveSummarize(optimized, maxLength);
  }

  // Strategy 3: Remove redundant sentences (aggressive)
  const finalTokens = estimateTokenCount(optimized);
  if (finalTokens > targetTokens * 1.2) {
    // Allow 20% overage for safety
    optimized = removeRedundantSentences(optimized, targetTokens);
  }

  const finalTokenCount = estimateTokenCount(optimized);
  const reduction = (
    ((originalTokens - finalTokenCount) / originalTokens) *
    100
  ).toFixed(1);

  console.log(
    `Token optimization complete: ${originalTokens} → ${finalTokenCount} tokens (${reduction}% reduction)`,
  );

  return optimized;
}

/**
 * Extractive summarization - keep most important sentences
 * Uses heuristic scoring based on position, length, and keywords
 */
function extractiveSummarize(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;

  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const scoredSentences: Array<{
    sentence: string;
    score: number;
    position: number;
  }> = [];

  sentences.forEach((sentence, index) => {
    let score = 0;

    // Position scoring (first and last sentences more important)
    if (index === 0) score += 10; // First sentence
    if (index === sentences.length - 1) score += 5; // Last sentence

    // Length scoring (medium-length sentences preferred)
    const length = sentence.trim().length;
    if (length > 50 && length < 200) score += 3;

    // Keyword scoring (sentences with important words)
    const keywords = [
      "important",
      "key",
      "main",
      "summary",
      "conclusion",
      "therefore",
      "however",
      "thus",
    ];
    const lowerSentence = sentence.toLowerCase();
    keywords.forEach((keyword) => {
      if (lowerSentence.includes(keyword)) score += 2;
    });

    // Heading proximity (sentences near headings)
    const headingPatterns = [/^#{1,6}\s/, /^\d+\./, /^[A-Z][^.!?]*:/];
    headingPatterns.forEach((pattern) => {
      if (pattern.test(sentence.trim())) score += 5;
    });

    scoredSentences.push({
      sentence: sentence.trim(),
      score,
      position: index,
    });
  });

  // Sort by score (descending)
  scoredSentences.sort((a, b) => b.score - a.score);

  // Select sentences until we reach maxLength
  const selected: string[] = [];
  let currentLength = 0;

  for (const item of scoredSentences) {
    if (currentLength + item.sentence.length <= maxLength) {
      selected.push(item.sentence);
      currentLength += item.sentence.length;
    }
  }

  // Sort back to original order
  selected.sort((a, b) => {
    const aIndex = scoredSentences.find((s) => s.sentence === a)?.position || 0;
    const bIndex = scoredSentences.find((s) => s.sentence === b)?.position || 0;
    return aIndex - bIndex;
  });

  return selected.join(". ").trim() + ".";
}

/**
 * Remove redundant sentences to reduce token count
 */
function removeRedundantSentences(
  content: string,
  targetTokens: number,
): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const targetLength = Math.floor(targetTokens * 4 * 0.9); // Conservative character estimate

  if (content.length <= targetLength) return content;

  // Simple approach: keep first part of content
  // Could be improved with more sophisticated deduplication
  const truncated = content.substring(0, targetLength);

  // Try to end at a sentence boundary
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );

  if (lastSentenceEnd > targetLength * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  return truncated;
}

/**
 * Rough token count estimation (4 characters ≈ 1 token)
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

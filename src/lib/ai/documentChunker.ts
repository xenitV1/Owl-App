// Smart Document Chunking for Large Files

export interface ChunkConfig {
  maxChunkSize: number; // characters
  overlapSize: number; // characters for context overlap
  preserveParagraphs: boolean; // try to keep paragraphs intact
  batchSize?: number; // number of chunks per API call (for batch processing)
}

export interface DocumentChunk {
  index: number;
  content: string;
  startPosition: number;
  endPosition: number;
  totalChunks: number;
}

export interface ChunkBatch {
  batchIndex: number;
  chunks: DocumentChunk[];
  totalBatches: number;
  estimatedTokens: number;
}

const DEFAULT_CONFIG: ChunkConfig = {
  maxChunkSize: 40000, // Leave room for AI response (50k total limit)
  overlapSize: 500, // Overlap for context continuity
  preserveParagraphs: true,
};

/**
 * Smart document chunking that preserves context
 * @param document - Full document text
 * @param config - Chunking configuration
 * @returns Array of document chunks
 */
export function chunkDocument(
  document: string,
  config: Partial<ChunkConfig> = {},
): DocumentChunk[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxChunkSize, overlapSize, preserveParagraphs } = finalConfig;

  // If document is small enough, return as single chunk
  if (document.length <= maxChunkSize) {
    return [
      {
        index: 0,
        content: document,
        startPosition: 0,
        endPosition: document.length,
        totalChunks: 1,
      },
    ];
  }

  const chunks: DocumentChunk[] = [];
  let currentPosition = 0;

  while (currentPosition < document.length) {
    let chunkEnd = Math.min(currentPosition + maxChunkSize, document.length);

    // Try to find a natural break point (paragraph, sentence)
    if (preserveParagraphs && chunkEnd < document.length) {
      // Look for paragraph break (\n\n)
      const paragraphBreak = document.lastIndexOf("\n\n", chunkEnd);
      if (paragraphBreak > currentPosition) {
        chunkEnd = paragraphBreak + 2;
      } else {
        // Look for sentence break (.!?)
        const sentenceBreak = findSentenceBreak(
          document,
          currentPosition,
          chunkEnd,
        );
        if (sentenceBreak > currentPosition) {
          chunkEnd = sentenceBreak;
        }
      }
    }

    const chunkContent = document.substring(currentPosition, chunkEnd).trim();

    chunks.push({
      index: chunks.length,
      content: chunkContent,
      startPosition: currentPosition,
      endPosition: chunkEnd,
      totalChunks: 0, // Will be updated after loop
    });

    // Move to next chunk with overlap for context
    currentPosition = chunkEnd - overlapSize;

    // Ensure we don't get stuck
    if (currentPosition <= chunks[chunks.length - 1].startPosition) {
      currentPosition = chunkEnd;
    }
  }

  // Update total chunks count
  chunks.forEach((chunk) => {
    chunk.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Group chunks into batches for efficient API calls
 * @param chunks - Array of document chunks
 * @param batchSize - Number of chunks per batch
 * @returns Array of chunk batches
 */
export function createChunkBatches(
  chunks: DocumentChunk[],
  batchSize: number = 3,
): ChunkBatch[] {
  if (chunks.length <= batchSize) {
    // Single batch if small enough
    const estimatedTokens = estimateBatchTokens(chunks);
    return [
      {
        batchIndex: 0,
        chunks,
        totalBatches: 1,
        estimatedTokens,
      },
    ];
  }

  const batches: ChunkBatch[] = [];
  let currentBatch: DocumentChunk[] = [];
  let batchIndex = 0;

  for (const chunk of chunks) {
    currentBatch.push(chunk);

    // Check if batch is full or this is the last chunk
    if (currentBatch.length >= batchSize || chunk.index === chunks.length - 1) {
      const estimatedTokens = estimateBatchTokens(currentBatch);
      batches.push({
        batchIndex,
        chunks: [...currentBatch],
        totalBatches: Math.ceil(chunks.length / batchSize),
        estimatedTokens,
      });

      currentBatch = [];
      batchIndex++;
    }
  }

  return batches;
}

/**
 * Estimate token count for a batch of chunks
 * Rough estimation: ~4 characters per token
 */
function estimateBatchTokens(chunks: DocumentChunk[]): number {
  const totalChars = chunks.reduce(
    (sum, chunk) => sum + chunk.content.length,
    0,
  );
  const promptOverhead = 2000; // Estimated prompt template overhead
  return Math.ceil((totalChars + promptOverhead) / 4);
}

/**
 * Find the last sentence break before maxPosition
 */
function findSentenceBreak(
  text: string,
  startPosition: number,
  maxPosition: number,
): number {
  const sentenceEnders = [". ", "! ", "? ", ".\n", "!\n", "?\n"];
  let lastBreak = -1;

  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, maxPosition);
    if (pos > startPosition && pos > lastBreak) {
      lastBreak = pos + ender.length;
    }
  }

  return lastBreak > startPosition ? lastBreak : maxPosition;
}

/**
 * Merge AI-generated content from multiple chunks
 * @param contentType - Type of content being merged
 * @param chunks - Array of AI responses
 * @param maxItems - Optional maximum number of items to return (enforces user limit)
 * @returns Merged content
 */
export function mergeChunkedResults(
  contentType: "flashcards" | "questions" | "notes",
  chunks: any[],
  maxItems?: number,
): any {
  if (chunks.length === 1) {
    return chunks[0];
  }

  if (contentType === "flashcards") {
    // Merge flashcard arrays
    const allFlashcards = chunks.flatMap((chunk) => chunk.flashcards || []);

    // Remove duplicates based on front text similarity
    const uniqueFlashcards = deduplicateFlashcards(allFlashcards);

    // 🚨 ENFORCE TOTAL LIMIT - Safety check in case AI generated more than requested
    const finalFlashcards =
      maxItems && uniqueFlashcards.length > maxItems
        ? uniqueFlashcards.slice(0, maxItems)
        : uniqueFlashcards;

    if (maxItems && uniqueFlashcards.length > maxItems) {
      console.warn(
        `After merge, got ${uniqueFlashcards.length} flashcards but user requested max ${maxItems}. Limiting to ${maxItems}.`,
      );
    }

    return { flashcards: finalFlashcards };
  }

  if (contentType === "questions") {
    // Merge question arrays
    const allQuestions = chunks.flatMap((chunk) => chunk.questions || []);

    // Remove duplicates based on question text similarity
    const uniqueQuestions = deduplicateQuestions(allQuestions);

    // 🚨 ENFORCE TOTAL LIMIT - Safety check in case AI generated more than requested
    const finalQuestions =
      maxItems && uniqueQuestions.length > maxItems
        ? uniqueQuestions.slice(0, maxItems)
        : uniqueQuestions;

    if (maxItems && uniqueQuestions.length > maxItems) {
      console.warn(
        `After merge, got ${uniqueQuestions.length} questions but user requested max ${maxItems}. Limiting to ${maxItems}.`,
      );
    }

    return { questions: finalQuestions };
  }

  if (contentType === "notes") {
    // For notes, concatenate with section separators
    const mergedNotes = chunks
      .map((chunk, index) => {
        if (typeof chunk === "string") return chunk;
        return chunk.content || "";
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    return mergedNotes;
  }

  return chunks[0];
}

/**
 * Remove duplicate flashcards based on similarity
 */
function deduplicateFlashcards(flashcards: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const card of flashcards) {
    const key = normalizeText(card.front);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(card);
    }
  }

  return unique;
}

/**
 * Remove duplicate questions based on similarity
 * IMPORTANT: Preserves all properties including options array
 */
function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const question of questions) {
    const key = normalizeText(question.question);
    if (!seen.has(key)) {
      seen.add(key);

      // Ensure multiple_choice questions have options array
      if (
        question.type === "multiple_choice" &&
        (!question.options || question.options.length === 0)
      ) {
        console.warn(
          "Skipping multiple_choice question without options:",
          question.question,
        );
        continue; // Skip this question
      }

      unique.push(question);
    }
  }

  return unique;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate optimal chunk count and size for a document
 * @param documentLength - Total document length in characters
 * @returns Recommended chunk configuration
 */
export function calculateOptimalChunking(documentLength: number): {
  shouldChunk: boolean;
  estimatedChunks: number;
  chunkSize: number;
} {
  const maxChunkSize = 40000;

  if (documentLength <= maxChunkSize) {
    return {
      shouldChunk: false,
      estimatedChunks: 1,
      chunkSize: documentLength,
    };
  }

  const estimatedChunks = Math.ceil(documentLength / maxChunkSize);
  const optimalChunkSize = Math.ceil(documentLength / estimatedChunks);

  return {
    shouldChunk: true,
    estimatedChunks,
    chunkSize: optimalChunkSize,
  };
}

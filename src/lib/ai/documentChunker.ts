// Smart Document Chunking for Large Files

export interface ChunkConfig {
  maxChunkSize: number; // characters
  overlapSize: number; // characters for context overlap
  preserveParagraphs: boolean; // try to keep paragraphs intact
}

export interface DocumentChunk {
  index: number;
  content: string;
  startPosition: number;
  endPosition: number;
  totalChunks: number;
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
  config: Partial<ChunkConfig> = {}
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
      const paragraphBreak = document.lastIndexOf('\n\n', chunkEnd);
      if (paragraphBreak > currentPosition) {
        chunkEnd = paragraphBreak + 2;
      } else {
        // Look for sentence break (.!?)
        const sentenceBreak = findSentenceBreak(
          document,
          currentPosition,
          chunkEnd
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
 * Find the last sentence break before maxPosition
 */
function findSentenceBreak(
  text: string,
  startPosition: number,
  maxPosition: number
): number {
  const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
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
 * @returns Merged content
 */
export function mergeChunkedResults(
  contentType: 'flashcards' | 'questions' | 'notes',
  chunks: any[]
): any {
  if (chunks.length === 1) {
    return chunks[0];
  }

  if (contentType === 'flashcards') {
    // Merge flashcard arrays
    const allFlashcards = chunks.flatMap((chunk) => chunk.flashcards || []);
    
    // Remove duplicates based on front text similarity
    const uniqueFlashcards = deduplicateFlashcards(allFlashcards);
    
    return { flashcards: uniqueFlashcards };
  }

  if (contentType === 'questions') {
    // Merge question arrays
    const allQuestions = chunks.flatMap((chunk) => chunk.questions || []);
    
    // Remove duplicates based on question text similarity
    const uniqueQuestions = deduplicateQuestions(allQuestions);
    
    return { questions: uniqueQuestions };
  }

  if (contentType === 'notes') {
    // For notes, concatenate with section separators
    const mergedNotes = chunks
      .map((chunk, index) => {
        if (typeof chunk === 'string') return chunk;
        return chunk.content || '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
    
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
      if (question.type === 'multiple_choice' && (!question.options || question.options.length === 0)) {
        console.warn('Skipping multiple_choice question without options:', question.question);
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
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
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


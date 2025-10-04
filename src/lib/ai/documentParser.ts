// Document Parsing Utilities for AI Content Generation
// NOTE: This module should only be imported in server-side code (API routes)

/**
 * Parse PDF file to extract text content
 * Using unpdf - modern ESM-compatible PDF parser
 * @param buffer - PDF file buffer
 * @returns Extracted text
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import('unpdf');
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractText(uint8Array, { mergePages: true });
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse DOCX file to extract text content
 * @param buffer - DOCX file buffer
 * @returns Extracted text
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    // Lazy import mammoth
    const mammoth = await import('mammoth').then(mod => mod.default || mod);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Parse TXT file to extract text content
 * @param buffer - TXT file buffer
 * @returns Extracted text
 */
export function parseTXT(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('TXT parsing error:', error);
    throw new Error('Failed to parse TXT file');
  }
}

/**
 * Main document parser - routes to appropriate parser based on file type
 * @param buffer - File buffer
 * @param mimeType - File MIME type
 * @returns Extracted text content
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // Normalize MIME type
  const normalizedMimeType = mimeType.toLowerCase();

  try {
    if (
      normalizedMimeType === 'application/pdf' ||
      normalizedMimeType.includes('pdf')
    ) {
      return await parsePDF(buffer);
    }

    if (
      normalizedMimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      normalizedMimeType.includes('wordprocessingml') ||
      normalizedMimeType === 'application/msword'
    ) {
      return await parseDOCX(buffer);
    }

    if (
      normalizedMimeType === 'text/plain' ||
      normalizedMimeType.startsWith('text/')
    ) {
      return parseTXT(buffer);
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    console.error('Document parsing error:', error);
    throw error;
  }
}

/**
 * Validate document size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default: 10MB)
 * @returns true if size is valid
 */
export function validateDocumentSize(
  size: number,
  maxSize: number = 10 * 1024 * 1024
): boolean {
  return size <= maxSize;
}

/**
 * Validate document type
 * @param mimeType - File MIME type
 * @returns true if type is supported
 */
export function validateDocumentType(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  return supportedTypes.some((type) => mimeType.toLowerCase().includes(type.toLowerCase()));
}

/**
 * Clean and normalize extracted text
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/ {2,}/g, ' ') // Remove multiple spaces
    .trim();
}


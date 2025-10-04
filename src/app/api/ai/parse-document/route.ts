// API Route: Parse Document
import { NextRequest, NextResponse } from 'next/server';
import {
  parseDocument,
  validateDocumentSize,
  validateDocumentType,
  cleanText,
} from '@/lib/ai/documentParser';
import type { ParseDocumentResponseBody } from '../types';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<ParseDocumentResponseBody>(
        {
          success: false,
          error: 'No file provided',
          message: 'Please upload a document file',
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (!validateDocumentSize(file.size)) {
      return NextResponse.json<ParseDocumentResponseBody>(
        {
          success: false,
          error: 'File too large',
          message: 'File size must be less than 10MB',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateDocumentType(file.type)) {
      return NextResponse.json<ParseDocumentResponseBody>(
        {
          success: false,
          error: 'Unsupported file type',
          message:
            'Please upload a PDF, DOCX, or TXT file',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse document using pdfjs-dist (already in package.json)
    const rawText = await parseDocument(buffer, file.type);

    // Clean extracted text
    const cleanedText = cleanText(rawText);

    if (!cleanedText || cleanedText.length < 50) {
      return NextResponse.json<ParseDocumentResponseBody>(
        {
          success: false,
          error: 'No content extracted',
          message:
            'Could not extract enough text from the document. Please check the file.',
        },
        { status: 400 }
      );
    }

    // Return parsed content
    return NextResponse.json<ParseDocumentResponseBody>(
      {
        success: true,
        data: {
          text: cleanedText,
          filename: file.name,
          fileType: file.type,
          size: file.size,
        },
        message: 'Document parsed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json<ParseDocumentResponseBody>(
      {
        success: false,
        error: 'Parsing failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to parse document',
      },
      { status: 500 }
    );
  }
}


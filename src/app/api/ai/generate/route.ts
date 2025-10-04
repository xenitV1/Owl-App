// API Route: AI Content Generation
import { NextRequest, NextResponse } from 'next/server';
import { generateContent, isGeminiConfigured } from '@/lib/ai/geminiClient';
import { getPromptForContentType } from '@/lib/ai/promptTemplates';
import { formatGeneratedContent, validateGeneratedContent } from '@/lib/ai/contentFormatter';
import { chunkDocument, mergeChunkedResults, calculateOptimalChunking } from '@/lib/ai/documentChunker';
import type { AIGenerateRequestBody, AIGenerateResponseBody } from '../types';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'AI service not configured',
          message: 'Gemini API key is not configured. Please contact administrator.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: AIGenerateRequestBody = await request.json();

    // Validate required fields
    if (!body.contentType || !body.documentContent || !body.ageGroup || !body.language) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Please provide contentType, documentContent, ageGroup, and language',
        },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['flashcards', 'questions', 'notes'];
    if (!validContentTypes.includes(body.contentType)) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'Invalid content type',
          message: 'contentType must be one of: flashcards, questions, notes',
        },
        { status: 400 }
      );
    }

    // Validate age group
    const validAgeGroups = ['elementary', 'middle', 'high', 'university'];
    if (!validAgeGroups.includes(body.ageGroup)) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'Invalid age group',
          message: 'ageGroup must be one of: elementary, middle, high, university',
        },
        { status: 400 }
      );
    }

    // Validate language (accept any string)
    if (!body.language || body.language.trim().length === 0) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'Invalid language',
          message: 'language is required',
        },
        { status: 400 }
      );
    }

    // Validate card count (optional, max 20)
    if (body.cardCount !== undefined) {
      if (body.cardCount < 1 || body.cardCount > 20) {
        return NextResponse.json<AIGenerateResponseBody>(
          {
            success: false,
            error: 'Invalid card count',
            message: 'cardCount must be between 1 and 20',
          },
          { status: 400 }
        );
      }
    }

    // Validate document content length
    if (body.documentContent.length < 50) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: 'Content too short',
          message: 'Document content must be at least 50 characters',
        },
        { status: 400 }
      );
    }

    // Check if document needs chunking
    const chunkingInfo = calculateOptimalChunking(body.documentContent.length);

    let aiResponse: string;
    let mergedContent: any;

    if (chunkingInfo.shouldChunk) {
      // Process large documents in chunks
      console.log(`Processing large document in ${chunkingInfo.estimatedChunks} chunks`);

      const chunks = chunkDocument(body.documentContent, {
        maxChunkSize: 40000,
        overlapSize: 500,
        preserveParagraphs: true,
      });

      const chunkResponses: any[] = [];

      // Process each chunk
      for (const chunk of chunks) {
        const chunkPrompt = getPromptForContentType(body.contentType as any, {
          documentContent: `[Part ${chunk.index + 1}/${chunk.totalChunks}]\n\n${chunk.content}`,
          ageGroup: body.ageGroup as any,
          language: body.language,
          subject: body.subject,
          cardCount: body.cardCount,
        });

        const chunkResponse = await generateContent(chunkPrompt, {
          temperature: body.contentType === 'notes' ? 0.7 : 0.8,
          maxOutputTokens: body.contentType === 'notes' ? 8192 : 4096,
        });

        // Parse chunk response
        try {
          if (body.contentType === 'notes') {
            chunkResponses.push(chunkResponse);
          } else {
            const parsedChunk = JSON.parse(
              chunkResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            );
            chunkResponses.push(parsedChunk);
          }
        } catch (error) {
          console.error('Failed to parse chunk response:', error);
          // Continue with other chunks
        }
      }

      // Merge all chunk responses
      mergedContent = mergeChunkedResults(body.contentType as any, chunkResponses);
      
      // Convert back to string for formatting
      aiResponse = body.contentType === 'notes' 
        ? mergedContent 
        : JSON.stringify(mergedContent);
    } else {
      // Single request for small documents
      const prompt = getPromptForContentType(body.contentType as any, {
        documentContent: body.documentContent,
        ageGroup: body.ageGroup as any,
        language: body.language,
        subject: body.subject,
        cardCount: body.cardCount,
      });

      aiResponse = await generateContent(prompt, {
        temperature: body.contentType === 'notes' ? 0.7 : 0.8,
        maxOutputTokens: body.contentType === 'notes' ? 8192 : 4096,
      });
    }

    // Format and validate response
    const generatedContent = formatGeneratedContent(
      body.contentType as any,
      aiResponse,
      {
        ageGroup: body.ageGroup as any,
        language: body.language,
        subject: body.subject,
      }
    );

    // Validate generated content
    if (!validateGeneratedContent(generatedContent)) {
      throw new Error('Generated content validation failed');
    }

    // Return success response
    return NextResponse.json<AIGenerateResponseBody>(
      {
        success: true,
        data: {
          type: generatedContent.type,
          title: generatedContent.title,
          content: generatedContent.content,
          metadata: {
            ageGroup: generatedContent.metadata.ageGroup,
            language: generatedContent.metadata.language,
            subject: generatedContent.metadata.subject,
            generatedAt: generatedContent.metadata.generatedAt.toISOString(),
          },
        },
        message: 'Content generated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json<AIGenerateResponseBody>(
      {
        success: false,
        error: 'Generation failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate content. Please try again.',
      },
      { status: 500 }
    );
  }
}


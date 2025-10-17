// API Route: AI Content Generation
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContent, isGeminiConfigured } from "@/lib/ai/geminiClient";
import { getPromptForContentType } from "@/lib/ai/promptTemplates";
import {
  formatGeneratedContent,
  validateGeneratedContent,
} from "@/lib/ai/contentFormatter";
import {
  chunkDocument,
  mergeChunkedResults,
  calculateOptimalChunking,
  createChunkBatches,
  ChunkBatch,
} from "@/lib/ai/documentChunker";
import { optimizeForTokens } from "@/lib/ai/pdfOptimizer";
import type {
  AIGenerateRequestBody,
  AIGenerateResponseBody,
  AIGenerationProgress,
} from "../types";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for Vercel Hobby plan limit

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "AI service not configured",
          message:
            "Gemini API key is not configured. Please contact administrator.",
        },
        { status: 500 },
      );
    }

    // Parse request body
    const body: AIGenerateRequestBody = await request.json();

    // Validate required fields
    if (
      !body.contentType ||
      !body.documentContent ||
      !body.ageGroup ||
      !body.language
    ) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "Missing required fields",
          message:
            "Please provide contentType, documentContent, ageGroup, and language",
        },
        { status: 400 },
      );
    }

    // Validate content type
    const validContentTypes = ["flashcards", "questions", "notes"];
    if (!validContentTypes.includes(body.contentType)) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "Invalid content type",
          message: "contentType must be one of: flashcards, questions, notes",
        },
        { status: 400 },
      );
    }

    // Validate age group
    const validAgeGroups = ["elementary", "middle", "high", "university"];
    if (!validAgeGroups.includes(body.ageGroup)) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "Invalid age group",
          message:
            "ageGroup must be one of: elementary, middle, high, university",
        },
        { status: 400 },
      );
    }

    // Validate language (accept any string)
    if (!body.language || body.language.trim().length === 0) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "Invalid language",
          message: "language is required",
        },
        { status: 400 },
      );
    }

    // Validate card count (optional, max 20)
    if (body.cardCount !== undefined) {
      if (body.cardCount < 1 || body.cardCount > 20) {
        return NextResponse.json<AIGenerateResponseBody>(
          {
            success: false,
            error: "Invalid card count",
            message: "cardCount must be between 1 and 20",
          },
          { status: 400 },
        );
      }
    }

    // Validate document content length
    if (body.documentContent.length < 50) {
      return NextResponse.json<AIGenerateResponseBody>(
        {
          success: false,
          error: "Content too short",
          message: "Document content must be at least 50 characters",
        },
        { status: 400 },
      );
    }

    // 🚀 TOKEN OPTIMIZATION: Pre-process large documents to reduce token usage
    let processedContent = body.documentContent;

    // For very large documents, apply token optimization
    const documentTokens = Math.ceil(body.documentContent.length / 4); // Rough estimate
    const MAX_OPTIMAL_TOKENS = 150000; // Target for batch processing

    if (documentTokens > MAX_OPTIMAL_TOKENS * 1.5) {
      // 225k+ tokens
      console.log(
        `Applying token optimization: ${documentTokens} tokens detected`,
      );
      processedContent = optimizeForTokens(
        body.documentContent,
        MAX_OPTIMAL_TOKENS,
      );
      console.log(
        `Content optimized: ${documentTokens} → ${Math.ceil(processedContent.length / 4)} tokens`,
      );
    }

    // Check if document needs chunking (after optimization)
    const chunkingInfo = calculateOptimalChunking(processedContent.length);

    let aiResponse: string;
    let mergedContent: any;

    if (chunkingInfo.shouldChunk) {
      // 🚀 OPTIMIZED: Process large documents in batches (3-5 chunks per API call)
      console.log(
        `Processing large document in ${chunkingInfo.estimatedChunks} chunks`,
      );

      const chunks = chunkDocument(processedContent, {
        maxChunkSize: 35000, // Slightly smaller to leave room for batch processing
        overlapSize: 500,
        preserveParagraphs: true,
      });

      // Create batches for efficient API calls
      const batches = createChunkBatches(chunks, 3); // 3 chunks per batch = ~105k chars max
      console.log(`Created ${batches.length} batches for processing`);

      const chunkResponses: any[] = [];

      // 🚨 CRITICAL: Smart proportional distribution based on chunk sizes
      // Ensure EVERY chunk contributes cards, but proportionally to its content size
      let cardsPerChunk: number[] = [];

      if (body.cardCount) {
        const totalSize = chunks.reduce((sum, c) => sum + c.content.length, 0);
        let remaining = body.cardCount;
        const requestedCount = body.cardCount; // Store for use in map

        // Calculate proportional cards for each chunk
        cardsPerChunk = chunks.map((chunk, index) => {
          // Minimum 1 card per chunk (unless we run out)
          if (remaining === 0) return 0;

          // For last chunk, give all remaining cards
          if (index === chunks.length - 1) {
            return Math.max(1, remaining);
          }

          // Proportional calculation
          const proportion = chunk.content.length / totalSize;
          const proportionalCards = Math.max(
            1,
            Math.round(requestedCount * proportion),
          );
          const assigned = Math.min(proportionalCards, remaining);

          remaining -= assigned;
          return assigned;
        });

        console.log(
          `User requested ${body.cardCount} total cards. Distribution:`,
          cardsPerChunk
            .map((count, i) => `Chunk ${i + 1}: ${count} cards`)
            .join(", "),
        );
      }

      // Process each batch (multiple chunks per API call)
      for (const batch of batches) {
        console.log(
          `Processing batch ${batch.batchIndex + 1}/${batch.totalBatches} (${batch.chunks.length} chunks, ~${batch.estimatedTokens} tokens)`,
        );

        // Calculate total cards for this batch
        const batchCardCount = body.cardCount
          ? batch.chunks.reduce(
              (sum, chunk) => sum + (cardsPerChunk[chunk.index] || 0),
              0,
            )
          : undefined;

        // Skip if this batch should generate 0 cards
        if (batchCardCount === 0) {
          console.log(
            `Skipping batch ${batch.batchIndex + 1} - no cards allocated`,
          );
          continue;
        }

        // Combine all chunks in this batch into a single document
        const batchContent = batch.chunks
          .map(
            (chunk, idx) =>
              `[Part ${chunk.index + 1}/${chunk.totalChunks}]\n\n${chunk.content}`,
          )
          .join("\n\n---\n\n");

        const batchPrompt = getPromptForContentType(body.contentType as any, {
          documentContent: batchContent,
          ageGroup: body.ageGroup as any,
          language: body.language,
          subject: body.subject,
          cardCount: batchCardCount, // Total cards for entire batch
        });

        const batchResponse = await generateContent(batchPrompt, {
          temperature: body.contentType === "notes" ? 0.7 : 0.8,
          maxOutputTokens: body.contentType === "notes" ? 8192 : 4096,
        });

        // Parse batch response
        try {
          if (body.contentType === "notes") {
            chunkResponses.push(batchResponse);
          } else {
            const parsedBatch = JSON.parse(
              batchResponse
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim(),
            );
            chunkResponses.push(parsedBatch);
          }
        } catch (error) {
          console.error(
            `Failed to parse batch ${batch.batchIndex + 1} response:`,
            error,
          );
          // Continue with other batches
        }
      }

      // Merge all chunk responses
      // Pass cardCount as maxItems to enforce total limit after merge
      mergedContent = mergeChunkedResults(
        body.contentType as any,
        chunkResponses,
        body.cardCount, // Enforce user's requested limit
      );

      // Convert back to string for formatting
      aiResponse =
        body.contentType === "notes"
          ? mergedContent
          : JSON.stringify(mergedContent);
    } else {
      // Single request for small documents
      const singlePrompt = getPromptForContentType(body.contentType as any, {
        documentContent: body.documentContent,
        ageGroup: body.ageGroup as any,
        language: body.language,
        subject: body.subject,
        cardCount: body.cardCount,
      });

      const optimizedPrompt = getPromptForContentType(body.contentType as any, {
        documentContent: processedContent,
        ageGroup: body.ageGroup as any,
        language: body.language,
        subject: body.subject,
        cardCount: body.cardCount,
      });

      aiResponse = await generateContent(optimizedPrompt, {
        temperature: body.contentType === "notes" ? 0.7 : 0.8,
        maxOutputTokens: body.contentType === "notes" ? 8192 : 4096,
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
      },
    );

    // Validate generated content
    if (!validateGeneratedContent(generatedContent)) {
      throw new Error("Generated content validation failed");
    }

    // AUTO-SAVE STUDY NOTES: If content type is 'notes', save to database
    let savedNoteId: string | undefined;
    if (body.contentType === "notes") {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email },
          });

          if (user) {
            const studyNote = await prisma.studyNote.create({
              data: {
                title: generatedContent.title || "Untitled Study Note",
                content:
                  typeof generatedContent.content === "string"
                    ? generatedContent.content
                    : JSON.stringify(generatedContent.content),
                subject: body.subject,
                ageGroup: body.ageGroup,
                language: body.language,
                sourceDocument: body.sourceDocument,
                userId: user.id,
                isPublic: false,
              },
            });
            savedNoteId = studyNote.id;
            console.log(`Study note saved successfully: ${studyNote.id}`);
          }
        }
      } catch (saveError) {
        console.error("Failed to save study note:", saveError);
        // Don't fail the request if saving fails
      }
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
            ...(savedNoteId && { savedNoteId }), // Include saved note ID if available
          },
        },
        message: savedNoteId
          ? "Content generated and saved successfully"
          : "Content generated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json<AIGenerateResponseBody>(
      {
        success: false,
        error: "Generation failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate content. Please try again.",
      },
      { status: 500 },
    );
  }
}

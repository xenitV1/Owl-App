import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContent } from "@/lib/ai/geminiClient";
import { getPromptForContentType } from "@/lib/ai/promptTemplates";
import type { GenerateFromNoteRequest } from "@/types/studyNote";

// POST - Generate flashcards or questions from study note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get study note
    const studyNote = await prisma.studyNote.findUnique({
      where: { id },
    });

    if (!studyNote) {
      return NextResponse.json(
        { error: "Study note not found" },
        { status: 404 },
      );
    }

    if (studyNote.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: GenerateFromNoteRequest = await request.json();

    if (
      !body.contentType ||
      !["flashcards", "questions"].includes(body.contentType)
    ) {
      return NextResponse.json(
        { error: 'Invalid content type. Must be "flashcards" or "questions"' },
        { status: 400 },
      );
    }

    // Use note's language and ageGroup, or fallback to request params
    const language = body.language || studyNote.language;
    const ageGroup = body.ageGroup || studyNote.ageGroup;
    const cardCount = body.cardCount || 15;

    console.log(
      `Generating ${body.contentType} from study note: ${studyNote.title}`,
    );

    // Generate AI content using the study note's markdown content
    const prompt = getPromptForContentType(body.contentType, {
      documentContent: studyNote.content,
      ageGroup: ageGroup as any,
      language,
      subject: studyNote.subject || undefined,
      cardCount,
    });

    const aiResponse = await generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    // Parse AI response
    let generatedContent;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      generatedContent = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 },
      );
    }

    // Return the generated content
    return NextResponse.json({
      success: true,
      contentType: body.contentType,
      content: generatedContent,
      noteTitle: studyNote.title,
      noteSubject: studyNote.subject,
      language,
      ageGroup,
    });
  } catch (error) {
    console.error("Error generating content from study note:", error);
    return NextResponse.json(
      { error: "Failed to generate content from study note" },
      { status: 500 },
    );
  }
}

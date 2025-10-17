// Content Formatters for AI-Generated Content
import type {
  Flashcard,
  Question,
  StudyNoteContent,
  GeneratedContent,
  ContentType,
  AgeGroup,
} from "@/types/ai";

/**
 * Parse and validate AI-generated flashcards from JSON response
 * @param aiResponse - Raw AI response text
 * @returns Array of validated flashcards
 */
export function parseFlashcardsResponse(aiResponse: string): Flashcard[] {
  try {
    // Clean the response (remove markdown code blocks if present)
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid flashcards format");
    }

    // Validate and format each flashcard
    return parsed.flashcards.map((card: any, index: number) => ({
      id: `flashcard-${Date.now()}-${index}`,
      front: String(card.front || "").trim(),
      back: String(card.back || "").trim(),
      difficulty: Math.max(1, Math.min(5, Number(card.difficulty) || 3)),
      tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
      category: card.category ? String(card.category) : undefined,
    }));
  } catch (error) {
    console.error("Failed to parse flashcards response:", error);
    throw new Error("Failed to parse AI-generated flashcards");
  }
}

/**
 * Parse and validate AI-generated questions from JSON response
 * @param aiResponse - Raw AI response text
 * @returns Array of validated questions
 */
export function parseQuestionsResponse(aiResponse: string): Question[] {
  try {
    // Clean the response
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid questions format");
    }

    // Validate and format each question
    return parsed.questions
      .map((q: any, index: number) => {
        const questionType = q.type || "multiple_choice";
        const options = Array.isArray(q.options)
          ? q.options.map(String)
          : undefined;

        // For multiple choice questions, options are required
        if (
          questionType === "multiple_choice" &&
          (!options || options.length === 0)
        ) {
          console.warn(
            `Question ${index + 1} is multiple_choice but has no options. Skipping.`,
          );
          return null;
        }

        return {
          id: `question-${Date.now()}-${index}`,
          type: questionType,
          question: String(q.question || "").trim(),
          options: options,
          correctAnswer: String(q.correctAnswer || "").trim(),
          explanation: String(q.explanation || "").trim(),
          difficulty: Math.max(1, Math.min(5, Number(q.difficulty) || 3)),
          bloomLevel: q.bloomLevel || "understand",
        };
      })
      .filter((q): q is Question => q !== null); // Remove null entries
  } catch (error) {
    console.error("Failed to parse questions response:", error);
    throw new Error("Failed to parse AI-generated questions");
  }
}

/**
 * Parse and validate AI-generated study notes from markdown response
 * @param aiResponse - Raw AI response text (markdown)
 * @returns Formatted study note
 */
export function parseNotesResponse(aiResponse: string): StudyNoteContent {
  try {
    // Clean the response
    const cleanedResponse = aiResponse.trim();

    // Extract title from first heading
    const titleMatch = cleanedResponse.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "Study Notes";

    // Extract sections (## headings)
    const sections: { heading: string; content: string }[] = [];
    const sectionRegex = /^##\s+(.+)$[\s\S]*?(?=^##\s+|$)/gm;
    let match;

    while ((match = sectionRegex.exec(cleanedResponse)) !== null) {
      const heading = match[1].trim();
      const startIndex = match.index;
      const nextMatch = sectionRegex.exec(cleanedResponse);
      const endIndex = nextMatch ? nextMatch.index : cleanedResponse.length;
      sectionRegex.lastIndex = nextMatch
        ? nextMatch.index
        : cleanedResponse.length;

      const content = cleanedResponse.substring(startIndex, endIndex).trim();

      sections.push({ heading, content });
    }

    return {
      title,
      content: cleanedResponse,
      sections: sections.length > 0 ? sections : undefined,
    };
  } catch (error) {
    console.error("Failed to parse notes response:", error);
    throw new Error("Failed to parse AI-generated notes");
  }
}

/**
 * Format generated content into standardized structure
 * @param contentType - Type of content
 * @param aiResponse - Raw AI response
 * @param metadata - Metadata about the generation
 * @returns Formatted generated content
 */
export function formatGeneratedContent(
  contentType: ContentType,
  aiResponse: string,
  metadata: {
    ageGroup: AgeGroup;
    language: string;
    subject?: string;
    sourceDocument?: string;
  },
): GeneratedContent {
  let content: Flashcard[] | Question[] | StudyNoteContent;
  let title: string;

  switch (contentType) {
    case "flashcards":
      content = parseFlashcardsResponse(aiResponse);
      title = `Flashcards${metadata.subject ? `: ${metadata.subject}` : ""}`;
      break;

    case "questions":
      content = parseQuestionsResponse(aiResponse);
      title = `Practice Questions${metadata.subject ? `: ${metadata.subject}` : ""}`;
      break;

    case "notes":
      content = parseNotesResponse(aiResponse);
      title = (content as StudyNoteContent).title;
      break;

    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }

  return {
    type: contentType,
    title,
    content,
    metadata: {
      ...metadata,
      generatedAt: new Date(),
    },
  };
}

/**
 * Generate a summary title from document content
 * @param documentContent - The document text
 * @param maxLength - Maximum title length
 * @returns Generated title
 */
export function generateTitleFromContent(
  documentContent: string,
  maxLength: number = 60,
): string {
  // Take first line or first sentence
  const firstLine = documentContent.split("\n")[0].trim();
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();

  let title = firstSentence || firstLine || "Study Material";

  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + "...";
  }

  return title;
}

/**
 * Validate generated content structure
 * @param content - Generated content to validate
 * @returns true if valid
 */
export function validateGeneratedContent(content: GeneratedContent): boolean {
  if (!content.type || !content.title || !content.content) {
    return false;
  }

  if (content.type === "flashcards") {
    const flashcards = content.content as Flashcard[];
    return (
      Array.isArray(flashcards) &&
      flashcards.length > 0 &&
      flashcards.every((card) => card.front && card.back)
    );
  }

  if (content.type === "questions") {
    const questions = content.content as Question[];
    return (
      Array.isArray(questions) &&
      questions.length > 0 &&
      questions.every((q) => q.question && q.correctAnswer)
    );
  }

  if (content.type === "notes") {
    const note = content.content as StudyNoteContent;
    return !!note.content && note.content.length > 0;
  }

  return false;
}

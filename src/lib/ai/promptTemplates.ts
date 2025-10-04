// AI Prompt Templates for Educational Content Generation
import type { ContentType, AgeGroup } from '@/types/ai';

interface PromptParams {
  documentContent: string;
  ageGroup: AgeGroup;
  language: string; // Support any language
  subject?: string;
  cardCount?: number; // Number of cards to generate (default: 10-15)
}

// Language display names for better AI context
const LANGUAGE_NAMES: Record<string, string> = {
  'tr': 'Turkish',
  'en': 'English',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'ar': 'Arabic',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ru': 'Russian',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ko': 'Korean',
};

// Age group descriptions for better AI context
const AGE_GROUP_CONTEXT = {
  elementary: 'Elementary school students (ages 6-11), requiring simple language and visual examples',
  middle: 'Middle school students (ages 12-14), capable of abstract thinking and complex concepts',
  high: 'High school students (ages 15-18), advanced comprehension and analytical skills',
  university: 'University students (ages 18+), sophisticated understanding and critical thinking',
};

/**
 * Generate prompt for Flashcards (Bilgi Kartları)
 * Based on: Active Recall & Spaced Repetition principles
 * Format: Topic/Concept → Explanation (NOT Question → Answer)
 */
export function generateFlashcardPrompt(params: PromptParams): string {
  const { documentContent, ageGroup, language, subject, cardCount } = params;
  const languageName = LANGUAGE_NAMES[language] || language;
  const targetCount = cardCount || 15;

  return `You are an expert educational content creator specializing in information flashcard design using Active Recall and Spaced Repetition principles.

TARGET AUDIENCE: ${AGE_GROUP_CONTEXT[ageGroup]}
OUTPUT LANGUAGE: ${languageName} (ALL content must be in ${languageName})
${subject ? `SUBJECT: ${subject}` : ''}

EDUCATIONAL PRINCIPLES:
1. Atomic Principle - One concept per card
2. Clear Language - Appropriate for ${ageGroup} students
3. Front Side: Key topic, concept, or term (NOT a question)
4. Back Side: Clear explanation or information about that topic

IMPORTANT - FLASHCARD FORMAT:
- Front: Topic/Concept/Term (e.g., "Photosynthesis", "Newton's Second Law", "The Renaissance")
- Back: Explanation/Information (e.g., "Process by which plants convert sunlight into energy...")
- DO NOT use question format on the front side
- DO use informative, encyclopedic style on the back side

CONTENT TO PROCESS:
${documentContent}

TASK: Generate exactly ${targetCount} high-quality information flashcards in JSON format.

IMPORTANT RULES:
- CRITICAL: Use ${languageName} language throughout - ALL text must be in ${languageName}
- Front side: Topic/concept name only (1-5 words, NO questions)
- Back side: Clear, informative explanation (2-4 sentences)
- Difficulty scale: 1 (very easy) to 5 (very difficult)
- Add relevant tags for categorization (also in ${languageName})

OUTPUT FORMAT (JSON only, no additional text):
{
  "flashcards": [
    {
      "front": "Topic or concept name in ${languageName}",
      "back": "Clear explanation or information in ${languageName}",
      "difficulty": 3,
      "tags": ["tag1", "tag2"],
      "category": "optional category"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks, no explanations.`;
}

/**
 * Generate prompt for Question Cards (Soru Kartları)
 * Based on: Bloom's Taxonomy & Varied Assessment
 */
export function generateQuestionPrompt(params: PromptParams): string {
  const { documentContent, ageGroup, language, subject, cardCount } = params;
  const languageName = LANGUAGE_NAMES[language] || language;
  const targetCount = cardCount || 15;

  return `You are an expert in educational assessment and question design using Bloom's Taxonomy.

TARGET AUDIENCE: ${AGE_GROUP_CONTEXT[ageGroup]}
OUTPUT LANGUAGE: ${languageName} (ALL content must be in ${languageName})
${subject ? `SUBJECT: ${subject}` : ''}

BLOOM'S TAXONOMY DISTRIBUTION:
- Remember/Understand (30%): Basic recall and comprehension
- Apply/Analyze (50%): Problem-solving and analysis
- Evaluate/Create (20%): Critical thinking and synthesis

QUESTION TYPES (Choose dynamically based on content):
1. multiple_choice - 5 options (A, B, C, D, E) - MUST INCLUDE OPTIONS ARRAY
2. true_false - True or False questions
3. fill_blank - Fill in the blank
4. open_ended - Short answer questions

CONTENT TO PROCESS:
${documentContent}

TASK: Generate exactly ${targetCount} diverse questions in JSON format.

CRITICAL RULES - NO EXCEPTIONS:
- MANDATORY: Use ${languageName} language throughout - ALL text must be in ${languageName}
- MANDATORY: For EVERY multiple_choice question, you MUST include an "options" array with exactly 5 options
- MANDATORY: ALL multiple_choice questions MUST have the "options" field - NO EXCEPTIONS
- Difficulty scale: 1 (very easy) to 5 (very difficult)
- All questions must have correct answers and explanations (in ${languageName})
- Distribute question types and Bloom levels evenly
- Ensure questions are appropriate for ${ageGroup} level

WARNING: If you create a multiple_choice question without an "options" array, the question will be REJECTED

OUTPUT FORMAT (JSON only, no additional text):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text in ${languageName}",
      "options": ["Option A in ${languageName}", "Option B in ${languageName}", "Option C in ${languageName}", "Option D in ${languageName}", "Option E in ${languageName}"],
      "correctAnswer": "Option B in ${languageName}",
      "explanation": "Why this is correct in ${languageName}",
      "difficulty": 3,
      "bloomLevel": "apply"
    },
    {
      "type": "true_false",
      "question": "Statement in ${languageName}",
      "correctAnswer": "true",
      "explanation": "Explanation in ${languageName}",
      "difficulty": 2,
      "bloomLevel": "remember"
    },
    {
      "type": "fill_blank",
      "question": "Fill in the blank: The capital of France is ___.",
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital city of France.",
      "difficulty": 1,
      "bloomLevel": "remember"
    }
  ]
}

REMEMBER: EVERY multiple_choice question MUST have an "options" array with exactly 5 options!

Return ONLY valid JSON, no markdown code blocks, no explanations.`;
}

/**
 * Generate prompt for Study Notes (Ders Notları)
 * Based on: Cornell Method & Structured Learning
 */
export function generateNotesPrompt(params: PromptParams): string {
  const { documentContent, ageGroup, language, subject } = params;
  const languageName = LANGUAGE_NAMES[language] || language;

  return `You are an expert note-taker and educational content organizer using Cornell Method principles.

TARGET AUDIENCE: ${AGE_GROUP_CONTEXT[ageGroup]}
OUTPUT LANGUAGE: ${languageName} (ALL content must be in ${languageName})
${subject ? `SUBJECT: ${subject}` : ''}

NOTE-TAKING PRINCIPLES:
1. Clear Hierarchical Structure - Use headings and subheadings
2. Key Concepts Highlighted - Bold important terms
3. Organized Information - Bullet points and numbered lists
4. Examples Included - Real-world applications
5. Summary Sections - Brief overviews after major sections
6. Visual Formatting - Use appropriate markdown for clarity

CONTENT TO PROCESS:
${documentContent}

TASK: Transform this content into well-structured study notes in Markdown format.

MARKDOWN STRUCTURE:
# Main Title
Brief introduction or overview

## Major Section
Key concepts and explanations

### Subsection
Detailed information
- Bullet point for lists
- **Bold** for key terms
- *Italic* for emphasis

> Important notes in blockquotes

**Key Concept**: Definition

### Examples
1. Example one
2. Example two

**Summary**: Brief recap of the section

IMPORTANT RULES:
- CRITICAL: Use ${languageName} language throughout - ALL text must be in ${languageName}
- Structure should be appropriate for ${ageGroup} level
- Include definitions for technical terms (in ${languageName})
- Add examples where helpful (in ${languageName})
- Use code blocks \`\`\` for formulas or technical content
- Keep sections organized and easy to navigate
- End major sections with a brief summary (in ${languageName})

OUTPUT: Return ONLY the formatted Markdown text in ${languageName}, no JSON, no explanations, no meta-commentary.`;
}

/**
 * Get appropriate prompt based on content type
 */
export function getPromptForContentType(
  contentType: ContentType,
  params: PromptParams
): string {
  switch (contentType) {
    case 'flashcards':
      return generateFlashcardPrompt(params);
    case 'questions':
      return generateQuestionPrompt(params);
    case 'notes':
      return generateNotesPrompt(params);
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }
}


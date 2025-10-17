// AI Prompt Templates for Educational Content Generation
import type { ContentType, AgeGroup } from "@/types/ai";

interface PromptParams {
  documentContent: string;
  ageGroup: AgeGroup;
  language: string; // Support any language
  subject?: string;
  cardCount?: number; // Number of cards to generate (default: 10-15)
}

// Language display names for better AI context
const LANGUAGE_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  ja: "Japanese",
  zh: "Chinese",
  ru: "Russian",
  it: "Italian",
  pt: "Portuguese",
  ko: "Korean",
};

// Age group descriptions with specific note-taking requirements
const AGE_GROUP_CONTEXT = {
  elementary:
    "Elementary school students (ages 6-11), requiring simple language, visual examples, and basic concepts",
  middle:
    "Middle school students (ages 12-14), capable of abstract thinking, structured learning, and organized notes",
  high: "High school students (ages 15-18), advanced comprehension, analytical skills, and exam-focused content",
  university:
    "University students (ages 18+), sophisticated understanding, critical thinking, and academic rigor",
};

// Content type specific formatting rules
const CONTENT_FORMATTING_RULES = {
  programming: {
    codeBlocks: true,
    syntaxHighlighting: true,
    examples: "practical code examples",
    focus: "implementation and best practices",
  },
  mathematics: {
    codeBlocks: false,
    formulas: true,
    examples: "step-by-step solutions",
    focus: "problem-solving methodology",
  },
  science: {
    codeBlocks: false,
    formulas: true,
    examples: "real-world applications",
    focus: "concepts and experiments",
  },
  language: {
    codeBlocks: false,
    formulas: false,
    examples: "usage examples and exercises",
    focus: "grammar and vocabulary",
  },
  history: {
    codeBlocks: false,
    formulas: false,
    examples: "historical events and timelines",
    focus: "chronological understanding",
  },
  general: {
    codeBlocks: "context-dependent",
    formulas: "context-dependent",
    examples: "relevant examples",
    focus: "comprehensive understanding",
  },
};

// Age-specific note-taking characteristics
const AGE_SPECIFIC_REQUIREMENTS = {
  elementary: {
    language: "Simple sentences, basic vocabulary, visual cues",
    structure: "Short sections, lots of examples, colorful formatting",
    examples: "Everyday examples, simple analogies",
    length: "Concise, 2-3 sentences per concept",
  },
  middle: {
    language: "Clear explanations, moderate complexity, organized structure",
    structure: "Logical flow, bullet points, clear headings",
    examples: "Relevant examples, step-by-step explanations",
    length: "Moderate detail, 3-4 sentences per concept",
  },
  high: {
    language: "Academic language, technical terms with explanations",
    structure: "Comprehensive sections, detailed analysis, exam preparation",
    examples: "Complex examples, case studies, problem sets",
    length: "Detailed explanations, 4-6 sentences per concept",
  },
  university: {
    language: "Sophisticated academic language, specialized terminology",
    structure: "Research-oriented, critical analysis, multiple perspectives",
    examples:
      "Advanced applications, theoretical frameworks, research findings",
    length: "Comprehensive coverage, 5-8 sentences per concept",
  },
};

/**
 * Generate prompt for Flashcards (Bilgi Kartları)
 * Based on: Active Recall & Spaced Repetition principles with age-specific optimization
 * Format: Topic/Concept → Explanation (NOT Question → Answer)
 */
export function generateFlashcardPrompt(params: PromptParams): string {
  const { documentContent, ageGroup, language, subject, cardCount } = params;
  const languageName = LANGUAGE_NAMES[language] || language;
  const targetCount = cardCount || 15;

  // Get age-specific requirements
  const ageRequirements = AGE_SPECIFIC_REQUIREMENTS[ageGroup];

  return `You are an expert educational content creator specializing in information flashcard design using Active Recall and Spaced Repetition principles.

TARGET AUDIENCE: ${AGE_GROUP_CONTEXT[ageGroup]}
OUTPUT LANGUAGE: ${languageName} (ALL content must be in ${languageName})
${subject ? `SUBJECT: ${subject}` : ""}

AGE-SPECIFIC REQUIREMENTS FOR ${ageGroup.toUpperCase()}:
- LANGUAGE COMPLEXITY: ${ageRequirements.language}
- EXPLANATION LENGTH: ${ageRequirements.length}
- EXAMPLE STYLE: ${ageRequirements.examples}

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

🚨 STRICT CARD COUNT REQUIREMENT - ABSOLUTE LIMIT 🚨
TASK: Generate EXACTLY ${targetCount} information flashcards - NO MORE, NO LESS
- MAXIMUM ALLOWED: ${targetCount} cards
- DO NOT EXCEED: ${targetCount} cards
- IF YOU GENERATE MORE THAN ${targetCount} CARDS, THEY WILL BE REJECTED
- COUNT YOUR OUTPUT: Must be exactly ${targetCount} items in the flashcards array

IMPORTANT RULES - AGE-APPROPRIATE:
- CRITICAL: Use ${languageName} language throughout - ALL text must be in ${languageName}
- CRITICAL: Generate EXACTLY ${targetCount} cards - this is MANDATORY
- Front side: Topic/concept name only (1-5 words, NO questions)
- Back side: Clear, informative explanation following ${ageRequirements.length}
- Difficulty scale: 1 (very easy) to 5 (very difficult)
- Language must be appropriate for ${ageGroup} level: ${ageRequirements.language}
- Add relevant tags for categorization (also in ${languageName})
- Focus on essential concepts, avoid unnecessary details

OUTPUT FORMAT (JSON only, no additional text):
{
  "flashcards": [
    {
      "front": "Topic or concept name in ${languageName}",
      "back": "Clear explanation or information in ${languageName} (${ageRequirements.length})",
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
${subject ? `SUBJECT: ${subject}` : ""}

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

🚨 STRICT QUESTION COUNT REQUIREMENT - ABSOLUTE LIMIT 🚨
TASK: Generate EXACTLY ${targetCount} questions - NO MORE, NO LESS
- MAXIMUM ALLOWED: ${targetCount} questions
- DO NOT EXCEED: ${targetCount} questions
- IF YOU GENERATE MORE THAN ${targetCount} QUESTIONS, THEY WILL BE REJECTED
- COUNT YOUR OUTPUT: Must be exactly ${targetCount} items in the questions array

CRITICAL RULES - NO EXCEPTIONS:
- MANDATORY: Generate EXACTLY ${targetCount} questions - this is MANDATORY
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
 * Based on: Cornell Method & Structured Learning with age-specific optimization
 */
export function generateNotesPrompt(params: PromptParams): string {
  const { documentContent, ageGroup, language, subject } = params;
  const languageName = LANGUAGE_NAMES[language] || language;

  // Detect content type for appropriate formatting
  const isProgramming =
    documentContent.toLowerCase().includes("function") ||
    documentContent.toLowerCase().includes("class") ||
    documentContent.toLowerCase().includes("html") ||
    documentContent.toLowerCase().includes("css") ||
    documentContent.toLowerCase().includes("javascript") ||
    documentContent.toLowerCase().includes("python") ||
    documentContent.toLowerCase().includes("java") ||
    documentContent.toLowerCase().includes("code");

  const isMathematics =
    documentContent.toLowerCase().includes("formula") ||
    documentContent.toLowerCase().includes("equation") ||
    documentContent.toLowerCase().includes("solve") ||
    documentContent.toLowerCase().includes("calculate") ||
    documentContent.toLowerCase().includes("math") ||
    documentContent.toLowerCase().includes("algebra") ||
    documentContent.toLowerCase().includes("geometry");

  const isScience =
    documentContent.toLowerCase().includes("experiment") ||
    documentContent.toLowerCase().includes("hypothesis") ||
    documentContent.toLowerCase().includes("theory") ||
    documentContent.toLowerCase().includes("physics") ||
    documentContent.toLowerCase().includes("chemistry") ||
    documentContent.toLowerCase().includes("biology");

  // Get age-specific requirements
  const ageRequirements = AGE_SPECIFIC_REQUIREMENTS[ageGroup];

  // Determine content type and formatting rules
  let contentType = "general";
  if (isProgramming) contentType = "programming";
  else if (isMathematics) contentType = "mathematics";
  else if (isScience) contentType = "science";

  const formattingRules = CONTENT_FORMATTING_RULES[contentType];

  return `You are an expert note-taker specializing in ${ageGroup} education using Cornell Method principles.

TARGET AUDIENCE: ${AGE_GROUP_CONTEXT[ageGroup]}
OUTPUT LANGUAGE: ${languageName} (ALL content must be in ${languageName})
${subject ? `SUBJECT: ${subject}` : ""}
DETECTED CONTENT TYPE: ${contentType.toUpperCase()}

AGE-SPECIFIC REQUIREMENTS FOR ${ageGroup.toUpperCase()}:
- LANGUAGE: ${ageRequirements.language}
- STRUCTURE: ${ageRequirements.structure}
- EXAMPLES: ${ageRequirements.examples}
- LENGTH: ${ageRequirements.length}

CONTENT TYPE FORMATTING RULES:
- CODE BLOCKS: ${formattingRules.codeBlocks ? "REQUIRED for programming examples" : "NOT NEEDED - use mathematical notation or regular text"}
- FORMULAS: ${formattingRules.formulas ? "REQUIRED - use LaTeX notation or clear mathematical formatting" : "Not applicable"}
- EXAMPLES: ${formattingRules.examples}
- FOCUS: ${formattingRules.focus}

CRITICAL CONTENT OPTIMIZATION RULES:
🚨 AVOID UNNECESSARY CONTENT:
- DO NOT include generic introductions like "This document covers..." or "In this lesson we will learn..."
- DO NOT add redundant explanations that repeat the same information
- DO NOT include obvious statements or filler content
- DO NOT write lengthy theoretical introductions without practical value
- DO NOT add unnecessary code comments or verbose explanations

🚨 CONTENT QUALITY REQUIREMENTS:
- Focus on ESSENTIAL concepts and practical applications
- Include only RELEVANT examples that add educational value
- Use CONCISE language appropriate for ${ageGroup} level
- Structure content for EASY learning and review
- Prioritize ACTIONABLE information over theoretical discussions

CONTENT TO PROCESS:
${documentContent}

TASK: Transform this content into well-structured, concise study notes optimized for ${ageGroup} students.

MARKDOWN STRUCTURE (${ageGroup}-appropriate):
# Main Title
${ageGroup === "elementary" ? "Simple overview (1-2 sentences)" : "Brief introduction (2-3 sentences)"}

## Key Concept
${ageRequirements.length}
- **Important Term**: Clear definition
- Practical example or application
${ageGroup === "high" || ageGroup === "university" ? "- Additional context or implications" : ""}

### Detailed Explanation
${ageRequirements.length}
${formattingRules.codeBlocks && isProgramming ? "- Include code examples when relevant\n```language\n// Practical code example\n```" : ""}
${formattingRules.formulas && (isMathematics || isScience) ? "- Use clear mathematical notation\n- Show step-by-step solutions" : ""}

**Key Takeaways**: 
${ageGroup === "elementary" ? "Simple summary (1-2 points)" : ageGroup === "middle" ? "Clear summary (2-3 points)" : "Comprehensive summary (3-4 points)"}

IMPORTANT RULES - STRICT ADHERENCE:
- CRITICAL: Use ${languageName} language throughout - ALL text must be in ${languageName}
- CRITICAL: Follow ${ageGroup} language complexity - ${ageRequirements.language}
- CRITICAL: Keep sections concise - ${ageRequirements.length}
- CRITICAL: Include only ESSENTIAL information - avoid redundancy
- CRITICAL: ${formattingRules.codeBlocks ? "Include code blocks for programming examples" : "DO NOT use code blocks unless absolutely necessary"}
- CRITICAL: ${formattingRules.formulas ? "Use clear mathematical notation for formulas" : "Focus on conceptual understanding"}
- Structure must be appropriate for ${ageGroup} learning style
- End major sections with brief, actionable summaries
- Avoid unnecessary theoretical discussions or verbose introductions

OUTPUT: Return ONLY the formatted Markdown text in ${languageName}, no JSON, no explanations, no meta-commentary.`;
}

/**
 * Get appropriate prompt based on content type
 */
export function getPromptForContentType(
  contentType: ContentType,
  params: PromptParams,
): string {
  switch (contentType) {
    case "flashcards":
      return generateFlashcardPrompt(params);
    case "questions":
      return generateQuestionPrompt(params);
    case "notes":
      return generateNotesPrompt(params);
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }
}

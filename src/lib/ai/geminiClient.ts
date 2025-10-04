// Gemini AI Client
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiGenerationConfig } from '@/types/ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Default generation config optimized for educational content
const DEFAULT_CONFIG: GeminiGenerationConfig = {
  temperature: 0.7, // Balanced creativity
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};

/**
 * Generate content using Gemini AI
 * @param prompt - The prompt to send to Gemini
 * @param config - Optional generation configuration
 * @returns Generated text response
 */
export async function generateContent(
  prompt: string,
  config?: Partial<GeminiGenerationConfig>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    const generationConfig = { ...DEFAULT_CONFIG, ...config };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(
      `AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate content with file input (for future use with images/PDFs)
 * @param prompt - The prompt
 * @param fileData - Base64 encoded file data
 * @param mimeType - File MIME type
 * @returns Generated text response
 */
export async function generateContentWithFile(
  prompt: string,
  fileData: string,
  mimeType: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: fileData,
              },
            },
          ],
        },
      ],
      generationConfig: DEFAULT_CONFIG,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error with file:', error);
    throw new Error(
      `AI content generation with file failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate if Gemini API is configured
 * @returns true if API key is present
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}


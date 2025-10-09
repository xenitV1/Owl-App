/**
 * Spaced Repetition Algorithm Implementation
 * Based on SM-2 (SuperMemo 2) algorithm
 * Extracted from FlashcardSystem.tsx for better testability
 */

import { Flashcard } from "@/types/flashcard";

/**
 * Calculate the next review date for a flashcard based on user's response quality
 * @param card - The flashcard to update
 * @param quality - Quality of recall (1-5, where 3+ is correct)
 * @returns Updated flashcard with new scheduling parameters
 */
export function calculateNextReview(
  card: Flashcard,
  quality: number,
): Flashcard {
  const now = new Date();

  // Failed card (quality < 3) - reset to minimum interval
  if (quality < 3) {
    return {
      ...card,
      interval: 1,
      repetitions: 0,
      nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      easeFactor: Math.max(1.3, card.easeFactor - 0.2),
      lastReviewed: now,
    };
  }

  // Calculate new interval based on SM-2 algorithm
  let newInterval = card.interval;
  let newEaseFactor = card.easeFactor;

  if (card.repetitions === 0) {
    newInterval = 1; // First successful review: 1 day
  } else if (card.repetitions === 1) {
    newInterval = 6; // Second successful review: 6 days
  } else {
    // Subsequent reviews: multiply by ease factor
    newInterval = Math.round(card.interval * card.easeFactor);
  }

  // Update ease factor based on quality of recall
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  return {
    ...card,
    interval: newInterval,
    repetitions: card.repetitions + 1,
    nextReview: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
    easeFactor: Math.max(1.3, newEaseFactor), // Minimum ease factor is 1.3
    lastReviewed: now,
  };
}

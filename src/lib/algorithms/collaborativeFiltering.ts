/**
 * Collaborative Filtering (User-User Similarity)
 * Finds similar users and recommends content they liked
 */

import {
  calculateCosineSimilarity,
  type UserInterestVector,
} from "./userInterestVector";

export interface User {
  id: string;
  totalInteractions: number;
  createdAt: Date;
}

export interface SimilarUser {
  userId: string;
  similarity: number;
}

/**
 * Get account age in days
 */
export function getAccountAgeDays(userId: string, createdAt: Date): number {
  return (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Calculate similarity between two users based on their interest vectors
 */
export function calculateUserSimilarity(
  targetVector: UserInterestVector,
  candidateVector: UserInterestVector,
): number {
  // Combine subject and grade similarities
  const subjectSimilarity = calculateCosineSimilarity(
    targetVector.subjects,
    candidateVector.subjects,
  );

  const gradeSimilarity = calculateCosineSimilarity(
    targetVector.grades,
    candidateVector.grades,
  );

  // Weighted combination
  return subjectSimilarity * 0.7 + gradeSimilarity * 0.3;
}

/**
 * Find similar users
 */
export async function findSimilarUsers(
  userId: string,
  targetVector: UserInterestVector,
  allUsers: User[],
  getUserVector: (userId: string) => Promise<UserInterestVector | null>,
  maxSimilarUsers: number = 50,
  minAccountAge: number = 30,
  minInteractionCount: number = 50,
): Promise<SimilarUser[]> {
  // Sadece "olgun" kullanıcılarla eşleştir (Cold start cascade prevention)
  const matureUsers = allUsers.filter(
    (u) =>
      u.id !== userId &&
      getAccountAgeDays(u.id, u.createdAt) >= minAccountAge &&
      u.totalInteractions >= minInteractionCount,
  );

  const similarities = await Promise.all(
    matureUsers.map(async (user) => {
      const candidateVector = await getUserVector(user.id);

      // Skip if vector not found
      if (!candidateVector) {
        return null;
      }

      return {
        userId: user.id,
        similarity: calculateUserSimilarity(targetVector, candidateVector),
      };
    }),
  );

  // Filter out nulls
  const validSimilarities = similarities.filter(
    (s): s is SimilarUser => s !== null,
  );

  return validSimilarities
    .filter((s) => s.similarity > 0.15) // Threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSimilarUsers);
}

/**
 * Predict content score based on similar users' interactions
 */
export async function predictContentScore(
  userId: string,
  contentId: string,
  similarUsers: SimilarUser[],
  getUserInteraction: (
    userId: string,
    contentId: string,
  ) => Promise<number | null>,
): Promise<number> {
  if (similarUsers.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const similar of similarUsers) {
    const interaction = await getUserInteraction(similar.userId, contentId);

    if (interaction !== null) {
      weightedSum += interaction * similar.similarity;
      totalWeight += similar.similarity;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

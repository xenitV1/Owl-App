/**
 * Hybrid Scoring System
 * Combines all algorithms into a unified scoring system
 */

import { calculateSeasonalTimeDecayScore } from "./timeDecayScoring";
import {
  calculateTimeAwareWilsonScore,
  type LikeHistoryEntry,
} from "./wilsonScore";
import {
  calculateCosineSimilarity,
  type UserInterestVector,
} from "./userInterestVector";
import { calculateGradeLevelScore } from "./gradeLevelMatching";
import { applyQualityFilters, type Post } from "./qualityFilters";
import {
  predictContentScore,
  type SimilarUser,
} from "./collaborativeFiltering";
import { calculateAdvancedCommunityScore } from "./communityInfluence";
import { getColdStartStrategy, type ScoringWeights } from "./coldStartHandler";
import {
  calculateCountryScore,
  type CountryPreferences,
  type ContentCountryInfo,
} from "./countryAwareScoring";
import type { User } from "@prisma/client";

export interface ContentScore {
  finalScore: number;
  breakdown: {
    timeDecay: number;
    wilsonScore: number;
    userInterest: number;
    collaborative: number;
    communityInfluence: number;
    gradeMatch: number;
    qualityFilter: number;
    countryMatch: number;
  };
}

export interface Content {
  id: string;
  title?: string;
  content?: string;
  subject?: string;
  grade?: string;
  authorId: string;
  communityId: string | null;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  reportCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  authorCountry?: string | null;
  language?: string | null;
}

export interface ScoringContext {
  userProfile: User;
  userVector: UserInterestVector;
  similarUsers: SimilarUser[];
}

/**
 * Normalize score to 0-1 range
 */
function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Extract content features for similarity calculation
 */
export function extractContentFeatures(
  content: Content,
): Record<string, number> {
  const features: Record<string, number> = {};

  if (content.subject) {
    features[content.subject] = 1.0;
  }

  if (content.grade) {
    features[content.grade] = 1.0;
  }

  return features;
}

/**
 * Calculate hybrid score combining all algorithms
 */
export async function calculateHybridScore(
  content: Content,
  userId: string,
  context: ScoringContext,
  getLikesHistory: (contentId: string) => Promise<LikeHistoryEntry[]>,
  getUserInteraction: (
    userId: string,
    contentId: string,
  ) => Promise<number | null>,
): Promise<ContentScore> {
  // 1. Time Decay (seasonal adjusted)
  const timeDecay = calculateSeasonalTimeDecayScore(
    content.likesCount,
    content.commentsCount,
    content.sharesCount,
    content.createdAt,
  );

  // 2. Wilson Score (time-aware)
  const likesHistory = await getLikesHistory(content.id);
  const wilsonScore = calculateTimeAwareWilsonScore(
    content.upvotes,
    content.downvotes,
    content.createdAt,
    likesHistory,
  );

  // 3. User Interest
  const contentFeatures = extractContentFeatures(content);
  const userInterest = calculateCosineSimilarity(
    context.userVector.subjects,
    contentFeatures,
  );

  // 4. Collaborative Filtering
  const collaborative = await predictContentScore(
    userId,
    content.id,
    context.similarUsers,
    getUserInteraction,
  );

  // 5. Community Influence (DYNAMIC - placeholder for now)
  const communityInfluence = await calculateAdvancedCommunityScore(
    content.id,
    content.authorId,
    content.communityId,
  );

  // 6. Grade Level Match
  const userGrade = context.userProfile.grade || "General";
  const contentGrade = content.grade || "General";
  const gradeMatch = calculateGradeLevelScore(userGrade, contentGrade);

  // 7. Quality Filter (pass/fail)
  const passesQualityFilter =
    (
      await applyQualityFilters(
        [content as Post],
        getLikesHistory,
        async () => context.userProfile.createdAt,
      )
    ).length > 0;
  const qualityFilter = passesQualityFilter ? 1.0 : 0.0;

  // 8. Country Match Score
  const countryPrefs: CountryPreferences = {
    userCountry: context.userProfile.country || null,
    userLanguage: (context.userProfile as any).language || null,
    preferLocalContent: (context.userProfile as any).preferLocalContent ?? true,
  };

  const contentCountryInfo: ContentCountryInfo = {
    authorCountry: content.authorCountry || null,
    language: content.language || null,
  };

  const countryMatch = calculateCountryScore(countryPrefs, contentCountryInfo);

  // Normalize scores
  const normalizedScores = {
    timeDecay: normalizeScore(timeDecay, 0, 100),
    wilsonScore: wilsonScore,
    userInterest: userInterest,
    collaborative: normalizeScore(collaborative, 0, 5),
    communityInfluence: communityInfluence,
    gradeMatch: gradeMatch,
    qualityFilter: qualityFilter,
    countryMatch: countryMatch,
  };

  // Adaptive weights (cold start stratejisi)
  const weights = getColdStartStrategy(context.userProfile);

  // Final score hesaplama (country weight = 20% when user prefers local)
  const countryWeight = countryPrefs.preferLocalContent ? 0.2 : 0.0;
  const baseWeightSum = 1.0 - countryWeight;

  const finalScore =
    (weights.timeDecay * normalizedScores.timeDecay +
      weights.wilsonScore * normalizedScores.wilsonScore +
      weights.userInterest * normalizedScores.userInterest +
      weights.collaborative * normalizedScores.collaborative +
      weights.communityInfluence * normalizedScores.communityInfluence) *
      baseWeightSum +
    countryWeight * normalizedScores.countryMatch;

  // Grade match ve quality filter çarpan olarak uygulanır
  const adjustedScore =
    finalScore * normalizedScores.gradeMatch * normalizedScores.qualityFilter;

  return {
    finalScore: adjustedScore,
    breakdown: normalizedScores,
  };
}

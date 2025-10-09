/**
 * Quality Filters & Spam Detection
 * Ensures only high-quality content reaches users
 */

import {
  calculateTimeAwareWilsonScore,
  type LikeHistoryEntry,
} from "./wilsonScore";

export interface QualityThresholds {
  minLikes: number;
  minWilsonScore: number;
  minAccountAgeDays: number;
  maxReportCount: number;
  minContentLength: number;
}

export const QUALITY_THRESHOLDS: Record<string, QualityThresholds> = {
  default: {
    minLikes: 2,
    minWilsonScore: 0.3,
    minAccountAgeDays: 1,
    maxReportCount: 3,
    minContentLength: 50,
  },
  trending: {
    minLikes: 10,
    minWilsonScore: 0.6,
    minAccountAgeDays: 7,
    maxReportCount: 1,
    minContentLength: 100,
  },
};

export interface Post {
  id: string;
  content: string;
  title?: string;
  authorId: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  reportCount: number;
}

/**
 * Detect spam patterns in content
 */
export function detectSpamPatterns(content: string): boolean {
  const spamPatterns = [
    /\b(click here|buy now|limited offer|act now)\b/gi,
    /(.)\1{10,}/gi, // Repeated characters (more than 10)
    /[🔥💰💵💎]{5,}/gi, // Excessive emojis
    /https?:\/\/[^\s]{100,}/gi, // Suspiciously long URLs
  ];

  return spamPatterns.some((pattern) => pattern.test(content));
}

/**
 * Get account age in days
 */
export function getAccountAgeDays(createdAt: Date): number {
  return (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Apply quality filters to posts
 */
export async function applyQualityFilters(
  posts: Post[],
  getLikesHistory: (postId: string) => Promise<LikeHistoryEntry[]>,
  getUserCreatedAt: (userId: string) => Promise<Date>,
  filterLevel: "default" | "trending" = "default",
): Promise<Post[]> {
  const thresholds = QUALITY_THRESHOLDS[filterLevel];

  const filteredPosts = await Promise.all(
    posts.map(async (post) => {
      // Basic checks
      if (post.upvotes < thresholds.minLikes) return null;

      const contentLength =
        (post.content?.length || 0) + (post.title?.length || 0);
      if (contentLength < thresholds.minContentLength) return null;

      // Wilson score with time awareness
      const likesHistory = await getLikesHistory(post.id);
      const wilsonScore = calculateTimeAwareWilsonScore(
        post.upvotes,
        post.downvotes,
        post.createdAt,
        likesHistory,
      );
      if (wilsonScore < thresholds.minWilsonScore) return null;

      // Author trust
      const authorCreatedAt = await getUserCreatedAt(post.authorId);
      const authorAge = getAccountAgeDays(authorCreatedAt);
      if (authorAge < thresholds.minAccountAgeDays) return null;

      // Report count
      if (post.reportCount > thresholds.maxReportCount) return null;

      // Spam patterns
      if (detectSpamPatterns(post.content || "")) return null;

      return post;
    }),
  );

  return filteredPosts.filter((p) => p !== null) as Post[];
}

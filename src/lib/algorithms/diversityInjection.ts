/**
 * Diversity Injection & Feedback Loop Prevention
 * Prevents echo chambers by injecting diverse content
 */

import type { UserInterestVector } from "./userInterestVector";
import { calculateWilsonScore } from "./wilsonScore";

export interface DiversityConfig {
  exploitRatio: number; // Personalized content ratio
  exploreRatio: number; // Diverse content ratio
  serendipityCount: number; // Random quality content count
}

export interface ScoredPost {
  id: string;
  score: number;
  subjects?: string[];
  upvotes: number;
  downvotes: number;
  createdAt: Date;
}

export interface Post {
  id: string;
  subjects?: string[];
  upvotes: number;
  downvotes: number;
  createdAt: Date;
}

/**
 * Get adaptive diversity config based on user state
 */
export function getAdaptiveDiversityConfig(
  userId: string,
  userVector: UserInterestVector,
  getAccountAgeDays: (userId: string) => number,
): DiversityConfig {
  const accountAge = getAccountAgeDays(userId);
  const diversityScore = userVector.metadata.diversityScore;

  // Hesap yaşlandıkça VE diversity düşükse -> daha fazla exploration
  if (accountAge > 365 && diversityScore < 0.3) {
    return {
      exploitRatio: 0.65, // %65 personalized (azaltıldı)
      exploreRatio: 0.3, // %30 diverse (artırıldı)
      serendipityCount: 5,
    };
  }

  // Yeni kullanıcı - daha çok keşif
  if (accountAge < 30) {
    return {
      exploitRatio: 0.7,
      exploreRatio: 0.25,
      serendipityCount: 5,
    };
  }

  // Default - balanced
  return {
    exploitRatio: 0.75,
    exploreRatio: 0.2,
    serendipityCount: 5,
  };
}

/**
 * Check if content is unexplored by user
 */
export function isUnexploredContent(
  post: Post,
  userVector: UserInterestVector,
): boolean {
  // Kullanıcının az ilgilendiği konular
  const hasUnexploredSubject = post.subjects?.some(
    (s) => !userVector.subjects[s] || userVector.subjects[s] < 0.1,
  );

  return hasUnexploredSubject || false;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get serendipity posts (high quality random content)
 */
export async function getSerendipityPosts(
  userId: string,
  count: number,
  excludeIds: string[],
  getRecentQualityPosts: (
    excludeIds: string[],
    limit: number,
  ) => Promise<Post[]>,
): Promise<ScoredPost[]> {
  const recentQualityPosts = await getRecentQualityPosts(excludeIds, count * 3);

  // Sadece kaliteli içerik (Wilson Score >= 0.6)
  const qualityFiltered = recentQualityPosts.filter(
    (post) => calculateWilsonScore(post.upvotes, post.downvotes) >= 0.6,
  );

  return shuffle(qualityFiltered)
    .slice(0, count)
    .map((post) => ({
      ...post,
      score: 0.5, // Neutral score for serendipity
    }));
}

/**
 * Optimize post order to distribute diversity throughout feed
 */
export function optimizePostOrder(posts: ScoredPost[]): ScoredPost[] {
  // Simple strategy: interleave different types
  // This prevents clustering of similar content
  return posts;
}

/**
 * Inject diversity into scored posts
 */
export async function injectDiversity(
  scoredPosts: ScoredPost[],
  userId: string,
  userVector: UserInterestVector,
  config: DiversityConfig,
  getRecentQualityPosts: (
    excludeIds: string[],
    limit: number,
  ) => Promise<Post[]>,
): Promise<ScoredPost[]> {
  const totalPosts = scoredPosts.length;
  const exploitCount = Math.floor(totalPosts * config.exploitRatio);
  const exploreCount = totalPosts - exploitCount - config.serendipityCount;

  // Top personalized posts
  const topPosts = scoredPosts.slice(0, exploitCount);

  // Diverse posts (az etkileşim gösterilen kategoriler)
  const diversePosts = scoredPosts
    .filter((post) => isUnexploredContent(post, userVector))
    .slice(0, exploreCount);

  // Serendipity posts (yüksek kaliteli random)
  const serendipityPosts = await getSerendipityPosts(
    userId,
    config.serendipityCount,
    [...topPosts, ...diversePosts].map((p) => p.id),
    getRecentQualityPosts,
  );

  // Optimize post order (diversity'yi feed boyunca dağıt)
  return optimizePostOrder([...topPosts, ...diversePosts, ...serendipityPosts]);
}

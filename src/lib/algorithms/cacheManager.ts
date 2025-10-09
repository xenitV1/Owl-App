/**
 * Algorithm Cache Manager
 * Optimized caching strategy for algorithm components
 */

export const CACHE_KEYS = {
  userInterestVector: (userId: string) => `uiv:${userId}`,
  similarUsers: (userId: string) => `su:${userId}`,
  contentScore: (contentId: string, userId: string) =>
    `cs:${contentId}:${userId}`,
  userFeed: (userId: string, page: number) => `feed:${userId}:${page}`,
};

export type ActivityLevel = "very_active" | "active" | "moderate" | "inactive";

/**
 * Get user activity level based on recent interactions
 */
export function getUserActivityLevel(
  totalInteractions: number,
  accountAgeDays: number,
): ActivityLevel {
  const avgInteractionsPerDay = totalInteractions / Math.max(accountAgeDays, 1);

  if (avgInteractionsPerDay > 20) return "very_active";
  if (avgInteractionsPerDay > 5) return "active";
  if (avgInteractionsPerDay > 1) return "moderate";
  return "inactive";
}

/**
 * Get adaptive TTL based on user activity
 */
export function getAdaptiveTTL(activity: ActivityLevel): number {
  switch (activity) {
    case "very_active":
      return 3 * 60; // 3 dakika
    case "active":
      return 15 * 60; // 15 dakika
    case "moderate":
      return 60 * 60; // 1 saat
    case "inactive":
      return 4 * 60 * 60; // 4 saat
    default:
      return 2 * 60 * 60;
  }
}

export const CACHE_TTL = {
  userInterestVector: (activity: ActivityLevel) => getAdaptiveTTL(activity),
  similarUsers: 7 * 24 * 60 * 60, // 7 gün
  contentScore: 60 * 60, // 1 saat
  userFeed: 5 * 60, // 5 dakika
};

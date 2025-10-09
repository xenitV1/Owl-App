/**
 * Smart Cache Manager
 * Handles cache invalidation with stampede protection
 */

/**
 * Sleep utility for staggered operations
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Content {
  id: string;
  subject?: string;
  grade?: string;
}

/**
 * Find users interested in content
 * This is a simplified version - real implementation would query database
 */
export async function findInterestedUsers(
  content: Content,
  getUsersByInterest: (subject?: string, grade?: string) => Promise<string[]>,
): Promise<string[]> {
  return await getUsersByInterest(content.subject, content.grade);
}

export class SmartCacheManager {
  private redis: any; // Redis client would be injected

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  /**
   * Handle new content with staggered cache invalidation
   */
  async onNewContent(
    content: Content,
    getUsersByInterest: (subject?: string, grade?: string) => Promise<string[]>,
  ): Promise<void> {
    // Tüm ilgili kullanıcıları bul
    const interestedUsers = await findInterestedUsers(
      content,
      getUsersByInterest,
    );

    // SORUN: Binlerce kullanıcının cache'i aynı anda invalidate olursa stampede
    // ÇÖZÜM: Staggered invalidation

    const batchSize = 100;
    const delayMs = 500;

    for (let i = 0; i < interestedUsers.length; i += batchSize) {
      const batch = interestedUsers.slice(i, i + batchSize);

      await Promise.all(
        batch.map((userId) => this.invalidateUserFeedGracefully(userId)),
      );

      // Batch'ler arası delay
      if (i + batchSize < interestedUsers.length) {
        await sleep(delayMs);
      }
    }
  }

  /**
   * Gracefully invalidate user feed (soft delete with TTL)
   */
  private async invalidateUserFeedGracefully(userId: string): Promise<void> {
    const key = `feed:${userId}`;

    if (!this.redis) return;

    try {
      // Soft delete: Set short TTL instead of immediate delete
      const cached = await this.redis.get(key);
      if (cached) {
        await this.redis.expire(key, 60); // 1 dakika içinde expire olacak
      }
    } catch (error) {
      console.error(`Failed to invalidate cache for ${userId}:`, error);
    }
  }
}

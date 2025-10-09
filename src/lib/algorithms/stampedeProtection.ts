/**
 * Cache Stampede Protection
 * Prevents thundering herd problem when cache expires
 */

import { algorithmMonitor } from "@/lib/monitoring/algorithmHealthMonitor";

export class StampedeProtection {
  private computeLocks = new Map<string, Promise<any>>();
  private requestCounters = new Map<string, number>();

  /**
   * Get or compute value with stampede protection
   * If multiple requests ask for same key, only first one computes, others wait
   */
  async getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T> {
    // 1. Check if already computing
    if (this.computeLocks.has(key)) {
      const requestCount = (this.requestCounters.get(key) || 0) + 1;
      this.requestCounters.set(key, requestCount);

      if (requestCount > 10) {
        console.warn(
          `⚠️  STAMPEDE DETECTED for ${key}: ${requestCount} concurrent requests`,
        );
        algorithmMonitor.recordStampede(); // Track stampede incident
      }

      console.log(
        `⏳ Waiting for existing computation: ${key} (${requestCount} waiters)`,
      );
      return this.computeLocks.get(key) as Promise<T>;
    }

    // 2. Start new computation
    this.requestCounters.set(key, 1);

    const promise = compute()
      .then((result) => {
        // Cleanup on success
        this.computeLocks.delete(key);
        this.requestCounters.delete(key);
        return result;
      })
      .catch((error) => {
        // Cleanup on error
        this.computeLocks.delete(key);
        this.requestCounters.delete(key);
        throw error;
      });

    this.computeLocks.set(key, promise);
    return promise;
  }

  /**
   * Clear all locks (useful for testing)
   */
  clear(): void {
    this.computeLocks.clear();
    this.requestCounters.clear();
  }

  /**
   * Get current stampede statistics
   */
  getStats(): { activeComputes: number; maxWaiters: number } {
    const activeComputes = this.computeLocks.size;
    const maxWaiters = Math.max(
      0,
      ...Array.from(this.requestCounters.values()),
    );

    return { activeComputes, maxWaiters };
  }
}

// Global singleton instance
export const stampedeProtection = new StampedeProtection();

/**
 * Smart Cache Manager
 * Handles cache invalidation with staggered approach to prevent stampedes
 */
export class SmartCacheManager {
  /**
   * Invalidate user feed cache gracefully
   * Instead of immediate delete, set short TTL
   */
  async invalidateUserFeedGracefully(userId: string): Promise<void> {
    // In a Redis-based system, this would set a short TTL (60s)
    // For now, we just log the action
    console.log(`🔄 Feed invalidated gracefully for user: ${userId}`);

    // TODO: When Redis is integrated:
    // await redis.expire(`feed:${userId}`, 60);
  }

  /**
   * Staggered cache invalidation for multiple users
   * Prevents stampede when many users need cache invalidation at once
   */
  async invalidateMultipleUsersStaggered(
    userIds: string[],
    batchSize: number = 100,
    delayMs: number = 500,
  ): Promise<void> {
    console.log(`🔄 Staggered invalidation for ${userIds.length} users...`);

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Invalidate batch
      await Promise.all(
        batch.map((userId) => this.invalidateUserFeedGracefully(userId)),
      );

      // Delay before next batch (prevent stampede)
      if (i + batchSize < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(`✅ Staggered invalidation complete`);
  }

  /**
   * Handle new content publication
   * Invalidates feed for interested users with stampede protection
   */
  async onNewContent(content: {
    subject?: string;
    grade?: string;
  }): Promise<void> {
    // Find users interested in this content
    // (simplified - in production this would use more sophisticated matching)
    const interestedUsers = await this.findInterestedUsers(content);

    // Staggered invalidation to prevent stampede
    await this.invalidateMultipleUsersStaggered(interestedUsers);
  }

  /**
   * Find users interested in content (simplified)
   */
  private async findInterestedUsers(content: {
    subject?: string;
    grade?: string;
  }): Promise<string[]> {
    // TODO: Implement sophisticated user matching
    // For now, just return empty array
    return [];
  }
}

// Global cache manager instance
export const smartCacheManager = new SmartCacheManager();

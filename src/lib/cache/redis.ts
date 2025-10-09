/**
 * Redis Cache Client
 * Supports both Upstash (Vercel) and standard Redis
 */

import { Redis } from "@upstash/redis";

// Upstash Redis client (works in Vercel Edge/Serverless)
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn("⚠️  Redis not configured. Using PostgreSQL cache fallback.");
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("✅ Redis client initialized (Upstash)");
  }

  return redis;
}

/**
 * Redis Cache Helper
 * Automatically falls back to PostgreSQL if Redis unavailable
 */
export class RedisCache {
  private client: Redis | null;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Set value with TTL (seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) return; // Fallback to PostgreSQL

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error("Redis SET error:", error);
      // Silent fail - PostgreSQL will handle caching
    }
  }

  /**
   * Get value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null; // Fallback to PostgreSQL

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value as string) as T;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Redis DEL error:", error);
    }
  }

  /**
   * Set expiration (seconds)
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error("Redis EXPIRE error:", error);
    }
  }

  /**
   * Delete multiple keys by pattern (use carefully!)
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;

    try {
      // Upstash doesn't support SCAN, so we track keys manually
      // For now, just log the pattern
      console.log(`🗑️  Would delete Redis pattern: ${pattern}`);
      // TODO: Implement key tracking if needed
    } catch (error) {
      console.error("Redis DELETE PATTERN error:", error);
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.client) return 0;

    try {
      return (await this.client.incr(key)) as number;
    } catch (error) {
      console.error("Redis INCR error:", error);
      return 0;
    }
  }
}

// Global cache instance
export const cache = new RedisCache();

/**
 * Cache Keys (centralized)
 */
export const CACHE_KEYS = {
  userVector: (userId: string) => `uiv:${userId}`,
  similarUsers: (userId: string) => `su:${userId}`,
  userFeed: (userId: string, page: number) => `feed:${userId}:${page}`,
  contentScore: (contentId: string, userId: string) =>
    `cs:${contentId}:${userId}`,
  postLikes: (postId: string) => `post:likes:${postId}`,
  postComments: (postId: string) => `post:comments:${postId}`,
};

/**
 * Cache TTLs (seconds)
 */
export const CACHE_TTL = {
  userVector: 4 * 60 * 60, // 4 hours
  similarUsers: 7 * 24 * 60 * 60, // 7 days
  userFeed: 5 * 60, // 5 minutes
  contentScore: 60 * 60, // 1 hour
  postCounts: 60, // 1 minute
};

/**
 * Fallback Strategies
 * Multi-tier system to ensure feed always works
 */

import type { Post } from "@prisma/client";

export interface FeedResult {
  posts: Post[];
  algorithm: "hybrid" | "simplified" | "chronological";
}

/**
 * Circuit Breaker Pattern
 */
export class AlgorithmCircuitBreaker {
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  async execute<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallback();
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

/**
 * Get feed with multi-tier fallback
 */
export async function getFeedWithFallback(
  userId: string,
  page: number,
  limit: number,
  getHybridFeed: (
    userId: string,
    page: number,
    limit: number,
  ) => Promise<Post[]>,
  getSimplifiedFeed: (
    userId: string,
    page: number,
    limit: number,
  ) => Promise<Post[]>,
  getChronologicalFeed: (
    userId: string,
    page: number,
    limit: number,
  ) => Promise<Post[]>,
): Promise<FeedResult> {
  const circuitBreaker = new AlgorithmCircuitBreaker();

  // Tier 1: Full hybrid (tüm algoritmalar)
  try {
    const posts = await circuitBreaker.execute(
      async () => await getHybridFeed(userId, page, limit),
      async () => await getSimplifiedFeed(userId, page, limit),
    );
    return { posts, algorithm: "hybrid" };
  } catch (error) {
    console.error("Tier 1 (hybrid) failed:", error);
  }

  // Tier 2: Simplified (sadece Time Decay + Wilson)
  try {
    const posts = await getSimplifiedFeed(userId, page, limit);
    return { posts, algorithm: "simplified" };
  } catch (error) {
    console.error("Tier 2 (simplified) failed:", error);
  }

  // Tier 3: Chronological (guaranteed to work)
  const posts = await getChronologicalFeed(userId, page, limit);
  return { posts, algorithm: "chronological" };
}

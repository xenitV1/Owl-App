/**
 * Algorithm Helper Functions
 * Shared utilities across algorithm components
 */

import { prisma } from "@/lib/db";
import type { UserInterestVector, Interaction } from "./userInterestVector";
import type { LikeHistoryEntry } from "./wilsonScore";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache/redis";

/**
 * Get user interactions from database
 */
export async function getInteractions(
  userId: string,
  startDays: number,
  endDays?: number,
): Promise<Interaction[]> {
  const startDate = new Date(Date.now() - startDays * 24 * 60 * 60 * 1000);
  const endDate = endDays
    ? new Date(Date.now() - endDays * 24 * 60 * 60 * 1000)
    : new Date(0);

  const interactions = await prisma.interaction.findMany({
    where: {
      userId,
      createdAt: {
        gte: endDate,
        lte: startDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return interactions.map((i) => ({
    id: i.id,
    type: i.type,
    subject: i.subject || "",
    grade: i.grade || "",
    createdAt: i.createdAt,
  }));
}

/**
 * Get likes history for a post
 */
export async function getLikesHistory(
  postId: string,
): Promise<LikeHistoryEntry[]> {
  const likes = await prisma.like.findMany({
    where: { postId },
    select: {
      userId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return likes.map((like) => ({
    userId: like.userId,
    timestamp: like.createdAt,
  }));
}

/**
 * Get user interest vector from cache or calculate
 */
export async function getUserInterestVector(
  userId: string,
): Promise<UserInterestVector> {
  // Try to get from database
  const cached = await prisma.userInterestVector.findUnique({
    where: { userId },
  });

  if (cached) {
    return {
      subjects: JSON.parse(cached.subjects),
      grades: JSON.parse(cached.grades),
      metadata: {
        lastUpdated: cached.lastUpdated,
        driftScore: cached.driftScore,
        diversityScore: cached.diversityScore,
      },
    };
  }

  // Return default for new users
  return {
    subjects: {},
    grades: {},
    metadata: {
      lastUpdated: new Date(),
      driftScore: 0,
      diversityScore: 0,
    },
  };
}

/**
 * Cache user interest vector (PostgreSQL + Redis)
 */
export async function cacheUserInterestVector(
  userId: string,
  vector: UserInterestVector,
): Promise<void> {
  // Write to PostgreSQL (persistent)
  await prisma.userInterestVector.upsert({
    where: { userId },
    create: {
      userId,
      subjects: JSON.stringify(vector.subjects),
      grades: JSON.stringify(vector.grades),
      driftScore: vector.metadata.driftScore,
      diversityScore: vector.metadata.diversityScore,
      lastUpdated: vector.metadata.lastUpdated,
    },
    update: {
      subjects: JSON.stringify(vector.subjects),
      grades: JSON.stringify(vector.grades),
      driftScore: vector.metadata.driftScore,
      diversityScore: vector.metadata.diversityScore,
      lastUpdated: vector.metadata.lastUpdated,
    },
  });

  // 🚀 Also write to Redis for fast access (if available)
  if (cache.isAvailable()) {
    await cache.set(
      CACHE_KEYS.userVector(userId),
      vector,
      CACHE_TTL.userVector,
    );
  }
}

/**
 * Get user interaction with content (for collaborative filtering)
 */
export async function getUserInteraction(
  userId: string,
  contentId: string,
): Promise<number | null> {
  const interaction = await prisma.interaction.findFirst({
    where: {
      userId,
      contentId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!interaction) return null;

  return interaction.weight;
}

/**
 * Invalidate user feed cache (Redis + log)
 */
export async function invalidateUserFeed(userId: string): Promise<void> {
  // 🚀 Invalidate Redis cache (if available)
  if (cache.isAvailable()) {
    // Invalidate all pages of user's feed
    for (let page = 1; page <= 5; page++) {
      await cache.del(CACHE_KEYS.userFeed(userId, page));
    }
  }

  console.log(`🔄 Feed invalidated for user: ${userId}`);
}

/**
 * Record interaction
 */
export async function recordInteraction(
  userId: string,
  contentId: string,
  contentType: string,
  type: string,
  subject?: string,
  grade?: string,
  weight?: number,
): Promise<void> {
  await prisma.interaction.create({
    data: {
      userId,
      contentId,
      contentType,
      type,
      subject,
      grade,
      weight: weight || 1,
    },
  });

  // Update user total interactions
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalInteractions: {
        increment: 1,
      },
    },
  });
}

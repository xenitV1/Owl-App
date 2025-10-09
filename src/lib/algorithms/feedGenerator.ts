/**
 * Feed Generator
 * Main feed generation logic combining all algorithms
 */

import { prisma } from "@/lib/db";
import type { Post, User } from "@prisma/client";
import { calculateHybridScore } from "./hybridScoring";
import { getLikesHistory, getUserInteraction } from "./helpers";
import { findSimilarUsers } from "./collaborativeFiltering";
import {
  getAdaptiveDiversityConfig,
  injectDiversity,
} from "./diversityInjection";
import { algorithmMonitor } from "@/lib/monitoring/algorithmHealthMonitor";
import { getStableUserVector } from "./stableVectorManager";
import { getDefaultInterestsByGrade } from "./coldStartHandler";
import type { ScoredPost } from "./diversityInjection";
import { stampedeProtection } from "./stampedeProtection";
import {
  getCountryAwareWhereClause,
  balanceCountryDistribution,
  type CountryPreferences,
} from "./countryAwareScoring";

export interface FeedOptions {
  page?: number;
  limit?: number;
  filterByGrade?: boolean;
  filterBySubject?: string;
}

/**
 * Generate hybrid feed for user
 */
export async function generateHybridFeed(
  userId: string,
  options: FeedOptions = {},
): Promise<Post[]> {
  const {
    page = 1,
    limit = 20,
    filterByGrade = true,
    filterBySubject,
  } = options;

  // ✅ STAMPEDE PROTECTION: Use cache key to prevent duplicate computations
  const cacheKey = `feed:${userId}:${page}:${limit}:${filterByGrade}:${filterBySubject || "all"}`;

  return await stampedeProtection.getOrCompute(cacheKey, async () => {
    const startTime = Date.now();

    try {
      const skip = (page - 1) * limit;

      // Get user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get stable user interest vector (4 saatlik cache)
      let userVector = await getStableUserVector(userId);

      // Eğer vector yoksa (yeni kullanıcı), grade-based default kullan
      if (!userVector && user.grade) {
        userVector = getDefaultInterestsByGrade(user.grade);
      }

      // Hala vector yoksa, boş vector kullan
      if (!userVector) {
        userVector = {
          subjects: {},
          grades: {},
          metadata: {
            lastUpdated: new Date(),
            driftScore: 0,
            diversityScore: 0,
          },
        };
      }

      // Get similar users for collaborative filtering
      const allUsers = await prisma.user.findMany({
        where: { id: { not: userId } },
        select: {
          id: true,
          totalInteractions: true,
          createdAt: true,
        },
      });

      const similarUsers = await findSimilarUsers(
        userId,
        userVector,
        allUsers,
        getStableUserVector,
      );

      // Country-aware preferences
      const countryPrefs: CountryPreferences = {
        userCountry: user.country || null,
        userLanguage: (user as any).language || null,
        preferLocalContent: (user as any).preferLocalContent ?? true,
      };

      // Get country-aware WHERE clause
      const countryClause = getCountryAwareWhereClause(countryPrefs);

      // Get candidate posts with country-aware filtering
      const whereClause: any = {
        isPublic: true,
        authorId: { not: userId },
      };

      // Combine country filtering with existing filters
      if (Object.keys(countryClause).length > 0) {
        whereClause.AND = [countryClause];
      }

      if (filterByGrade && user.grade) {
        const gradeFilter = {
          OR: [{ grade: user.grade }, { grade: "General" }, { grade: null }],
        };

        if (whereClause.AND) {
          whereClause.AND.push(gradeFilter);
        } else {
          whereClause.AND = [gradeFilter];
        }
      }

      if (filterBySubject) {
        whereClause.subject = filterBySubject;
      }

      const candidatePosts = await prisma.post.findMany({
        where: whereClause,
        take: limit * 5, // Get more candidates for scoring
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              createdAt: true,
              country: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              echoes: true,
            },
          },
        },
      });

      // Calculate hybrid scores for each post
      const scoredPosts: ScoredPost[] = await Promise.all(
        candidatePosts.map(async (post) => {
          const contentScore = await calculateHybridScore(
            {
              id: post.id,
              title: post.title,
              content: post.content || "",
              subject: post.subject || undefined,
              grade: post.grade || undefined,
              authorId: post.authorId,
              communityId: post.communityId,
              createdAt: post.createdAt,
              upvotes: (post as any).upvotes || post._count.likes, // Fallback to likes count
              downvotes: (post as any).downvotes || 0,
              reportCount: (post as any).reportCount || 0,
              likesCount: post._count.likes,
              commentsCount: post._count.comments,
              sharesCount: post._count.echoes, // Using echoes as shares
            },
            userId,
            {
              userProfile: user,
              userVector,
              similarUsers,
            },
            getLikesHistory,
            getUserInteraction,
          );

          return {
            ...post,
            score: contentScore.finalScore,
            subjects: post.subject ? [post.subject] : undefined,
            upvotes: (post as any).upvotes || post._count.likes,
            downvotes: (post as any).downvotes || 0,
            authorCountry: (post as any).authorCountry || null,
          };
        }),
      );

      // Sort by score
      scoredPosts.sort((a, b) => b.score - a.score);

      // Balance country distribution (70% local, 30% global)
      const balancedPosts = balanceCountryDistribution(
        scoredPosts,
        countryPrefs.userCountry,
        0.7, // 70% local content ratio
      );

      // Inject diversity
      const accountAgeDays =
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const diversityConfig = getAdaptiveDiversityConfig(
        userId,
        userVector,
        () => accountAgeDays,
      );

      const diversifiedPosts = await injectDiversity(
        balancedPosts,
        userId,
        userVector,
        diversityConfig,
        async (excludeIds, limit) => {
          const posts = await prisma.post.findMany({
            where: {
              id: { notIn: excludeIds },
              isPublic: true,
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          });

          return posts.map((p) => ({
            id: p.id,
            subjects: p.subject ? [p.subject] : undefined,
            upvotes: (p as any).upvotes || 0,
            downvotes: (p as any).downvotes || 0,
            createdAt: p.createdAt,
          }));
        },
      );

      // ✅ MONITORING: Track diversity score
      algorithmMonitor.recordDiversityScore(userVector.metadata.diversityScore);

      // Apply pagination
      const finalPosts = diversifiedPosts.slice(skip, skip + limit).map((p) => {
        // Remove score property before returning
        const { score, ...post } = p;
        return post as any;
      });

      // Record metrics
      const calculationTime = Date.now() - startTime;
      algorithmMonitor.recordCalculationTime(calculationTime);
      algorithmMonitor.recordSuccess();

      return finalPosts;
    } catch (error) {
      algorithmMonitor.recordError();
      throw error;
    }
  }); // End of stampedeProtection.getOrCompute
}

/**
 * Generate simplified feed (Time Decay + Wilson only)
 */
export async function generateSimplifiedFeed(
  userId: string,
  options: FeedOptions = {},
): Promise<Post[]> {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const whereClause: any = {
    isPublic: true,
    authorId: { not: userId },
  };

  if (user.grade) {
    whereClause.OR = [
      { grade: user.grade },
      { grade: "General" },
      { grade: null },
    ];
  }

  return await prisma.post.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Generate chronological feed (guaranteed fallback)
 */
export async function generateChronologicalFeed(
  userId: string,
  options: FeedOptions = {},
): Promise<Post[]> {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return await prisma.post.findMany({
    where: {
      isPublic: true,
      authorId: { not: userId },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

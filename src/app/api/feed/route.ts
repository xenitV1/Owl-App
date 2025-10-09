/**
 * Feed API Endpoint
 *
 * Provides intelligent content feed using hybrid algorithm system.
 * Falls back to simpler algorithms if needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { getFeedWithFallback } from "@/lib/algorithms/fallbackStrategies";
import {
  generateHybridFeed,
  generateSimplifiedFeed,
  generateChronologicalFeed,
} from "@/lib/algorithms/feedGenerator";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const algorithm = searchParams.get("algorithm") || "hybrid"; // hybrid, simplified, chronological

    // 3. Get user ID from session
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Get feed with fallback system
    const { posts, algorithm: usedAlgorithm } = await getFeedWithFallback(
      user.id,
      page,
      limit,
      async (userId, page, limit) =>
        generateHybridFeed(userId, { page, limit }),
      async (userId, page, limit) =>
        generateSimplifiedFeed(userId, { page, limit }),
      async (userId, page, limit) =>
        generateChronologicalFeed(userId, { page, limit }),
    );

    // 5. Enrich posts with user-specific data (OPTIMIZED - batch queries)
    const postIds = posts.map((p) => p.id);
    const authorIds = [...new Set(posts.map((p) => p.authorId))];

    // Batch fetch all authors
    const authors = await db.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        grade: true,
      },
    });
    const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

    // Batch fetch like counts
    const likeCounts = await db.like.groupBy({
      by: ["postId"],
      where: { postId: { in: postIds } },
      _count: { postId: true },
    });
    const likeCountMap = Object.fromEntries(
      likeCounts.map((l) => [l.postId, l._count.postId]),
    );

    // Batch fetch comment counts
    const commentCounts = await db.comment.groupBy({
      by: ["postId"],
      where: { postId: { in: postIds } },
      _count: { postId: true },
    });
    const commentCountMap = Object.fromEntries(
      commentCounts.map((c) => [c.postId, c._count.postId]),
    );

    // Batch fetch user's likes
    const userLikes = await db.like.findMany({
      where: {
        postId: { in: postIds },
        userId: user.id,
      },
      select: { postId: true },
    });
    const userLikeSet = new Set(userLikes.map((l) => l.postId));

    // Map data to posts (no more N+1 queries!)
    const enrichedPosts = posts.map((post) => ({
      ...post,
      author: authorMap[post.authorId],
      isLiked: userLikeSet.has(post.id),
      _count: {
        comments: commentCountMap[post.id] || 0,
        likes: likeCountMap[post.id] || 0,
      },
    }));

    // 6. Return response
    return NextResponse.json({
      success: true,
      posts: enrichedPosts,
      metadata: {
        page,
        limit,
        count: enrichedPosts.length,
        algorithm: usedAlgorithm,
      },
    });
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

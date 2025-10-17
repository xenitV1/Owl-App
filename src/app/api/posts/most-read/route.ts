import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import apiDebugLogger, { withApiDebug } from "@/lib/apiDebug";

export async function GET(request: NextRequest) {
  const timer = apiDebugLogger.startTimer("GET /api/posts/most-read");
  const logEntry = await apiDebugLogger.logRequest(request);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get posts ordered by creation date (algorithm system removed)
    // This endpoint now returns recent posts instead of most-read
    const posts = await db.post.findMany({
      where: {
        isPublic: true,
        communityId: null, // Exclude community posts from main feed
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pools: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const response = NextResponse.json({
      notes: posts.map((post) => ({
        id: post.id,
        title: post.title,
        subject: post.subject,
        author: post.author,
        createdAt: post.createdAt,
      })),
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      postsCount: posts.length,
      limit,
    });

    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error("Error fetching most read posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch most read posts" },
      { status: 500 },
    );
  }
}

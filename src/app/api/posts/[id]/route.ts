import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import apiDebugLogger, { withApiDebug } from "@/lib/apiDebug";
import { recordInteraction } from "@/lib/algorithms/helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const timer = apiDebugLogger.startTimer(
    `GET /api/posts/${resolvedParams.id}`,
  );
  const logEntry = await apiDebugLogger.logRequest(request);

  try {
    const { id } = resolvedParams;

    if (!id) {
      apiDebugLogger.logResponse(logEntry, 400, {
        error: "Post ID is required",
      });
      timer();
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Get the post with author and counts
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            school: true,
            grade: true,
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
    });

    if (!post) {
      apiDebugLogger.logResponse(logEntry, 404, { error: "Post not found" });
      timer();
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is authenticated to see if they liked/saved the post
    let isLiked = false;
    let isSaved = false;

    try {
      let userEmail: string | null = null;

      // Use NextAuth session instead of Firebase tokens
      const session = await getServerSession(authOptions);

      if (session?.user?.email) {
        const currentUser = await db.user.findUnique({
          where: { email: session.user.email },
        });

        if (currentUser) {
          // Check if user liked the post
          const like = await db.like.findUnique({
            where: {
              userId_postId: {
                userId: currentUser.id,
                postId: id,
              },
            },
          });
          isLiked = !!like;

          // Check if user saved the post
          const pool = await db.pool.findFirst({
            where: {
              userId: currentUser.id,
              postId: id,
            },
          });
          isSaved = !!pool;

          // ✅ ALGORITHM: Record view interaction for recommendation system
          // Only record for authenticated users, fire-and-forget (don't await)
          recordInteraction(
            currentUser.id,
            id,
            "post",
            "VIEW",
            post.subject || undefined,
            post.grade || undefined,
            1, // VIEW weight
          ).catch((err) =>
            console.error("Failed to record view interaction:", err),
          );
        }
      }
    } catch (authError) {
      // If authentication fails, continue without user-specific data
      console.warn("Authentication check failed for post:", authError);
    }

    const response = NextResponse.json({
      ...post,
      isLiked,
      isSaved,
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      postId: id,
      hasAuthor: !!post.author,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      saveCount: post._count.pools,
    });

    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;
  const timer = apiDebugLogger.startTimer(
    `DELETE /api/posts/${resolvedParams.id}`,
  );
  const logEntry = await apiDebugLogger.logRequest(request);

  try {
    const { id } = resolvedParams;

    if (!id) {
      apiDebugLogger.logResponse(logEntry, 400, {
        error: "Post ID is required",
      });
      timer();
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      apiDebugLogger.logResponse(logEntry, 401, {
        error: "Authentication required",
      });
      timer();
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      apiDebugLogger.logResponse(logEntry, 401, { error: "User not found" });
      timer();
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check if the post exists and get its author
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!post) {
      apiDebugLogger.logResponse(logEntry, 404, { error: "Post not found" });
      timer();
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the current user is the author of the post
    if (post.author.id !== currentUser.id) {
      apiDebugLogger.logResponse(logEntry, 403, {
        error: "You can only delete your own posts",
      });
      timer();
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 },
      );
    }

    // Delete the post and all related data (likes, comments, pools, images, etc.)
    // Using a transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Delete all likes for this post
      await tx.like.deleteMany({
        where: { postId: id },
      });

      // Delete all comments for this post
      await tx.comment.deleteMany({
        where: { postId: id },
      });

      // Delete all pools (saves) for this post
      await tx.pool.deleteMany({
        where: { postId: id },
      });

      // Delete all reports for this post
      await tx.report.deleteMany({
        where: { targetId: id, targetType: "POST" },
      });

      // Delete the image associated with this post (if exists)
      await tx.postImage.deleteMany({
        where: { postId: id },
      });

      // Finally, delete the post itself
      await tx.post.delete({
        where: { id },
      });
    });

    const response = NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      postId: id,
      deletedBy: currentUser.id,
      success: true,
    });

    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}

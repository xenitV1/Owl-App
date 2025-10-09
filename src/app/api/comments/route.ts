import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContentFilterService } from "@/lib/contentFilter";
import { createCommentNotification } from "@/lib/notifications";
import { recordInteraction } from "@/lib/algorithms/helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    // Get current user for block filtering
    const session = await getServerSession(authOptions);
    const currentUser = session?.user?.email
      ? await db.user.findUnique({
          where: { email: session.user.email },
        })
      : null;

    // Build where clause with block filtering
    const where: any = { postId };

    if (currentUser) {
      const blockedUserIds = await db.userBlock
        .findMany({
          where: { blockerId: currentUser.id },
          select: { blockedId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockedId));

      const blockingUserIds = await db.userBlock
        .findMany({
          where: { blockedId: currentUser.id },
          select: { blockerId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockerId));

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      if (allBlockedIds.length > 0) {
        where.authorId = {
          notIn: allBlockedIds,
        };
      }
    }

    const comments = await db.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            school: true,
            grade: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await db.comment.count({
      where: { postId },
    });

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { postId, content } = await request.json();

    if (!postId || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 },
      );
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        postId: postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            school: true,
            grade: true,
          },
        },
      },
    });

    // Apply content filtering
    const filterResult = await ContentFilterService.checkContent(
      content.trim(),
      "COMMENT",
    );

    if (filterResult.matched) {
      // Apply the filter action
      await ContentFilterService.applyFilterAction(
        filterResult,
        comment.id,
        "COMMENT",
        user.id,
      );

      // If the content was removed/blocked, return a different response
      if (filterResult.action === "BLOCK" || filterResult.action === "REMOVE") {
        return NextResponse.json(
          {
            message: "Comment was blocked by content filter",
            filterResult,
            blocked: true,
          },
          { status: 201 },
        );
      }

      // If flagged or escalated, include that info in the response
      return NextResponse.json(
        {
          ...comment,
          filterResult,
          flagged: true,
        },
        { status: 201 },
      );
    }

    // ✅ ALGORITHM: Record interaction for recommendation system
    await recordInteraction(
      user.id,
      postId,
      "post",
      "COMMENT",
      post.subject || undefined,
      post.grade || undefined,
      5, // COMMENT weight
    );

    // Create notification for the post author (only if comment wasn't blocked)
    await createCommentNotification(postId, user.id);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 },
    );
  }
}

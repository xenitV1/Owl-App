import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createLikeNotification } from "@/lib/notifications";
import { recordInteraction } from "@/lib/algorithms/helpers";

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

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Check if post exists and if user is blocked
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is blocked by post author or vice versa
    const isBlocked = await db.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: user.id },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user already liked the post
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await db.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json({
        liked: false,
        likesCount: await db.like.count({
          where: { postId },
        }),
      });
    } else {
      // Like the post
      await db.like.create({
        data: {
          userId: user.id,
          postId: postId,
        },
      });

      // ✅ ALGORITHM: Record interaction for recommendation system
      await recordInteraction(
        user.id,
        postId,
        "post",
        "LIKE",
        post.subject || undefined,
        post.grade || undefined,
        3, // LIKE weight
      );

      // Create notification for the post author
      await createLikeNotification(postId, user.id);

      return NextResponse.json({
        liked: true,
        likesCount: await db.like.count({
          where: { postId },
        }),
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEchoNotification } from "@/lib/notifications";
import { recordInteraction } from "@/lib/algorithms/helpers";

export async function POST(request: NextRequest) {
  try {
    // Use NextAuth session
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

    const { postId, comment } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    // Validate comment length if provided
    if (comment && comment.length > 280) {
      return NextResponse.json(
        { error: "Comment must be 280 characters or less" },
        { status: 400 },
      );
    }

    // Check if post exists and get author info
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

    // Check if user already echoed the post
    const existingEcho = await db.echo.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    });

    if (existingEcho) {
      return NextResponse.json(
        { error: "You have already echoed this post" },
        { status: 400 },
      );
    }

    // Create echo
    await db.echo.create({
      data: {
        userId: user.id,
        postId: postId,
        comment: comment || null,
      },
    });

    // ✅ ALGORITHM: Record interaction for recommendation system
    await recordInteraction(
      user.id,
      postId,
      "post",
      "ECHO",
      post.subject || undefined,
      post.grade || undefined,
      8, // ECHO weight (highest - it's a share)
    );

    // Create notification for the post author
    await createEchoNotification(postId, user.id, comment);

    // Get updated echo count
    const echoCount = await db.echo.count({
      where: { postId },
    });

    return NextResponse.json({
      echoed: true,
      echoCount,
      comment: comment || null,
    });
  } catch (error) {
    console.error("Error creating echo:", error);
    return NextResponse.json(
      { error: "Failed to create echo" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use NextAuth session
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

    // Find and delete echo
    const existingEcho = await db.echo.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    });

    if (!existingEcho) {
      return NextResponse.json({ error: "Echo not found" }, { status: 404 });
    }

    await db.echo.delete({
      where: {
        id: existingEcho.id,
      },
    });

    // Get updated echo count
    const echoCount = await db.echo.count({
      where: { postId },
    });

    return NextResponse.json({
      echoed: false,
      echoCount,
    });
  } catch (error) {
    console.error("Error deleting echo:", error);
    return NextResponse.json(
      { error: "Failed to delete echo" },
      { status: 500 },
    );
  }
}

/**
 * Join Community API
 * POST /api/communities/[id]/join
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoJoinUserToChatRoom } from "@/lib/services/systemCommunityService";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if community exists
    const community = await db.community.findUnique({
      where: { id: params.id },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    // Add user as member
    await db.communityMember.upsert({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: params.id,
        },
      },
      create: {
        userId: user.id,
        communityId: params.id,
        role: "member",
      },
      update: {},
    });

    // Auto-join user to community main chat room
    try {
      await autoJoinUserToChatRoom(user.id, params.id);
    } catch (e) {
      console.error("[API] Auto-join to chat failed:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Joined community successfully",
    });
  } catch (error) {
    console.error("[API] Error joining community:", error);
    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 },
    );
  }
}

/**
 * Leave Community API
 * DELETE /api/communities/[id]/join
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure community exists
    const community = await db.community.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    // Remove membership if exists
    await db.communityMember.deleteMany({
      where: {
        userId: user.id,
        communityId: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Left community successfully",
    });
  } catch (error) {
    console.error("[API] Error leaving community:", error);
    return NextResponse.json(
      { error: "Failed to leave community" },
      { status: 500 },
    );
  }
}

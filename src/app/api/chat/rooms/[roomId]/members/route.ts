import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    roomId: string;
  }>;
}

/**
 * Get Chat Room Members API
 * GET /api/chat/rooms/[roomId]/members
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
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

    const params = await context.params;
    const roomId = params.roomId;

    // Verify user is member of this room
    const membership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId: roomId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get room members
    const members = await db.chatRoomMember.findMany({
      where: { chatRoomId: roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // moderators first
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json({
      members,
      total: members.length,
    });
  } catch (error) {
    console.error("[API] Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

/**
 * Add Member to Chat Room API
 * POST /api/chat/rooms/[roomId]/members
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
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

    const params = await context.params;
    const roomId = params.roomId;

    const body = await request.json();
    const { userId, role = "member" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get room details first
    const chatRoom = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        creatorId: true,
        maxMembers: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 },
      );
    }

    // Check if current user is moderator or creator
    const currentMembership = await db.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        userId: user.id,
        role: { in: ["moderator", "admin"] },
      },
    });

    if (!currentMembership && chatRoom.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Check room capacity
    if (chatRoom._count.members >= chatRoom.maxMembers) {
      return NextResponse.json(
        { error: "Chat room is at maximum capacity" },
        { status: 403 },
      );
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Check if user is already a member
    const existingMembership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId,
          chatRoomId: roomId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 400 },
      );
    }

    // Add member
    const newMembership = await db.chatRoomMember.create({
      data: {
        userId,
        chatRoomId: roomId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      member: newMembership,
      success: true,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("[API] Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }
}

/**
 * Remove Member from Chat Room API
 * DELETE /api/chat/rooms/[roomId]/members
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
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

    const params = await context.params;
    const roomId = params.roomId;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Check if current user is moderator, creator, or removing themselves
    const canRemove = userId === user.id;

    if (!canRemove) {
      // Get room to check creator
      const chatRoom = await db.chatRoom.findUnique({
        where: { id: roomId },
        select: { creatorId: true },
      });

      if (!chatRoom) {
        return NextResponse.json(
          { error: "Chat room not found" },
          { status: 404 },
        );
      }

      // Check if user is moderator
      const currentMembership = await db.chatRoomMember.findFirst({
        where: {
          chatRoomId: roomId,
          userId: user.id,
          role: { in: ["moderator", "admin"] },
        },
      });

      if (!currentMembership && chatRoom.creatorId !== user.id) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // Verify target user is a member
    const targetMembership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId,
          chatRoomId: roomId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "User is not a member" },
        { status: 404 },
      );
    }

    // Don't allow removing the creator
    const chatRoom = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: { creatorId: true },
    });

    if (chatRoom?.creatorId === userId) {
      return NextResponse.json(
        { error: "Cannot remove room creator" },
        { status: 403 },
      );
    }

    // Remove member
    await db.chatRoomMember.delete({
      where: {
        userId_chatRoomId: {
          userId,
          chatRoomId: roomId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("[API] Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

/**
 * Join Chat Room by Token API
 * GET /api/chat/join/[token]
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
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 },
      );
    }

    // Find room by invite token
    const room = await db.chatRoom.findFirst({
      where: {
        inviteToken: token,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            avatar: true,
            chatEnabled: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 },
      );
    }

    // Check if community has chat enabled
    if (!room.community.chatEnabled) {
      return NextResponse.json(
        { error: "Chat is not enabled for this community" },
        { status: 403 },
      );
    }

    // Check if user is allowed (for private rooms)
    if (room.isPrivate && room.allowedUserId !== user.id) {
      return NextResponse.json(
        {
          error: "Bu davet linki sadece belirtilen kullanıcı içindir",
          allowedUser: room.allowedUserId,
        },
        { status: 403 },
      );
    }

    // Check room capacity
    if (room._count.members >= room.maxMembers) {
      return NextResponse.json(
        { error: "Chat room is at maximum capacity" },
        { status: 403 },
      );
    }

    // Check if user is already a member
    const existingMembership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId: room.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({
        room,
        message: "You are already a member of this room",
        success: true,
        alreadyMember: true,
      });
    }

    // Add user as member
    await db.chatRoomMember.create({
      data: {
        userId: user.id,
        chatRoomId: room.id,
        role: "member",
      },
    });

    // Clear invite token (single-use)
    await db.chatRoom.update({
      where: { id: room.id },
      data: {
        inviteToken: null,
        allowedUserId: null,
      },
    });

    return NextResponse.json({
      room,
      success: true,
      message: "Successfully joined the chat room",
    });
  } catch (error) {
    console.error("[API] Error joining room by token:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

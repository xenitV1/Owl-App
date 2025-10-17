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
 * Join Chat Room API
 * POST /api/chat/rooms/[roomId]/join
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
    const { inviteToken } = body;

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 },
      );
    }

    // Find room by invite token
    const room = await db.chatRoom.findFirst({
      where: {
        id: roomId,
        inviteToken,
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Invalid invite link or room not found" },
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
    console.error("[API] Error joining room:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}

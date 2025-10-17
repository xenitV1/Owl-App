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
 * Get Chat Room Details API
 * GET /api/chat/rooms/[roomId]
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

    // Get chat room with membership check
    const chatRoom = await db.chatRoom.findFirst({
      where: {
        id: roomId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isSystemGenerated: true,
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      chatRoom,
    });
  } catch (error) {
    console.error("[API] Error fetching chat room:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat room" },
      { status: 500 },
    );
  }
}

/**
 * Update Chat Room API
 * PUT /api/chat/rooms/[roomId]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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
    const { name, description, maxMembers } = body;

    // Check if user is room creator or moderator
    const membership = await db.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        userId: user.id,
        role: { in: ["moderator", "admin"] },
      },
      include: {
        chatRoom: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    // Check if user has permission (is moderator/admin OR is creator)
    if (!membership) {
      // User is not a moderator, check if they're the creator
      const chatRoom = await db.chatRoom.findFirst({
        where: {
          id: roomId,
          creatorId: user.id,
        },
      });

      if (!chatRoom) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    // Update chat room
    const updatedChatRoom = await db.chatRoom.update({
      where: { id: roomId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxMembers && { maxMembers }),
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isSystemGenerated: true,
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json({
      chatRoom: updatedChatRoom,
      success: true,
      message: "Chat room updated successfully",
    });
  } catch (error) {
    console.error("[API] Error updating chat room:", error);
    return NextResponse.json(
      { error: "Failed to update chat room" },
      { status: 500 },
    );
  }
}

/**
 * Delete Chat Room API
 * DELETE /api/chat/rooms/[roomId]
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

    // Check if user is room creator
    const chatRoom = await db.chatRoom.findFirst({
      where: {
        id: roomId,
        creatorId: user.id,
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found or insufficient permissions" },
        { status: 404 },
      );
    }

    // Don't allow deletion of main chat rooms
    if (chatRoom.isMainChat) {
      return NextResponse.json(
        { error: "Cannot delete main chat room" },
        { status: 403 },
      );
    }

    // Delete chat room (cascade will handle members and messages)
    await db.chatRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({
      success: true,
      message: "Chat room deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error deleting chat room:", error);
    return NextResponse.json(
      { error: "Failed to delete chat room" },
      { status: 500 },
    );
  }
}

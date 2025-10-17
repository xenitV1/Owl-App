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
 * Get Chat Messages API
 * GET /api/chat/rooms/[roomId]/messages
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 messages per request
    const before = searchParams.get("before"); // ISO date string for pagination

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

    // Build where clause for pagination
    const whereClause: any = {
      chatRoomId: roomId,
      isDeleted: false,
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before),
      };
    }

    // Get messages with pagination
    const [messages, totalCount] = await Promise.all([
      db.chatMessage.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true, // Add username field
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.chatMessage.count({
        where: whereClause,
      }),
    ]);

    // Update last read timestamp
    await db.chatRoomMember.update({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId: roomId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

/**
 * Send Chat Message API
 * POST /api/chat/rooms/[roomId]/messages
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
    const { content, messageType = "text", attachmentUrl } = body;

    // Validate message content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    // Verify user is member of this room
    const membership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId: roomId,
        },
      },
      include: {
        chatRoom: {
          select: {
            maxMembers: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check room capacity
    if (membership.chatRoom._count.members >= membership.chatRoom.maxMembers) {
      return NextResponse.json(
        { error: "Chat room is at maximum capacity" },
        { status: 403 },
      );
    }

    // Create message
    const message = await db.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId: user.id,
        content: content.trim(),
        messageType,
        attachmentUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Update last read timestamp for sender
    await db.chatRoomMember.update({
      where: {
        userId_chatRoomId: {
          userId: user.id,
          chatRoomId: roomId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      message,
      success: true,
    });
  } catch (error) {
    console.error("[API] Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get Chat Rooms API
 * GET /api/chat/rooms
 */
export async function GET(request: NextRequest) {
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

    // Get user's chat rooms
    const chatRooms = await db.chatRoom.findMany({
      where: {
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
      orderBy: [{ isMainChat: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      chatRooms,
      total: chatRooms.length,
    });
  } catch (error) {
    console.error("[API] Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 },
    );
  }
}

/**
 * Create Chat Room API
 * POST /api/chat/rooms
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      communityId,
      name,
      description,
      isPrivate = false,
      allowedUserId,
      maxMembers = 300,
    } = body;

    // Validate required fields
    if (!communityId || !name) {
      return NextResponse.json(
        { error: "Community ID and name are required" },
        { status: 400 },
      );
    }

    // Verify community exists and user is member
    const community = await db.community.findFirst({
      where: {
        id: communityId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found or you are not a member" },
        { status: 404 },
      );
    }

    // Check if community has chat enabled
    if (!community.chatEnabled) {
      return NextResponse.json(
        { error: "Chat is not enabled for this community" },
        { status: 403 },
      );
    }

    // For private rooms, validate allowedUserId
    if (isPrivate && !allowedUserId) {
      return NextResponse.json(
        { error: "Allowed user ID is required for private rooms" },
        { status: 400 },
      );
    }

    if (isPrivate && allowedUserId) {
      const allowedUser = await db.user.findUnique({
        where: { id: allowedUserId },
      });

      if (!allowedUser) {
        return NextResponse.json(
          { error: "Allowed user not found" },
          { status: 404 },
        );
      }
    }

    // Check if there's already a main chat for this community
    if (!isPrivate) {
      const existingMainChat = await db.chatRoom.findFirst({
        where: {
          communityId,
          isMainChat: true,
        },
      });

      if (existingMainChat) {
        return NextResponse.json(
          { error: "Main chat already exists for this community" },
          { status: 400 },
        );
      }
    }

    // Generate invite token for private rooms
    let inviteToken: string | null = null;
    if (isPrivate) {
      inviteToken = generateSecureToken();
    }

    // Create chat room
    const chatRoom = await db.chatRoom.create({
      data: {
        communityId,
        name,
        description,
        isMainChat: !isPrivate,
        isPrivate,
        isPublic: community.chatPublicAccess,
        maxMembers: Math.min(maxMembers, community.chatMaxMembers || 300),
        inviteToken,
        allowedUserId: isPrivate ? allowedUserId : null,
        creatorId: user.id,
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
      },
    });

    // Add creator as member
    await db.chatRoomMember.create({
      data: {
        userId: user.id,
        chatRoomId: chatRoom.id,
        role: "moderator",
      },
    });

    // Add allowed user as member for private rooms
    if (isPrivate && allowedUserId) {
      await db.chatRoomMember.create({
        data: {
          userId: allowedUserId,
          chatRoomId: chatRoom.id,
          role: "member",
        },
      });
    }

    return NextResponse.json({
      chatRoom,
      success: true,
      message: isPrivate
        ? "Private chat room created successfully"
        : "Chat room created successfully",
    });
  } catch (error) {
    console.error("[API] Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room" },
      { status: 500 },
    );
  }
}

/**
 * Generate secure random token for invite links
 */
function generateSecureToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Generate Invite Link API
 * POST /api/chat/invite-link
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
    const { chatRoomId, targetUsername } = body;

    if (!chatRoomId || !targetUsername) {
      return NextResponse.json(
        { error: "Chat room ID and target username are required" },
        { status: 400 },
      );
    }

    // Validate user is room creator or moderator
    const room = await db.chatRoom.findFirst({
      where: {
        id: chatRoomId,
        OR: [
          { creatorId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: { in: ["moderator", "admin"] },
              },
            },
          },
        ],
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or insufficient permissions" },
        { status: 404 },
      );
    }

    // Find target user by username
    const targetUser = await db.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Check if target user is already a member
    const existingMembership = await db.chatRoomMember.findUnique({
      where: {
        userId_chatRoomId: {
          userId: targetUser.id,
          chatRoomId: chatRoomId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this room" },
        { status: 400 },
      );
    }

    // Generate unique token
    const inviteToken = generateSecureToken();

    // Update room with invite link
    await db.chatRoom.update({
      where: { id: chatRoomId },
      data: {
        inviteToken,
        allowedUserId: targetUser.id,
        isPrivate: true,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/chat/join/${inviteToken}`;

    return NextResponse.json({
      inviteLink,
      token: inviteToken,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      success: true,
    });
  } catch (error) {
    console.error("[API] Error generating invite link:", error);
    return NextResponse.json(
      { error: "Failed to generate invite link" },
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

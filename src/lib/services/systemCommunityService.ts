/**
 * System Community Service
 *
 * Handles automatic community creation and user assignment based on
 * country and grade information
 * Also handles automatic chat room creation for system communities
 */

import { db } from "@/lib/db";

/**
 * Get or create a system community for a specific country and grade
 */
export async function getOrCreateSystemCommunity(
  country: string,
  grade: string,
) {
  // 1. Check if community exists
  let community = await db.community.findFirst({
    where: {
      isSystemGenerated: true,
      country,
      grade,
    },
  });

  // 2. Create if not exists
  if (!community) {
    // Generate i18n key for community name
    const nameKey = `communities.${country.toLowerCase().replace(/\s+/g, "_")}_${grade.toLowerCase().replace(/\s+/g, "_")}`;

    community = await db.community.create({
      data: {
        name: `${country} - ${grade}`, // Fallback name
        nameKey,
        isSystemGenerated: true,
        country,
        grade,
        isPublic: true,
        chatEnabled: true, // ✨ YENİ: Chat always enabled for system communities
        chatPublicAccess: false, // Only members can access chat
        chatMaxMembers: 300, // Default max members per chat room
      },
    });

    // ✨ YENİ: Create main chat room for the community
    await createMainChatRoom(community.id, community.name);
  }

  return community;
}

/**
 * Automatically join a user to their country+grade system community
 */
export async function autoJoinUserToCommunity(
  userId: string,
  country: string,
  grade: string,
) {
  const community = await getOrCreateSystemCommunity(country, grade);

  // Add user as member
  await db.communityMember.upsert({
    where: {
      userId_communityId: {
        userId,
        communityId: community.id,
      },
    },
    create: {
      userId,
      communityId: community.id,
      role: "member",
    },
    update: {},
  });

  // ✨ YENİ: Auto-join user to main chat room
  await autoJoinUserToChatRoom(userId, community.id);

  return community;
}

/**
 * Get all system communities for a specific grade (across all countries)
 * Used for discovery feature
 */
export async function getSystemCommunitiesByGrade(
  grade: string,
  excludeCountry?: string,
) {
  return await db.community.findMany({
    where: {
      isSystemGenerated: true,
      grade,
      ...(excludeCountry && { country: { not: excludeCountry } }),
    },
    include: {
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: {
      country: "asc",
    },
  });
}

/**
 * Check if user is member of a specific community
 */
export async function isUserCommunityMember(
  userId: string,
  communityId: string,
): Promise<boolean> {
  const membership = await db.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId,
      },
    },
  });

  return !!membership;
}

/**
 * Get user's system community (their country+grade community)
 */
export async function getUserSystemCommunity(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { country: true, grade: true },
  });

  if (!user?.country || !user?.grade) {
    return null;
  }

  return await db.community.findFirst({
    where: {
      isSystemGenerated: true,
      country: user.country,
      grade: user.grade,
    },
    include: {
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
  });
}

/**
 * ✨ YENİ: Create main chat room for a community
 */
export async function createMainChatRoom(
  communityId: string,
  communityName: string,
) {
  // Check if main chat already exists
  const existingMainChat = await db.chatRoom.findFirst({
    where: {
      communityId,
      isMainChat: true,
    },
  });

  if (existingMainChat) {
    return existingMainChat;
  }

  // Get first admin/moderator as creator, or use system
  const communityAdmin = await db.communityMember.findFirst({
    where: {
      communityId,
      role: { in: ["admin", "moderator"] },
    },
  });

  // If no admin found, get any member or create with first user that joins
  const anyMember =
    communityAdmin ||
    (await db.communityMember.findFirst({
      where: { communityId },
    }));

  if (!anyMember) {
    // No members yet, will be created when first user joins
    return null;
  }

  // Create main chat room
  const chatRoom = await db.chatRoom.create({
    data: {
      communityId,
      name: `${communityName} - Main Chat`,
      description: "Main community chat room",
      isMainChat: true,
      isPrivate: false,
      isPublic: false, // Only community members
      maxMembers: 300,
      creatorId: anyMember.userId,
    },
  });

  // Add creator as first member
  await db.chatRoomMember.create({
    data: {
      userId: anyMember.userId,
      chatRoomId: chatRoom.id,
      role: "moderator",
    },
  });

  return chatRoom;
}

/**
 * ✨ YENİ: Auto-join user to community's main chat room
 */
export async function autoJoinUserToChatRoom(
  userId: string,
  communityId: string,
) {
  // Find main chat room for this community
  let mainChatRoom = await db.chatRoom.findFirst({
    where: {
      communityId,
      isMainChat: true,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  // Create main chat if doesn't exist
  if (!mainChatRoom) {
    const community = await db.community.findUnique({
      where: { id: communityId },
      select: { name: true },
    });

    if (community) {
      const newRoom = await createMainChatRoom(communityId, community.name);
      if (!newRoom) {
        return null;
      }

      // Re-fetch with _count to match expected type
      mainChatRoom = await db.chatRoom.findFirst({
        where: { id: newRoom.id },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });
    }
  }

  if (!mainChatRoom) {
    return null;
  }

  // ✨ KAPASITE YÖNETİMİ: Check if room is full
  if (
    mainChatRoom._count &&
    mainChatRoom._count.members >= mainChatRoom.maxMembers
  ) {
    // Find or create next chat room (already includes _count)
    const nextRoom = await getOrCreateNextChatRoom(
      communityId,
      mainChatRoom.name,
    );

    // Re-fetch with _count to match expected type
    mainChatRoom = await db.chatRoom.findFirst({
      where: { id: nextRoom.id },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!mainChatRoom) {
      return null;
    }
  }

  // Check if user is already a member
  const existingMembership = await db.chatRoomMember.findUnique({
    where: {
      userId_chatRoomId: {
        userId,
        chatRoomId: mainChatRoom.id,
      },
    },
  });

  if (existingMembership) {
    return mainChatRoom;
  }

  // Add user to chat room
  await db.chatRoomMember.create({
    data: {
      userId,
      chatRoomId: mainChatRoom.id,
      role: "member",
    },
  });

  return mainChatRoom;
}

/**
 * ✨ YENİ: Get or create next chat room when capacity is reached
 */
export async function getOrCreateNextChatRoom(
  communityId: string,
  baseName: string,
) {
  // Find all main chats for this community
  const allMainChats = await db.chatRoom.findMany({
    where: {
      communityId,
      isMainChat: true,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Find first chat room with available space
  const availableRoom = allMainChats.find(
    (room) => room._count.members < room.maxMembers,
  );

  if (availableRoom) {
    return availableRoom;
  }

  // All rooms are full, create a new one
  const roomNumber = allMainChats.length + 1;
  const creator = await db.communityMember.findFirst({
    where: { communityId, role: { in: ["admin", "moderator"] } },
  });

  if (!creator) {
    throw new Error("No admin/moderator found to create new chat room");
  }

  const newChatRoom = await db.chatRoom.create({
    data: {
      communityId,
      name: `${baseName.replace(" - Main Chat", "")} - Chat ${roomNumber}`,
      description: `Community chat room ${roomNumber}`,
      isMainChat: true,
      isPrivate: false,
      isPublic: false,
      maxMembers: 300,
      creatorId: creator.userId,
    },
  });

  // Add creator as first member
  await db.chatRoomMember.create({
    data: {
      userId: creator.userId,
      chatRoomId: newChatRoom.id,
      role: "moderator",
    },
  });

  return newChatRoom;
}

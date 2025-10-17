import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoJoinUserToCommunity } from "@/lib/services/systemCommunityService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const username = searchParams.get("username");
    const recommended = searchParams.get("recommended") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Handle recommended users
    if (recommended) {
      // Use NextAuth session instead of Firebase tokens
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized to get recommendations" },
          { status: 401 },
        );
      }

      const currentUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          school: true,
          grade: true,
          favoriteSubject: true,
        },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: "Current user not found" },
          { status: 404 },
        );
      }

      // Get users that current user is not following
      const followingIds = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });

      const excludedIds = [
        currentUser.id,
        ...followingIds.map((f) => f.followingId),
      ];

      // Get blocked users (both directions)
      const blockedUserIds = await db.userBlock
        .findMany({
          where: { blockerId: currentUser.id },
          select: { blockedId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockedId));

      const blockingUserIds = await db.userBlock
        .findMany({
          where: { blockedId: currentUser.id },
          select: { blockerId: true },
        })
        .then((blocks) => blocks.map((b) => b.blockerId));

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];
      const finalExcludedIds = [...excludedIds, ...allBlockedIds];

      // Find users with similar interests
      const recommendedUsers = await db.user.findMany({
        where: {
          id: {
            notIn: finalExcludedIds,
          },
          OR: [
            {
              school: currentUser.school,
            },
            {
              grade: currentUser.grade,
            },
            {
              favoriteSubject: currentUser.favoriteSubject,
            },
          ],
          role: "STUDENT",
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          username: true, // Add username field
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: [
          {
            posts: {
              _count: "desc",
            },
          },
          {
            followers: {
              _count: "desc",
            },
          },
        ],
        take: limit,
      });

      return NextResponse.json({
        users: recommendedUsers,
      });
    }

    // Handle single user lookup
    if (!userId && !email && !username) {
      return NextResponse.json(
        { error: "User ID, email or username is required" },
        { status: 400 },
      );
    }

    // Get current user for block filtering
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    let user;

    if (userId) {
      // Check if current user has blocked the target user or vice versa
      let blockedUserIds: string[] = [];
      let blockingUserIds: string[] = [];

      if (currentUser) {
        const blockedUsers = await db.userBlock
          .findMany({
            where: { blockerId: currentUser.id },
            select: { blockedId: true },
          })
          .then((blocks) => blocks.map((b) => b.blockedId));

        const blockingUsers = await db.userBlock
          .findMany({
            where: { blockedId: currentUser.id },
            select: { blockerId: true },
          })
          .then((blocks) => blocks.map((b) => b.blockerId));

        blockedUserIds = blockedUsers;
        blockingUserIds = blockingUsers;
      }

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      // If target user is blocked, don't return the profile
      if (allBlockedIds.includes(userId)) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
          country: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              pools: true,
              followers: true,
              following: true,
            },
          },
        },
      });
    } else if (email) {
      // Check if current user has blocked the target user or vice versa
      let blockedUserIds: string[] = [];
      let blockingUserIds: string[] = [];

      if (currentUser) {
        const blockedUsers = await db.userBlock
          .findMany({
            where: { blockerId: currentUser.id },
            select: { blockedId: true },
          })
          .then((blocks) => blocks.map((b) => b.blockedId));

        const blockingUsers = await db.userBlock
          .findMany({
            where: { blockedId: currentUser.id },
            select: { blockerId: true },
          })
          .then((blocks) => blocks.map((b) => b.blockerId));

        blockedUserIds = blockedUsers;
        blockingUserIds = blockingUsers;
      }

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      // Find the target user
      const targetUser = await db.user.findUnique({
        where: { email: email! },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          username: true, // Add username field
          role: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
          country: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              pools: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      // If target user is blocked, don't return the profile
      if (targetUser && allBlockedIds.includes(targetUser.id)) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = targetUser;
    } else if (username) {
      // Lookup by username
      const targetUser = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
          country: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              pools: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      // If target user is blocked, don't return the profile
      if (targetUser && currentUser) {
        const [blockedUsers, blockingUsers] = await Promise.all([
          db.userBlock
            .findMany({
              where: { blockerId: currentUser.id },
              select: { blockedId: true },
            })
            .then((blocks) => blocks.map((b) => b.blockedId)),
          db.userBlock
            .findMany({
              where: { blockedId: currentUser.id },
              select: { blockerId: true },
            })
            .then((blocks) => blocks.map((b) => b.blockerId)),
        ]);

        const allBlockedIds = [...blockedUsers, ...blockingUsers];
        if (allBlockedIds.includes(targetUser.id)) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }
      }

      user = targetUser;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
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

    const {
      name,
      school,
      grade,
      favoriteSubject,
      bio,
      role,
      avatar,
      username,
      country,
    } = await request.json();

    const data: any = {
      ...(name && { name }),
      ...(username !== undefined && { username }), // Add username field
      ...(school !== undefined && { school }),
      ...(grade !== undefined && { grade }),
      ...(favoriteSubject !== undefined && { favoriteSubject }),
      ...(bio !== undefined && { bio }),
      ...(role !== undefined && { role }),
      ...(avatar !== undefined && { avatar }),
    };

    // Optional: handle country update (basic)
    if (country !== undefined) {
      data.country = country;
    }

    const prevCountry = user.country;
    const prevGrade = user.grade;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true, // Add username field
        avatar: true,
        role: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        country: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If country or grade changed and both are present, auto-join system community
    const countryChanged = country !== undefined && country !== prevCountry;
    const gradeChanged = grade !== undefined && grade !== prevGrade;
    if (
      (countryChanged || gradeChanged) &&
      updatedUser.country &&
      updatedUser.grade
    ) {
      try {
        await autoJoinUserToCommunity(
          updatedUser.id,
          updatedUser.country,
          updatedUser.grade,
        );
        // Optional cleanup: remove memberships from other system communities not matching current pair
        await db.communityMember.deleteMany({
          where: {
            userId: updatedUser.id,
            community: {
              isSystemGenerated: true,
              OR: [
                { country: { not: updatedUser.country } },
                { grade: { not: updatedUser.grade } },
              ],
            },
          },
        });
      } catch (e) {
        console.error("Auto-join to system community failed:", e);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}

// DELETE /api/users - Permanently delete current user's account and all related data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = currentUser.id;

    // Best-effort hard delete of user data
    await db.$transaction(async (tx) => {
      // Gather post ids authored by user
      const posts = await tx.post.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const postIds = posts.map((p) => p.id);

      if (postIds.length > 0) {
        await tx.like.deleteMany({ where: { postId: { in: postIds } } });
        await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
        await tx.pool.deleteMany({ where: { postId: { in: postIds } } });
        await tx.report.deleteMany({
          where: { targetId: { in: postIds }, targetType: "POST" },
        });
        await tx.postImage
          ?.deleteMany?.({ where: { postId: { in: postIds } } })
          .catch(() => {});
        await tx.post.deleteMany({ where: { id: { in: postIds } } });
      }

      // User-authored comments/likes/pools
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.like.deleteMany({ where: { userId } });
      await tx.pool.deleteMany({ where: { userId } });

      // Follows
      await tx.follow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
      });

      // Blocks & mutes
      await tx.userBlock.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      });
      await tx.userMute.deleteMany({
        where: { OR: [{ muterId: userId }, { mutedId: userId }] },
      });

      // Communities and groups memberships
      await tx.communityMember.deleteMany({ where: { userId } });
      await tx.groupMember?.deleteMany?.({ where: { userId } }).catch(() => {});

      // Chat memberships and messages
      await tx.chatRoomMember
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});
      await tx.chatMessage
        ?.deleteMany?.({ where: { senderId: userId } })
        .catch(() => {});

      // Notifications & reports
      await tx.notification.deleteMany({
        where: { OR: [{ userId }, { actorId: userId }] },
      });
      await tx.report.deleteMany({
        where: {
          OR: [
            { reporterId: userId },
            { targetId: userId, targetType: "USER" },
          ],
        },
      });

      // Echoes
      await tx.echo.deleteMany({ where: { userId: userId } }).catch(() => {});

      // Pools created by user
      await tx.pool.deleteMany({ where: { userId } });

      // Study notes and related standalone user tables
      await tx.studyNote?.deleteMany?.({ where: { userId } }).catch(() => {});
      await tx.userInterestVector
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});
      await tx.algorithmMetrics
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});
      await tx.similarUser
        ?.deleteMany?.({
          where: { OR: [{ userId }, { similarUserId: userId }] },
        })
        .catch(() => {});
      await tx.interaction?.deleteMany?.({ where: { userId } }).catch(() => {});
      await tx.pendingGradeChange
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});
      await tx.poolCategory
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});

      // Admin and moderation artifacts
      await tx.adminActivityLog
        ?.deleteMany?.({ where: { adminId: userId } })
        .catch(() => {});
      await tx.moderationAction
        ?.deleteMany?.({ where: { moderatorId: userId } })
        .catch(() => {});

      // Reports: clear assignedTo and delete reporter-owned reports (already cascaded by reporter)
      await tx.report.updateMany({
        where: { assignedTo: userId },
        data: { assignedTo: null },
      });

      // Appeals: clear reviewer link
      await tx.appeal.updateMany({
        where: { reviewedBy: userId },
        data: { reviewedBy: null },
      });

      // Communities: clear creator to avoid FK violation
      await tx.community.updateMany({
        where: { creatorId: userId },
        data: { creatorId: null },
      });

      // Chat rooms created by user (cannot null creatorId since required)
      await tx.chatRoomMember
        ?.deleteMany?.({ where: { userId } })
        .catch(() => {});
      const myRooms = await tx.chatRoom.findMany({
        where: { creatorId: userId },
        select: { id: true },
      });
      if (myRooms.length > 0) {
        const roomIds = myRooms.map((r) => r.id);
        await tx.chatMessage.deleteMany({
          where: { chatRoomId: { in: roomIds } },
        });
        await tx.chatRoomMember.deleteMany({
          where: { chatRoomId: { in: roomIds } },
        });
        await tx.chatRoom.deleteMany({ where: { id: { in: roomIds } } });
      }

      // Finally, delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete user account" },
      { status: 500 },
    );
  }
}

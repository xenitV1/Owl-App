import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const recommended = searchParams.get('recommended') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Handle recommended users
    if (recommended) {
      // Use NextAuth session instead of Firebase tokens
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Unauthorized to get recommendations' },
          { status: 401 }
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
          { error: 'Current user not found' },
          { status: 404 }
        );
      }

      // Get users that current user is not following
      const followingIds = await db.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });

      const excludedIds = [currentUser.id, ...followingIds.map(f => f.followingId)];

      // Get blocked users (both directions)
      const blockedUserIds = await db.userBlock.findMany({
        where: { blockerId: currentUser.id },
        select: { blockedId: true }
      }).then(blocks => blocks.map(b => b.blockedId));

      const blockingUserIds = await db.userBlock.findMany({
        where: { blockedId: currentUser.id },
        select: { blockerId: true }
      }).then(blocks => blocks.map(b => b.blockerId));

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
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
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
              _count: 'desc',
            },
          },
          {
            followers: {
              _count: 'desc',
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
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Get current user for block filtering
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email }
    });

    let user;

    if (userId) {
      // Check if current user has blocked the target user or vice versa
      let blockedUserIds: string[] = [];
      let blockingUserIds: string[] = [];

      if (currentUser) {
        const blockedUsers = await db.userBlock.findMany({
          where: { blockerId: currentUser.id },
          select: { blockedId: true }
        }).then(blocks => blocks.map(b => b.blockedId));

        const blockingUsers = await db.userBlock.findMany({
          where: { blockedId: currentUser.id },
          select: { blockerId: true }
        }).then(blocks => blocks.map(b => b.blockerId));

        blockedUserIds = blockedUsers;
        blockingUserIds = blockingUsers;
      }

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      // If target user is blocked, don't return the profile
      if (allBlockedIds.includes(userId)) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
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
    } else {
      // Check if current user has blocked the target user or vice versa
      let blockedUserIds: string[] = [];
      let blockingUserIds: string[] = [];

      if (currentUser) {
        const blockedUsers = await db.userBlock.findMany({
          where: { blockerId: currentUser.id },
          select: { blockedId: true }
        }).then(blocks => blocks.map(b => b.blockedId));

        const blockingUsers = await db.userBlock.findMany({
          where: { blockedId: currentUser.id },
          select: { blockerId: true }
        }).then(blocks => blocks.map(b => b.blockerId));

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
          role: true,
          school: true,
          grade: true,
          favoriteSubject: true,
          bio: true,
          isVerified: true,
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
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      user = targetUser;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { name, school, grade, favoriteSubject, bio, role, avatar } = await request.json();

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(school !== undefined && { school }),
        ...(grade !== undefined && { grade }),
        ...(favoriteSubject !== undefined && { favoriteSubject }),
        ...(bio !== undefined && { bio }),
        ...(role !== undefined && { role }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
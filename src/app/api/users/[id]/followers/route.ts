import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';import { db } from '@/lib/db';
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get current user for block filtering
    let currentUser: any = null;
    let userEmail: string | null = null;
    
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
    }

    // Build where clause with block filtering
    const where: any = { followingId: userId };
    
    if (currentUser) {
      const blockedUserIds = await db.userBlock.findMany({
        where: { blockerId: currentUser.id },
        select: { blockedId: true }
      }).then(blocks => blocks.map(b => b.blockedId));

      const blockingUserIds = await db.userBlock.findMany({
        where: { blockedId: currentUser.id },
        select: { blockerId: true }
      }).then(blocks => blocks.map(b => b.blockerId));

      const allBlockedIds = [...blockedUserIds, ...blockingUserIds];

      if (allBlockedIds.length > 0) {
        where.followerId = {
          notIn: allBlockedIds
        };
      }
    }

    // Get followers with pagination
    const followers = await db.follow.findMany({
      where,
      include: {
        follower: {
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
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const total = await db.follow.count({
      where
    });

    return NextResponse.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
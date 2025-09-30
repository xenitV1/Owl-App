import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Get current user for block filtering and follow-gated visibility
    let currentUser: any = null;
    let userEmail: string | null = null;
    
    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);
    const requester = session?.user?.email
      ? await db.user.findUnique({ where: { email: session.user.email } })
      : null;

    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email }
      });
    }

    const where: any = { authorId: userId };

    // Enforce follow-gated visibility: requester must be owner or follower
    const isOwner = requester?.id === userId;
    if (!isOwner && requester) {
      const follow = await db.follow.findUnique({
        where: { followerId_followingId: { followerId: requester.id, followingId: userId! } },
      });
      if (!follow) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    if (!isOwner && !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add block filtering - exclude comments from blocked users
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
        where.authorId = {
          notIn: allBlockedIds
        };
      }
    }

    const comments = await db.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true, school: true, grade: true },
            },
            _count: { select: { likes: true, comments: true, pools: true } },
          },
        },
      },
    });

    const total = await db.comment.count({ where });

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user comments' },
      { status: 500 }
    );
  }
}



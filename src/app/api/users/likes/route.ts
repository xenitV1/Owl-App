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

    // Enforce follow-gated visibility: requester must be owner or follower
    const session = await getServerSession(authOptions);
    const requester = session?.user?.email
      ? await db.user.findUnique({ where: { email: session.user.email } })
      : null;

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

    const likes = await db.like.findMany({
      where: { userId },
      select: { postId: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const postIds = likes.map(l => l.postId);

    const posts = await db.post.findMany({
      where: { id: { in: postIds }, isPublic: true },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, school: true, grade: true },
        },
        _count: { select: { likes: true, comments: true, pools: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await db.like.count({ where: { userId } });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked posts' },
      { status: 500 }
    );
  }
}



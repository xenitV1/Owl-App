import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/communities/[id]/posts - Get posts from a specific community
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if community exists
    const community = await db.community.findUnique({
      where: { id: params.id }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    const posts = await db.post.findMany({
      where: {
        communityId: params.id,
        isPublic: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            school: true,
            grade: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pools: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await db.post.count({
      where: {
        communityId: params.id,
        isPublic: true
      }
    });

    return NextResponse.json({
      posts,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community posts' },
      { status: 500 }
    );
  }
}

// POST /api/communities/[id]/posts - Create a post in a community
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;

    // Use NextAuth session instead of Firebase tokens
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the community
    const membership = await db.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: params.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this community to post' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, image, subject } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post title is required' },
        { status: 400 }
      );
    }

    // Create post
    const post = await db.post.create({
      data: {
        title: title.trim(),
        content: content?.trim() || null,
        image: image || null,
        subject: subject?.trim() || null,
        authorId: user.id,
        communityId: params.id,
        isPublic: true
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            school: true,
            grade: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pools: true
          }
        }
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { error: 'Failed to create community post' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/groups/[id]/posts - Get posts from a specific group
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a member of the group
    const membership = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUser.uid,
          groupId: params.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this group.' },
        { status: 403 }
      );
    }

    // Check if group exists
    const group = await db.privateGroup.findUnique({
      where: { id: params.id }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const posts = await db.post.findMany({
      where: {
        groupId: params.id
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
        group: {
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
        groupId: params.id
      }
    });

    return NextResponse.json({
      posts,
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group posts' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/posts - Create a post in a group
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a member of the group
    const membership = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUser.uid,
          groupId: params.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to post' },
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
        authorId: currentUser.uid,
        groupId: params.id,
        isPublic: false // Group posts are private by default
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
        group: {
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
    console.error('Error creating group post:', error);
    return NextResponse.json(
      { error: 'Failed to create group post' },
      { status: 500 }
    );
  }
}
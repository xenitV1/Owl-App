import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/communities/[id] - Get a specific community
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const community = await db.community.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                school: true,
                grade: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        posts: {
          include: {
            author: {
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
          take: 10
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    });

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(community);
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    );
  }
}

// PUT /api/communities/[id] - Update a community
export async function PUT(request: NextRequest, context: RouteContext) {
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

    const body = await request.json();
    const { name, description, avatar } = body;

    // Check if user is admin of the community
    const membership = await db.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: currentUser.uid,
          communityId: params.id
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only community admins can update the community' },
        { status: 403 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (name && name.trim().length > 0) {
      const existingCommunity = await db.community.findFirst({
        where: {
          name: name.trim(),
          NOT: {
            id: params.id
          }
        }
      });

      if (existingCommunity) {
        return NextResponse.json(
          { error: 'Community with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedCommunity = await db.community.update({
      where: { id: params.id },
      data: {
        name: name ? name.trim() : undefined,
        description: description ? description.trim() : undefined,
        avatar: avatar || undefined
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    });

    return NextResponse.json(updatedCommunity);
  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id] - Delete a community
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Check if user is admin of the community
    const membership = await db.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: currentUser.uid,
          communityId: params.id
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only community admins can delete the community' },
        { status: 403 }
      );
    }

    await db.community.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    );
  }
}
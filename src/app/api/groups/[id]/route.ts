import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/groups/[id] - Get a specific group
export async function GET(request: NextRequest, context: RouteContext) {
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
        { error: 'Access denied. You are not a member of this group.' },
        { status: 403 }
      );
    }

    const group = await db.privateGroup.findUnique({
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

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update a group
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

    // Check if user is admin of the group
    const membership = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUser.uid,
          groupId: params.id
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can update the group' },
        { status: 403 }
      );
    }

    const updatedGroup = await db.privateGroup.update({
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

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete a group
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

    // Check if user is admin of the group
    const membership = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUser.uid,
          groupId: params.id
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can delete the group' },
        { status: 403 }
      );
    }

    await db.privateGroup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
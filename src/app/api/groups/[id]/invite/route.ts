import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/groups/[id]/invite - Invite users to a group
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

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
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
        { error: 'Only group admins can invite users' },
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

    // Filter out users who are already members
    const existingMembers = await db.groupMember.findMany({
      where: {
        groupId: params.id,
        userId: {
          in: userIds
        }
      }
    });

    const existingMemberIds = existingMembers.map(m => m.userId);
    const newUserIds = userIds.filter((id: string) => !existingMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { error: 'All users are already members of this group' },
        { status: 400 }
      );
    }

    // Add new members
    const newMembers = await db.groupMember.createMany({
      data: newUserIds.map((userId: string) => ({
        userId,
        groupId: params.id,
        role: 'member'
      }))
    });

    // Get the newly added members with user details
    const addedMembers = await db.groupMember.findMany({
      where: {
        groupId: params.id,
        userId: {
          in: newUserIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `Successfully invited ${newUserIds.length} user(s) to the group`,
      addedMembers
    });
  } catch (error) {
    console.error('Error inviting users to group:', error);
    return NextResponse.json(
      { error: 'Failed to invite users to group' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/invite - Remove users from a group
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin of the group or if user is removing themselves
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
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Only admins can remove other users, users can remove themselves
    if (currentUser.uid !== userId && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can remove other members' },
        { status: 403 }
      );
    }

    // Check if the user to be removed is an admin
    const targetMembership = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: params.id
        }
      }
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 400 }
      );
    }

    // Check if removing the last admin
    if (targetMembership.role === 'admin') {
      const adminCount = await db.groupMember.count({
        where: {
          groupId: params.id,
          role: 'admin'
        }
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin. Please promote another member to admin first.' },
          { status: 400 }
        );
      }
    }

    // Remove user from group
    await db.groupMember.delete({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: params.id
        }
      }
    });

    return NextResponse.json({ message: 'User removed from group successfully' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from group' },
      { status: 500 }
    );
  }
}
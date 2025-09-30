import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/communities/[id]/join - Join a community
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

    // Check if user is already a member
    const existingMembership = await db.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: params.id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this community' },
        { status: 400 }
      );
    }

    // Join community
    const membership = await db.communityMember.create({
      data: {
        userId: user.id,
        communityId: params.id,
        role: 'member'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error('Error joining community:', error);
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id]/join - Leave a community
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Check if user is a member
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
        { error: 'You are not a member of this community' },
        { status: 400 }
      );
    }

    // Check if user is the only admin
    if (membership.role === 'admin') {
      const adminCount = await db.communityMember.count({
        where: {
          communityId: params.id,
          role: 'admin'
        }
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot leave community as the only admin. Please promote another member to admin first.' },
          { status: 400 }
        );
      }
    }

    // Leave community
    await db.communityMember.delete({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: params.id
        }
      }
    });

    return NextResponse.json({ message: 'Left community successfully' });
  } catch (error) {
    console.error('Error leaving community:', error);
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    );
  }
}
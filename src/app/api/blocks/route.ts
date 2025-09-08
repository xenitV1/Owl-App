import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blockedId, reason } = body;

    if (!blockedId) {
      return NextResponse.json({ error: 'Blocked user ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is trying to block themselves
    if (user.id === blockedId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const existingBlock = await db.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: blockedId
        }
      }
    });

    if (existingBlock) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
    }

    // Create the block
    const block = await db.userBlock.create({
      data: {
        blockerId: user.id,
        blockedId: blockedId,
        reason: reason || undefined
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Remove any existing follow relationship
    await db.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: blockedId },
          { followerId: blockedId, followingId: user.id }
        ]
      }
    });

    return NextResponse.json({ 
      message: 'User blocked successfully',
      block 
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const blockedUsers = await db.userBlock.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            school: true,
            grade: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ blockedUsers });

  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
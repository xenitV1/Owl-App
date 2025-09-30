import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
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

  try {

    // Check if user is trying to block themselves
    if (user.id === blockedId) {
      console.log('Block attempt: User trying to block themselves', { userId: user.id, blockedId });
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { id: blockedId },
      select: { id: true, email: true, name: true }
    });

    if (!targetUser) {
      console.log('Block attempt: Target user not found', { blockedId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      console.log('Block attempt: User already blocked', { blockerId: user.id, blockedId });
      return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
    }

    // Create the block
    console.log('Creating block', {
      blockerId: user.id,
      blockedId: blockedId,
      blockerEmail: user.email,
      blockedEmail: targetUser.email
    });

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

    console.log('Block created successfully', { blockId: block.id });

    return NextResponse.json({
      message: 'User blocked successfully',
      block
    });

    } catch (error) {
      console.error('Error blocking user:', error);
      console.error('Error details:', {
        userId: user?.id,
        userEmail: user?.email,
        blockedId: blockedId,
        reason: reason
      });
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
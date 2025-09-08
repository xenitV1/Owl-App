import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createFollowNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { followingId } = await request.json();

    if (!followingId) {
      return NextResponse.json({ error: 'Following ID is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is trying to follow themselves
    if (currentUser.id === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: followingId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await db.follow.delete({
        where: { id: existingFollow.id }
      });

      return NextResponse.json({ 
        message: 'Unfollowed successfully',
        following: false 
      });
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: followingId
        }
      });

      // Create notification for the user being followed
      await createFollowNotification(followingId, currentUser.id);

      return NextResponse.json({ 
        message: 'Followed successfully',
        following: true 
      });
    }
  } catch (error) {
    console.error('Error in follow/unfollow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
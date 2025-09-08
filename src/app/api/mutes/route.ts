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
    const { mutedId, reason, duration } = body;

    if (!mutedId) {
      return NextResponse.json({ error: 'Muted user ID is required' }, { status: 400 });
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is trying to mute themselves
    if (user.id === mutedId) {
      return NextResponse.json({ error: 'Cannot mute yourself' }, { status: 400 });
    }

    // Check if already muted
    const existingMute = await db.userMute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: mutedId
        }
      }
    });

    if (existingMute) {
      return NextResponse.json({ error: 'User is already muted' }, { status: 400 });
    }

    // Calculate expiration date if duration is provided
    let expiresAt: Date | null = null;
    if (duration) {
      const durationMs = parseDuration(duration);
      if (durationMs) {
        expiresAt = new Date(Date.now() + durationMs);
      }
    }

    // Create the mute
    const mute = await db.userMute.create({
      data: {
        muterId: user.id,
        mutedId: mutedId,
        reason: reason || undefined,
        expiresAt
      },
      include: {
        muted: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'User muted successfully',
      mute 
    });

  } catch (error) {
    console.error('Error muting user:', error);
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

    const mutedUsers = await db.userMute.findMany({
      where: { muterId: user.id },
      include: {
        muted: {
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

    // Filter out expired mutes
    const activeMutes = mutedUsers.filter(mute => 
      !mute.expiresAt || mute.expiresAt > new Date()
    );

    return NextResponse.json({ mutedUsers: activeMutes });

  } catch (error) {
    console.error('Error fetching muted users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to parse duration strings like "1h", "7d", "30d"
function parseDuration(duration: string): number | null {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000; // seconds
    case 'm':
      return value * 60 * 1000; // minutes
    case 'h':
      return value * 60 * 60 * 1000; // hours
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days
    default:
      return null;
  }
}
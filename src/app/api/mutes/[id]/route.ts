import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
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

    // Check if the mute exists and belongs to the current user
    const mute = await db.userMute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: params.id
        }
      }
    });

    if (!mute) {
      return NextResponse.json({ error: 'Mute not found' }, { status: 404 });
    }

    // Delete the mute
    await db.userMute.delete({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: params.id
        }
      }
    });

    return NextResponse.json({ 
      message: 'User unmuted successfully' 
    });

  } catch (error) {
    console.error('Error unmuting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
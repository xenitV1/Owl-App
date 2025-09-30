import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { userId } = await context.params;

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    let currentUser: any = null;

    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email }
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user has blocked the target user
    const currentUserBlockedTarget = await db.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUser.id,
          blockedId: userId
        }
      }
    });

    // Check if target user has blocked the current user
    const targetUserBlockedCurrent = await db.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: currentUser.id
        }
      }
    });

    const isBlocked = !!(currentUserBlockedTarget || targetUserBlockedCurrent);

    return NextResponse.json({ 
      isBlocked,
      currentUserBlockedTarget: !!currentUserBlockedTarget,
      targetUserBlockedCurrent: !!targetUserBlockedCurrent
    });

  } catch (error) {
    console.error('Error checking block status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { school: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    // Get users with counts
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        school: true,
        grade: true,
        favoriteSubject: true,
        isVerified: true,
        createdAt: true,
        avatar: true,
        bio: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reports: true,
            moderationActions: {
              where: {
                OR: [
                  { type: 'ACCOUNT_SUSPENSION' },
                  { type: 'ACCOUNT_BAN' }
                ]
              }
            }
          }
        },
        moderationActions: {
          where: {
            OR: [
              { type: 'ACCOUNT_SUSPENSION' },
              { type: 'ACCOUNT_BAN' }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Process users to check suspension/ban status
    const processedUsers = users.map(user => {
      const latestAction = user.moderationActions[0];
      const isSuspended = latestAction?.type === 'ACCOUNT_SUSPENSION' && 
                         (!latestAction.expiresAt || latestAction.expiresAt > new Date());
      const isBanned = latestAction?.type === 'ACCOUNT_BAN';

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        grade: user.grade,
        favoriteSubject: user.favoriteSubject,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        postCount: user._count.posts,
        commentCount: user._count.comments,
        reportCount: user._count.reports,
        moderationActionCount: user._count.moderationActions,
        isSuspended,
        isBanned,
        latestModerationAction: latestAction ? {
          type: latestAction.type,
          reason: latestAction.reason,
          createdAt: latestAction.createdAt,
          expiresAt: latestAction.expiresAt
        } : null
      };
    });

    // Get total count for pagination
    const total = await db.user.count({ where });

    return NextResponse.json({
      users: processedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await db.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true, id: true, name: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { userId, action, reason } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow actions on other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot perform action on admin user' }, { status: 403 });
    }

    let moderationActionType;
    let updateUser = {};

    switch (action) {
      case 'suspend':
        moderationActionType = 'ACCOUNT_SUSPENSION';
        updateUser = { /* Add suspension fields if needed */ };
        break;
      case 'ban':
        moderationActionType = 'ACCOUNT_BAN';
        updateUser = { /* Add ban fields if needed */ };
        break;
      case 'restore':
        // Restore user by ending suspension/ban
        updateUser = { /* Restore user fields */ };
        break;
      case 'verify':
        updateUser = { isVerified: true };
        break;
      case 'unverify':
        updateUser = { isVerified: false };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user if needed
    if (Object.keys(updateUser).length > 0) {
      await db.user.update({
        where: { id: userId },
        data: updateUser
      });
    }

    // Create moderation action record
    if (moderationActionType) {
      await db.moderationAction.create({
        data: {
          type: moderationActionType,
          targetId: userId,
          targetType: 'USER',
          reason: reason || `User ${action}ed by admin`,
          moderatorId: admin.id
        }
      });
    }

    // Log admin activity
    await db.adminActivityLog.create({
      data: {
        action: `${action.toUpperCase()}_USER`,
        targetType: 'USER',
        targetId: userId,
        adminId: admin.id,
        details: `${admin.name} ${action}ed user ${targetUser.name} (${targetUser.email}). Reason: ${reason || 'No reason provided'}`
      }
    });

    return NextResponse.json({ 
      message: `User ${action}ed successfully`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        action: action
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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

    // Get current date and date 30 days ago for growth calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total users count
    const totalUsers = await db.user.count();

    // Get active users (users who have posted or commented in the last 30 days)
    const activeUsers = await db.user.count({
      where: {
        OR: [
          {
            posts: {
              some: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          },
          {
            comments: {
              some: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          }
        ]
      }
    });

    // Get total posts count
    const totalPosts = await db.post.count();

    // Get total reports count
    const totalReports = await db.report.count();

    // Get pending reports count
    const pendingReports = await db.report.count({
      where: { status: 'PENDING' }
    });

    // Get resolved reports count
    const resolvedReports = await db.report.count({
      where: { status: 'RESOLVED' }
    });

    // Get total communities count
    const totalCommunities = await db.community.count();

    // Get total groups count
    const totalGroups = await db.privateGroup.count();

    // Get user growth (users created in last 30 days vs previous 30 days)
    const usersLast30Days = await db.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const usersPrevious30Days = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    });

    const userGrowth = usersPrevious30Days > 0 
      ? Math.round(((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100)
      : usersLast30Days > 0 ? 100 : 0;

    // Get post growth (posts created in last 30 days vs previous 30 days)
    const postsLast30Days = await db.post.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const postsPrevious30Days = await db.post.count({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    });

    const postGrowth = postsPrevious30Days > 0 
      ? Math.round(((postsLast30Days - postsPrevious30Days) / postsPrevious30Days) * 100)
      : postsLast30Days > 0 ? 100 : 0;

    // Get report growth (reports created in last 30 days vs previous 30 days)
    const reportsLast30Days = await db.report.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const reportsPrevious30Days = await db.report.count({
      where: {
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo
        }
      }
    });

    const reportGrowth = reportsPrevious30Days > 0 
      ? Math.round(((reportsLast30Days - reportsPrevious30Days) / reportsPrevious30Days) * 100)
      : reportsLast30Days > 0 ? 100 : 0;

    const stats = {
      totalUsers,
      activeUsers,
      totalPosts,
      totalReports,
      pendingReports,
      resolvedReports,
      totalCommunities,
      totalGroups,
      userGrowth,
      postGrowth,
      reportGrowth
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
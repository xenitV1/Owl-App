import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get total users count
    const totalUsers = await db.user.count();

    // Get total posts count
    const totalPosts = await db.post.count();

    // Get total communities count
    const totalCommunities = await db.community.count();

    // Get total likes count
    const totalLikes = await db.like.count();

    // Get total comments count
    const totalComments = await db.comment.count();

    // Get total pools/saves count
    const totalSaves = await db.pool.count();

    // Get active users (users who have posted or commented in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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

    const stats = {
      totalUsers,
      totalPosts,
      totalCommunities,
      totalLikes,
      totalComments,
      totalSaves,
      activeUsers
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

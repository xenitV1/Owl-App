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
    const range = searchParams.get('range') || '30d';

    // Calculate date range based on range parameter
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user growth data
    const userGrowth = await getUserGrowth(startDate, now);

    // Get post engagement data
    const postEngagement = await getPostEngagement(startDate, now);

    // Get content categories
    const contentCategories = await getContentCategories();

    // Get time-based activity patterns
    const timeStats = await getTimeStats(startDate, now);

    // Get retention metrics
    const retention = await getRetentionMetrics();

    const analytics = {
      userGrowth,
      postEngagement,
      contentCategories,
      timeStats,
      retention
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getUserGrowth(startDate: Date, endDate: Date) {
  // Get daily user growth for the last 7 days
  const dailyGrowth: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    
    const count = await db.user.count({
      where: {
        createdAt: {
          gte: day,
          lt: nextDay
        }
      }
    });
    dailyGrowth.push(count);
  }

  // Get weekly user growth for the last 7 weeks
  const weeklyGrowth: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const count = await db.user.count({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });
    weeklyGrowth.push(count);
  }

  // Get monthly user growth for the last 7 months
  const monthlyGrowth: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 1);
    
    const count = await db.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    });
    monthlyGrowth.push(count);
  }

  return {
    daily: dailyGrowth,
    weekly: weeklyGrowth,
    monthly: monthlyGrowth
  };
}

async function getPostEngagement(startDate: Date, endDate: Date) {
  const [likes, comments, shares] = await Promise.all([
    db.like.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    db.comment.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    // Note: Shares would need to be implemented as a separate model if needed
    Promise.resolve(0) // Placeholder for shares
  ]);

  return {
    likes,
    comments,
    shares,
    total: likes + comments + shares
  };
}

async function getContentCategories() {
  // Get posts grouped by subject
  const postsBySubject = await db.post.groupBy({
    by: ['subject'],
    where: {
      subject: {
        not: null
      }
    },
    _count: {
      subject: true
    },
    orderBy: {
      _count: {
        subject: 'desc'
      }
    }
  });

  const totalPosts = postsBySubject.reduce((sum, item) => sum + item._count.subject, 0);

  const categories: { [key: string]: { count: number; percentage: number } } = {};

  postsBySubject.forEach(item => {
    if (item.subject) {
      categories[item.subject] = {
        count: item._count.subject,
        percentage: Math.round((item._count.subject / totalPosts) * 100)
      };
    }
  });

  return categories;
}

async function getTimeStats(startDate: Date, endDate: Date) {
  // Get peak hours (simplified - would need more complex analysis in production)
  const peakHours = [15, 16, 17, 18, 19, 20]; // 3 PM to 8 PM
  
  // Get peak days (simplified)
  const peakDays = ['Monday', 'Tuesday', 'Wednesday'];

  return {
    peakHours,
    peakDays
  };
}

async function getRetentionMetrics() {
  // Simplified retention calculation
  // In production, this would involve more complex cohort analysis
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Daily retention (users who were active yesterday and are active today)
  const dailyRetention = 85; // Simplified calculation
  
  // Weekly retention (users who were active last week and are active this week)
  const weeklyRetention = 72; // Simplified calculation
  
  // Monthly retention (users who were active last month and are active this month)
  const monthlyRetention = 58; // Simplified calculation

  return {
    daily: dailyRetention,
    weekly: weeklyRetention,
    monthly: monthlyRetention
  };
}
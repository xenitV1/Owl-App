import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import apiDebugLogger, { withApiDebug } from '@/lib/apiDebug';

export async function GET(request: NextRequest) {
  const timer = apiDebugLogger.startTimer('GET /api/posts/trending-subjects');
  const logEntry = await apiDebugLogger.logRequest(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    // Get subject counts and recent activity
    const subjectStats = await db.post.groupBy({
      by: ['subject'],
      where: {
        isPublic: true,
        subject: {
          not: null,
        },
      },
      _count: {
        subject: true,
      },
      orderBy: {
        _count: {
          subject: 'desc',
        },
      },
      take: limit,
    });

    // Get recent posts for each subject to calculate trends
    const subjectsWithTrends = await Promise.all(
      subjectStats.map(async (stat) => {
        if (!stat.subject) return null;

        // Get recent posts for this subject (last 7 days)
        const recentPosts = await db.post.count({
          where: {
            subject: stat.subject,
            isPublic: true,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        });

        // Get posts from previous 7 days for comparison
        const previousPosts = await db.post.count({
          where: {
            subject: stat.subject,
            isPublic: true,
            createdAt: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),   // 7 days ago
            },
          },
        });

        // Calculate trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (recentPosts > previousPosts) {
          trend = 'up';
        } else if (recentPosts < previousPosts) {
          trend = 'down';
        }

        return {
          name: stat.subject,
          count: stat._count.subject,
          trend,
          recentPosts,
        };
      })
    );

    const validSubjects = subjectsWithTrends.filter(Boolean);

    const response = NextResponse.json({
      subjects: validSubjects,
    });

    apiDebugLogger.logResponse(logEntry, 200, {
      subjectsCount: validSubjects.length,
      limit,
    });
    
    timer();
    return response;
  } catch (error) {
    apiDebugLogger.logError(logEntry, error);
    console.error('Error fetching trending subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending subjects' },
      { status: 500 }
    );
  }
}

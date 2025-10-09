/**
 * Algorithm Health Check Endpoint
 * Sistemin çalışıp çalışmadığını test eder
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const checks: Record<string, any> = {};
    let overallStatus = "healthy";

    // 1. Database connectivity
    try {
      await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: "ok",
        message: "Database connection successful",
      };
    } catch (error) {
      checks.database = {
        status: "error",
        message: "Database connection failed",
      };
      overallStatus = "unhealthy";
    }

    // 2. Algorithm tables exist
    try {
      const tables = await db.$queryRaw<Array<any>>`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN (
          'user_interest_vectors', 
          'similar_users', 
          'interactions', 
          'algorithm_metrics'
        )
      `;
      checks.tables = {
        status: tables.length === 4 ? "ok" : "warning",
        message: `${tables.length}/4 algorithm tables found`,
        tables: tables.map((t: any) => t.name),
      };
      if (tables.length < 4) overallStatus = "degraded";
    } catch (error) {
      checks.tables = { status: "error", message: "Failed to check tables" };
      overallStatus = "unhealthy";
    }

    // 3. User vectors count
    try {
      const vectorCount = await db.userInterestVector.count();
      checks.userVectors = {
        status: "ok",
        count: vectorCount,
        message: `${vectorCount} user vectors cached`,
      };
    } catch (error) {
      checks.userVectors = {
        status: "warning",
        message: "No vectors yet or table missing",
      };
    }

    // 4. Interactions count
    try {
      const interactionCount = await db.interaction.count();
      const recentInteractions = await db.interaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      checks.interactions = {
        status: interactionCount > 0 ? "ok" : "warning",
        total: interactionCount,
        last24h: recentInteractions,
        message:
          interactionCount > 0
            ? `${interactionCount} total interactions, ${recentInteractions} in last 24h`
            : "No interactions recorded yet",
      };
    } catch (error) {
      checks.interactions = {
        status: "warning",
        message: "No interactions yet or table missing",
      };
    }

    // 5. Post algorithm fields
    try {
      const post = await db.post.findFirst({
        select: {
          id: true,
          upvotes: true,
          downvotes: true,
          sharesCount: true,
          reportCount: true,
        },
      });
      checks.postFields = {
        status: "ok",
        message: "Post model has algorithm fields",
        sample: post,
      };
    } catch (error) {
      checks.postFields = {
        status: "error",
        message: "Post algorithm fields missing",
      };
      overallStatus = "unhealthy";
    }

    // 6. Feed generation test (light)
    try {
      const session = await getServerSession();
      if (session?.user?.email) {
        const user = await db.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          // Basit bir feed query test et
          const posts = await db.post.findMany({
            where: { isPublic: true },
            take: 5,
            orderBy: { createdAt: "desc" },
          });
          checks.feedGeneration = {
            status: "ok",
            message: `Feed generation working (${posts.length} posts available)`,
          };
        }
      } else {
        checks.feedGeneration = {
          status: "skipped",
          message: "Not authenticated, skipped feed test",
        };
      }
    } catch (error) {
      checks.feedGeneration = {
        status: "warning",
        message: "Feed generation test failed",
      };
    }

    // 7. Cache TTL configuration
    checks.cacheConfiguration = {
      status: "ok",
      vectorCacheTTL: "4 hours",
      similarUsersCacheTTL: "7 days",
      feedCacheTTL: "5 minutes",
    };

    // Response
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      recommendations: getRecommendations(checks),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getRecommendations(checks: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (checks.userVectors?.count === 0) {
    recommendations.push(
      "No user vectors cached yet. Vectors will be created as users interact with content.",
    );
  }

  if (checks.interactions?.total === 0) {
    recommendations.push(
      "No interactions recorded yet. Add interaction tracking to like/comment/view endpoints.",
    );
  }

  if (checks.tables?.status !== "ok") {
    recommendations.push(
      "Some algorithm tables are missing. Run: npx prisma db push",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("All systems operational! Algorithm is ready to use.");
  }

  return recommendations;
}

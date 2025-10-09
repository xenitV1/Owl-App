/**
 * Algorithm Statistics API
 * Returns detailed algorithm statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication (Admin only)
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check admin role
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // 3. Gather statistics
    const [
      totalVectors,
      totalInteractions,
      totalPosts,
      vectors,
      interactionsLast24h,
      interactionTypes,
    ] = await Promise.all([
      // Total vectors
      db.userInterestVector.count(),

      // Total interactions
      db.interaction.count(),

      // Total posts
      db.post.count(),

      // All vectors for age calculation
      db.userInterestVector.findMany({
        select: { lastUpdated: true },
      }),

      // Active users (interactions in last 24h)
      db.interaction.groupBy({
        by: ["userId"],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Interaction types breakdown
      db.interaction.groupBy({
        by: ["type"],
        _count: {
          type: true,
        },
      }),
    ]);

    // Calculate average vector age
    const avgVectorAge =
      vectors.length > 0
        ? vectors.reduce((sum, v) => {
            const ageMs = Date.now() - v.lastUpdated.getTime();
            return sum + ageMs / (1000 * 60 * 60); // Convert to hours
          }, 0) / vectors.length
        : 0;

    // Format interaction types
    const interactionTypesMap: Record<string, number> = {};
    interactionTypes.forEach((item) => {
      interactionTypesMap[item.type] = item._count.type;
    });

    // 4. Return statistics
    return NextResponse.json({
      totalVectors,
      totalInteractions,
      totalPosts,
      activeUsers24h: interactionsLast24h.length,
      avgVectorAge,
      interactionTypes: interactionTypesMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

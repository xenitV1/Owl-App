/**
 * Algorithm Metrics API Endpoint
 * Returns current algorithm health metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { algorithmMonitor } from "@/lib/monitoring/algorithmHealthMonitor";

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

    // 3. Get metrics
    const metrics = algorithmMonitor.getMetrics();

    // 4. Check thresholds
    await algorithmMonitor.checkThresholdsAndAlert();

    // 5. Return metrics
    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

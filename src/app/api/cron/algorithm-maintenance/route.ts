/**
 * Algorithm Maintenance Cron Job
 * Runs scheduled maintenance tasks
 */

import { NextRequest, NextResponse } from "next/server";
import {
  runDailyMaintenance,
  runWeeklyMaintenance,
} from "@/lib/jobs/algorithmJobs";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret (security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get maintenance type from query
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "daily";

    // 3. Run appropriate maintenance
    let result: string;

    if (type === "weekly") {
      await runWeeklyMaintenance();
      result = "Weekly maintenance completed";
    } else {
      await runDailyMaintenance();
      result = "Daily maintenance completed";
    }

    // 4. Return success
    return NextResponse.json({
      success: true,
      type,
      message: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

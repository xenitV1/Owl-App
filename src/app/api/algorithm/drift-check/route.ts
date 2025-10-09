/**
 * Drift Check API Endpoint
 * Checks if user's interests have drifted and recalculates vector if needed
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DriftDetector } from "@/lib/algorithms/driftDetection";
import {
  getInteractions,
  cacheUserInterestVector,
  invalidateUserFeed,
} from "@/lib/algorithms/helpers";
import { calculateUserInterestVector } from "@/lib/algorithms/userInterestVector";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Detect drift
    const driftDetector = new DriftDetector();
    const analysis = await driftDetector.detectConceptDrift(
      user.id,
      getInteractions,
    );

    // 4. If drift detected, recalculate vector
    if (analysis.hasDrift) {
      const interactions = await getInteractions(user.id, 30);
      const newVector = calculateUserInterestVector(interactions, 30);
      await cacheUserInterestVector(user.id, newVector);
      await invalidateUserFeed(user.id);
    }

    // 5. Return analysis
    return NextResponse.json({
      success: true,
      analysis,
      vectorRecalculated: analysis.hasDrift,
    });
  } catch (error) {
    console.error("Drift check error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

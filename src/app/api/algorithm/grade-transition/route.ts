/**
 * Grade Transition API Endpoint
 * Handles user grade transitions smoothly
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { DriftDetector } from "@/lib/algorithms/driftDetection";
import {
  getUserInterestVector,
  cacheUserInterestVector,
  invalidateUserFeed,
} from "@/lib/algorithms/helpers";

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
      select: { id: true, grade: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { newGrade } = body;

    if (!newGrade) {
      return NextResponse.json(
        { error: "New grade is required" },
        { status: 400 },
      );
    }

    // 4. Handle grade transition
    const oldGrade = user.grade || "General";
    const driftDetector = new DriftDetector();

    await driftDetector.handleGradeTransition(
      user.id,
      oldGrade,
      newGrade,
      getUserInterestVector,
      cacheUserInterestVector,
      invalidateUserFeed,
    );

    // 5. Update user grade in database
    await db.user.update({
      where: { id: user.id },
      data: { grade: newGrade },
    });

    // 6. Return success
    return NextResponse.json({
      success: true,
      oldGrade,
      newGrade,
      message: "Grade transition completed successfully",
    });
  } catch (error) {
    console.error("Grade transition error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

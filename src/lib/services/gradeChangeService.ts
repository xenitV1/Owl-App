/**
 * Grade Change Service
 *
 * Handles grade change requests with 24-hour pending period
 */

import { db } from "@/lib/db";
import { autoJoinUserToCommunity } from "./systemCommunityService";

interface GradeChangeResult {
  success: boolean;
  hoursRemaining?: number;
  scheduledFor?: Date;
  message: string;
}

/**
 * Request a grade change (will be applied after 24 hours)
 */
export async function requestGradeChange(
  userId: string,
  newGrade: string,
): Promise<GradeChangeResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // Check if user has a pending grade change
  const existingPending = await db.pendingGradeChange.findUnique({
    where: { userId },
  });

  if (existingPending) {
    return {
      success: false,
      message: "You already have a pending grade change",
      scheduledFor: existingPending.scheduledFor,
    };
  }

  // Check 24-hour limit
  if (user.lastGradeChange) {
    const hoursSinceChange =
      (Date.now() - user.lastGradeChange.getTime()) / (1000 * 60 * 60);
    if (hoursSinceChange < 24) {
      return {
        success: false,
        hoursRemaining: Math.ceil(24 - hoursSinceChange),
        message: "You can change grade once every 24 hours",
      };
    }
  }

  // Schedule change for 24 hours from now
  const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.pendingGradeChange.create({
    data: {
      userId,
      currentGrade: user.grade || "",
      newGrade,
      scheduledFor,
    },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      pendingGrade: newGrade,
      pendingGradeDate: new Date(),
    },
  });

  return {
    success: true,
    scheduledFor,
    message: "Grade change scheduled successfully",
  };
}

/**
 * Cancel a pending grade change
 */
export async function cancelPendingGradeChange(
  userId: string,
): Promise<boolean> {
  const pending = await db.pendingGradeChange.findUnique({
    where: { userId },
  });

  if (!pending) {
    return false;
  }

  await db.pendingGradeChange.delete({
    where: { userId },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      pendingGrade: null,
      pendingGradeDate: null,
    },
  });

  return true;
}

/**
 * Apply all pending grade changes that are due
 * This should be called by a cron job every hour
 */
export async function applyPendingGradeChanges(): Promise<number> {
  const pending = await db.pendingGradeChange.findMany({
    where: {
      scheduledFor: {
        lte: new Date(),
      },
    },
  });

  console.log(
    `[GradeChangeService] Found ${pending.length} pending grade changes to apply`,
  );

  let successCount = 0;

  for (const change of pending) {
    try {
      // Update user grade
      await db.user.update({
        where: { id: change.userId },
        data: {
          grade: change.newGrade,
          lastGradeChange: new Date(),
          pendingGrade: null,
          pendingGradeDate: null,
        },
      });

      // Re-assign to new community
      const user = await db.user.findUnique({
        where: { id: change.userId },
      });

      if (user?.country) {
        await autoJoinUserToCommunity(
          change.userId,
          user.country,
          change.newGrade,
        );
        console.log(
          `[GradeChangeService] User ${change.userId} reassigned to ${user.country} - ${change.newGrade}`,
        );
      }

      // Delete pending record
      await db.pendingGradeChange.delete({
        where: { id: change.id },
      });

      successCount++;
    } catch (error) {
      console.error(
        `[GradeChangeService] Error applying grade change for user ${change.userId}:`,
        error,
      );
    }
  }

  console.log(
    `[GradeChangeService] Successfully applied ${successCount}/${pending.length} grade changes`,
  );

  return successCount;
}

/**
 * Get pending grade change for a user
 */
export async function getPendingGradeChange(userId: string) {
  return await db.pendingGradeChange.findUnique({
    where: { userId },
  });
}

/**
 * Check if user can change grade immediately
 */
export async function canChangeGradeNow(userId: string): Promise<{
  canChange: boolean;
  hoursRemaining?: number;
  reason?: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      canChange: false,
      reason: "User not found",
    };
  }

  // Check for pending change
  const pending = await getPendingGradeChange(userId);
  if (pending) {
    return {
      canChange: false,
      reason: "You already have a pending grade change",
    };
  }

  // Check 24-hour limit
  if (user.lastGradeChange) {
    const hoursSinceChange =
      (Date.now() - user.lastGradeChange.getTime()) / (1000 * 60 * 60);
    if (hoursSinceChange < 24) {
      return {
        canChange: false,
        hoursRemaining: Math.ceil(24 - hoursSinceChange),
        reason: "You can change grade once every 24 hours",
      };
    }
  }

  return { canChange: true };
}

/**
 * Algorithm Background Jobs
 * Scheduled maintenance tasks for the recommendation algorithm
 */

import { prisma } from "@/lib/db";
import { DriftDetector } from "@/lib/algorithms/driftDetection";
import { forceRecalculateVector } from "@/lib/algorithms/stableVectorManager";
import { getInteractions } from "@/lib/algorithms/helpers";
import { pruneVector } from "@/lib/algorithms/userInterestVector";
import { algorithmMonitor } from "@/lib/monitoring/algorithmHealthMonitor";

/**
 * Daily Maintenance Job
 * - Cleanup old interactions (30+ days)
 * - Drift detection for active users
 * - Vector pruning (memory leak prevention)
 */
export async function runDailyMaintenance(): Promise<void> {
  console.log("🧹 Starting daily algorithm maintenance...");
  const startTime = Date.now();

  try {
    // 1. Cleanup old interactions (30+ days)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedInteractions = await prisma.interaction.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    console.log(
      `   ✅ Deleted ${deletedInteractions.count} old interactions (30+ days)`,
    );

    // 2. Drift detection for active users (last 7 days)
    const activeUsers = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, name: true },
    });

    console.log(
      `   📊 Checking ${activeUsers.length} active users for drift...`,
    );

    const driftDetector = new DriftDetector();
    let driftCount = 0;

    for (const user of activeUsers) {
      try {
        const analysis = await driftDetector.detectConceptDrift(
          user.id,
          getInteractions,
        );

        if (analysis.hasDrift) {
          await forceRecalculateVector(user.id);
          driftCount++;
          console.log(
            `      ↻ Drift detected for user ${user.name || user.id}, vector recalculated`,
          );
        }

        // ✅ MONITORING: Track drift detection result
        algorithmMonitor.recordDriftDetection(analysis.hasDrift);
      } catch (error) {
        console.error(
          `      ⚠️  Failed to check drift for user ${user.id}:`,
          error,
        );
      }
    }

    console.log(
      `   ✅ Drift detection complete: ${driftCount}/${activeUsers.length} users updated`,
    );

    // 3. Vector pruning (prevent memory leak)
    const allVectors = await prisma.userInterestVector.findMany({
      select: { id: true, userId: true, subjects: true },
    });

    let prunedCount = 0;
    for (const vector of allVectors) {
      try {
        const subjects = JSON.parse(vector.subjects);
        const subjectCount = Object.keys(subjects).length;

        // Only prune if too many subjects (>50)
        if (subjectCount > 50) {
          const prunedSubjects = pruneVector(subjects, 50);
          await prisma.userInterestVector.update({
            where: { id: vector.id },
            data: { subjects: JSON.stringify(prunedSubjects) },
          });
          prunedCount++;
        }
      } catch (error) {
        console.error(`      ⚠️  Failed to prune vector ${vector.id}:`, error);
      }
    }

    if (prunedCount > 0) {
      console.log(
        `   ✅ Pruned ${prunedCount} user vectors (memory optimization)`,
      );
    } else {
      console.log(`   ✅ No vectors needed pruning`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Daily maintenance completed in ${duration}s\n`);
  } catch (error) {
    console.error("❌ Daily maintenance failed:", error);
    throw error;
  }
}

/**
 * Weekly Maintenance Job
 * - Recalculate similar users cache
 * - Cleanup old similar users entries
 */
export async function runWeeklyMaintenance(): Promise<void> {
  console.log("🔄 Starting weekly algorithm maintenance...");
  const startTime = Date.now();

  try {
    // 1. Cleanup old similar users cache (30+ days)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedSimilarUsers = await prisma.similarUser.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
    });
    console.log(
      `   ✅ Deleted ${deletedSimilarUsers.count} old similar user entries`,
    );

    // 2. Recalculate similar users for active users
    // Note: This is expensive, so we only do it weekly
    // In a production system with many users, you'd want to:
    // - Use approximate LSH instead of exact similarity
    // - Process users in batches
    // - Run this during low-traffic hours

    const activeUsersCount = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(
      `   📊 Found ${activeUsersCount} active users for similarity recalculation`,
    );
    console.log(`   ⚠️  Similar user recalculation is currently manual`);
    console.log(
      `   💡 For large user bases, implement LSH-based approximate CF`,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✨ Weekly maintenance completed in ${duration}s\n`);
  } catch (error) {
    console.error("❌ Weekly maintenance failed:", error);
    throw error;
  }
}

/**
 * Cleanup algorithm metrics (monthly)
 * Keeps only last 90 days of metrics
 */
export async function cleanupOldMetrics(): Promise<void> {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.algorithmMetrics.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log(`✅ Deleted ${deleted.count} old algorithm metrics (90+ days)`);
}

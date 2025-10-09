/**
 * Algorithm Migration Framework
 *
 * Manages phased rollout of new algorithm versions.
 * Includes A/B testing, metrics tracking, and rollback capabilities.
 */

import { db } from "../db";

export enum MigrationPhase {
  PHASE_0_DATA_COLLECTION = "data_collection",
  PHASE_1_SHADOW_MODE = "shadow_mode",
  PHASE_2_AB_TEST = "ab_test",
  PHASE_3_GRADUAL_ROLLOUT = "gradual_rollout",
  PHASE_4_FULL_MIGRATION = "full_migration",
  PHASE_5_OPTIMIZATION = "optimization",
}

export interface MigrationDecisionCriteria {
  minImprovement: {
    sessionDuration: number;
    contentLikes: number;
    returnRate: number;
  };
  maxRegression: {
    errorRate: number;
    latency: number;
  };
  minimumTestDuration: number; // days
  minimumSampleSize: number;
}

export const MIGRATION_CRITERIA: MigrationDecisionCriteria = {
  minImprovement: {
    sessionDuration: 0.1, // %10 artış şart
    contentLikes: 0.15, // %15 artış şart
    returnRate: 0.05, // %5 artış şart
  },
  maxRegression: {
    errorRate: 0.02, // %2 error artışı kabul edilir
    latency: 0.2, // %20 latency artışı kabul edilir
  },
  minimumTestDuration: 14, // 14 gün test
  minimumSampleSize: 1000,
};

export interface MigrationMetrics {
  improvement: {
    sessionDuration: number;
    contentLikes: number;
    returnRate: number;
  };
  newAlgoMetrics: {
    errorRate: number;
    latency: number;
  };
  sampleSize: number;
  testDuration: number; // days
}

export class MigrationManager {
  /**
   * Get current migration phase
   */
  async getCurrentPhase(): Promise<MigrationPhase> {
    const config = await (db as any).systemConfig.findUnique({
      where: { key: "migration_phase" },
    });

    if (!config) {
      return MigrationPhase.PHASE_0_DATA_COLLECTION;
    }

    return JSON.parse(config.value).phase as MigrationPhase;
  }

  /**
   * Set migration phase
   */
  async setPhase(phase: MigrationPhase): Promise<void> {
    await (db as any).systemConfig.upsert({
      where: { key: "migration_phase" },
      create: {
        key: "migration_phase",
        value: JSON.stringify({ phase, updatedAt: new Date() }),
      },
      update: {
        value: JSON.stringify({ phase, updatedAt: new Date() }),
      },
    });

    console.log(`[Migration] Phase set to: ${phase}`);
  }

  /**
   * Assign user to algorithm variant (for A/B testing)
   */
  async assignUserVariant(userId: string): Promise<"control" | "treatment"> {
    // Check if already assigned
    const existing = await (db as any).systemConfig.findUnique({
      where: { key: `user_variant:${userId}` },
    });

    if (existing) {
      return JSON.parse(existing.value).variant;
    }

    // Assign randomly (50/50 split)
    const variant = Math.random() < 0.5 ? "control" : "treatment";

    await (db as any).systemConfig.create({
      data: {
        key: `user_variant:${userId}`,
        value: JSON.stringify({ variant, assignedAt: new Date() }),
      },
    });

    return variant;
  }

  /**
   * Get migration metrics
   */
  async getMigrationMetrics(): Promise<MigrationMetrics> {
    // Get metrics for both control and treatment groups
    const controlMetrics = await (db as any).algorithmMetrics.aggregate({
      where: { algorithmVersion: "control" },
      _avg: {
        sessionDuration: true,
        contentLikes: true,
        returnRate: true,
      },
      _count: true,
    });

    const treatmentMetrics = await (db as any).algorithmMetrics.aggregate({
      where: { algorithmVersion: "treatment" },
      _avg: {
        sessionDuration: true,
        contentLikes: true,
        returnRate: true,
      },
      _count: true,
    });

    // Calculate improvements
    const improvement = {
      sessionDuration:
        (treatmentMetrics._avg.sessionDuration || 0) /
          (controlMetrics._avg.sessionDuration || 1) -
        1,
      contentLikes:
        (treatmentMetrics._avg.contentLikes || 0) /
          (controlMetrics._avg.contentLikes || 1) -
        1,
      returnRate:
        (treatmentMetrics._avg.returnRate || 0) /
          (controlMetrics._avg.returnRate || 1) -
        1,
    };

    // Get latest metrics record for duration
    const latestMetric = await (db as any).algorithmMetrics.findFirst({
      where: { algorithmVersion: "treatment" },
      orderBy: { createdAt: "asc" },
    });

    const testDuration = latestMetric
      ? (Date.now() - latestMetric.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      improvement,
      newAlgoMetrics: {
        errorRate: 0, // TODO: Calculate from actual error logs
        latency: 0, // TODO: Calculate from performance metrics
      },
      sampleSize: treatmentMetrics._count || 0,
      testDuration,
    };
  }

  /**
   * Check if should advance to next phase
   */
  async shouldAdvancePhase(): Promise<boolean> {
    const currentPhase = await this.getCurrentPhase();

    if (currentPhase === MigrationPhase.PHASE_2_AB_TEST) {
      const metrics = await this.getMigrationMetrics();

      // Check minimum requirements
      if (metrics.sampleSize < MIGRATION_CRITERIA.minimumSampleSize) {
        console.log(
          `[Migration] Sample size too small: ${metrics.sampleSize}/${MIGRATION_CRITERIA.minimumSampleSize}`,
        );
        return false;
      }

      if (metrics.testDuration < MIGRATION_CRITERIA.minimumTestDuration) {
        console.log(
          `[Migration] Test duration too short: ${metrics.testDuration}/${MIGRATION_CRITERIA.minimumTestDuration} days`,
        );
        return false;
      }

      // Check improvement criteria
      const meetsImprovement =
        metrics.improvement.sessionDuration >=
          MIGRATION_CRITERIA.minImprovement.sessionDuration &&
        metrics.improvement.contentLikes >=
          MIGRATION_CRITERIA.minImprovement.contentLikes &&
        metrics.improvement.returnRate >=
          MIGRATION_CRITERIA.minImprovement.returnRate;

      // Check regression limits
      const meetsRegression =
        metrics.newAlgoMetrics.errorRate <=
          MIGRATION_CRITERIA.maxRegression.errorRate &&
        metrics.newAlgoMetrics.latency <=
          MIGRATION_CRITERIA.maxRegression.latency;

      const shouldAdvance = meetsImprovement && meetsRegression;

      console.log(`[Migration] Evaluation:`, {
        meetsImprovement,
        meetsRegression,
        shouldAdvance,
      });

      return shouldAdvance;
    }

    // Other phases auto-advance (manual control recommended)
    return true;
  }

  /**
   * Rollback to previous version
   */
  async rollback(reason: string): Promise<void> {
    console.warn(`[Migration] ROLLBACK initiated: ${reason}`);

    await this.setPhase(MigrationPhase.PHASE_0_DATA_COLLECTION);

    // Log rollback event
    await (db as any).systemConfig.create({
      data: {
        key: `rollback:${Date.now()}`,
        value: JSON.stringify({ reason, timestamp: new Date() }),
      },
    });
  }
}

/**
 * Global migration manager instance
 */
export const globalMigrationManager = new MigrationManager();

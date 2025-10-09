/**
 * Drift Detection & Adaptation
 * Detects when user interests change over time
 */

import {
  calculateUserInterestVector,
  calculateCosineSimilarity,
  type UserInterestVector,
  type Interaction,
} from "./userInterestVector";

export interface DriftAnalysis {
  hasDrift: boolean;
  driftSeverity: number;
  recommendation: "RECALCULATE_VECTOR" | "CONTINUE";
  affectedSubjects: string[];
}

/**
 * Find subjects that have drifted significantly
 */
function findDriftingSubjects(
  recentVector: UserInterestVector,
  historicalVector: UserInterestVector,
): string[] {
  const drifting: string[] = [];
  const allSubjects = new Set([
    ...Object.keys(recentVector.subjects),
    ...Object.keys(historicalVector.subjects),
  ]);

  allSubjects.forEach((subject) => {
    const recentScore = recentVector.subjects[subject] || 0;
    const historicalScore = historicalVector.subjects[subject] || 0;
    const change = Math.abs(recentScore - historicalScore);

    // Significant change detected
    if (change > 0.2) {
      drifting.push(subject);
    }
  });

  return drifting;
}

export class DriftDetector {
  /**
   * Detect concept drift by comparing recent vs historical interactions
   */
  async detectConceptDrift(
    userId: string,
    getInteractions: (
      userId: string,
      startDays: number,
      endDays?: number,
    ) => Promise<Interaction[]>,
  ): Promise<DriftAnalysis> {
    // Son 30 gün vs önceki 90 gün karşılaştırması
    const recentInteractions = await getInteractions(userId, 30);
    const historicalInteractions = await getInteractions(userId, 30, 90);

    const recentVector = calculateUserInterestVector(recentInteractions, 30);
    const historicalVector = calculateUserInterestVector(
      historicalInteractions,
      60,
    );

    const similarity = calculateCosineSimilarity(
      recentVector.subjects,
      historicalVector.subjects,
    );

    return {
      hasDrift: similarity < 0.6, // %40+ değişim = drift
      driftSeverity: 1 - similarity,
      recommendation: similarity < 0.6 ? "RECALCULATE_VECTOR" : "CONTINUE",
      affectedSubjects: findDriftingSubjects(recentVector, historicalVector),
    };
  }

  /**
   * Handle grade transition smoothly
   * Subject interests are preserved, grade weights are updated
   */
  async handleGradeTransition(
    userId: string,
    oldGrade: string,
    newGrade: string,
    getUserVector: (userId: string) => Promise<UserInterestVector>,
    cacheVector: (userId: string, vector: UserInterestVector) => Promise<void>,
    invalidateFeed: (userId: string) => Promise<void>,
  ): Promise<void> {
    const oldVector = await getUserVector(userId);

    // Subject interests korunur, grade güncellenir
    const newVector: UserInterestVector = {
      subjects: oldVector.subjects, // Konular aynı kalır
      grades: {
        [newGrade]: 1.0,
        [oldGrade]: 0.3, // Geçiş dönemi için hafif ağırlık
      },
      metadata: {
        lastUpdated: new Date(),
        driftScore: 0,
        diversityScore: oldVector.metadata.diversityScore,
      },
    };

    await cacheVector(userId, newVector);
    await invalidateFeed(userId);
  }
}

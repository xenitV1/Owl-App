/**
 * Cold Start Strategy
 * Handles new users with limited interaction history
 */

import type { User } from "@prisma/client";
import type { UserInterestVector } from "./userInterestVector";

export interface ScoringWeights {
  timeDecay: number;
  wilsonScore: number;
  userInterest: number;
  collaborative: number;
  communityInfluence: number;
}

/**
 * Get scoring weights based on user maturity
 */
export function getColdStartStrategy(user: User): ScoringWeights {
  const accountAge = Date.now() - user.createdAt.getTime();
  const interactionCount = user.totalInteractions || 0;

  // Yeni kullanıcı (< 7 gün veya < 10 etkileşim)
  if (accountAge < 7 * 24 * 60 * 60 * 1000 || interactionCount < 10) {
    return {
      timeDecay: 0.4, // Popüler içerik
      wilsonScore: 0.3, // Kaliteli içerik
      userInterest: 0.0, // Henüz yok
      collaborative: 0.0, // Henüz yok
      communityInfluence: 0.3, // Grade-based default
    };
  }

  // Orta seviye (7-30 gün)
  if (accountAge < 30 * 24 * 60 * 60 * 1000 || interactionCount < 50) {
    return {
      timeDecay: 0.3,
      wilsonScore: 0.25,
      userInterest: 0.2, // Yavaş devreye giriş
      collaborative: 0.1,
      communityInfluence: 0.15,
    };
  }

  // Olgun kullanıcı
  return {
    timeDecay: 0.25,
    wilsonScore: 0.2,
    userInterest: 0.3,
    collaborative: 0.15,
    communityInfluence: 0.1,
  };
}

/**
 * Get default interests based on grade
 */
export function getDefaultInterestsByGrade(grade: string): UserInterestVector {
  const gradeDefaults: Record<string, Partial<UserInterestVector>> = {
    "9th Grade": {
      subjects: {
        math: 0.3,
        science: 0.3,
        literature: 0.2,
        history: 0.1,
        english: 0.1,
      },
      grades: { "9th Grade": 1.0 },
    },
    "10th Grade": {
      subjects: {
        physics: 0.3,
        chemistry: 0.2,
        math: 0.3,
        biology: 0.1,
        literature: 0.1,
      },
      grades: { "10th Grade": 1.0 },
    },
    "11th Grade": {
      subjects: {
        math: 0.25,
        physics: 0.25,
        chemistry: 0.2,
        biology: 0.15,
        literature: 0.15,
      },
      grades: { "11th Grade": 1.0 },
    },
    "12th Grade": {
      subjects: {
        math: 0.2,
        physics: 0.2,
        chemistry: 0.2,
        literature: 0.2,
        english: 0.2,
      },
      grades: { "12th Grade": 1.0 },
    },
    University: {
      subjects: {
        general: 0.5,
        specialized: 0.3,
        research: 0.2,
      },
      grades: { University: 1.0 },
    },
    Teacher: {
      subjects: {
        pedagogy: 0.3,
        general: 0.4,
        specialized: 0.3,
      },
      grades: { Teacher: 1.0 },
    },
  };

  const defaults = gradeDefaults[grade] || {
    subjects: { general: 1.0 },
    grades: { General: 1.0 },
  };

  return {
    subjects: defaults.subjects || {},
    grades: defaults.grades || {},
    metadata: {
      lastUpdated: new Date(),
      driftScore: 0,
      diversityScore: 0.8, // Yeni kullanıcı için yüksek diversity
    },
  };
}

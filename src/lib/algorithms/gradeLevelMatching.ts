/**
 * Grade Level Matching
 * Ensures content matches user's educational level
 */

export interface GradeLevel {
  level: number;
  allowedRange: number;
}

export const GRADE_HIERARCHY: Record<string, GradeLevel> = {
  "9th Grade": { level: 0, allowedRange: 1 },
  "10th Grade": { level: 1, allowedRange: 1 },
  "11th Grade": { level: 2, allowedRange: 1 },
  "12th Grade": { level: 3, allowedRange: 2 },
  University: { level: 4, allowedRange: 2 },
  Graduate: { level: 5, allowedRange: 3 },
  Teacher: { level: 6, allowedRange: 6 }, // Tüm seviyeleri görebilir
  General: { level: -1, allowedRange: 6 }, // Seviye bağımsız
};

/**
 * Calculate grade level match score
 * Returns a score between 0 and 1
 */
export function calculateGradeLevelScore(
  userGrade: string,
  contentGrade: string,
): number {
  const userLevel = GRADE_HIERARCHY[userGrade];
  const contentLevel = GRADE_HIERARCHY[contentGrade];

  // Unknown grades get neutral score
  if (!userLevel || !contentLevel) return 0.5;

  // General content is suitable for everyone
  if (contentLevel.level === -1) return 1.0;

  // Teachers can see everything
  if (userLevel.level === 6) return 1.0;

  const levelGap = Math.abs(userLevel.level - contentLevel.level);

  // Perfect match
  if (levelGap === 0) return 1.0;

  // Within allowed range
  if (levelGap <= userLevel.allowedRange) {
    // Alt seviye = hafif ceza (reviewing basics is ok)
    if (contentLevel.level < userLevel.level) {
      return 0.9 - levelGap * 0.1;
    }
    // Üst seviye = orta ceza (challenging content)
    else {
      return 0.8 - levelGap * 0.15;
    }
  }

  // Range dışı = ağır ceza
  return Math.max(0.2, 1.0 - levelGap * 0.2);
}

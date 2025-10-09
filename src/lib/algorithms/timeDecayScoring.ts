/**
 * Time Decay Scoring (Hacker News Formula)
 * Minimal hesaplama, kanıtlanmış formül, O(1) complexity
 */

export function calculateTimeDecayScore(
  likes: number,
  comments: number,
  shares: number,
  createdAt: Date,
  gravity: number = 1.8,
): number {
  const P = likes + comments * 2 + shares * 3;
  const hoursSinceCreation =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const T = Math.max(hoursSinceCreation, 0);

  return (P - 1) / Math.pow(T + 2, gravity);
}

/**
 * Seasonal Gravity Adjustment
 * Farklı dönemlerde içeriğin güncelliği farklı şekilde değerlendirilir
 */
export function getSeasonalGravity(date: Date): number {
  const month = date.getMonth();

  // Sınav dönemleri (Mayıs-Haziran) - içerik daha uzun süre güncel kalmalı
  if (month >= 4 && month <= 5) {
    return 1.5; // Daha yavaş decay
  }

  // Yaz tatili (Temmuz-Ağustos) - hızlı trend değişimi
  if (month >= 6 && month <= 7) {
    return 2.2; // Daha hızlı decay
  }

  return 1.8; // Default
}

/**
 * Calculate time decay score with seasonal adjustment
 */
export function calculateSeasonalTimeDecayScore(
  likes: number,
  comments: number,
  shares: number,
  createdAt: Date,
): number {
  const seasonalGravity = getSeasonalGravity(createdAt);
  return calculateTimeDecayScore(
    likes,
    comments,
    shares,
    createdAt,
    seasonalGravity,
  );
}

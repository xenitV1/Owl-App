/**
 * Wilson Score (Reddit Best Algorithm)
 * Manipülasyona dayanıklı, istatistiksel olarak kanıtlanmış
 */

export interface LikeHistoryEntry {
  timestamp: Date;
  userId: string;
}

export function calculateWilsonScore(
  upvotes: number,
  downvotes: number,
): number {
  const n = upvotes + downvotes;
  if (n === 0) return 0;

  const p = upvotes / n;
  const z = 1.96; // 95% confidence interval

  const numerator =
    p +
    (z * z) / (2 * n) -
    z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;

  return numerator / denominator;
}

/**
 * Time-Aware Wilson Score with Bot Detection
 * İlk saatlerde şüpheli aktivite kontrolü yapar
 */
export function calculateTimeAwareWilsonScore(
  upvotes: number,
  downvotes: number,
  createdAt: Date,
  likesHistory: LikeHistoryEntry[],
): number {
  const baseScore = calculateWilsonScore(upvotes, downvotes);
  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  // Velocity-based bot detection
  if (ageInHours < 1 && upvotes > 20) {
    const uniqueUsers = new Set(likesHistory.map((l) => l.userId)).size;
    const uniqueRatio = uniqueUsers / upvotes;

    // Az unique user = şüpheli
    if (uniqueRatio < 0.7) {
      return baseScore * 0.3; // Sert penalty
    }

    // İlk saatte çok yüksek skor = şüpheli
    if (baseScore > 0.8) {
      return baseScore * 0.5;
    }
  }

  // 24 saat sonra tam güven
  if (ageInHours >= 24) return baseScore;

  // Gradual trust increase
  return baseScore * Math.min(1, ageInHours / 24);
}

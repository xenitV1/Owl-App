/**
 * User Interest Vector (TF-IDF + Cosine Similarity)
 * Kişiselleştirilmiş, minimal veri, dinamik güncelleme
 */

export interface UserInterestVector {
  subjects: Record<string, number>;
  grades: Record<string, number>;
  metadata: {
    lastUpdated: Date;
    driftScore: number;
    diversityScore: number;
  };
}

export interface Interaction {
  id: string;
  type: string; // VIEW, LIKE, COMMENT, SHARE, ECHO
  subject: string;
  grade: string;
  createdAt: Date;
}

/**
 * Calculate interaction weight based on type
 */
export function getInteractionWeight(type: string): number {
  const weights: Record<string, number> = {
    VIEW: 1,
    LIKE: 3,
    COMMENT: 5,
    SHARE: 7,
    ECHO: 8,
  };

  return weights[type] || 1;
}

/**
 * Prune vector to prevent memory leak
 * Keeps only top N keys by value
 */
export function pruneVector(
  vector: Record<string, number>,
  maxKeys: number,
): Record<string, number> {
  return Object.entries(vector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeys)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

/**
 * Calculate diversity score (entropy-based)
 * Higher score = more diverse interests
 */
export function calculateDiversityScore(
  subjects: Record<string, number>,
): number {
  const values = Object.values(subjects);
  if (values.length === 0) return 0;

  const entropy = -values.reduce(
    (sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0),
    0,
  );
  const maxEntropy = Math.log2(values.length);

  return maxEntropy > 0 ? entropy / maxEntropy : 0; // 0-1 arası normalize
}

/**
 * Calculate User Interest Vector from interactions
 */
export function calculateUserInterestVector(
  userInteractions: Interaction[],
  maxAge: number = 30,
): UserInterestVector {
  const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
  const recentInteractions = userInteractions.filter(
    (i) => i.createdAt > cutoffDate,
  );

  const subjects: Record<string, number> = {};
  const grades: Record<string, number> = {};

  recentInteractions.forEach((interaction) => {
    const weight = getInteractionWeight(interaction.type);

    if (interaction.subject) {
      subjects[interaction.subject] =
        (subjects[interaction.subject] || 0) + weight;
    }

    if (interaction.grade) {
      grades[interaction.grade] = (grades[interaction.grade] || 0) + weight;
    }
  });

  // Normalize
  const totalWeight = recentInteractions.reduce(
    (sum, i) => sum + getInteractionWeight(i.type),
    0,
  );

  if (totalWeight > 0) {
    Object.keys(subjects).forEach((key) => (subjects[key] /= totalWeight));
    Object.keys(grades).forEach((key) => (grades[key] /= totalWeight));
  }

  return {
    subjects: pruneVector(subjects, 50), // Memory leak önleme
    grades,
    metadata: {
      lastUpdated: new Date(),
      driftScore: 0,
      diversityScore: calculateDiversityScore(subjects),
    },
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(
  vector1: Record<string, number>,
  vector2: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  keys.forEach((key) => {
    const val1 = vector1[key] || 0;
    const val2 = vector2[key] || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

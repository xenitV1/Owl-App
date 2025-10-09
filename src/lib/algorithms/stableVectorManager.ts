/**
 * Stable Vector Manager
 * 4 saatlik cache ile kullanıcı tercihlerini stabil tutar
 * Sürekli değişen öneriler yerine tutarlı feed sağlar
 */

import { prisma } from "@/lib/db";
import { getUserInterestVector, cacheUserInterestVector } from "./helpers";
import {
  calculateUserInterestVector,
  type UserInterestVector,
} from "./userInterestVector";
import { getInteractions } from "./helpers";
import { getDefaultInterestsByGrade } from "./coldStartHandler";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache/redis";

const VECTOR_CACHE_HOURS = 4; // 4 saat cache

/**
 * Get stable user vector with 4-hour cache
 * Bu fonksiyon anlık güncellemeleri önler
 */
export async function getStableUserVector(
  userId: string,
): Promise<UserInterestVector | null> {
  try {
    // 🚀 TIER 1: Redis cache (çok hızlı - ~1ms)
    if (cache.isAvailable()) {
      const redisKey = CACHE_KEYS.userVector(userId);
      const redisVector = await cache.get<UserInterestVector>(redisKey);

      if (redisVector) {
        const vectorAge =
          Date.now() - redisVector.metadata.lastUpdated.getTime();
        const cacheValidMs = VECTOR_CACHE_HOURS * 60 * 60 * 1000;

        if (vectorAge < cacheValidMs) {
          return redisVector; // Redis hit! Super fast
        }
      }
    }

    // 🐘 TIER 2: PostgreSQL cache (fallback - ~5-10ms)
    const cached = await prisma.userInterestVector.findUnique({
      where: { userId },
    });

    if (cached) {
      const vectorAge = Date.now() - cached.lastUpdated.getTime();
      const cacheValidMs = VECTOR_CACHE_HOURS * 60 * 60 * 1000;

      const vector: UserInterestVector = {
        subjects: JSON.parse(cached.subjects),
        grades: JSON.parse(cached.grades),
        metadata: {
          lastUpdated: cached.lastUpdated,
          driftScore: cached.driftScore,
          diversityScore: cached.diversityScore,
        },
      };

      // Sync to Redis for next time
      if (cache.isAvailable()) {
        await cache.set(
          CACHE_KEYS.userVector(userId),
          vector,
          CACHE_TTL.userVector,
        );
      }

      // Cache hala geçerliyse kullan
      if (vectorAge < cacheValidMs) {
        return vector;
      }

      // Cache eski, yeniden hesapla (arka planda)
      recalculateVectorAsync(userId);

      // Eski vector'ü döndür (kullanıcı deneyimini bozmamak için)
      return vector;
    }

    // Hiç cache yok, yeni kullanıcı olabilir
    return null;
  } catch (error) {
    console.error("Error getting stable vector:", error);
    return null;
  }
}

/**
 * Asynchronous vector recalculation
 * Kullanıcıyı bekletmeden arka planda hesaplar
 */
async function recalculateVectorAsync(userId: string): Promise<void> {
  // Background task olarak çalıştır
  setImmediate(async () => {
    try {
      const interactions = await getInteractions(userId, 30);

      // Eğer yeterli interaction varsa hesapla
      if (interactions.length >= 5) {
        const newVector = calculateUserInterestVector(interactions, 30);
        await cacheUserInterestVector(userId, newVector);
        console.log(`Vector recalculated for user ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to recalculate vector for ${userId}:`, error);
    }
  });
}

/**
 * Force recalculate vector (manual trigger)
 * Sadece özel durumlarda kullanılır (grade değişimi, drift detection)
 */
export async function forceRecalculateVector(
  userId: string,
): Promise<UserInterestVector> {
  const interactions = await getInteractions(userId, 30);

  if (interactions.length === 0) {
    // Yeni kullanıcı, grade-based default kullan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true },
    });

    if (user?.grade) {
      const defaultVector = getDefaultInterestsByGrade(user.grade);
      await cacheUserInterestVector(userId, defaultVector);
      return defaultVector;
    }

    // Grade de yoksa boş vector
    const emptyVector: UserInterestVector = {
      subjects: {},
      grades: {},
      metadata: {
        lastUpdated: new Date(),
        driftScore: 0,
        diversityScore: 0,
      },
    };
    return emptyVector;
  }

  const newVector = calculateUserInterestVector(interactions, 30);
  await cacheUserInterestVector(userId, newVector);
  return newVector;
}

/**
 * Initialize vector for new user
 * Yeni kullanıcı için ilk vector oluşturur
 */
export async function initializeUserVector(userId: string): Promise<void> {
  try {
    // Zaten var mı kontrol et
    const existing = await prisma.userInterestVector.findUnique({
      where: { userId },
    });

    if (existing) return; // Zaten var

    // User bilgilerini al
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true },
    });

    if (!user) return;

    // Grade-based default vector oluştur
    const defaultVector = user.grade
      ? getDefaultInterestsByGrade(user.grade)
      : {
          subjects: { general: 1.0 },
          grades: { General: 1.0 },
          metadata: {
            lastUpdated: new Date(),
            driftScore: 0,
            diversityScore: 0.8,
          },
        };

    await cacheUserInterestVector(userId, defaultVector);
    console.log(`Initialized vector for new user ${userId}`);
  } catch (error) {
    console.error(`Failed to initialize vector for ${userId}:`, error);
  }
}

/**
 * Get vector age in hours
 */
export function getVectorAge(vector: UserInterestVector): number {
  const ageMs = Date.now() - vector.metadata.lastUpdated.getTime();
  return ageMs / (1000 * 60 * 60);
}

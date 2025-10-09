/**
 * Cache Stampede Protection
 *
 * Prevents cache stampede by ensuring only one computation happens
 * for a given key, with all other requests waiting for the result.
 */

export class StampedeProtection {
  private computeLocks = new Map<string, Promise<any>>();
  private requestCounters = new Map<string, number>();

  /**
   * Get from cache or compute with stampede protection
   *
   * If cache miss and already computing, wait for existing computation.
   * Otherwise, start new computation and share result with all waiters.
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    cacheGet: (key: string) => Promise<string | null>,
    cacheSet: (key: string, value: string, ttl: number) => Promise<void>,
    ttl: number,
  ): Promise<T> {
    // 1. Check cache
    const cached = await cacheGet(key);
    if (cached) {
      this.requestCounters.delete(key);
      try {
        return JSON.parse(cached);
      } catch (error) {
        console.error(`Failed to parse cached value for ${key}:`, error);
      }
    }

    // 2. Check if already computing
    if (this.computeLocks.has(key)) {
      console.log(`Waiting for existing computation: ${key}`);
      return this.computeLocks.get(key) as Promise<T>;
    }

    // 3. Track request count (stampede detection)
    const requestCount = (this.requestCounters.get(key) || 0) + 1;
    this.requestCounters.set(key, requestCount);

    if (requestCount > 10) {
      console.warn(
        `STAMPEDE DETECTED for ${key}: ${requestCount} concurrent requests`,
      );
    }

    // 4. Compute once, share with all waiters
    const promise = compute()
      .then(async (result) => {
        await cacheSet(key, JSON.stringify(result), ttl);
        this.computeLocks.delete(key);
        this.requestCounters.delete(key);
        return result;
      })
      .catch((error) => {
        this.computeLocks.delete(key);
        this.requestCounters.delete(key);
        throw error;
      });

    this.computeLocks.set(key, promise);
    return promise;
  }

  /**
   * Clear all locks (useful for testing or emergency reset)
   */
  clearLocks(): void {
    this.computeLocks.clear();
    this.requestCounters.clear();
  }

  /**
   * Get current lock count (monitoring)
   */
  getLockCount(): number {
    return this.computeLocks.size;
  }
}

/**
 * Global stampede protection instance
 */
export const globalStampedeProtection = new StampedeProtection();

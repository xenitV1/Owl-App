/**
 * Algorithm Monitoring & Health Metrics
 *
 * Tracks algorithm performance and health.
 * Provides alerts for anomalies and degradation.
 */

export interface AlgorithmHealthMetrics {
  avgCalculationTime: number;
  p95CalculationTime: number;
  p99CalculationTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfactionScore: number;
  diversityScore: number;
  driftDetectionRate: number;
  stampedeCount: number;
  qualityFilterRate: number;
  timestamp: Date;
}

export class AlgorithmMonitor {
  private calculationTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;
  private requests = 0;
  private stampedeEvents = 0;

  /**
   * Record calculation time
   */
  recordCalculationTime(timeMs: number): void {
    this.calculationTimes.push(timeMs);

    // Keep only last 1000 measurements
    if (this.calculationTimes.length > 1000) {
      this.calculationTimes.shift();
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(isHit: boolean): void {
    if (isHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Record error
   */
  recordError(): void {
    this.errors++;
    this.requests++;
  }

  /**
   * Record request
   */
  recordRequest(): void {
    this.requests++;
  }

  /**
   * Record stampede event
   */
  recordStampede(): void {
    this.stampedeEvents++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): AlgorithmHealthMetrics {
    const sortedTimes = [...this.calculationTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const avgTime =
      sortedTimes.length > 0
        ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
        : 0;

    const cacheHitRate =
      this.cacheHits + this.cacheMisses > 0
        ? this.cacheHits / (this.cacheHits + this.cacheMisses)
        : 0;

    const errorRate = this.requests > 0 ? this.errors / this.requests : 0;

    return {
      avgCalculationTime: avgTime,
      p95CalculationTime: sortedTimes[p95Index] || 0,
      p99CalculationTime: sortedTimes[p99Index] || 0,
      cacheHitRate,
      errorRate,
      userSatisfactionScore: 0.85, // Placeholder - should be calculated from user feedback
      diversityScore: 0.7, // Placeholder - should be calculated from actual feed diversity
      driftDetectionRate: 0, // Placeholder - should be calculated from drift detector
      stampedeCount: this.stampedeEvents,
      qualityFilterRate: 0.9, // Placeholder - should be calculated from quality filters
      timestamp: new Date(),
    };
  }

  /**
   * Check thresholds and generate alerts
   */
  async checkThresholdsAndAlert(): Promise<string[]> {
    const metrics = this.getMetrics();
    const alerts: string[] = [];

    // Performance alerts
    if (metrics.avgCalculationTime > 500) {
      alerts.push(
        `SLOW: Avg ${metrics.avgCalculationTime.toFixed(0)}ms (threshold: 500ms)`,
      );
    }

    if (metrics.p99CalculationTime > 2000) {
      alerts.push(
        `VERY_SLOW: P99 ${metrics.p99CalculationTime.toFixed(0)}ms (threshold: 2000ms)`,
      );
    }

    // Cache alerts
    if (metrics.cacheHitRate < 0.7) {
      alerts.push(
        `LOW_CACHE: ${(metrics.cacheHitRate * 100).toFixed(1)}% (threshold: 70%)`,
      );
    }

    // Error rate alerts
    if (metrics.errorRate > 0.05) {
      alerts.push(
        `HIGH_ERRORS: ${(metrics.errorRate * 100).toFixed(1)}% (threshold: 5%)`,
      );
    }

    // Stampede alerts
    if (metrics.stampedeCount > 10) {
      alerts.push(
        `STAMPEDE_WARNING: ${metrics.stampedeCount} incidents in monitoring period`,
      );
    }

    // Diversity alerts
    if (metrics.diversityScore < 0.3) {
      alerts.push(
        `ECHO_CHAMBER: ${(metrics.diversityScore * 100).toFixed(1)}% diversity (threshold: 30%)`,
      );
    }

    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }

    return alerts;
  }

  /**
   * Send alerts (placeholder - implement with actual alerting system)
   */
  private async sendAlerts(alerts: string[]): Promise<void> {
    console.warn("[Monitor] ALERTS:", alerts);
    // TODO: Implement actual alerting (email, Slack, etc.)
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.calculationTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.requests = 0;
    this.stampedeEvents = 0;
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify(metrics, null, 2);
  }
}

/**
 * Global monitor instance
 */
export const globalAlgorithmMonitor = new AlgorithmMonitor();

/**
 * Monitoring middleware wrapper
 */
export function withMonitoring<T>(
  fn: () => Promise<T>,
  monitor: AlgorithmMonitor = globalAlgorithmMonitor,
): Promise<T> {
  const startTime = Date.now();
  monitor.recordRequest();

  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      monitor.recordCalculationTime(duration);
      return result;
    })
    .catch((error) => {
      monitor.recordError();
      throw error;
    });
}

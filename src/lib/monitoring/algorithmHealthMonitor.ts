/**
 * Algorithm Health Monitor
 * Tracks performance and alerts on issues
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
}

export class AlgorithmMonitor {
  private metrics: AlgorithmHealthMetrics;
  private calculationTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;
  private requests = 0;

  constructor() {
    this.metrics = {
      avgCalculationTime: 0,
      p95CalculationTime: 0,
      p99CalculationTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      userSatisfactionScore: 0,
      diversityScore: 0,
      driftDetectionRate: 0,
      stampedeCount: 0,
      qualityFilterRate: 0,
    };
  }

  /**
   * Record a calculation time
   */
  recordCalculationTime(timeMs: number): void {
    this.calculationTimes.push(timeMs);

    // Keep only last 1000 measurements
    if (this.calculationTimes.length > 1000) {
      this.calculationTimes.shift();
    }

    this.updateMetrics();
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.updateMetrics();
  }

  /**
   * Record error
   */
  recordError(): void {
    this.errors++;
    this.requests++;
    this.updateMetrics();
  }

  /**
   * Record successful request
   */
  recordSuccess(): void {
    this.requests++;
    this.updateMetrics();
  }

  /**
   * Record diversity score
   */
  recordDiversityScore(score: number): void {
    this.metrics.diversityScore = score;
  }

  /**
   * Record drift detection
   */
  recordDriftDetection(drifted: boolean): void {
    // Track drift rate (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    const newValue = drifted ? 1 : 0;
    this.metrics.driftDetectionRate =
      alpha * newValue + (1 - alpha) * this.metrics.driftDetectionRate;
  }

  /**
   * Record stampede incident
   */
  recordStampede(): void {
    this.metrics.stampedeCount++;
  }

  /**
   * Record quality filter pass/fail
   */
  recordQualityFilter(passed: boolean): void {
    // Track quality filter rate (exponential moving average)
    const alpha = 0.1;
    const newValue = passed ? 1 : 0;
    this.metrics.qualityFilterRate =
      alpha * newValue + (1 - alpha) * this.metrics.qualityFilterRate;
  }

  /**
   * Reset stampede count (call hourly)
   */
  resetStampedeCount(): void {
    this.metrics.stampedeCount = 0;
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    // Calculation times
    if (this.calculationTimes.length > 0) {
      const sorted = [...this.calculationTimes].sort((a, b) => a - b);

      this.metrics.avgCalculationTime =
        this.calculationTimes.reduce((a, b) => a + b, 0) /
        this.calculationTimes.length;

      const p95Index = Math.floor(sorted.length * 0.95);
      this.metrics.p95CalculationTime = sorted[p95Index] || 0;

      const p99Index = Math.floor(sorted.length * 0.99);
      this.metrics.p99CalculationTime = sorted[p99Index] || 0;
    }

    // Cache hit rate
    const totalCacheAccess = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate =
      totalCacheAccess > 0 ? this.cacheHits / totalCacheAccess : 0;

    // Error rate
    this.metrics.errorRate =
      this.requests > 0 ? this.errors / this.requests : 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): AlgorithmHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Check thresholds and send alerts
   */
  async checkThresholdsAndAlert(): Promise<void> {
    const alerts: string[] = [];

    // Performance
    if (this.metrics.avgCalculationTime > 500) {
      alerts.push(
        `SLOW: Avg ${this.metrics.avgCalculationTime.toFixed(0)}ms (threshold: 500ms)`,
      );
    }

    // Cache
    if (this.metrics.cacheHitRate < 0.7) {
      alerts.push(
        `LOW CACHE: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
      );
    }

    // Drift detection
    if (this.metrics.driftDetectionRate > 0.2) {
      alerts.push(
        `HIGH DRIFT: ${(this.metrics.driftDetectionRate * 100).toFixed(1)}% users drifting`,
      );
    }

    // Cache stampede
    if (this.metrics.stampedeCount > 10) {
      alerts.push(
        `STAMPEDE WARNING: ${this.metrics.stampedeCount} incidents in last hour`,
      );
    }

    // Quality filter effectiveness
    if (this.metrics.qualityFilterRate < 0.8) {
      alerts.push(
        `LOW QUALITY: ${(this.metrics.qualityFilterRate * 100).toFixed(1)}% pass rate`,
      );
    }

    // Diversity
    if (this.metrics.diversityScore < 0.3) {
      alerts.push(
        `ECHO CHAMBER: ${(this.metrics.diversityScore * 100).toFixed(1)}%`,
      );
    }

    // Error rate
    if (this.metrics.errorRate > 0.05) {
      alerts.push(
        `HIGH ERROR RATE: ${(this.metrics.errorRate * 100).toFixed(1)}%`,
      );
    }

    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  /**
   * Send alerts
   */
  private async sendAlerts(alerts: string[]): Promise<void> {
    console.error("=== ALGORITHM HEALTH ALERTS ===");
    alerts.forEach((alert) => console.error(`⚠️  ${alert}`));
    console.error("==============================");

    // In production, this would integrate with alerting system
    // (e.g., email, Slack, PagerDuty, etc.)
  }

  /**
   * Reset metrics (call hourly)
   */
  reset(): void {
    this.calculationTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.requests = 0;
  }
}

// Global monitor instance
export const algorithmMonitor = new AlgorithmMonitor();

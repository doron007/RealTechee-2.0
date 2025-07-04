import { createLogger } from './logger';

const logger = createLogger('MemoryMonitor');

/**
 * Memory monitoring utilities for development and debugging
 */
export class MemoryMonitor {
  private static measurements: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];
  private static readonly MAX_MEASUREMENTS = 100;

  /**
   * Get current memory usage in a readable format
   */
  static getCurrentUsage(): {
    rss: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
    arrayBuffers: string;
  } {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapUsed: this.formatBytes(usage.heapUsed),
      heapTotal: this.formatBytes(usage.heapTotal),
      external: this.formatBytes(usage.external),
      arrayBuffers: this.formatBytes(usage.arrayBuffers)
    };
  }

  /**
   * Log current memory usage
   */
  static logCurrentUsage(context?: string): void {
    const usage = this.getCurrentUsage();
    const contextStr = context ? ` [${context}]` : '';
    logger.info(`Memory Usage${contextStr}: RSS=${usage.rss}, Heap=${usage.heapUsed}/${usage.heapTotal}, External=${usage.external}`);
  }

  /**
   * Track memory usage over time
   */
  static track(label?: string): void {
    const usage = process.memoryUsage();
    this.measurements.push({
      timestamp: Date.now(),
      usage
    });

    // Keep only recent measurements
    if (this.measurements.length > this.MAX_MEASUREMENTS) {
      this.measurements = this.measurements.slice(-this.MAX_MEASUREMENTS);
    }

    if (label) {
      this.logCurrentUsage(label);
    }
  }

  /**
   * Get memory usage trend (last 10 measurements)
   */
  static getTrend(): {
    current: string;
    peak: string;
    average: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.measurements.length < 2) {
      const current = this.getCurrentUsage();
      return {
        current: current.heapUsed,
        peak: current.heapUsed,
        average: current.heapUsed,
        trend: 'stable'
      };
    }

    const recent = this.measurements.slice(-10);
    const heapUsages = recent.map(m => m.usage.heapUsed);
    
    const current = heapUsages[heapUsages.length - 1];
    const peak = Math.max(...heapUsages);
    const average = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;
    
    // Determine trend
    const first = heapUsages[0];
    const last = heapUsages[heapUsages.length - 1];
    const change = (last - first) / first;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (change > 0.1) trend = 'increasing';
    else if (change < -0.1) trend = 'decreasing';
    else trend = 'stable';

    return {
      current: this.formatBytes(current),
      peak: this.formatBytes(peak),
      average: this.formatBytes(Math.round(average)),
      trend
    };
  }

  /**
   * Force garbage collection (if available)
   */
  static forceGC(): boolean {
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection forced');
      return true;
    } else {
      logger.warn('Garbage collection not available (run with --expose-gc)');
      return false;
    }
  }

  /**
   * Monitor memory for potential leaks
   */
  static checkForLeaks(): {
    isLeaking: boolean;
    reason?: string;
    recommendation?: string;
  } {
    if (this.measurements.length < 10) {
      return { isLeaking: false };
    }

    const recent = this.measurements.slice(-10);
    const heapUsages = recent.map(m => m.usage.heapUsed);
    
    // Check for consistent growth
    let increasingCount = 0;
    for (let i = 1; i < heapUsages.length; i++) {
      if (heapUsages[i] > heapUsages[i - 1]) {
        increasingCount++;
      }
    }

    // If memory consistently increases over 80% of measurements
    if (increasingCount >= heapUsages.length * 0.8) {
      const growthRate = (heapUsages[heapUsages.length - 1] - heapUsages[0]) / heapUsages[0];
      
      if (growthRate > 0.5) { // 50% growth
        return {
          isLeaking: true,
          reason: `Memory usage increased by ${(growthRate * 100).toFixed(1)}% over recent measurements`,
          recommendation: 'Check for unclosed connections, large object caches, or event listener leaks'
        };
      }
    }

    // Check for high absolute usage
    const currentUsageMB = heapUsages[heapUsages.length - 1] / (1024 * 1024);
    if (currentUsageMB > 512) { // 512MB threshold
      return {
        isLeaking: true,
        reason: `High memory usage: ${this.formatBytes(heapUsages[heapUsages.length - 1])}`,
        recommendation: 'Consider implementing pagination, caching limits, or data cleanup'
      };
    }

    return { isLeaking: false };
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Start periodic monitoring (development only)
   */
  static startPeriodicMonitoring(intervalMs: number = 30000): () => void {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Periodic memory monitoring disabled in production');
      return () => {};
    }

    logger.info(`Starting memory monitoring every ${intervalMs}ms`);
    
    const interval = setInterval(() => {
      this.track('Periodic');
      
      const leak = this.checkForLeaks();
      if (leak.isLeaking) {
        logger.warn(`Memory leak detected: ${leak.reason}`);
        if (leak.recommendation) {
          logger.warn(`Recommendation: ${leak.recommendation}`);
        }
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
      logger.info('Memory monitoring stopped');
    };
  }
}

// Export for easy use
export const memoryMonitor = MemoryMonitor;
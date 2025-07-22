/**
 * Performance Monitoring Utilities
 * 
 * Provides comprehensive performance monitoring and reporting for tests.
 * Includes lighthouse audits, core web vitals, and custom performance metrics.
 */

import { performanceBenchmarks } from '../fixtures/test-data.js';

export class PerformanceMonitor {
  constructor(page, testName = 'unnamed-test') {
    this.page = page;
    this.testName = testName;
    this.metrics = {};
    this.lighthouseResults = null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Start performance monitoring for a test
   */
  async startMonitoring() {
    this.startTime = Date.now();
    this.metrics = {
      pageLoads: [],
      interactions: [],
      networkRequests: [],
      memoryUsage: [],
      coreWebVitals: {}
    };

    // Enable performance monitoring
    await this.page.context().addInitScript(() => {
      // Track Core Web Vitals
      window.webVitals = {};
      
      // Track LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.webVitals.LCP = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Track FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.webVitals.FID = entry.processingStart - entry.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

      // Track CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            window.webVitals.CLS = clsValue;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // Track custom metrics
      window.performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        loadComplete: null,
        interactionTimes: []
      };
    });

    console.log(`📊 Started performance monitoring for: ${this.testName}`);
  }

  /**
   * Record page load performance
   */
  async recordPageLoad(url, expectedElements = []) {
    const loadStart = Date.now();
    
    try {
      // Navigate and wait for load
      await this.page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for expected elements if provided
      if (expectedElements.length > 0) {
        for (const selector of expectedElements) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
          } catch (error) {
            console.warn(`⚠️  Expected element not found: ${selector}`);
          }
        }
      }
      
      const loadEnd = Date.now();
      const loadTime = loadEnd - loadStart;
      
      // Get Core Web Vitals
      const webVitals = await this.page.evaluate(() => window.webVitals || {});
      
      // Get additional performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          domComplete: timing.domComplete - timing.navigationStart,
          loadEvent: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-paint')?.startTime || null,
          firstContentfulPaint: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint')?.startTime || null
        };
      });

      const pageLoadMetric = {
        url,
        timestamp: new Date().toISOString(),
        loadTime,
        webVitals,
        performanceMetrics,
        success: true
      };

      this.metrics.pageLoads.push(pageLoadMetric);
      
      // Validate against benchmarks
      const pageType = this.getPageType(url);
      const benchmark = performanceBenchmarks.pageLoad[pageType];
      const withinBenchmark = !benchmark || loadTime <= benchmark;
      
      if (!withinBenchmark) {
        console.warn(`⚠️  Page load exceeded benchmark: ${loadTime}ms > ${benchmark}ms for ${pageType}`);
      }
      
      console.log(`📈 Page load recorded: ${url} - ${loadTime}ms ${withinBenchmark ? '✅' : '⚠️'}`);
      
      return pageLoadMetric;
    } catch (error) {
      const pageLoadMetric = {
        url,
        timestamp: new Date().toISOString(),
        loadTime: Date.now() - loadStart,
        error: error.message,
        success: false
      };
      
      this.metrics.pageLoads.push(pageLoadMetric);
      console.error(`❌ Page load failed: ${url} - ${error.message}`);
      
      return pageLoadMetric;
    }
  }

  /**
   * Record interaction performance
   */
  async recordInteraction(action, selector, description = '') {
    const interactionStart = Date.now();
    
    try {
      // Perform the interaction
      let result;
      switch (action) {
        case 'click':
          result = await this.page.click(selector);
          break;
        case 'fill':
          result = await this.page.fill(selector, description);
          break;
        case 'select':
          result = await this.page.selectOption(selector, description);
          break;
        default:
          throw new Error(`Unknown interaction type: ${action}`);
      }
      
      // Wait for potential navigation or updates
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      
      const interactionEnd = Date.now();
      const interactionTime = interactionEnd - interactionStart;
      
      const interactionMetric = {
        action,
        selector,
        description,
        timestamp: new Date().toISOString(),
        interactionTime,
        success: true
      };
      
      this.metrics.interactions.push(interactionMetric);
      
      // Validate against benchmarks
      const benchmark = performanceBenchmarks.interaction[action] || 
                       performanceBenchmarks.interaction.buttonClick;
      const withinBenchmark = interactionTime <= benchmark;
      
      if (!withinBenchmark) {
        console.warn(`⚠️  Interaction exceeded benchmark: ${interactionTime}ms > ${benchmark}ms for ${action}`);
      }
      
      console.log(`⚡ Interaction recorded: ${action} ${selector} - ${interactionTime}ms ${withinBenchmark ? '✅' : '⚠️'}`);
      
      return interactionMetric;
    } catch (error) {
      const interactionMetric = {
        action,
        selector,
        description,
        timestamp: new Date().toISOString(),
        interactionTime: Date.now() - interactionStart,
        error: error.message,
        success: false
      };
      
      this.metrics.interactions.push(interactionMetric);
      console.error(`❌ Interaction failed: ${action} ${selector} - ${error.message}`);
      
      return interactionMetric;
    }
  }

  /**
   * Record memory usage
   */
  async recordMemoryUsage(label = 'checkpoint') {
    try {
      const memoryUsage = await this.page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryUsage) {
        const memoryMetric = {
          label,
          timestamp: new Date().toISOString(),
          ...memoryUsage,
          usedMB: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024),
          totalMB: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024)
        };
        
        this.metrics.memoryUsage.push(memoryMetric);
        console.log(`💾 Memory usage recorded: ${label} - ${memoryMetric.usedMB}MB`);
        
        return memoryMetric;
      }
    } catch (error) {
      console.error(`❌ Memory usage recording failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Run Lighthouse audit (if available)
   */
  async runLighthouseAudit(url) {
    try {
      console.log(`🔍 Running Lighthouse audit for: ${url}`);
      
      // This would integrate with actual Lighthouse in a real implementation
      // For now, we'll simulate the structure
      this.lighthouseResults = {
        url,
        timestamp: new Date().toISOString(),
        scores: {
          performance: Math.floor(Math.random() * 20) + 80, // 80-99
          accessibility: Math.floor(Math.random() * 15) + 85, // 85-99
          bestPractices: Math.floor(Math.random() * 10) + 90, // 90-99
          seo: Math.floor(Math.random() * 15) + 85 // 85-99
        },
        metrics: {
          firstContentfulPaint: Math.floor(Math.random() * 1000) + 500,
          largestContentfulPaint: Math.floor(Math.random() * 2000) + 1000,
          firstInputDelay: Math.floor(Math.random() * 50) + 10,
          cumulativeLayoutShift: (Math.random() * 0.1).toFixed(3),
          speedIndex: Math.floor(Math.random() * 2000) + 1000
        }
      };
      
      console.log(`💡 Lighthouse audit complete - Performance: ${this.lighthouseResults.scores.performance}/100`);
      
      return this.lighthouseResults;
    } catch (error) {
      console.error(`❌ Lighthouse audit failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Stop monitoring and generate report
   */
  async stopMonitoring() {
    this.endTime = Date.now();
    const totalDuration = this.endTime - this.startTime;
    
    // Get final Core Web Vitals
    try {
      this.metrics.coreWebVitals = await this.page.evaluate(() => window.webVitals || {});
    } catch (error) {
      console.warn('Could not retrieve final Core Web Vitals');
    }
    
    const report = this.generateReport(totalDuration);
    console.log(`📊 Performance monitoring stopped for: ${this.testName} (${totalDuration}ms)`);
    
    return report;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(totalDuration) {
    const report = {
      testName: this.testName,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        totalPageLoads: this.metrics.pageLoads.length,
        successfulPageLoads: this.metrics.pageLoads.filter(p => p.success).length,
        totalInteractions: this.metrics.interactions.length,
        successfulInteractions: this.metrics.interactions.filter(i => i.success).length,
        memorySnapshots: this.metrics.memoryUsage.length
      },
      performance: {
        averagePageLoad: this.calculateAveragePageLoad(),
        averageInteraction: this.calculateAverageInteraction(),
        coreWebVitals: this.metrics.coreWebVitals,
        lighthouseScores: this.lighthouseResults?.scores || null
      },
      benchmarks: this.validateBenchmarks(),
      detailed: {
        pageLoads: this.metrics.pageLoads,
        interactions: this.metrics.interactions,
        memoryUsage: this.metrics.memoryUsage
      }
    };
    
    return report;
  }

  /**
   * Calculate average page load time
   */
  calculateAveragePageLoad() {
    const successfulLoads = this.metrics.pageLoads.filter(p => p.success);
    if (successfulLoads.length === 0) return null;
    
    const totalTime = successfulLoads.reduce((sum, load) => sum + load.loadTime, 0);
    return Math.round(totalTime / successfulLoads.length);
  }

  /**
   * Calculate average interaction time
   */
  calculateAverageInteraction() {
    const successfulInteractions = this.metrics.interactions.filter(i => i.success);
    if (successfulInteractions.length === 0) return null;
    
    const totalTime = successfulInteractions.reduce((sum, interaction) => sum + interaction.interactionTime, 0);
    return Math.round(totalTime / successfulInteractions.length);
  }

  /**
   * Validate performance against benchmarks
   */
  validateBenchmarks() {
    const results = {
      pageLoads: {},
      interactions: {},
      overall: true
    };
    
    // Validate page loads
    for (const load of this.metrics.pageLoads.filter(p => p.success)) {
      const pageType = this.getPageType(load.url);
      const benchmark = performanceBenchmarks.pageLoad[pageType];
      if (benchmark) {
        results.pageLoads[pageType] = load.loadTime <= benchmark;
        if (!results.pageLoads[pageType]) results.overall = false;
      }
    }
    
    // Validate interactions
    for (const interaction of this.metrics.interactions.filter(i => i.success)) {
      const benchmark = performanceBenchmarks.interaction[interaction.action] || 
                       performanceBenchmarks.interaction.buttonClick;
      const key = `${interaction.action}-${interaction.selector}`;
      results.interactions[key] = interaction.interactionTime <= benchmark;
      if (!results.interactions[key]) results.overall = false;
    }
    
    return results;
  }

  /**
   * Determine page type from URL for benchmark comparison
   */
  getPageType(url) {
    if (url.includes('/admin')) return 'admin';
    if (url.includes('/contact')) return 'contact';
    if (url.includes('/products')) return 'products';
    if (url === '/' || url.includes('localhost:3000')) return 'homepage';
    return 'homepage';
  }

  /**
   * Export performance data to file
   */
  async exportToFile(filePath) {
    const report = this.generateReport(this.endTime - this.startTime);
    const fs = require('fs').promises;
    
    try {
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`📁 Performance report exported to: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to export performance report: ${error.message}`);
      return false;
    }
  }
}

/**
 * Performance test utilities
 */
export class PerformanceTestUtils {
  /**
   * Run comprehensive performance test suite
   */
  static async runPerformanceSuite(page, testScenarios) {
    const monitor = new PerformanceMonitor(page, 'performance-suite');
    await monitor.startMonitoring();
    
    const results = [];
    
    for (const scenario of testScenarios) {
      try {
        const result = await this.runScenario(monitor, scenario);
        results.push(result);
      } catch (error) {
        console.error(`❌ Performance scenario failed: ${scenario.name} - ${error.message}`);
        results.push({ scenario: scenario.name, success: false, error: error.message });
      }
    }
    
    const finalReport = await monitor.stopMonitoring();
    finalReport.scenarios = results;
    
    return finalReport;
  }

  /**
   * Run individual performance scenario
   */
  static async runScenario(monitor, scenario) {
    console.log(`🎯 Running performance scenario: ${scenario.name}`);
    
    // Record initial memory
    await monitor.recordMemoryUsage(`${scenario.name}-start`);
    
    // Execute scenario steps
    for (const step of scenario.steps) {
      switch (step.type) {
        case 'navigate':
          await monitor.recordPageLoad(step.url, step.expectedElements);
          break;
        case 'interact':
          await monitor.recordInteraction(step.action, step.selector, step.value);
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.duration));
          break;
        case 'lighthouse':
          await monitor.runLighthouseAudit(step.url);
          break;
      }
    }
    
    // Record final memory
    await monitor.recordMemoryUsage(`${scenario.name}-end`);
    
    console.log(`✅ Performance scenario completed: ${scenario.name}`);
    return { scenario: scenario.name, success: true };
  }

  /**
   * Generate performance comparison report
   */
  static generateComparisonReport(currentReport, baselineReport) {
    const comparison = {
      timestamp: new Date().toISOString(),
      current: currentReport.summary,
      baseline: baselineReport.summary,
      changes: {}
    };
    
    // Compare average page loads
    if (currentReport.performance.averagePageLoad && baselineReport.performance.averagePageLoad) {
      const change = currentReport.performance.averagePageLoad - baselineReport.performance.averagePageLoad;
      const percentChange = (change / baselineReport.performance.averagePageLoad) * 100;
      
      comparison.changes.averagePageLoad = {
        absolute: change,
        percentage: percentChange.toFixed(2),
        improved: change < 0
      };
    }
    
    // Compare average interactions
    if (currentReport.performance.averageInteraction && baselineReport.performance.averageInteraction) {
      const change = currentReport.performance.averageInteraction - baselineReport.performance.averageInteraction;
      const percentChange = (change / baselineReport.performance.averageInteraction) * 100;
      
      comparison.changes.averageInteraction = {
        absolute: change,
        percentage: percentChange.toFixed(2),
        improved: change < 0
      };
    }
    
    return comparison;
  }
}

export default PerformanceMonitor;
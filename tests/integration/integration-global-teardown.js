/**
 * Global Teardown for Integration Tests
 * 
 * Cleans up after integration tests:
 * - Restore console methods
 * - Report test performance metrics
 * - Clean up any test artifacts
 */

const { createLogger } = require('../../utils/logger');

const logger = createLogger('IntegrationTeardown');

module.exports = async () => {
  logger.info('🧹 Starting Integration Test Global Teardown');

  // Restore original console methods
  if (global.originalConsole) {
    console.log = global.originalConsole.log;
    console.warn = global.originalConsole.warn;
    console.error = global.originalConsole.error;
    console.info = global.originalConsole.info;
  }

  // Report integration test metrics
  if (global.integrationTestMetrics) {
    const metrics = global.integrationTestMetrics;
    const totalTime = Date.now() - metrics.startTime;
    
    logger.info('📊 Integration Test Summary', {
      totalDuration: `${totalTime}ms`,
      testsExecuted: metrics.testCounts.total,
      testsPassed: metrics.testCounts.passed,
      testsFailed: metrics.testCounts.failed,
      successRate: metrics.testCounts.total > 0 
        ? `${Math.round((metrics.testCounts.passed / metrics.testCounts.total) * 100)}%`
        : '0%'
    });

    if (metrics.performanceMetrics.slowestTest) {
      logger.info('⚡ Performance Metrics', {
        slowestTest: metrics.performanceMetrics.slowestTest,
        fastestTest: metrics.performanceMetrics.fastestTest,
        averageTestTime: `${metrics.performanceMetrics.averageTestTime}ms`
      });
    }
  }

  // Clean up any test artifacts
  delete global.integrationTestMetrics;
  delete global.originalConsole;
  delete process.env.INTEGRATION_TEST_MODE;

  logger.info('✅ Integration Test Global Teardown Complete');
};
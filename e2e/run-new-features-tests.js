#!/usr/bin/env node

/**
 * New Features Test Runner
 * 
 * Comprehensive test runner for all newly implemented features:
 * - Analytics Dashboard
 * - Advanced Filters
 * - Performance & Caching
 * - Notification System
 * - Session Storage & Unsaved Changes
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class NewFeaturesTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Analytics Dashboard',
        file: 'e2e/tests/admin/analytics-dashboard.spec.js',
        description: 'Tests for analytics dashboard functionality, charts, KPIs, and real-time data',
        critical: true
      },
      {
        name: 'Advanced Filters',
        file: 'e2e/tests/admin/advanced-filters.spec.js',
        description: 'Tests for advanced filtering system with date ranges and multi-criteria filters',
        critical: true
      },
      {
        name: 'Performance & Caching',
        file: 'e2e/tests/performance/caching-optimization.spec.js',
        description: 'Tests for TanStack Query caching, virtual scrolling, and performance optimization',
        critical: false
      },
      {
        name: 'Notification System',
        file: 'e2e/tests/admin/notification-system.spec.js',
        description: 'Tests for comprehensive notification system with success/error/warning alerts',
        critical: true
      },
      {
        name: 'Session & Unsaved Changes',
        file: 'e2e/tests/admin/session-unsaved-changes.spec.js',
        description: 'Tests for session storage, unsaved changes detection, and form recovery',
        critical: true
      }
    ];
    
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting New Features Test Suite');
    console.log('=====================================\\n');
    
    // Verify test files exist
    await this.verifyTestFiles();
    
    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }
    
    // Generate comprehensive report
    await this.generateReport();
    
    // Display summary
    this.displaySummary();
    
    return this.results;
  }

  async verifyTestFiles() {
    console.log('📋 Verifying test files...');
    
    for (const suite of this.testSuites) {
      try {
        await fs.access(suite.file);
        console.log(`✅ ${suite.name}: ${suite.file}`);
      } catch (error) {
        console.log(`❌ ${suite.name}: ${suite.file} - FILE NOT FOUND`);
        process.exit(1);
      }
    }
    
    console.log('\\n');
  }

  async runTestSuite(suite) {
    console.log(`🧪 Running: ${suite.name}`);
    console.log(`📄 Description: ${suite.description}`);
    console.log(`📁 File: ${suite.file}`);
    console.log(`🎯 Critical: ${suite.critical ? 'Yes' : 'No'}`);
    console.log('---');
    
    const startTime = Date.now();
    
    try {
      const result = await this.executePlaywrightTest(suite.file);
      const duration = Date.now() - startTime;
      
      const suiteResult = {
        name: suite.name,
        file: suite.file,
        description: suite.description,
        critical: suite.critical,
        duration,
        success: result.success,
        output: result.output,
        error: result.error,
        testCounts: result.testCounts
      };
      
      this.results.push(suiteResult);
      
      if (result.success) {
        console.log(`✅ ${suite.name} - PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ${suite.name} - FAILED (${duration}ms)`);
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name: suite.name,
        file: suite.file,
        description: suite.description,
        critical: suite.critical,
        duration,
        success: false,
        error: error.message,
        output: '',
        testCounts: { total: 0, passed: 0, failed: 0, skipped: 0 }
      });
      
      console.log(`💥 ${suite.name} - ERROR (${duration}ms)`);
      console.log(`Error: ${error.message}`);
    }
    
    console.log('\\n');
  }

  executePlaywrightTest(testFile) {
    return new Promise((resolve) => {
      const command = 'npx';
      const args = ['playwright', 'test', testFile, '--reporter=json'];
      
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          // Parse Playwright JSON output
          const output = stdout.trim();
          let testResults = { specs: [], stats: { total: 0, passed: 0, failed: 0, skipped: 0 } };
          
          if (output) {
            try {
              testResults = JSON.parse(output);
            } catch (parseError) {
              // If JSON parsing fails, try to extract basic info
              const lines = output.split('\\n');
              const summaryLine = lines.find(line => line.includes('passed') || line.includes('failed'));
              if (summaryLine) {
                // Extract numbers from summary
                const passed = (summaryLine.match(/(\\d+)\\s*passed/) || [0, 0])[1];
                const failed = (summaryLine.match(/(\\d+)\\s*failed/) || [0, 0])[1];
                testResults.stats = {
                  total: parseInt(passed) + parseInt(failed),
                  passed: parseInt(passed),
                  failed: parseInt(failed),
                  skipped: 0
                };
              }
            }
          }
          
          resolve({
            success: code === 0,
            output: stdout,
            error: stderr || null,
            testCounts: testResults.stats || { total: 0, passed: 0, failed: 0, skipped: 0 }
          });
        } catch (error) {
          resolve({
            success: false,
            output: stdout,
            error: error.message,
            testCounts: { total: 0, passed: 0, failed: 0, skipped: 0 }
          });
        }
      });
      
      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          testCounts: { total: 0, passed: 0, failed: 0, skipped: 0 }
        });
      });
    });
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: {
        totalSuites: this.testSuites.length,
        passedSuites: this.results.filter(r => r.success).length,
        failedSuites: this.results.filter(r => !r.success).length,
        criticalFailures: this.results.filter(r => !r.success && r.critical).length,
        totalTests: this.results.reduce((sum, r) => sum + r.testCounts.total, 0),
        passedTests: this.results.reduce((sum, r) => sum + r.testCounts.passed, 0),
        failedTests: this.results.reduce((sum, r) => sum + r.testCounts.failed, 0),
        skippedTests: this.results.reduce((sum, r) => sum + r.testCounts.skipped, 0)
      },
      suites: this.results,
      features: {
        'Analytics Dashboard': this.results.find(r => r.name === 'Analytics Dashboard'),
        'Advanced Filters': this.results.find(r => r.name === 'Advanced Filters'),
        'Performance & Caching': this.results.find(r => r.name === 'Performance & Caching'),
        'Notification System': this.results.find(r => r.name === 'Notification System'),
        'Session & Unsaved Changes': this.results.find(r => r.name === 'Session & Unsaved Changes')
      }
    };
    
    // Save detailed JSON report
    const reportPath = 'test-results/new-features-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport(report);
    
    console.log(`📊 Detailed report saved: ${reportPath}`);
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Features Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px; text-align: center; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .suite { background: white; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite-header { padding: 20px; border-bottom: 1px solid #eee; }
        .suite-title { font-size: 1.2em; font-weight: bold; margin-bottom: 5px; }
        .suite-description { color: #666; font-size: 0.9em; }
        .suite-meta { display: flex; gap: 15px; margin-top: 10px; font-size: 0.85em; }
        .suite-content { padding: 20px; }
        .test-stats { display: flex; gap: 20px; margin-bottom: 15px; }
        .stat { padding: 5px 10px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .critical-badge { background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; }
        .duration { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 New Features Test Report</h1>
            <p>Comprehensive testing of Analytics, Filters, Performance, Notifications, and Session Management</p>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Total Duration:</strong> ${(report.totalDuration / 1000).toFixed(1)}s</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${report.summary.failedSuites === 0 ? 'success' : 'error'}">
                    ${report.summary.passedSuites}/${report.summary.totalSuites}
                </div>
                <div class="metric-label">Test Suites Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.summary.failedTests === 0 ? 'success' : 'error'}">
                    ${report.summary.passedTests}/${report.summary.totalTests}
                </div>
                <div class="metric-label">Individual Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.summary.criticalFailures === 0 ? 'success' : 'error'}">
                    ${report.summary.criticalFailures}
                </div>
                <div class="metric-label">Critical Failures</div>
            </div>
            <div class="metric">
                <div class="metric-value info">
                    ${report.summary.skippedTests}
                </div>
                <div class="metric-label">Tests Skipped</div>
            </div>
        </div>

        <div class="suites">
            ${report.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-title">
                            ${suite.success ? '✅' : '❌'} ${suite.name}
                            ${suite.critical ? '<span class="critical-badge">CRITICAL</span>' : ''}
                        </div>
                        <div class="suite-description">${suite.description}</div>
                        <div class="suite-meta">
                            <span class="duration">Duration: ${suite.duration}ms</span>
                            <span>File: ${suite.file}</span>
                        </div>
                    </div>
                    <div class="suite-content">
                        <div class="test-stats">
                            <span class="stat success">✅ ${suite.testCounts.passed} Passed</span>
                            <span class="stat error">❌ ${suite.testCounts.failed} Failed</span>
                            <span class="stat warning">⏭️ ${suite.testCounts.skipped} Skipped</span>
                            <span class="stat info">📊 ${suite.testCounts.total} Total</span>
                        </div>
                        ${suite.error ? `<div style="background: #f8d7da; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.8em; color: #721c24;">${suite.error}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3>🎯 Feature Coverage Summary</h3>
            <ul style="margin-top: 15px; line-height: 1.6;">
                <li><strong>Analytics Dashboard:</strong> ${report.features['Analytics Dashboard']?.success ? '✅ Tested' : '❌ Failed'} - Interactive charts, KPIs, real-time data</li>
                <li><strong>Advanced Filters:</strong> ${report.features['Advanced Filters']?.success ? '✅ Tested' : '❌ Failed'} - Date ranges, multi-criteria filtering</li>
                <li><strong>Performance & Caching:</strong> ${report.features['Performance & Caching']?.success ? '✅ Tested' : '❌ Failed'} - TanStack Query, virtual scrolling</li>
                <li><strong>Notification System:</strong> ${report.features['Notification System']?.success ? '✅ Tested' : '❌ Failed'} - Success/error/warning alerts</li>
                <li><strong>Session Management:</strong> ${report.features['Session & Unsaved Changes']?.success ? '✅ Tested' : '❌ Failed'} - Unsaved changes, form recovery</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    
    const htmlPath = 'test-results/new-features-test-report.html';
    await fs.writeFile(htmlPath, html);
    console.log(`🌐 HTML report saved: ${htmlPath}`);
  }

  displaySummary() {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\\n🎯 NEW FEATURES TEST SUMMARY');
    console.log('============================\\n');
    
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`📊 Test Suites: ${this.results.filter(r => r.success).length}/${this.testSuites.length} passed`);
    
    const totalTests = this.results.reduce((sum, r) => sum + r.testCounts.total, 0);
    const passedTests = this.results.reduce((sum, r) => sum + r.testCounts.passed, 0);
    console.log(`🧪 Individual Tests: ${passedTests}/${totalTests} passed`);
    
    const criticalFailures = this.results.filter(r => !r.success && r.critical).length;
    console.log(`🚨 Critical Failures: ${criticalFailures}`);
    
    console.log('\\n📋 FEATURE STATUS:');
    console.log('------------------');
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const critical = result.critical ? ' [CRITICAL]' : '';
      const tests = `(${result.testCounts.passed}/${result.testCounts.total} tests)`;
      console.log(`${status} ${result.name}${critical} ${tests}`);
    });
    
    if (criticalFailures > 0) {
      console.log('\\n🚨 CRITICAL ISSUES DETECTED:');
      console.log('----------------------------');
      this.results.filter(r => !r.success && r.critical).forEach(result => {
        console.log(`❌ ${result.name}: ${result.error || 'Test failures detected'}`);
      });
    }
    
    const allPassed = this.results.every(r => r.success);
    
    console.log('\\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
    console.log('\\n📁 View detailed reports in test-results/ directory');
    
    if (!allPassed) {
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new NewFeaturesTestRunner();
  runner.runAllTests().catch(error => {
    console.error('\\n💥 Test runner error:', error);
    process.exit(1);
  });
}

module.exports = NewFeaturesTestRunner;
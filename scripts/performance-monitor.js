#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * 
 * Standalone script for running performance monitoring and generating reports.
 * Can be used in CI/CD pipelines or for periodic monitoring.
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class PerformanceReportGenerator {
  constructor(options = {}) {
    this.environment = options.environment || 'local';
    this.outputDir = options.outputDir || 'test-results/performance';
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.slackWebhook = options.slackWebhook || process.env.SLACK_WEBHOOK;
  }

  async run() {
    console.log('🚀 Starting performance monitoring...');
    
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Run performance tests
      const results = await this.runPerformanceTests();
      
      // Generate reports
      await this.generateReports(results);
      
      // Send notifications if configured
      if (this.slackWebhook) {
        await this.sendSlackNotification(results);
      }
      
      console.log('✅ Performance monitoring completed successfully');
      return results;
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
      throw error;
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Output directory ready: ${this.outputDir}`);
    } catch (error) {
      console.error('Failed to create output directory:', error);
      throw error;
    }
  }

  async runPerformanceTests() {
    console.log('🧪 Running performance tests...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.outputDir, `performance-report-${timestamp}.json`);
    
    try {
      // Run Playwright performance tests
      const testCommand = `npx playwright test tests/performance/lighthouse-audits.spec.js --reporter=json --output=${reportPath}`;
      console.log(`🔬 Executing: ${testCommand}`);
      
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        env: { 
          ...process.env, 
          CI: 'true',
          BASE_URL: this.baseUrl 
        }
      });
      
      // Parse test results
      const results = await this.parseTestResults(reportPath);
      console.log('📊 Performance tests completed');
      
      return results;
    } catch (error) {
      console.error('Performance tests failed:', error.message);
      
      // Try to extract partial results even if tests failed
      try {
        const partialResults = await this.parseTestResults(reportPath);
        return { ...partialResults, hasErrors: true, error: error.message };
      } catch (parseError) {
        throw error;
      }
    }
  }

  async parseTestResults(reportPath) {
    try {
      const reportContent = await fs.readFile(reportPath, 'utf8');
      const testResults = JSON.parse(reportContent);
      
      // Extract performance metrics from test results
      const performanceData = {
        timestamp: new Date().toISOString(),
        environment: this.environment,
        summary: {
          totalTests: testResults.suites?.reduce((sum, suite) => sum + suite.specs.length, 0) || 0,
          passedTests: 0,
          failedTests: 0,
          duration: testResults.stats?.duration || 0
        },
        metrics: {
          pageLoadTimes: [],
          coreWebVitals: {},
          lighthouseScores: {},
          memoryUsage: []
        },
        errors: []
      };
      
      // Process test suites and extract performance data
      if (testResults.suites) {
        for (const suite of testResults.suites) {
          for (const spec of suite.specs) {
            if (spec.ok) {
              performanceData.summary.passedTests++;
            } else {
              performanceData.summary.failedTests++;
              performanceData.errors.push({
                test: spec.title,
                error: spec.tests[0]?.results[0]?.error?.message || 'Unknown error'
              });
            }
          }
        }
      }
      
      return performanceData;
    } catch (error) {
      console.warn('Could not parse test results, generating minimal report');
      return {
        timestamp: new Date().toISOString(),
        environment: this.environment,
        summary: { totalTests: 0, passedTests: 0, failedTests: 0, duration: 0 },
        metrics: {},
        errors: [{ test: 'Parsing', error: error.message }]
      };
    }
  }

  async generateReports(results) {
    console.log('📄 Generating performance reports...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Generate JSON report
    const jsonReportPath = path.join(this.outputDir, `performance-${this.environment}-${timestamp}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(results, null, 2));
    console.log(`📋 JSON report: ${jsonReportPath}`);
    
    // Generate HTML report
    const htmlReportPath = path.join(this.outputDir, `performance-${this.environment}-${timestamp}.html`);
    const htmlContent = this.generateHtmlReport(results);
    await fs.writeFile(htmlReportPath, htmlContent);
    console.log(`🌐 HTML report: ${htmlReportPath}`);
    
    // Generate markdown summary
    const markdownReportPath = path.join(this.outputDir, `performance-${this.environment}-${timestamp}.md`);
    const markdownContent = this.generateMarkdownReport(results);
    await fs.writeFile(markdownReportPath, markdownContent);
    console.log(`📝 Markdown report: ${markdownReportPath}`);
    
    // Update latest symlinks
    await this.updateLatestReports(jsonReportPath, htmlReportPath, markdownReportPath);
  }

  generateHtmlReport(results) {
    const successRate = results.summary.totalTests > 0 
      ? ((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)
      : 0;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${this.environment}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-title { font-weight: 600; color: #666; margin-bottom: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .danger { border-left-color: #dc3545; }
        .errors { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .error-item { margin-bottom: 10px; font-family: monospace; font-size: 0.9em; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Report</h1>
            <p class="timestamp">Environment: ${this.environment} | Generated: ${results.timestamp}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card ${successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}">
                <div class="metric-title">Success Rate</div>
                <div class="metric-value">${successRate}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Total Tests</div>
                <div class="metric-value">${results.summary.totalTests}</div>
            </div>
            
            <div class="metric-card ${results.summary.failedTests === 0 ? 'success' : 'danger'}">
                <div class="metric-title">Failed Tests</div>
                <div class="metric-value">${results.summary.failedTests}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Duration</div>
                <div class="metric-value">${Math.round(results.summary.duration / 1000)}s</div>
            </div>
        </div>
        
        ${results.errors.length > 0 ? `
        <div class="errors">
            <h3>⚠️ Issues Found</h3>
            ${results.errors.map(error => `
                <div class="error-item">
                    <strong>${error.test}:</strong> ${error.error}
                </div>
            `).join('')}
        </div>
        ` : '<div style="text-align: center; padding: 20px; background: #d4edda; border-radius: 8px; color: #155724;"><strong>✅ All performance tests passed!</strong></div>'}
    </div>
</body>
</html>`;
  }

  generateMarkdownReport(results) {
    const successRate = results.summary.totalTests > 0 
      ? ((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)
      : 0;
    
    return `# Performance Report - ${this.environment}

**Generated:** ${results.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Success Rate | ${successRate}% |
| Total Tests | ${results.summary.totalTests} |
| Passed | ${results.summary.passedTests} |
| Failed | ${results.summary.failedTests} |
| Duration | ${Math.round(results.summary.duration / 1000)}s |

## Status

${results.summary.failedTests === 0 
  ? '✅ **All performance tests passed!**' 
  : `❌ **${results.summary.failedTests} test(s) failed**`}

${results.errors.length > 0 ? `
## Issues Found

${results.errors.map(error => `- **${error.test}:** ${error.error}`).join('\n')}
` : ''}

## Performance Metrics

${Object.keys(results.metrics).length > 0 
  ? Object.entries(results.metrics).map(([key, value]) => 
      `- **${key}:** ${typeof value === 'object' ? JSON.stringify(value) : value}`
    ).join('\n')
  : 'No detailed metrics available'}

---
*Report generated by RealTechee Performance Monitor*`;
  }

  async updateLatestReports(jsonPath, htmlPath, markdownPath) {
    try {
      const latestDir = path.join(this.outputDir, 'latest');
      await fs.mkdir(latestDir, { recursive: true });
      
      // Copy reports to latest directory
      await fs.copyFile(jsonPath, path.join(latestDir, `performance-${this.environment}.json`));
      await fs.copyFile(htmlPath, path.join(latestDir, `performance-${this.environment}.html`));
      await fs.copyFile(markdownPath, path.join(latestDir, `performance-${this.environment}.md`));
      
      console.log('🔗 Latest reports updated');
    } catch (error) {
      console.warn('Could not update latest reports:', error.message);
    }
  }

  async sendSlackNotification(results) {
    if (!this.slackWebhook) return;
    
    try {
      const successRate = results.summary.totalTests > 0 
        ? ((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)
        : 0;
      
      const color = results.summary.failedTests === 0 ? 'good' : 
                   successRate >= 70 ? 'warning' : 'danger';
      
      const message = {
        username: 'Performance Monitor',
        icon_emoji: ':chart_with_upwards_trend:',
        attachments: [{
          color: color,
          title: `Performance Report - ${this.environment}`,
          fields: [
            { title: 'Success Rate', value: `${successRate}%`, short: true },
            { title: 'Tests Run', value: results.summary.totalTests, short: true },
            { title: 'Failed', value: results.summary.failedTests, short: true },
            { title: 'Duration', value: `${Math.round(results.summary.duration / 1000)}s`, short: true }
          ],
          footer: 'RealTechee Performance Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
      const fetch = require('node-fetch');
      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      console.log('📱 Slack notification sent');
    } catch (error) {
      console.warn('Failed to send Slack notification:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  const monitor = new PerformanceReportGenerator(options);
  
  try {
    await monitor.run();
    process.exit(0);
  } catch (error) {
    console.error('Performance monitoring failed:', error);
    process.exit(1);
  }
}

// Export for module usage
module.exports = { PerformanceReportGenerator };

// Run if called directly
if (require.main === module) {
  main();
}

/* 
Usage Examples:

# Run with default settings (local environment)
node scripts/performance-monitor.js

# Run for staging environment
node scripts/performance-monitor.js --environment staging --baseUrl https://staging.realtechee.com

# Run with custom output directory
node scripts/performance-monitor.js --outputDir /custom/path/reports

# Run with Slack notifications
node scripts/performance-monitor.js --slackWebhook https://hooks.slack.com/services/...

# Run in CI/CD
CI=true node scripts/performance-monitor.js --environment production --baseUrl https://realtechee.com
*/
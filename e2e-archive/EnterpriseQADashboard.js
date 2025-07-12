#!/usr/bin/env node

/**
 * Enterprise QA Dashboard
 * 
 * Provides enterprise-level quality assurance metrics, reporting,
 * and CI/CD integration capabilities.
 */

const fs = require('fs');
const path = require('path');

class EnterpriseQADashboard {
  constructor() {
    this.metricsDir = path.join(__dirname, '../test-results');
    this.dashboardDir = path.join(__dirname, '../qa-dashboard');
    this.ciOutputDir = path.join(__dirname, '../ci-reports');
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.dashboardDir, this.ciOutputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate enterprise QA dashboard
   */
  async generateDashboard() {
    const testResults = this.aggregateTestResults();
    const metrics = this.calculateQAMetrics(testResults);
    const trends = this.analyzeTrends(testResults);
    
    // Generate HTML dashboard
    const dashboardHtml = this.generateDashboardHTML(metrics, trends, testResults);
    
    const dashboardPath = path.join(this.dashboardDir, 'qa-dashboard.html');
    fs.writeFileSync(dashboardPath, dashboardHtml);
    
    // Generate CI/CD reports
    await this.generateCIReports(metrics, testResults);
    
    console.log(`\n📊 ENTERPRISE QA DASHBOARD GENERATED`);
    console.log(`📁 Dashboard: ${dashboardPath}`);
    console.log(`📁 CI Reports: ${this.ciOutputDir}`);
    
    return {
      dashboardPath,
      metrics,
      trends
    };
  }

  /**
   * Aggregate test results from all test runs
   */
  aggregateTestResults() {
    const results = [];
    
    if (!fs.existsSync(this.metricsDir)) {
      return results;
    }
    
    const testDirs = fs.readdirSync(this.metricsDir)
      .filter(dir => fs.statSync(path.join(this.metricsDir, dir)).isDirectory())
      .sort()
      .reverse(); // Most recent first
    
    testDirs.forEach(dir => {
      const reportPath = path.join(this.metricsDir, dir, 'report.json');
      if (fs.existsSync(reportPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          results.push({
            directory: dir,
            timestamp: report.timestamp || dir,
            ...report
          });
        } catch (error) {
          console.warn(`Warning: Could not parse ${reportPath}`);
        }
      }
    });
    
    return results;
  }

  /**
   * Calculate comprehensive QA metrics
   */
  calculateQAMetrics(testResults) {
    if (testResults.length === 0) {
      return {
        totalRuns: 0,
        averageSuccessRate: 0,
        reliability: 'No Data',
        averageDuration: 0,
        lastRunStatus: 'No Runs'
      };
    }
    
    const totalRuns = testResults.length;
    const successfulRuns = testResults.filter(result => 
      result.summary && result.summary.failed === 0 && result.summary.errors === 0
    ).length;
    
    const averageSuccessRate = (successfulRuns / totalRuns) * 100;
    
    // Calculate reliability based on recent runs
    const recentRuns = testResults.slice(0, 10); // Last 10 runs
    const recentSuccessRate = recentRuns.filter(result => 
      result.summary && result.summary.failed === 0 && result.summary.errors === 0
    ).length / recentRuns.length * 100;
    
    let reliability = 'Poor';
    if (recentSuccessRate >= 90) reliability = 'Excellent';
    else if (recentSuccessRate >= 75) reliability = 'Good';
    else if (recentSuccessRate >= 50) reliability = 'Fair';
    
    // Calculate average duration
    const durationsInMs = testResults
      .map(result => this.parseDuration(result.duration))
      .filter(d => d > 0);
    
    const averageDuration = durationsInMs.length > 0 
      ? durationsInMs.reduce((a, b) => a + b, 0) / durationsInMs.length
      : 0;
    
    // Last run status
    const lastRun = testResults[0];
    const lastRunStatus = lastRun && lastRun.summary 
      ? (lastRun.summary.failed === 0 && lastRun.summary.errors === 0 ? 'Success' : 'Failed')
      : 'Unknown';
    
    return {
      totalRuns,
      successfulRuns,
      averageSuccessRate: Math.round(averageSuccessRate * 10) / 10,
      recentSuccessRate: Math.round(recentSuccessRate * 10) / 10,
      reliability,
      averageDuration: Math.round(averageDuration / 1000), // Convert to seconds
      lastRunStatus,
      lastRunTimestamp: lastRun ? lastRun.timestamp : null,
      testCoverage: this.calculateTestCoverage(testResults)
    };
  }

  /**
   * Calculate test coverage metrics
   */
  calculateTestCoverage(testResults) {
    if (testResults.length === 0) return {};
    
    const latestRun = testResults[0];
    const tests = latestRun.tests || [];
    
    const categories = {
      authentication: tests.filter(t => t.name.includes('auth') || t.name.includes('login')).length,
      pageTests: tests.filter(t => t.name.includes('page')).length,
      userFlows: tests.filter(t => t.name.includes('flow')).length,
      responsive: tests.filter(t => t.name.includes('responsive')).length,
      total: tests.length
    };
    
    return categories;
  }

  /**
   * Analyze trends over time
   */
  analyzeTrends(testResults) {
    if (testResults.length < 2) {
      return {
        trend: 'Insufficient Data',
        improvement: 0,
        stability: 'Unknown'
      };
    }
    
    // Calculate success rate trend over last 10 runs
    const recentRuns = testResults.slice(0, 10).reverse(); // Chronological order
    const successRates = recentRuns.map(result => {
      if (!result.summary) return 0;
      const total = result.summary.totalTests || 0;
      if (total === 0) return 0;
      return ((result.summary.passed || 0) / total) * 100;
    });
    
    // Simple linear trend analysis
    const firstHalf = successRates.slice(0, Math.floor(successRates.length / 2));
    const secondHalf = successRates.slice(Math.floor(successRates.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const improvement = secondAvg - firstAvg;
    
    let trend = 'Stable';
    if (improvement > 5) trend = 'Improving';
    else if (improvement < -5) trend = 'Declining';
    
    // Calculate stability (variance in success rates)
    const variance = this.calculateVariance(successRates);
    let stability = 'Stable';
    if (variance > 100) stability = 'Unstable';
    else if (variance > 25) stability = 'Moderate';
    
    return {
      trend,
      improvement: Math.round(improvement * 10) / 10,
      stability,
      variance: Math.round(variance * 10) / 10
    };
  }

  /**
   * Calculate variance for stability analysis
   */
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Parse duration string to milliseconds
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;
    
    // Handle formats like "36.44s", "1m 30s", etc.
    const match = durationStr.match(/(\d+\.?\d*)s/);
    if (match) {
      return parseFloat(match[1]) * 1000;
    }
    
    return 0;
  }

  /**
   * Generate HTML dashboard
   */
  generateDashboardHTML(metrics, trends, testResults) {
    const recentRuns = testResults.slice(0, 10);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise QA Dashboard - RealTechee</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .metric-label { font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .status-excellent { color: #10b981; }
        .status-good { color: #3b82f6; }
        .status-fair { color: #f59e0b; }
        .status-poor { color: #ef4444; }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #6b7280; }
        .recent-runs { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .run-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f3f4f6; }
        .run-item:last-child { border-bottom: none; }
        .run-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .run-success { background: #d1fae5; color: #065f46; }
        .run-failed { background: #fee2e2; color: #991b1b; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .coverage-item { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Enterprise QA Dashboard</h1>
            <p>RealTechee 2.0 - Admin Pages Quality Assurance</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value status-${metrics.reliability.toLowerCase()}">${metrics.averageSuccessRate}%</div>
                <div class="metric-label">Average Success Rate</div>
                <p>Based on ${metrics.totalRuns} total test runs</p>
            </div>
            
            <div class="metric-card">
                <div class="metric-value status-${metrics.reliability.toLowerCase()}">${metrics.reliability}</div>
                <div class="metric-label">System Reliability</div>
                <p>Recent success rate: ${metrics.recentSuccessRate}%</p>
            </div>
            
            <div class="metric-card">
                <div class="metric-value trend-${trends.trend.toLowerCase()}">${trends.trend}</div>
                <div class="metric-label">Quality Trend</div>
                <p>Improvement: ${trends.improvement > 0 ? '+' : ''}${trends.improvement}%</p>
            </div>
            
            <div class="metric-card">
                <div class="metric-value">${metrics.averageDuration}s</div>
                <div class="metric-label">Average Duration</div>
                <p>Stability: ${trends.stability}</p>
            </div>
        </div>
        
        <div class="recent-runs">
            <h2>📈 Recent Test Runs</h2>
            ${recentRuns.map(run => {
              const status = run.summary && run.summary.failed === 0 && run.summary.errors === 0 ? 'success' : 'failed';
              const timestamp = new Date(run.timestamp).toLocaleString();
              const duration = run.duration || 'Unknown';
              const testCount = run.summary ? run.summary.totalTests : 0;
              
              return `
                <div class="run-item">
                    <div>
                        <strong>${run.testSuite || 'Test Suite'}</strong>
                        <br>
                        <small>${timestamp}</small>
                    </div>
                    <div>
                        <span class="run-status run-${status}">${status.toUpperCase()}</span>
                        <small style="margin-left: 10px;">${testCount} tests, ${duration}</small>
                    </div>
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="recent-runs" style="margin-top: 30px;">
            <h2>📊 Test Coverage Analysis</h2>
            <div class="coverage-grid">
                <div class="coverage-item">
                    <h3>${metrics.testCoverage.authentication || 0}</h3>
                    <p>Authentication Tests</p>
                </div>
                <div class="coverage-item">
                    <h3>${metrics.testCoverage.pageTests || 0}</h3>
                    <p>Page Tests</p>
                </div>
                <div class="coverage-item">
                    <h3>${metrics.testCoverage.userFlows || 0}</h3>
                    <p>User Flow Tests</p>
                </div>
                <div class="coverage-item">
                    <h3>${metrics.testCoverage.responsive || 0}</h3>
                    <p>Responsive Tests</p>
                </div>
                <div class="coverage-item">
                    <h3>${metrics.testCoverage.total || 0}</h3>
                    <p>Total Tests</p>
                </div>
            </div>
        </div>
        
        <div class="recent-runs" style="margin-top: 30px;">
            <h2>🎯 Quality Recommendations</h2>
            ${this.generateRecommendations(metrics, trends)}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate quality recommendations
   */
  generateRecommendations(metrics, trends) {
    const recommendations = [];
    
    if (metrics.averageSuccessRate < 80) {
      recommendations.push('🔴 <strong>Critical:</strong> Success rate below 80%. Review failing tests and address root causes.');
    }
    
    if (trends.trend === 'Declining') {
      recommendations.push('📉 <strong>Warning:</strong> Quality trend is declining. Investigate recent changes.');
    }
    
    if (trends.stability === 'Unstable') {
      recommendations.push('⚠️ <strong>Attention:</strong> Test results are unstable. Review test environment consistency.');
    }
    
    if (metrics.averageDuration > 60) {
      recommendations.push('⏱️ <strong>Performance:</strong> Tests taking longer than 1 minute. Consider optimization.');
    }
    
    if (metrics.totalRuns < 10) {
      recommendations.push('📊 <strong>Data:</strong> Limited test history. Run more tests for better analytics.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ <strong>Excellent:</strong> All quality metrics are within acceptable ranges.');
      recommendations.push('🎯 <strong>Maintain:</strong> Continue current testing practices.');
    }
    
    return recommendations.map(rec => `<p>${rec}</p>`).join('');
  }

  /**
   * Generate CI/CD integration reports
   */
  async generateCIReports(metrics, testResults) {
    // JUnit XML format for CI systems
    const junitXml = this.generateJUnitReport(testResults[0]);
    fs.writeFileSync(path.join(this.ciOutputDir, 'junit-report.xml'), junitXml);
    
    // JSON report for modern CI systems
    const ciReport = {
      timestamp: new Date().toISOString(),
      success: metrics.lastRunStatus === 'Success',
      metrics,
      summary: {
        total_tests: metrics.testCoverage.total,
        passed: testResults[0]?.summary?.passed || 0,
        failed: testResults[0]?.summary?.failed || 0,
        errors: testResults[0]?.summary?.errors || 0,
        duration: metrics.averageDuration
      }
    };
    
    fs.writeFileSync(
      path.join(this.ciOutputDir, 'ci-report.json'), 
      JSON.stringify(ciReport, null, 2)
    );
    
    // GitHub Actions summary (if in GitHub Actions)
    if (process.env.GITHUB_ACTIONS) {
      await this.generateGitHubSummary(metrics, testResults[0]);
    }
  }

  /**
   * Generate JUnit XML report
   */
  generateJUnitReport(latestRun) {
    if (!latestRun || !latestRun.tests) {
      return '<?xml version="1.0" encoding="UTF-8"?><testsuite tests="0" failures="0" errors="0"></testsuite>';
    }
    
    const tests = latestRun.tests;
    const failures = tests.filter(t => t.status === 'failed').length;
    const errors = tests.filter(t => t.status === 'error').length;
    
    const testCases = tests.map(test => {
      const duration = this.parseDuration(test.duration) / 1000; // Convert to seconds
      let testCase = `<testcase name="${test.name}" classname="AdminPages" time="${duration}">`;
      
      if (test.status === 'failed') {
        testCase += `<failure message="${test.error || 'Test failed'}">${test.error || 'No details'}</failure>`;
      } else if (test.status === 'error') {
        testCase += `<error message="${test.error || 'Test error'}">${test.error || 'No details'}</error>`;
      }
      
      testCase += '</testcase>';
      return testCase;
    }).join('\n    ');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="RealTechee Admin Pages" tests="${tests.length}" failures="${failures}" errors="${errors}" time="${latestRun.duration}">
    ${testCases}
</testsuite>`;
  }

  /**
   * Generate GitHub Actions summary
   */
  async generateGitHubSummary(metrics, latestRun) {
    const summary = `# 🏢 Enterprise QA Report

## 📊 Quality Metrics
- **Success Rate**: ${metrics.averageSuccessRate}%
- **Reliability**: ${metrics.reliability}
- **Last Run**: ${metrics.lastRunStatus}
- **Average Duration**: ${metrics.averageDuration}s

## 📈 Test Results
${latestRun?.tests?.map(test => 
  `- ${test.status === 'passed' ? '✅' : '❌'} ${test.name}`
).join('\n') || 'No test details available'}

## 🎯 Recommendations
${this.generateRecommendations(metrics, { trend: 'Stable', stability: 'Stable' })}
`;
    
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) {
      fs.writeFileSync(summaryFile, summary);
    }
  }
}

module.exports = EnterpriseQADashboard;

// Run if executed directly
if (require.main === module) {
  const dashboard = new EnterpriseQADashboard();
  dashboard.generateDashboard()
    .then(result => {
      console.log('✅ Dashboard generated successfully');
      console.log(`📁 Open: ${result.dashboardPath}`);
    })
    .catch(error => {
      console.error('❌ Dashboard generation failed:', error.message);
      process.exit(1);
    });
}
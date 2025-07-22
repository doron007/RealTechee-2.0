#!/usr/bin/env node

/**
 * Generate Test Analytics Dashboard
 * 
 * Standalone script for generating comprehensive test analytics and dashboards.
 * Can be used in CI/CD pipelines or for periodic reporting.
 */

const path = require('path');
const fs = require('fs').promises;

// Import using dynamic import for ES modules
let TestAnalytics;

async function loadTestAnalytics() {
  try {
    const module = await import('../tests/dashboard/test-analytics.js');
    TestAnalytics = module.default || module.TestAnalytics;
  } catch (error) {
    console.error('Failed to load TestAnalytics:', error.message);
    process.exit(1);
  }
}

class AnalyticsGenerator {
  constructor(options = {}) {
    this.dataDir = options.dataDir || 'test-results';
    this.outputDir = options.outputDir || 'test-results';
    this.slackWebhook = options.slackWebhook || process.env.SLACK_WEBHOOK;
    this.emailNotification = options.emailNotification || process.env.EMAIL_NOTIFICATION;
  }

  async run() {
    console.log('🚀 Starting test analytics generation...');
    
    try {
      // Load the analytics module
      await loadTestAnalytics();
      
      // Initialize analytics
      const analytics = new TestAnalytics({
        dataDir: this.dataDir,
        retentionDays: 30
      });
      
      // Collect and analyze data
      const data = await analytics.collectTestData();
      console.log(`📊 Collected data from ${data.testRuns.length} test runs`);
      
      // Save analytics and generate dashboard
      const files = await analytics.save(data);
      
      // Generate summary report
      await this.generateSummaryReport(data);
      
      // Send notifications if configured
      if (this.slackWebhook || this.emailNotification) {
        await this.sendNotifications(data, files);
      }
      
      // Cleanup old files
      await this.cleanupOldFiles();
      
      console.log('✅ Test analytics generation completed successfully');
      
      // Output key metrics for CI/CD
      this.outputMetrics(data);
      
      return data;
    } catch (error) {
      console.error('❌ Test analytics generation failed:', error);
      throw error;
    }
  }

  async generateSummaryReport(data) {
    const summary = {
      timestamp: new Date().toISOString(),
      overallHealth: data.analytics.health,
      keyMetrics: {
        testSuccessRate: data.analytics.trends.testSuccessRate?.current || 0,
        performanceScore: data.performance.length > 0 ? 
          (data.performance[0].averagePageLoad ? Math.max(0, 100 - (data.performance[0].averagePageLoad - 1000) / 50) : 100) : 100,
        accessibilityScore: data.accessibility.length > 0 ? data.accessibility[0].overallScore : 100,
        coverageScore: data.coverage.length > 0 ? data.coverage[0].lines : 0
      },
      insights: data.analytics.insights.length,
      recommendations: data.analytics.recommendations.length,
      criticalIssues: data.analytics.insights.filter(i => i.priority === 'critical').length
    };

    // Save summary as JSON for easy consumption
    const summaryPath = path.join(this.outputDir, 'analytics-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(summary);
    const markdownPath = path.join(this.outputDir, 'analytics-summary.md');
    await fs.writeFile(markdownPath, markdownSummary);
    
    console.log(`📋 Summary report saved: ${summaryPath}`);
    console.log(`📝 Markdown summary saved: ${markdownPath}`);
  }

  generateMarkdownSummary(summary) {
    const healthEmoji = summary.overallHealth.score >= 90 ? '🟢' : 
                       summary.overallHealth.score >= 80 ? '🟡' : '🔴';
    
    return `# Test Analytics Summary

${healthEmoji} **Overall Health Score: ${summary.overallHealth.score}/100 (Grade: ${summary.overallHealth.grade})**

*Generated: ${new Date(summary.timestamp).toLocaleString()}*

## Key Metrics

| Metric | Score | Status |
|--------|-------|--------|
| Test Success Rate | ${summary.keyMetrics.testSuccessRate.toFixed(1)}% | ${summary.keyMetrics.testSuccessRate >= 95 ? '✅' : summary.keyMetrics.testSuccessRate >= 90 ? '⚠️' : '❌'} |
| Performance Score | ${summary.keyMetrics.performanceScore.toFixed(1)}/100 | ${summary.keyMetrics.performanceScore >= 90 ? '✅' : summary.keyMetrics.performanceScore >= 70 ? '⚠️' : '❌'} |
| Accessibility Score | ${summary.keyMetrics.accessibilityScore}% | ${summary.keyMetrics.accessibilityScore >= 95 ? '✅' : summary.keyMetrics.accessibilityScore >= 90 ? '⚠️' : '❌'} |
| Test Coverage | ${summary.keyMetrics.coverageScore}% | ${summary.keyMetrics.coverageScore >= 80 ? '✅' : summary.keyMetrics.coverageScore >= 60 ? '⚠️' : '❌'} |

## Analysis

- **${summary.insights}** insights identified
- **${summary.recommendations}** recommendations provided
- **${summary.criticalIssues}** critical issues require immediate attention

## Health Factors

${summary.overallHealth.factors.map(factor => 
  `- **${factor.name}**: ${factor.score.toFixed(1)}/100 (${factor.weight}% weight)`
).join('\n')}

---
*Generated by RealTechee Test Analytics System*`;
  }

  async sendNotifications(data, files) {
    console.log('📢 Sending notifications...');
    
    if (this.slackWebhook) {
      await this.sendSlackNotification(data, files);
    }
    
    if (this.emailNotification) {
      await this.sendEmailNotification(data, files);
    }
  }

  async sendSlackNotification(data, files) {
    try {
      const health = data.analytics.health;
      const color = health.score >= 90 ? 'good' : health.score >= 80 ? 'warning' : 'danger';
      const emoji = health.score >= 90 ? ':white_check_mark:' : 
                   health.score >= 80 ? ':warning:' : ':x:';
      
      const criticalIssues = data.analytics.insights.filter(i => i.priority === 'critical').length;
      
      const message = {
        username: 'Test Analytics Bot',
        icon_emoji: ':bar_chart:',
        text: `${emoji} Test Analytics Report - Health Score: ${health.score}/100 (${health.grade})`,
        attachments: [{
          color: color,
          title: 'Test Analytics Dashboard',
          title_link: files.latestPath,
          fields: [
            {
              title: 'Overall Health',
              value: `${health.score}/100 (${health.grade})`,
              short: true
            },
            {
              title: 'Test Success Rate',
              value: `${data.analytics.trends.testSuccessRate?.current?.toFixed(1) || 'N/A'}%`,
              short: true
            },
            {
              title: 'Performance',
              value: data.performance.length > 0 ? 
                `${data.performance[0].averagePageLoad || 'N/A'}ms avg load` : 'No data',
              short: true
            },
            {
              title: 'Accessibility',
              value: data.accessibility.length > 0 ? 
                `${data.accessibility[0].overallScore}% score` : 'No data',
              short: true
            },
            {
              title: 'Insights',
              value: `${data.analytics.insights.length} total`,
              short: true
            },
            {
              title: 'Critical Issues',
              value: criticalIssues > 0 ? `${criticalIssues} ⚠️` : '0 ✅',
              short: true
            }
          ],
          footer: 'RealTechee Test Analytics',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
      if (criticalIssues > 0) {
        const criticalInsights = data.analytics.insights
          .filter(i => i.priority === 'critical')
          .map(i => `• ${i.title}: ${i.description}`)
          .join('\n');
        
        message.attachments.push({
          color: 'danger',
          title: 'Critical Issues Requiring Immediate Attention',
          text: criticalInsights,
          footer: 'Please address these issues as soon as possible'
        });
      }
      
      const fetch = require('node-fetch');
      const response = await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log('📱 Slack notification sent successfully');
      } else {
        console.warn('⚠️ Failed to send Slack notification:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to send Slack notification:', error.message);
    }
  }

  async sendEmailNotification(data, files) {
    // Email notification implementation would go here
    // This would integrate with services like SendGrid, AWS SES, etc.
    console.log('📧 Email notification configured but not implemented');
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.includes('analytics-') || file.includes('dashboard-')) {
          const filePath = path.join(this.outputDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} old analytics files`);
      }
    } catch (error) {
      console.warn('Could not cleanup old files:', error.message);
    }
  }

  outputMetrics(data) {
    const health = data.analytics.health;
    const criticalIssues = data.analytics.insights.filter(i => i.priority === 'critical').length;
    
    console.log('\n📊 KEY METRICS FOR CI/CD:');
    console.log(`HEALTH_SCORE=${health.score}`);
    console.log(`HEALTH_GRADE=${health.grade}`);
    console.log(`CRITICAL_ISSUES=${criticalIssues}`);
    console.log(`TEST_SUCCESS_RATE=${data.analytics.trends.testSuccessRate?.current?.toFixed(1) || 0}`);
    
    if (data.performance.length > 0) {
      console.log(`PERFORMANCE_SCORE=${data.performance[0].averagePageLoad || 0}`);
    }
    
    if (data.accessibility.length > 0) {
      console.log(`ACCESSIBILITY_SCORE=${data.accessibility[0].overallScore}`);
    }
    
    // Set exit code based on health score and critical issues
    if (criticalIssues > 0 || health.score < 70) {
      console.log('\n❌ Health score or critical issues detected - consider this a warning');
      // Don't exit with error code to avoid breaking CI/CD, just warn
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] && args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1];
      options[key] = value;
    }
  }
  
  const generator = new AnalyticsGenerator(options);
  
  try {
    await generator.run();
    process.exit(0);
  } catch (error) {
    console.error('Analytics generation failed:', error);
    process.exit(1);
  }
}

// Export for module usage
module.exports = { AnalyticsGenerator };

// Run if called directly
if (require.main === module) {
  main();
}

/* 
Usage Examples:

# Generate analytics with default settings
node scripts/generate-analytics.js

# Generate with custom data directory
node scripts/generate-analytics.js --dataDir /custom/test-results

# Generate with Slack notifications
node scripts/generate-analytics.js --slackWebhook https://hooks.slack.com/services/...

# Generate in CI/CD with email notifications
CI=true node scripts/generate-analytics.js --emailNotification admin@realtechee.com
*/
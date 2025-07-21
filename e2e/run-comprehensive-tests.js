#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs comprehensive business logic tests for admin pages
 * using the enhanced test framework with fail-fast validation and
 * comprehensive evidence collection.
 * 
 * Usage:
 *   node e2e/run-comprehensive-tests.js [options]
 * 
 * Options:
 *   --page <projects|quotes|requests|all>  Page(s) to test (default: all)
 *   --fail-fast <true|false>               Enable fail-fast mode (default: true)
 *   --headless <true|false>                Run in headless mode (default: false)
 *   --viewport <mobile|tablet|desktop>     Viewport to test (default: desktop)
 * 
 * Examples:
 *   node e2e/run-comprehensive-tests.js --page projects
 *   node e2e/run-comprehensive-tests.js --page all --fail-fast true
 */

const { chromium } = require('playwright');
const BusinessLogicTestRunner = require('./framework/BusinessLogicTestRunner');
const path = require('path');
const fs = require('fs');

class ComprehensiveTestRunner {
  constructor(options = {}) {
    this.options = {
      pages: options.pages || ['projects', 'quotes', 'requests'],
      failFast: options.failFast !== false,
      headless: options.headless === true,
      viewport: options.viewport || 'desktop',
      parallel: options.parallel === true,
      ...options
    };
    
    this.results = {
      summary: {
        totalPages: 0,
        passedPages: 0,
        failedPages: 0,
        criticalFailures: 0,
        startTime: null,
        endTime: null,
        duration: null
      },
      pageResults: [],
      globalErrors: []
    };
    
    this.browser = null;
    this.context = null;
  }

  async setup() {
    console.log('🚀 Setting up comprehensive test environment...');
    
    try {
      // Kill existing node processes to prevent port conflicts
      console.log('⚡ Killing existing node processes...');
      const { exec } = require('child_process');
      await new Promise((resolve) => {
        exec('killall "node"', (error) => {
          // Ignore errors - processes might not exist
          resolve();
        });
      });
      
      // Wait for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start the development server
      console.log('🔥 Starting development server...');
      const serverProcess = exec('npm run dev', { 
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      // Wait for server to start
      await this.waitForServer();
      
      // Setup browser
      this.browser = await chromium.launch({ 
        headless: this.options.headless,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
      });
      
      this.context = await this.browser.newContext({
        viewport: this.getViewportSize(),
        storageState: 'e2e/playwright/.auth/user.json'
      });
      
      console.log('✅ Test environment setup complete');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  async waitForServer() {
    const maxAttempts = 30;
    const delay = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('http://localhost:3000', { timeout: 5000 });
        if (response.ok) {
          console.log('✅ Server is ready');
          return;
        }
      } catch (error) {
        console.log(`⏳ Waiting for server... (${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Server did not start within expected time');
  }

  getViewportSize() {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 1080 }
    };
    
    return viewports[this.options.viewport] || viewports.desktop;
  }

  async runTests() {
    this.results.summary.startTime = new Date().toISOString();
    console.log('\n🎯 Starting comprehensive admin page testing...');
    console.log(`📄 Pages to test: ${this.options.pages.join(', ')}`);
    console.log(`⚡ Fail-fast mode: ${this.options.failFast ? 'ENABLED' : 'DISABLED'}`);
    console.log(`👁️  Headless mode: ${this.options.headless ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📱 Viewport: ${this.options.viewport}`);
    
    try {
      await this.setup();
      
      for (const pageType of this.options.pages) {
        await this.testPage(pageType);
        
        // Stop on critical failure if fail-fast is enabled
        if (this.options.failFast && this.results.summary.criticalFailures > 0) {
          console.log('🛑 Stopping test execution due to critical failure (fail-fast mode)');
          break;
        }
      }
      
    } catch (error) {
      this.results.globalErrors.push({
        type: 'setup_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Global test error:', error.message);
    } finally {
      await this.cleanup();
    }
    
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = new Date(this.results.summary.endTime) - new Date(this.results.summary.startTime);
    
    await this.generateSummaryReport();
  }

  async testPage(pageType) {
    console.log(`\n📄 Testing admin/${pageType} page...`);
    this.results.summary.totalPages++;
    
    const pageResult = {
      pageType,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      success: false,
      criticalFailure: false,
      testResults: null,
      reportPath: null,
      error: null
    };
    
    try {
      // Create new page for this test
      const page = await this.context.newPage();
      
      // Setup console logging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`🔴 [${pageType}] Browser Error: ${msg.text()}`);
        }
      });
      
      page.on('pageerror', error => {
        console.log(`🔴 [${pageType}] Page Error: ${error.message}`);
      });
      
      // Create test runner for this page
      const testRunner = new BusinessLogicTestRunner({
        testSuiteName: `admin-${pageType}-comprehensive`,
        failFast: this.options.failFast,
        screenshotValidation: true,
        businessLogicValidation: true
      });
      
      // Run comprehensive tests
      const testResults = await testRunner.runAdminPageTests(page, pageType);
      
      // Generate report
      const report = testRunner.generateReport();
      
      pageResult.endTime = new Date().toISOString();
      pageResult.duration = new Date(pageResult.endTime) - new Date(pageResult.startTime);
      pageResult.success = testResults.success;
      pageResult.criticalFailure = report.criticalFailure;
      pageResult.testResults = testResults;
      pageResult.reportPath = report.htmlPath;
      
      if (pageResult.success) {
        this.results.summary.passedPages++;
        console.log(`✅ [${pageType}] All tests passed`);
      } else {
        this.results.summary.failedPages++;
        console.log(`❌ [${pageType}] Tests failed: ${testResults.reason || 'Unknown error'}`);
      }
      
      if (pageResult.criticalFailure) {
        this.results.summary.criticalFailures++;
        console.log(`🚨 [${pageType}] Critical failure occurred`);
      }
      
      await page.close();
      
    } catch (error) {
      pageResult.endTime = new Date().toISOString();
      pageResult.duration = new Date(pageResult.endTime) - new Date(pageResult.startTime);
      pageResult.error = error.message;
      pageResult.criticalFailure = true;
      this.results.summary.failedPages++;
      this.results.summary.criticalFailures++;
      
      console.error(`💥 [${pageType}] Test execution error:`, error.message);
    }
    
    this.results.pageResults.push(pageResult);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      if (this.context) {
        await this.context.close();
      }
      
      if (this.browser) {
        await this.browser.close();
      }
      
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
  }

  async generateSummaryReport() {
    console.log('\n📊 Generating comprehensive test summary...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join('test-results', `${timestamp}-comprehensive-summary`);
    
    // Create report directory
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Generate JSON summary
    const jsonPath = path.join(reportDir, 'comprehensive-summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
    
    // Generate text summary
    const textSummary = this.generateTextSummary();
    const textPath = path.join(reportDir, 'summary.txt');
    fs.writeFileSync(textPath, textSummary);
    
    // Generate HTML summary
    const htmlSummary = this.generateHTMLSummary();
    const htmlPath = path.join(reportDir, 'summary.html');
    fs.writeFileSync(htmlPath, htmlSummary);
    
    // Console output
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(textSummary);
    console.log('='.repeat(80));
    console.log(`📁 Reports saved to: ${reportDir}`);
    console.log(`📄 JSON Report: ${path.basename(jsonPath)}`);
    console.log(`📄 Text Summary: ${path.basename(textPath)}`);
    console.log(`📄 HTML Summary: ${path.basename(htmlPath)}`);
    
    // Individual page reports
    if (this.results.pageResults.length > 0) {
      console.log('\n📄 Individual Page Reports:');
      this.results.pageResults.forEach(result => {
        if (result.reportPath) {
          console.log(`  ${result.pageType}: ${result.reportPath}`);
        }
      });
    }
    
    return {
      reportDir,
      jsonPath,
      textPath,
      htmlPath,
      results: this.results
    };
  }

  generateTextSummary() {
    const { summary, pageResults } = this.results;
    const duration = summary.duration ? (summary.duration / 1000).toFixed(2) + 's' : 'N/A';
    const successRate = summary.totalPages > 0 ? ((summary.passedPages / summary.totalPages) * 100).toFixed(1) : 0;
    
    let text = `
COMPREHENSIVE ADMIN PAGE TEST RESULTS
=====================================

CONFIGURATION:
- Test Mode: ${this.options.failFast ? 'Fail-Fast ENABLED' : 'Fail-Fast DISABLED'}
- Viewport: ${this.options.viewport}
- Headless: ${this.options.headless ? 'ENABLED' : 'DISABLED'}
- Pages Tested: ${this.options.pages.join(', ')}

OVERALL RESULTS:
- Total Pages: ${summary.totalPages}
- Passed: ${summary.passedPages}
- Failed: ${summary.failedPages}
- Critical Failures: ${summary.criticalFailures}
- Success Rate: ${successRate}%
- Total Duration: ${duration}

PAGE-BY-PAGE RESULTS:
`;

    pageResults.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const critical = result.criticalFailure ? ' 🚨 CRITICAL' : '';
      const pageDuration = result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A';
      
      text += `
- ${result.pageType.toUpperCase()}: ${status}${critical}
  Duration: ${pageDuration}
  Report: ${result.reportPath ? path.basename(result.reportPath) : 'N/A'}
  ${result.error ? `Error: ${result.error}` : ''}
`;
    });

    if (this.results.globalErrors.length > 0) {
      text += `
GLOBAL ERRORS:
`;
      this.results.globalErrors.forEach(error => {
        text += `- ${error.type}: ${error.message}\n`;
      });
    }

    text += `
RECOMMENDATIONS:
`;

    if (summary.criticalFailures > 0) {
      text += `- 🚨 Address critical failures immediately before proceeding
`;
    }

    if (summary.failedPages > 0) {
      text += `- 🔍 Review failed page reports for detailed error analysis
`;
    }

    if (summary.passedPages === summary.totalPages) {
      text += `- ✅ All tests passed! The admin pages are functioning correctly
`;
    }

    return text;
  }

  generateHTMLSummary() {
    // Simplified HTML summary - full implementation would be more comprehensive
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .critical { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Comprehensive Admin Page Test Summary</h1>
    <div class="summary">
        <h2>Results</h2>
        <p>Total Pages: ${this.results.summary.totalPages}</p>
        <p class="passed">Passed: ${this.results.summary.passedPages}</p>
        <p class="failed">Failed: ${this.results.summary.failedPages}</p>
        <p class="critical">Critical Failures: ${this.results.summary.criticalFailures}</p>
    </div>
    
    <h2>Page Results</h2>
    <ul>
        ${this.results.pageResults.map(result => `
            <li>
                <strong>${result.pageType}</strong>: 
                <span class="${result.success ? 'passed' : 'failed'}">
                    ${result.success ? 'PASSED' : 'FAILED'}
                </span>
                ${result.criticalFailure ? '<span class="critical"> CRITICAL</span>' : ''}
            </li>
        `).join('')}
    </ul>
</body>
</html>`;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'page':
        options.pages = value === 'all' ? ['projects', 'quotes', 'requests'] : [value];
        break;
      case 'fail-fast':
        options.failFast = value === 'true';
        break;
      case 'headless':
        options.headless = value === 'true';
        break;
      case 'viewport':
        options.viewport = value;
        break;
    }
  }
  
  const runner = new ComprehensiveTestRunner(options);
  
  try {
    await runner.runTests();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ComprehensiveTestRunner;
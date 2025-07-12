const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor(testSuiteName, options = {}) {
    this.testSuiteName = testSuiteName;
    this.baseDir = options.baseDir || 'test-results';
    
    // Create sortable folder name: YYYY-MM-DD_HH-MM-SS_[mode]
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
    const mode = options.mode || this.inferModeFromTestSuite(testSuiteName);
    this.reportDir = path.join(this.baseDir, `${dateStr}_${mode}`);
    
    this.results = {
      metadata: {
        testSuite: testSuiteName,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        ...options.metadata
      },
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 0,
        startTime: null,
        endTime: null,
        duration: null
      },
      tests: [],
      screenshots: [],
      artifacts: []
    };
    
    this.setupDirectories();
  }

  setupDirectories() {
    try {
      // Create main directories with proper error handling
      const dirs = [
        this.reportDir,
        path.join(this.reportDir, 'screenshots'),
        path.join(this.reportDir, 'screenshots', 'passed'),
        path.join(this.reportDir, 'screenshots', 'failed'),
        path.join(this.reportDir, 'screenshots', 'errors'),
        path.join(this.reportDir, 'artifacts'),
        path.join(this.reportDir, 'logs')
      ];

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Verify directory was actually created
        if (!fs.existsSync(dir)) {
          throw new Error(`Failed to create directory: ${dir}`);
        }
      });

      // Create initial log file
      const logFile = path.join(this.reportDir, 'logs', 'test.log');
      fs.writeFileSync(logFile, `Test started: ${new Date().toISOString()}\n`);

      console.log(`📁 Test report directory created: ${this.reportDir}`);
      console.log(`📁 Directory structure verified successfully`);
      
      return true;
    } catch (error) {
      console.error(`❌ CRITICAL: Failed to create test directories: ${error.message}`);
      console.error(`❌ Test cannot proceed without proper directory structure`);
      throw new Error(`Directory setup failed: ${error.message}`);
    }
  }

  startTest(testName, metadata = {}) {
    this.results.summary.startTime = new Date().toISOString();
    console.log(`🚀 Starting test suite: ${this.testSuiteName}`);
    return {
      testName,
      startTime: new Date().toISOString(),
      metadata
    };
  }

  addTestResult(testData) {
    const test = {
      name: testData.name,
      status: testData.status, // 'passed', 'failed', 'error', 'skipped'
      startTime: testData.startTime,
      endTime: testData.endTime || new Date().toISOString(),
      duration: testData.duration || this.calculateDuration(testData.startTime, testData.endTime),
      details: testData.details || {},
      assertions: testData.assertions || [],
      screenshots: testData.screenshots || [],
      error: testData.error || null,
      metadata: testData.metadata || {}
    };

    this.results.tests.push(test);
    this.results.summary.totalTests++;
    
    switch (test.status) {
      case 'passed':
        this.results.summary.passed++;
        console.log(`✅ ${test.name}: PASSED`);
        break;
      case 'failed':
        this.results.summary.failed++;
        console.log(`❌ ${test.name}: FAILED - ${test.error || 'Unknown error'}`);
        break;
      case 'error':
        this.results.summary.errors++;
        console.log(`💥 ${test.name}: ERROR - ${test.error || 'Unknown error'}`);
        break;
      case 'skipped':
        this.results.summary.skipped++;
        console.log(`⏭️  ${test.name}: SKIPPED`);
        break;
    }

    return test;
  }

  async captureScreenshot(page, testName, status = 'info', description = '') {
    const screenshotDir = path.join(this.reportDir, 'screenshots', status);
    const filename = `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, filename);
    
    try {
      // Verify screenshot directory exists
      if (!fs.existsSync(screenshotDir)) {
        throw new Error(`Screenshot directory does not exist: ${screenshotDir}`);
      }

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });

      // Verify screenshot was actually created
      if (!fs.existsSync(screenshotPath)) {
        throw new Error(`Screenshot file was not created: ${screenshotPath}`);
      }

      const screenshot = {
        testName,
        filename,
        path: screenshotPath,
        relativePath: path.relative(this.reportDir, screenshotPath),
        status,
        description,
        timestamp: new Date().toISOString(),
        metadata: {
          viewport: await page.viewport(),
          url: page.url(),
          fileSize: fs.statSync(screenshotPath).size
        }
      };

      this.results.screenshots.push(screenshot);
      console.log(`📸 Screenshot captured: ${filename} (${screenshot.metadata.fileSize} bytes)`);
      this.logMessage('info', `Screenshot captured: ${filename} for test: ${testName}`);
      return screenshot;
    } catch (error) {
      console.error(`📸 CRITICAL: Failed to capture screenshot: ${error.message}`);
      this.logMessage('error', `Failed to capture screenshot: ${error.message}`, { testName, status });
      
      // This is a critical failure for test validation
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  addArtifact(filePath, description = '', type = 'file') {
    const artifact = {
      path: filePath,
      relativePath: path.relative(this.reportDir, filePath),
      description,
      type,
      timestamp: new Date().toISOString(),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    };

    this.results.artifacts.push(artifact);
    console.log(`📎 Artifact added: ${artifact.relativePath}`);
    return artifact;
  }

  logMessage(level, message, metadata = {}) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Write to log file
    const logFile = path.join(this.reportDir, 'logs', 'test.log');
    const logLine = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}\n`;
    fs.appendFileSync(logFile, logLine);

    // Also log to console with appropriate formatting
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛'
    };
    console.log(`${emoji[level] || 'ℹ️'} ${message}`);
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    return new Date(endTime) - new Date(startTime);
  }

  generateHTMLReport() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${this.testSuiteName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 8px; }
        .metric.passed { background: #d4edda; color: #155724; }
        .metric.failed { background: #f8d7da; color: #721c24; }
        .metric.error { background: #fff3cd; color: #856404; }
        .metric .number { font-size: 2.5em; font-weight: bold; display: block; }
        .metric .label { font-size: 0.9em; text-transform: uppercase; opacity: 0.8; }
        .tests { padding: 0 30px 30px; }
        .test { border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
        .test-header { padding: 15px 20px; background: #f8f9fa; cursor: pointer; display: flex; justify-content: between; align-items: center; }
        .test-header.passed { border-left: 4px solid #28a745; }
        .test-header.failed { border-left: 4px solid #dc3545; }
        .test-header.error { border-left: 4px solid #ffc107; }
        .test-details { padding: 20px; background: white; display: none; }
        .test-details.show { display: block; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 15px; }
        .screenshot { border: 1px solid #dee2e6; border-radius: 4px; overflow: hidden; }
        .screenshot img { width: 100%; height: auto; display: block; }
        .screenshot .caption { padding: 10px; background: #f8f9fa; font-size: 0.9em; }
        .toggle { background: none; border: none; color: #007bff; cursor: pointer; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-badge.passed { background: #d4edda; color: #155724; }
        .status-badge.failed { background: #f8d7da; color: #721c24; }
        .status-badge.error { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Report: ${this.testSuiteName}</h1>
            <p>Generated on ${new Date(this.results.metadata.timestamp).toLocaleString()}</p>
            <p>Duration: ${this.results.summary.duration ? (this.results.summary.duration / 1000).toFixed(2) + 's' : 'N/A'}</p>
        </div>
        
        <div class="summary">
            <div class="metric passed">
                <span class="number">${this.results.summary.passed}</span>
                <span class="label">Passed</span>
            </div>
            <div class="metric failed">
                <span class="number">${this.results.summary.failed}</span>
                <span class="label">Failed</span>
            </div>
            <div class="metric error">
                <span class="number">${this.results.summary.errors}</span>
                <span class="label">Errors</span>
            </div>
            <div class="metric">
                <span class="number">${this.results.summary.totalTests}</span>
                <span class="label">Total</span>
            </div>
        </div>
        
        <div class="tests">
            <h2>Test Results</h2>
            ${this.results.tests.map(test => `
                <div class="test">
                    <div class="test-header ${test.status}" onclick="toggleDetails('${test.name.replace(/[^a-zA-Z0-9]/g, '')}')">
                        <div>
                            <strong>${test.name}</strong>
                            <span class="status-badge ${test.status}">${test.status}</span>
                        </div>
                        <button class="toggle">Toggle Details</button>
                    </div>
                    <div class="test-details" id="details-${test.name.replace(/[^a-zA-Z0-9]/g, '')}">
                        <p><strong>Duration:</strong> ${test.duration ? (test.duration / 1000).toFixed(2) + 's' : 'N/A'}</p>
                        ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                        ${test.details && Object.keys(test.details).length > 0 ? `
                            <p><strong>Details:</strong></p>
                            <pre>${JSON.stringify(test.details, null, 2)}</pre>
                        ` : ''}
                        ${test.screenshots.length > 0 ? `
                            <h4>Screenshots</h4>
                            <div class="screenshots">
                                ${test.screenshots.map(screenshot => `
                                    <div class="screenshot">
                                        <img src="${screenshot.relativePath}" alt="${screenshot.description}" />
                                        <div class="caption">${screenshot.description || screenshot.filename}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        function toggleDetails(testId) {
            const details = document.getElementById('details-' + testId);
            details.classList.toggle('show');
        }
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📄 HTML report generated: ${htmlPath}`);
    return htmlPath;
  }

  finalize() {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = this.calculateDuration(
      this.results.summary.startTime,
      this.results.summary.endTime
    );

    // Generate JSON report
    const jsonPath = path.join(this.reportDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    const htmlPath = this.generateHTMLReport();

    // Generate summary file
    const summaryPath = path.join(this.reportDir, 'summary.txt');
    const summaryContent = `
Test Suite: ${this.testSuiteName}
Timestamp: ${this.results.metadata.timestamp}
Duration: ${this.results.summary.duration ? (this.results.summary.duration / 1000).toFixed(2) + 's' : 'N/A'}

Results:
- Total Tests: ${this.results.summary.totalTests}
- Passed: ${this.results.summary.passed}
- Failed: ${this.results.summary.failed}
- Errors: ${this.results.summary.errors}
- Skipped: ${this.results.summary.skipped}

Success Rate: ${this.results.summary.totalTests > 0 ? 
  ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1) : 0}%

Screenshots: ${this.results.screenshots.length}
Artifacts: ${this.results.artifacts.length}
`;

    fs.writeFileSync(summaryPath, summaryContent);

    console.log('\n🎯 TEST REPORT SUMMARY');
    console.log('======================');
    console.log(`📁 Report Directory: ${this.reportDir}`);
    console.log(`📄 JSON Report: ${path.basename(jsonPath)}`);
    console.log(`📄 HTML Report: ${path.basename(htmlPath)}`);
    console.log(`📄 Summary: ${path.basename(summaryPath)}`);
    console.log(`📸 Screenshots: ${this.results.screenshots.length}`);
    console.log(`📎 Artifacts: ${this.results.artifacts.length}`);
    console.log(`\n${summaryContent}`);

    return {
      reportDir: this.reportDir,
      jsonPath,
      htmlPath,
      summaryPath,
      results: this.results
    };
  }

  /**
   * Infer test mode from test suite name for folder naming
   */
  inferModeFromTestSuite(testSuiteName) {
    const name = testSuiteName.toLowerCase();
    
    if (name.includes('semi-auto') || name.includes('semi') || name.includes('collaborative')) {
      return 'semi';
    } else if (name.includes('fully-auto') || name.includes('modular-admin')) {
      return 'full';
    } else if (name.includes('validation') || name.includes('component')) {
      return 'validation';
    } else if (name.includes('simple') || name.includes('browser')) {
      return 'simple';
    } else {
      return 'test';
    }
  }
}

module.exports = TestReporter;
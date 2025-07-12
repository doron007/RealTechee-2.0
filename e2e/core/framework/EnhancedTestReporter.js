const fs = require('fs');
const path = require('path');

class EnhancedTestReporter {
  constructor(testSuiteName, options = {}) {
    this.testSuiteName = testSuiteName;
    this.baseDir = options.baseDir || 'test-results';
    
    // Create sortable folder name: YYYY-MM-DD_HH-MM-SS_[mode]
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
    const mode = options.mode || this.inferModeFromTestSuite(testSuiteName);
    this.reportDir = path.join(this.baseDir, `${dateStr}_${mode}`);
    
    // Enhanced hierarchical structure
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
      phases: {
        systemPriming: {
          name: 'System Priming',
          status: 'pending',
          startTime: null,
          endTime: null,
          duration: null,
          tests: [],
          summary: { total: 0, passed: 0, failed: 0, errors: 0 }
        },
        authentication: {
          name: 'Authentication & Login',
          status: 'pending',
          startTime: null,
          endTime: null,
          duration: null,
          tests: [],
          summary: { total: 0, passed: 0, failed: 0, errors: 0 }
        },
        pages: {
          name: 'Admin Pages Testing',
          status: 'pending',
          startTime: null,
          endTime: null,
          duration: null,
          pages: {
            login: {
              name: 'Login Page',
              status: 'pending',
              tests: [],
              responsiveness: { tests: [], summary: { total: 0, passed: 0, failed: 0 }},
              functionality: { tests: [], summary: { total: 0, passed: 0, failed: 0 }}
            },
            dashboard: {
              name: 'Admin Dashboard',
              status: 'pending',
              tests: [],
              responsiveness: { tests: [], summary: { total: 0, passed: 0, failed: 0 }},
              functionality: { tests: [], summary: { total: 0, passed: 0, failed: 0 }}
            },
            projects: {
              name: 'Admin Projects',
              status: 'pending',
              tests: [],
              responsiveness: { tests: [], summary: { total: 0, passed: 0, failed: 0 }},
              functionality: { tests: [], summary: { total: 0, passed: 0, failed: 0 }}
            },
            quotes: {
              name: 'Admin Quotes',
              status: 'pending',
              tests: [],
              responsiveness: { tests: [], summary: { total: 0, passed: 0, failed: 0 }},
              functionality: { tests: [], summary: { total: 0, passed: 0, failed: 0 }}
            },
            requests: {
              name: 'Admin Requests',
              status: 'pending',
              tests: [],
              responsiveness: { tests: [], summary: { total: 0, passed: 0, failed: 0 }},
              functionality: { tests: [], summary: { total: 0, passed: 0, failed: 0 }}
            }
          },
          summary: { total: 0, passed: 0, failed: 0, errors: 0 }
        }
      },
      screenshots: [],
      artifacts: []
    };
    
    this.setupDirectories();
  }

  setupDirectories() {
    try {
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
        if (!fs.existsSync(dir)) {
          throw new Error(`Failed to create directory: ${dir}`);
        }
      });

      const logFile = path.join(this.reportDir, 'logs', 'test.log');
      fs.writeFileSync(logFile, `Test started: ${new Date().toISOString()}\n`);

      console.log(`📁 Enhanced test report directory created: ${this.reportDir}`);
      console.log(`📁 Directory structure verified successfully`);
      
      return true;
    } catch (error) {
      console.error(`❌ CRITICAL: Failed to create test directories: ${error.message}`);
      throw new Error(`Directory setup failed: ${error.message}`);
    }
  }

  startTest(testName, metadata = {}) {
    this.results.summary.startTime = new Date().toISOString();
    console.log(`🚀 Starting enhanced test suite: ${this.testSuiteName}`);
    return {
      testName,
      startTime: new Date().toISOString(),
      metadata
    };
  }

  /**
   * Start a test phase (systemPriming, authentication, pages)
   */
  startPhase(phaseName) {
    if (this.results.phases[phaseName]) {
      this.results.phases[phaseName].startTime = new Date().toISOString();
      this.results.phases[phaseName].status = 'running';
      console.log(`📋 Starting phase: ${this.results.phases[phaseName].name}`);
    }
  }

  /**
   * Complete a test phase
   */
  completePhase(phaseName) {
    if (this.results.phases[phaseName]) {
      const phase = this.results.phases[phaseName];
      phase.endTime = new Date().toISOString();
      phase.duration = new Date(phase.endTime) - new Date(phase.startTime);
      
      // Calculate phase status based on tests
      const hasFailures = phase.tests?.some(test => test.status === 'failed') ||
                         (phase.pages && Object.values(phase.pages).some(page => 
                           page.tests?.some(test => test.status === 'failed') ||
                           page.functionality?.tests?.some(test => test.status === 'failed') ||
                           page.responsiveness?.tests?.some(test => test.status === 'failed')
                         ));
      
      const hasErrors = phase.tests?.some(test => test.status === 'error') ||
                       (phase.pages && Object.values(phase.pages).some(page => 
                         page.tests?.some(test => test.status === 'error') ||
                         page.functionality?.tests?.some(test => test.status === 'error') ||
                         page.responsiveness?.tests?.some(test => test.status === 'error')
                       ));
      
      // Determine final status
      if (hasFailures) {
        phase.status = 'failed';
      } else if (hasErrors) {
        phase.status = 'error';
      } else if (phase.summary.total > 0) {
        phase.status = 'passed';
      } else {
        phase.status = 'skipped';
      }
      
      // Update page statuses for pages phase
      if (phaseName === 'pages' && phase.pages) {
        Object.entries(phase.pages).forEach(([pageKey, page]) => {
          this.updatePageStatus(pageKey);
        });
      }
      
      console.log(`✅ Completed phase: ${phase.name} - ${phase.status}`);
    }
  }

  /**
   * Add system priming test
   */
  addSystemPrimingTest(testData) {
    const test = this.formatTestData(testData);
    this.results.phases.systemPriming.tests.push(test);
    this.updatePhaseSummary('systemPriming', test);
    this.updateGlobalSummary(test);
  }

  /**
   * Add authentication test
   */
  addAuthenticationTest(testData) {
    const test = this.formatTestData(testData);
    this.results.phases.authentication.tests.push(test);
    this.updatePhaseSummary('authentication', test);
    this.updateGlobalSummary(test);
  }

  /**
   * Add page test (with category: responsiveness or functionality)
   */
  addPageTest(pageName, category, testData) {
    const test = this.formatTestData(testData);
    
    if (this.results.phases.pages.pages[pageName]) {
      if (category === 'responsiveness' || category === 'functionality') {
        this.results.phases.pages.pages[pageName][category].tests.push(test);
        this.updatePageCategorySummary(pageName, category, test);
      } else {
        this.results.phases.pages.pages[pageName].tests.push(test);
      }
      this.updatePhaseSummary('pages', test);
      this.updateGlobalSummary(test);
    }
  }

  /**
   * Update phase summary counts
   */
  updatePhaseSummary(phaseName, test) {
    const phase = this.results.phases[phaseName];
    if (phase.summary) {
      phase.summary.total++;
      if (test.status === 'passed') phase.summary.passed++;
      else if (test.status === 'failed') phase.summary.failed++;
      else if (test.status === 'error') phase.summary.errors++;
    }
  }

  /**
   * Update page category summary
   */
  updatePageCategorySummary(pageName, category, test) {
    const pageCategory = this.results.phases.pages.pages[pageName][category];
    if (pageCategory.summary) {
      pageCategory.summary.total++;
      if (test.status === 'passed') pageCategory.summary.passed++;
      else if (test.status === 'failed') pageCategory.summary.failed++;
    }
  }

  /**
   * Update page status based on its tests
   */
  updatePageStatus(pageKey) {
    const page = this.results.phases.pages.pages[pageKey];
    if (!page) return;
    
    const allTests = [
      ...page.tests,
      ...page.responsiveness.tests,
      ...page.functionality.tests
    ];
    
    if (allTests.length === 0) {
      page.status = 'skipped';
      return;
    }
    
    const hasFailures = allTests.some(test => test.status === 'failed');
    const hasErrors = allTests.some(test => test.status === 'error');
    
    if (hasFailures) {
      page.status = 'failed';
    } else if (hasErrors) {
      page.status = 'error';
    } else {
      page.status = 'passed';
    }
  }

  /**
   * Update global summary
   */
  updateGlobalSummary(test) {
    this.results.summary.totalTests++;
    if (test.status === 'passed') this.results.summary.passed++;
    else if (test.status === 'failed') this.results.summary.failed++;
    else if (test.status === 'error') this.results.summary.errors++;
    else if (test.status === 'skipped') this.results.summary.skipped++;
  }

  /**
   * Format test data consistently
   */
  formatTestData(testData) {
    return {
      name: testData.name,
      description: testData.description || testData.name,
      status: testData.status,
      startTime: testData.startTime,
      endTime: testData.endTime || new Date().toISOString(),
      duration: testData.duration || this.calculateDuration(testData.startTime, testData.endTime),
      details: testData.details || {},
      assertions: testData.assertions || [],
      screenshots: testData.screenshots || [],
      error: testData.error || null,
      metadata: testData.metadata || {},
      whatWasTested: testData.whatWasTested || [],
      steps: testData.steps || []
    };
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    return new Date(endTime) - new Date(startTime);
  }

  /**
   * Capture screenshot with enhanced metadata
   */
  async captureScreenshot(page, name, status, description, phase = null, pageName = null) {
    try {
      const timestamp = Date.now();
      const filename = `${name}-${timestamp}.png`;
      const screenshotPath = path.join(this.reportDir, 'screenshots', status, filename);
      
      await page.screenshot({ path: screenshotPath, fullPage: false });
      
      const screenshot = {
        name,
        filename,
        path: screenshotPath,
        relativePath: `screenshots/${status}/${filename}`,
        description,
        timestamp: new Date().toISOString(),
        status,
        phase,
        pageName,
        size: fs.statSync(screenshotPath).size
      };
      
      this.results.screenshots.push(screenshot);
      
      console.log(`📸 Screenshot captured: ${filename} (${screenshot.size} bytes)`);
      console.log(`ℹ️ Screenshot captured: ${filename} for test: ${name}`);
      
      return screenshot;
    } catch (error) {
      console.error(`❌ Failed to capture screenshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Log message with enhanced context
   */
  logMessage(level, message, phase = null, pageName = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      phase,
      pageName
    };
    
    const logFile = path.join(this.reportDir, 'logs', 'test.log');
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(logFile, logLine);
    
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  /**
   * Generate comprehensive HTML report
   */
  generateEnhancedHTMLReport() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Test Report - ${this.testSuiteName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 15px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; padding: 20px; }
        .metric { text-align: center; padding: 18px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .metric.passed { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); color: #155724; }
        .metric.failed { background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); color: #721c24; }
        .metric.error { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); color: #856404; }
        .metric .number { font-size: 2.2em; font-weight: bold; display: block; margin-bottom: 6px; }
        .metric .label { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
        
        .phases { padding: 0 20px 20px; }
        .phase { border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 12px; overflow: hidden; }
        .phase-header { padding: 12px 16px; background: #f8f9fa; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .phase-header.passed { border-left: 6px solid #28a745; }
        .phase-header.failed { border-left: 6px solid #dc3545; }
        .phase-header.error { border-left: 6px solid #ffc107; }
        .phase-header.skipped { border-left: 6px solid #6c757d; }
        .phase-content { padding: 16px; background: white; display: none; }
        .phase-content.show { display: block; }
        
        .phase-title { font-size: 1.1em; font-weight: 600; margin: 0; }
        .phase-meta { font-size: 0.8em; color: #6c757d; margin-top: 3px; }
        .phase-stats { display: flex; gap: 10px; }
        .phase-stat { background: #f1f3f4; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        
        .test-grid { display: grid; gap: 8px; margin-top: 12px; }
        .test-item { border: 1px solid #e9ecef; border-radius: 4px; overflow: hidden; }
        .test-header { padding: 10px 12px; background: #f8f9fa; cursor: pointer; }
        .test-header.passed { border-left: 3px solid #28a745; }
        .test-header.failed { border-left: 3px solid #dc3545; }
        .test-header.error { border-left: 3px solid #ffc107; }
        .test-content { padding: 12px; background: white; display: none; }
        .test-content.show { display: block; }
        
        .page-section { margin: 8px 0; }
        .page-header { background: #e9ecef; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; cursor: pointer; }
        .page-content { display: none; }
        .page-content.show { display: block; }
        .category-section { margin: 8px 0; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; }
        
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 15px; }
        .screenshot { border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .screenshot img { width: 100%; height: auto; display: block; }
        .screenshot .caption { padding: 12px; background: #f8f9fa; font-size: 0.9em; }
        
        .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-badge.passed { background: #d4edda; color: #155724; }
        .status-badge.failed { background: #f8d7da; color: #721c24; }
        .status-badge.error { background: #fff3cd; color: #856404; }
        .status-badge.skipped { background: #d1ecf1; color: #0c5460; }
        
        .what-tested { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .steps { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 10px 0; }
        .steps ol { margin: 0; padding-left: 20px; }
        
        .toggle-btn { background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.75em; }
        .toggle-btn:hover { background: #0056b3; }
        
        .expandable { transition: all 0.3s ease; }
        .duration { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Enhanced Test Report</h1>
            <h2>${this.testSuiteName}</h2>
            <p>Generated: ${new Date(this.results.metadata.timestamp).toLocaleString()}</p>
            <p>Duration: ${this.formatDuration(this.results.summary.duration)}</p>
            <p>Environment: ${this.results.metadata.environment} | Node: ${this.results.metadata.nodeVersion}</p>
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
        
        <div class="phases">
            <h2>📋 Test Phases</h2>
            ${this.generatePhasesHTML()}
        </div>
    </div>
    
    <script>
        function togglePhase(phaseId) {
            const content = document.getElementById('phase-' + phaseId);
            const button = content.previousElementSibling.querySelector('.toggle-btn');
            content.classList.toggle('show');
            button.textContent = content.classList.contains('show') ? 'Hide' : 'Show';
        }
        
        function toggleTest(testId) {
            const content = document.getElementById('test-' + testId);
            content.classList.toggle('show');
        }
        
        function togglePage(pageId) {
            const content = document.getElementById('page-' + pageId);
            const button = content.previousElementSibling.querySelector('.toggle-btn');
            content.classList.toggle('show');
            button.textContent = content.classList.contains('show') ? 'Hide' : 'Show';
        }
    </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generate phases HTML
   */
  generatePhasesHTML() {
    return Object.entries(this.results.phases).map(([phaseKey, phase]) => {
      const phaseId = phaseKey.replace(/[^a-zA-Z0-9]/g, '');
      
      return `
        <div class="phase">
            <div class="phase-header ${phase.status}" onclick="togglePhase('${phaseId}')">
                <div>
                    <div class="phase-title">${phase.name}</div>
                    <div class="phase-meta">
                        <span class="duration">${this.formatDuration(phase.duration)}</span>
                    </div>
                </div>
                <div class="phase-stats">
                    <div class="phase-stat">
                        <span class="status-badge ${phase.status}">${phase.status}</span>
                    </div>
                    <div class="phase-stat">
                        ${phase.summary.passed}/${phase.summary.total} passed
                    </div>
                    <button class="toggle-btn">Show</button>
                </div>
            </div>
            <div class="phase-content" id="phase-${phaseId}">
                ${this.generatePhaseContentHTML(phaseKey, phase)}
            </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate phase content HTML
   */
  generatePhaseContentHTML(phaseKey, phase) {
    if (phaseKey === 'pages') {
      return this.generatePagesHTML(phase);
    } else {
      return this.generateTestsHTML(phase.tests);
    }
  }

  /**
   * Generate pages HTML for the pages phase - only show pages that have tests
   */
  generatePagesHTML(pagesPhase) {
    // Filter pages that actually have tests
    const pagesWithTests = Object.entries(pagesPhase.pages).filter(([pageKey, page]) => {
      return page.responsiveness.tests.length > 0 || 
             page.functionality.tests.length > 0 || 
             page.tests.length > 0;
    });

    if (pagesWithTests.length === 0) {
      return '<p><em>No page tests were executed</em></p>';
    }

    return pagesWithTests.map(([pageKey, page]) => {
      const pageId = pageKey.replace(/[^a-zA-Z0-9]/g, '');
      const totalTests = page.responsiveness.summary.total + page.functionality.summary.total + page.tests.length;
      const passedTests = page.responsiveness.summary.passed + page.functionality.summary.passed + 
                         page.tests.filter(t => t.status === 'passed').length;
      
      return `
        <div class="page-section">
            <div class="page-header" onclick="togglePage('${pageId}')">
                <strong>${page.name}</strong> 
                <span class="status-badge ${page.status}">${passedTests}/${totalTests}</span>
                <button class="toggle-btn">Show</button>
            </div>
            <div class="page-content" id="page-${pageId}">
                ${page.responsiveness.tests.length > 0 ? `
                <div class="category-section">
                    <strong>📱 Responsiveness</strong> (${page.responsiveness.summary.passed}/${page.responsiveness.summary.total})
                    ${this.generateTestsHTML(page.responsiveness.tests)}
                </div>
                ` : ''}
                ${page.functionality.tests.length > 0 ? `
                <div class="category-section">
                    <strong>⚙️ Functionality</strong> (${page.functionality.summary.passed}/${page.functionality.summary.total})
                    ${this.generateTestsHTML(page.functionality.tests)}
                </div>
                ` : ''}
                ${page.tests.length > 0 ? `
                <div class="category-section">
                    <strong>🔧 General</strong> (${page.tests.filter(t => t.status === 'passed').length}/${page.tests.length})
                    ${this.generateTestsHTML(page.tests)}
                </div>
                ` : ''}
            </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate tests HTML
   */
  generateTestsHTML(tests) {
    if (!tests || tests.length === 0) {
      return '<p><em>No tests in this category</em></p>';
    }
    
    return `
      <div class="test-grid">
        ${tests.map((test, index) => {
          const testId = `${test.name.replace(/[^a-zA-Z0-9]/g, '')}_${index}`;
          
          return `
            <div class="test-item">
                <div class="test-header ${test.status}" onclick="toggleTest('${testId}')">
                    <strong>${test.description || test.name}</strong>
                    <span class="status-badge ${test.status}">${test.status}</span>
                </div>
                <div class="test-content" id="test-${testId}">
                    ${test.whatWasTested && test.whatWasTested.length > 0 ? `
                    <div class="what-tested">
                        <h5>🎯 What Was Tested:</h5>
                        <ul>
                            ${test.whatWasTested.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${test.steps && test.steps.length > 0 ? `
                    <div class="steps">
                        <h5>📝 Test Steps:</h5>
                        <ol>
                            ${test.steps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                    ` : ''}
                    
                    ${test.error ? `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 10px 0;">
                        <strong>Error:</strong> ${test.error}
                    </div>
                    ` : ''}
                    
                    ${test.screenshots && test.screenshots.length > 0 ? `
                    <div class="screenshots">
                        ${test.screenshots.map(screenshot => `
                        <div class="screenshot">
                            <img src="${screenshot.relativePath}" alt="${screenshot.description}" loading="lazy">
                            <div class="caption">${screenshot.description}</div>
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${Object.keys(test.details || {}).length > 0 ? `
                    <details style="margin-top: 15px;">
                        <summary>Technical Details</summary>
                        <pre style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 10px; font-size: 0.9em;">${JSON.stringify(test.details, null, 2)}</pre>
                    </details>
                    ` : ''}
                </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  formatDuration(duration) {
    if (!duration) return 'N/A';
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  inferModeFromTestSuite(testSuiteName) {
    const name = testSuiteName.toLowerCase();
    
    if (name.includes('semi-auto') || name.includes('semi') || name.includes('collaborative') || name.includes('streamlined')) {
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

  /**
   * Get the results path for external use
   */
  getResultsPath() {
    return this.reportDir;
  }

  /**
   * Generate final report (alias for finalize)
   */
  async generateFinalReport() {
    return this.finalize();
  }

  /**
   * Finalize and generate all reports
   */
  finalize() {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = new Date(this.results.summary.endTime) - new Date(this.results.summary.startTime);

    // Complete any running phases
    Object.keys(this.results.phases).forEach(phaseKey => {
      if (this.results.phases[phaseKey].status === 'running') {
        this.completePhase(phaseKey);
      }
    });

    // Generate reports
    const jsonPath = path.join(this.reportDir, 'report.json');
    const htmlPath = path.join(this.reportDir, 'report.html');
    const summaryPath = path.join(this.reportDir, 'summary.txt');

    // Write JSON report
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Generate enhanced HTML report
    const htmlContent = this.generateEnhancedHTMLReport();
    fs.writeFileSync(htmlPath, htmlContent);

    // Generate summary
    const summaryContent = `
Enhanced Test Suite: ${this.testSuiteName}
Timestamp: ${this.results.metadata.timestamp}
Duration: ${this.formatDuration(this.results.summary.duration)}

Results:
- Total Tests: ${this.results.summary.totalTests}
- Passed: ${this.results.summary.passed}
- Failed: ${this.results.summary.failed}
- Errors: ${this.results.summary.errors}
- Skipped: ${this.results.summary.skipped}

Success Rate: ${this.results.summary.totalTests > 0 ? 
  ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1) : 0}%

Phase Summary:
${Object.entries(this.results.phases).map(([key, phase]) => 
  `- ${phase.name}: ${phase.status} (${phase.summary.passed}/${phase.summary.total} passed)`
).join('\n')}

Screenshots: ${this.results.screenshots.length}
Artifacts: ${this.results.artifacts.length}
`;

    fs.writeFileSync(summaryPath, summaryContent);

    console.log('\n📊 ENHANCED TEST REPORT GENERATED');
    console.log('═'.repeat(50));
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
}

module.exports = EnhancedTestReporter;
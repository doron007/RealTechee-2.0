#!/usr/bin/env node

/**
 * Forced Report Generation Test
 * 
 * This test will ALWAYS generate a report, regardless of authentication success
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ForcedReportTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.credentials = { 
      email: 'info@realtechee.com', 
      password: 'Sababa123!' 
    };
    
    // Create timestamped folder name
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') + '-' +
                     now.getHours().toString().padStart(2, '0') + '_' +
                     now.getMinutes().toString().padStart(2, '0') + '_' +
                     now.getSeconds().toString().padStart(2, '0');
    
    this.testName = `${timestamp}-forced-report-test`;
    this.testDir = path.join(__dirname, '../../test-results', this.testName);
    
    // Ensure test directory exists
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
    fs.mkdirSync(path.join(this.testDir, 'screenshots'), { recursive: true });
    
    this.browser = null;
    this.page = null;
    this.results = {
      authentication: { success: false },
      pages: {},
      issues: [],
      summary: { totalTests: 0, passedTests: 0, failedTests: 0 }
    };
  }

  async setup() {
    console.log('🔧 Setting up Forced Report Test...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    this.page = await this.browser.newPage();
    
    // Capture console messages for analysis
    this.page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Warning:')) {
        this.results.issues.push(`Console ${msg.type()}: ${msg.text()}`);
      }
    });
    
    console.log('✅ Setup complete');
  }

  async testAuthentication() {
    console.log('🔐 Testing authentication...');
    
    try {
      // Navigate to login
      await this.page.goto(`${this.baseUrl}/login`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot
      await this.page.screenshot({
        path: path.join(this.testDir, 'screenshots', 'login-page.png'),
        fullPage: true
      });
      
      // Check form elements
      const formCheck = await this.page.evaluate(() => {
        return {
          hasEmailInput: !!document.querySelector('input[type="email"]'),
          hasPasswordInput: !!document.querySelector('input[type="password"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"]'),
          pageTitle: document.title,
          url: window.location.href
        };
      });
      
      this.results.authentication.formCheck = formCheck;
      
      if (formCheck.hasEmailInput && formCheck.hasPasswordInput) {
        // Try authentication
        await this.page.type('input[type="email"]', this.credentials.email);
        await this.page.type('input[type="password"]', this.credentials.password);
        
        await this.page.screenshot({
          path: path.join(this.testDir, 'screenshots', 'login-filled.png'),
          fullPage: true
        });
        
        await this.page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check result
        const authResult = await this.page.evaluate(() => {
          return {
            url: window.location.href,
            path: window.location.pathname,
            isStillOnLogin: window.location.pathname.includes('/login'),
            bodyText: document.body.innerText.substring(0, 200)
          };
        });
        
        this.results.authentication.authResult = authResult;
        this.results.authentication.success = !authResult.isStillOnLogin;
        
        await this.page.screenshot({
          path: path.join(this.testDir, 'screenshots', 'after-auth.png'),
          fullPage: true
        });
      }
      
    } catch (error) {
      this.results.authentication.error = error.message;
      this.results.issues.push(`Authentication error: ${error.message}`);
    }
  }

  async testAdminPageAccess() {
    console.log('🏢 Testing admin page access...');
    
    const adminPages = ['/admin/projects', '/admin/quotes', '/admin/requests'];
    
    for (const pagePath of adminPages) {
      try {
        await this.page.goto(`${this.baseUrl}${pagePath}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pageAnalysis = await this.page.evaluate(() => {
          return {
            url: window.location.href,
            title: document.title,
            hasH1: !!document.querySelector('h1'),
            h1Text: document.querySelector('h1')?.textContent || '',
            hasDataGrid: !!document.querySelector('[data-testid*="grid"], .MuiDataGrid-root'),
            hasAccessDenied: document.body.innerText.toLowerCase().includes('access denied'),
            hasLoggedInAs: document.body.innerText.toLowerCase().includes('logged in as'),
            bodyPreview: document.body.innerText.substring(0, 300)
          };
        });
        
        this.results.pages[pagePath] = {
          pagePath,
          accessible: !pageAnalysis.hasAccessDenied,
          pageAnalysis,
          tested: true
        };
        
        // Take screenshot
        const pageName = pagePath.replace('/admin/', '').replace('/', '-');
        await this.page.screenshot({
          path: path.join(this.testDir, 'screenshots', `${pageName}-page.png`),
          fullPage: true
        });
        
        if (pageAnalysis.hasAccessDenied) {
          this.results.issues.push(`Access denied to ${pagePath}`);
        }
        
        if (!pageAnalysis.hasH1) {
          this.results.issues.push(`No H1 title found on ${pagePath}`);
        }
        
      } catch (error) {
        this.results.pages[pagePath] = {
          pagePath,
          accessible: false,
          error: error.message,
          tested: false
        };
        this.results.issues.push(`Failed to load ${pagePath}: ${error.message}`);
      }
    }
  }

  async generateReport() {
    console.log('📊 Generating comprehensive report...');
    
    // Calculate summary
    const totalPages = Object.keys(this.results.pages).length;
    const accessiblePages = Object.values(this.results.pages).filter(p => p.accessible).length;
    const totalIssues = this.results.issues.length;
    
    this.results.summary = {
      authenticationPassed: this.results.authentication.success,
      totalPages,
      accessiblePages,
      failedPages: totalPages - accessiblePages,
      totalIssues,
      overallHealth: totalIssues === 0 && this.results.authentication.success ? 'HEALTHY' : 'ISSUES_FOUND'
    };
    
    // Generate HTML Report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(path.join(this.testDir, 'comprehensive-report.html'), htmlReport);
    
    // Generate JSON Report
    const jsonReport = {
      testSuite: 'Forced Report Generation Test',
      testName: this.testName,
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      authentication: this.results.authentication,
      pages: this.results.pages,
      issues: this.results.issues,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(path.join(this.testDir, 'report.json'), 
      JSON.stringify(jsonReport, null, 2));
    
    // Generate text summary
    const textSummary = this.generateTextSummary();
    fs.writeFileSync(path.join(this.testDir, 'summary.txt'), textSummary);
    
    console.log('\n📋 TEST SUMMARY REPORT');
    console.log('═'.repeat(60));
    console.log(textSummary);
    console.log('\n📁 REPORTS GENERATED:');
    console.log(`• HTML Report: file://${path.join(this.testDir, 'comprehensive-report.html')}`);
    console.log(`• JSON Data: ${path.join(this.testDir, 'report.json')}`);
    console.log(`• Text Summary: ${path.join(this.testDir, 'summary.txt')}`);
    console.log(`• Screenshots: ${path.join(this.testDir, 'screenshots/')}`);
  }

  generateHTMLReport() {
    const { summary, authentication, pages, issues } = this.results;
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>Admin Functional Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .healthy { border-left-color: #28a745; background: #f8fff9; }
        .issues { border-left-color: #dc3545; background: #fff8f8; }
        .section { margin: 30px 0; padding: 25px; border: 1px solid #ddd; border-radius: 12px; }
        .issue-list { background: #fff3cd; padding: 15px; border-radius: 8px; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .screenshot { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; height: auto; }
        .screenshot-title { padding: 10px; background: #f8f9fa; font-weight: bold; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .page-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Admin Functional Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Test Suite: ${this.testName}</p>
    </div>

    <div class="summary-grid">
        <div class="metric-card ${summary.overallHealth === 'HEALTHY' ? 'healthy' : 'issues'}">
            <h3>Overall Health</h3>
            <p style="font-size: 24px; margin: 0;">${summary.overallHealth}</p>
        </div>
        <div class="metric-card">
            <h3>Authentication</h3>
            <p class="${summary.authenticationPassed ? 'status-pass' : 'status-fail'}">
                ${summary.authenticationPassed ? '✅ PASSED' : '❌ FAILED'}
            </p>
        </div>
        <div class="metric-card">
            <h3>Page Access</h3>
            <p>${summary.accessiblePages}/${summary.totalPages} pages accessible</p>
        </div>
        <div class="metric-card">
            <h3>Issues Found</h3>
            <p style="color: ${summary.totalIssues > 0 ? '#dc3545' : '#28a745'};">${summary.totalIssues}</p>
        </div>
    </div>

    <div class="section">
        <h2>🔐 Authentication Analysis</h2>
        <div class="page-details">
            <p><strong>Form Elements Check:</strong></p>
            <ul>
                <li>Email Input: ${authentication.formCheck?.hasEmailInput ? '✅' : '❌'}</li>
                <li>Password Input: ${authentication.formCheck?.hasPasswordInput ? '✅' : '❌'}</li>
                <li>Submit Button: ${authentication.formCheck?.hasSubmitButton ? '✅' : '❌'}</li>
            </ul>
            ${authentication.authResult ? `
            <p><strong>Authentication Result:</strong></p>
            <ul>
                <li>Final URL: ${authentication.authResult.url}</li>
                <li>Still on Login: ${authentication.authResult.isStillOnLogin ? '❌ Yes' : '✅ No'}</li>
            </ul>` : ''}
            ${authentication.error ? `<p><strong>Error:</strong> ${authentication.error}</p>` : ''}
        </div>
    </div>

    <div class="section">
        <h2>🏢 Admin Page Access</h2>
        ${Object.values(pages).map(page => `
        <div class="page-details">
            <h3>${page.pagePath}</h3>
            <p><strong>Status:</strong> 
                <span class="${page.accessible ? 'status-pass' : 'status-fail'}">
                    ${page.accessible ? '✅ Accessible' : '❌ Access Denied'}
                </span>
            </p>
            ${page.pageAnalysis ? `
            <ul>
                <li>Title: ${page.pageAnalysis.title}</li>
                <li>H1 Found: ${page.pageAnalysis.hasH1 ? '✅' : '❌'}</li>
                <li>H1 Text: "${page.pageAnalysis.h1Text}"</li>
                <li>Has Data Grid: ${page.pageAnalysis.hasDataGrid ? '✅' : '❌'}</li>
                <li>Has "Logged in as": ${page.pageAnalysis.hasLoggedInAs ? '✅' : '❌'}</li>
            </ul>` : ''}
            ${page.error ? `<p><strong>Error:</strong> ${page.error}</p>` : ''}
        </div>`).join('')}
    </div>

    ${issues.length > 0 ? `
    <div class="section">
        <h2>⚠️ Issues Found</h2>
        <div class="issue-list">
            <ul>
                ${issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
        </div>
    </div>` : ''}

    <div class="section">
        <h2>📸 Screenshots</h2>
        <div class="screenshot-grid">
            <div class="screenshot">
                <div class="screenshot-title">Login Page</div>
                <img src="screenshots/login-page.png" alt="Login Page" />
            </div>
            <div class="screenshot">
                <div class="screenshot-title">After Authentication</div>
                <img src="screenshots/after-auth.png" alt="After Authentication" />
            </div>
            <div class="screenshot">
                <div class="screenshot-title">Projects Page</div>
                <img src="screenshots/projects-page.png" alt="Projects Page" />
            </div>
        </div>
    </div>

    <div class="section">
        <h2>💡 Recommendations</h2>
        <ul>
            ${this.generateRecommendations().map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.results.authentication.success) {
      recommendations.push('Fix authentication flow - form submission not working');
    }
    
    if (this.results.issues.some(i => i.includes('hydration'))) {
      recommendations.push('Resolve React hydration errors in login page');
    }
    
    if (this.results.issues.some(i => i.includes('Access denied'))) {
      recommendations.push('Check admin role authorization for test user');
    }
    
    if (this.results.issues.some(i => i.includes('No H1'))) {
      recommendations.push('Add proper H1 titles to admin pages');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passed! Admin functionality is working correctly.');
    }
    
    return recommendations;
  }

  generateTextSummary() {
    const { summary, authentication, pages, issues } = this.results;
    
    return `ADMIN FUNCTIONAL TEST SUMMARY
Generated: ${new Date().toLocaleString()}
Test Suite: ${this.testName}

OVERALL HEALTH: ${summary.overallHealth}

AUTHENTICATION: ${summary.authenticationPassed ? 'PASSED' : 'FAILED'}
- Form elements: ${authentication.formCheck ? 'Found' : 'Missing'}
- Login attempt: ${authentication.success ? 'Successful' : 'Failed'}

ADMIN PAGE ACCESS: ${summary.accessiblePages}/${summary.totalPages} pages accessible
${Object.values(pages).map(page => 
  `- ${page.pagePath}: ${page.accessible ? 'ACCESSIBLE' : 'DENIED'}`
).join('\n')}

ISSUES FOUND: ${summary.totalIssues}
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

RECOMMENDATIONS:
${this.generateRecommendations().map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      await this.testAuthentication();
      await this.testAdminPageAccess();
      await this.generateReport();
      await this.cleanup();
      
      return this.results.summary.overallHealth === 'HEALTHY';
      
    } catch (error) {
      console.error('💥 Test execution error:', error.message);
      this.results.issues.push(`Test execution error: ${error.message}`);
      
      // Still generate report even if test fails
      try {
        await this.generateReport();
      } catch (reportError) {
        console.error('Failed to generate report:', reportError.message);
      }
      
      await this.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const test = new ForcedReportTest();
  
  try {
    const success = await test.run();
    console.log(`\n${success ? '✅ ALL TESTS PASSED' : '❌ ISSUES FOUND - CHECK REPORT'}`);
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ForcedReportTest;
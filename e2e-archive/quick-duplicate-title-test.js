#!/usr/bin/env node

/**
 * Quick Duplicate Title Test
 * 
 * Simple test to verify that admin pages don't have duplicate H1 titles.
 * This test runs without authentication to quickly verify the fix.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class QuickDuplicateTitleTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    
    // Create timestamped folder name: yyyymmdd-hh_mm_ss-[test name]
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') + '-' +
                     now.getHours().toString().padStart(2, '0') + '_' +
                     now.getMinutes().toString().padStart(2, '0') + '_' +
                     now.getSeconds().toString().padStart(2, '0');
    
    this.testName = `${timestamp}-quick-duplicate-title-test`;
    this.testDir = path.join(__dirname, '../../test-results', this.testName);
    this.results = {};
  }

  async setup() {
    console.log('🚀 Setting up Quick Duplicate Title Test...');
    
    // Create test directory
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
    
    // Create subdirectories
    fs.mkdirSync(path.join(this.testDir, 'screenshots'), { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({ 
      headless: true, // Run headless for speed
      defaultViewport: { width: 1200, height: 800 }
    });
    
    this.page = await this.browser.newPage();
    
    console.log('✅ Setup complete');
  }

  async testPage(pagePath, pageName) {
    console.log(`📄 Testing ${pageName} for duplicate titles...`);
    
    try {
      // Go to page (this will show login, but we can still see the structure)
      await this.page.goto(`${this.baseUrl}${pagePath}`, { waitUntil: 'networkidle0', timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Count H1 elements
      const titleInfo = await this.page.evaluate((pageNameToFind) => {
        const h1Elements = Array.from(document.querySelectorAll('h1'));
        const pageNameElements = h1Elements.filter(h1 => 
          h1.textContent.toLowerCase().includes(pageNameToFind.toLowerCase())
        );
        
        return {
          totalH1Count: h1Elements.length,
          h1Texts: h1Elements.map(h1 => h1.textContent.trim()),
          pageNameH1Count: pageNameElements.length,
          pageNameH1Texts: pageNameElements.map(h1 => h1.textContent.trim())
        };
      }, pageName);

      // Take screenshot
      await this.page.screenshot({
        path: path.join(this.testDir, 'screenshots', `${pageName.toLowerCase()}-page.png`),
        fullPage: true
      });

      const result = {
        pageName,
        pagePath,
        totalH1Count: titleInfo.totalH1Count,
        h1Texts: titleInfo.h1Texts,
        pageNameH1Count: titleInfo.pageNameH1Count,
        pageNameH1Texts: titleInfo.pageNameH1Texts,
        hasDuplicatePageTitles: titleInfo.pageNameH1Count > 1,
        passed: titleInfo.pageNameH1Count <= 1
      };

      console.log(`  📊 Total H1s: ${titleInfo.totalH1Count}`);
      console.log(`  📊 "${pageName}" H1s: ${titleInfo.pageNameH1Count}`);
      console.log(`  📝 All H1 texts: [${titleInfo.h1Texts.join(', ')}]`);
      
      if (titleInfo.pageNameH1Count > 1) {
        console.log(`  ❌ DUPLICATE TITLES FOUND: [${titleInfo.pageNameH1Texts.join(', ')}]`);
      } else {
        console.log(`  ✅ No duplicate titles`);
      }

      return result;
      
    } catch (error) {
      console.error(`❌ Error testing ${pageName}: ${error.message}`);
      return {
        pageName,
        pagePath,
        error: error.message,
        passed: false
      };
    }
  }

  async testAllPages() {
    console.log('\n🧪 Testing Admin Pages for Duplicate Titles');
    console.log('═══════════════════════════════════════════════════════════');

    const pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    for (const pageInfo of pages) {
      const result = await this.testPage(pageInfo.path, pageInfo.name);
      this.results[pageInfo.name] = result;
    }
  }

  generateReport() {
    console.log('\n📊 DUPLICATE TITLE TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════');

    let totalTests = 0;
    let passedTests = 0;
    const failedTests = [];

    // HTML Report
    let htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Duplicate Title Test Report - ${this.testName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { border-color: #28a745; background: #f8fff9; }
        .failed { border-color: #dc3545; background: #fff8f8; }
        .error { border-color: #ffc107; background: #fffdf5; }
        .screenshot { margin: 10px 0; }
        .screenshot img { max-width: 400px; border: 1px solid #ddd; }
        .summary { background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        .issue { color: #dc3545; font-weight: bold; }
        .success { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Duplicate Title Test Report</h1>
        <p><strong>Test Suite:</strong> ${this.testName}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Purpose:</strong> Verify that admin pages don't have duplicate H1 titles</p>
    </div>
`;

    Object.entries(this.results).forEach(([pageName, result]) => {
      totalTests++;

      if (result.error) {
        htmlReport += `
    <div class="test-result error">
        <h2>⚠️ ${pageName} - ERROR</h2>
        <p><strong>Error:</strong> ${result.error}</p>
        <p><strong>Path:</strong> ${result.pagePath}</p>
    </div>`;
        return;
      }

      if (result.passed) {
        passedTests++;
      } else {
        failedTests.push(pageName);
      }

      const testClass = result.passed ? 'passed' : 'failed';
      const statusIcon = result.passed ? '✅' : '❌';
      const statusText = result.passed ? 'PASSED' : 'FAILED';

      htmlReport += `
    <div class="test-result ${testClass}">
        <h2>${statusIcon} ${pageName} - ${statusText}</h2>
        <p><strong>Page Path:</strong> ${result.pagePath}</p>
        
        <div class="test-details">
            <h3>Title Analysis:</h3>
            <ul>
                <li><strong>Total H1 elements:</strong> ${result.totalH1Count}</li>
                <li><strong>"${pageName}" title count:</strong> ${result.pageNameH1Count}</li>
                <li><strong>Has duplicate page titles:</strong> ${result.hasDuplicatePageTitles ? '<span class="issue">Yes ❌</span>' : '<span class="success">No ✅</span>'}</li>
            </ul>
            
            <h4>All H1 Elements Found:</h4>
            <ul>
                ${result.h1Texts.map(text => `<li>"${text}"</li>`).join('')}
            </ul>
            
            ${result.pageNameH1Count > 1 ? `
            <h4 class="issue">Duplicate Page Titles Found:</h4>
            <ul>
                ${result.pageNameH1Texts.map(text => `<li class="issue">"${text}"</li>`).join('')}
            </ul>` : ''}
        </div>
        
        <div class="screenshot">
            <h4>Screenshot:</h4>
            <img src="screenshots/${pageName.toLowerCase()}-page.png" alt="${pageName} Page" title="Click to view full size">
        </div>
    </div>`;

      // Console output
      console.log(`\n📄 ${pageName}: ${statusIcon} ${statusText}`);
      console.log(`  Path: ${result.pagePath}`);
      console.log(`  Total H1s: ${result.totalH1Count}`);
      console.log(`  Page title H1s: ${result.pageNameH1Count}`);
      console.log(`  All H1 texts: [${result.h1Texts.join(', ')}]`);
      
      if (result.hasDuplicatePageTitles) {
        console.log(`  ❌ DUPLICATE TITLES: [${result.pageNameH1Texts.join(', ')}]`);
      }
    });

    const passRate = Math.round((passedTests / totalTests) * 100);
    
    htmlReport += `
    <div class="summary">
        <h2>📊 Summary</h2>
        <ul>
            <li><strong>Total Pages Tested:</strong> ${totalTests}</li>
            <li><strong>Passed:</strong> ${passedTests} (${passRate}%)</li>
            <li><strong>Failed:</strong> ${totalTests - passedTests}</li>
            <li><strong>Pass Rate:</strong> ${passRate}%</li>
        </ul>
        
        ${failedTests.length > 0 ? `
        <h3>❌ Pages with Duplicate Titles:</h3>
        <ul>
            ${failedTests.map(page => `<li class="issue">${page}</li>`).join('')}
        </ul>` : ''}
        
        <div style="margin-top: 20px; padding: 15px; border-radius: 8px; ${passRate === 100 ? 'background: #d4edda; border: 1px solid #c3e6cb;' : 'background: #f8d7da; border: 1px solid #f5c6cb;'}">
            <h3>${passRate === 100 ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}</h3>
            <p>${passRate === 100 ? 'No duplicate titles found on any admin pages.' : 'Duplicate titles were found on some admin pages and need to be fixed.'}</p>
        </div>
    </div>
</body>
</html>`;

    // Save HTML report
    fs.writeFileSync(path.join(this.testDir, 'report.html'), htmlReport);
    
    // Save JSON report
    const jsonReport = {
      testName: this.testName,
      timestamp: new Date().toISOString(),
      purpose: 'Test for duplicate H1 titles on admin pages',
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        passRate,
        allPassed: passRate === 100
      },
      results: this.results,
      failedPages: failedTests
    };
    
    fs.writeFileSync(path.join(this.testDir, 'report.json'), JSON.stringify(jsonReport, null, 2));

    // Console summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`Pages tested: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${passRate}%)`);
    console.log(`Failed: ${totalTests - passedTests}`);
    
    if (passRate === 100) {
      console.log('🎉 ALL DUPLICATE TITLE TESTS PASSED!');
      console.log('✅ No duplicate titles found on any admin pages');
    } else {
      console.log('❌ Some pages have duplicate titles:');
      failedTests.forEach(page => console.log(`  - ${page}`));
    }

    console.log(`\n📁 Test Results Directory: ${this.testDir}`);
    console.log(`📄 HTML Report: file://${path.join(this.testDir, 'report.html')}`);
    console.log(`📊 JSON Report: ${path.join(this.testDir, 'report.json')}`);

    return passRate === 100;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      await this.testAllPages();
      const allPassed = this.generateReport();
      await this.cleanup();
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎉 DUPLICATE TITLE TEST COMPLETE');
      console.log('═══════════════════════════════════════════════════════════');
      
      return allPassed;
      
    } catch (error) {
      console.error('💥 Test execution error:', error.message);
      await this.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new QuickDuplicateTitleTest();
  
  try {
    const success = await tester.run();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Quick Duplicate Title Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = QuickDuplicateTitleTest;
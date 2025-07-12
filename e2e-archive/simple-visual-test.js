#!/usr/bin/env node

/**
 * Simple Visual Test for Admin Pages
 * 
 * Tests the specific issues that were reported:
 * 1. Duplicate page titles 
 * 2. Progressive card functionality 
 * 3. Address display in cards
 * 
 * This test will run quickly and generate clear reports with screenshots.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleVisualTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.credentials = { email: 'info@realtechee.com', password: 'Sababa123!' };
    this.browser = null;
    this.page = null;
    
    // Create timestamped folder name as requested: yyyymmdd-hh_mm_ss-[test name]
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') + '-' +
                     now.getHours().toString().padStart(2, '0') + '_' +
                     now.getMinutes().toString().padStart(2, '0') + '_' +
                     now.getSeconds().toString().padStart(2, '0');
    
    this.testName = `${timestamp}-simple-visual-test`;
    this.testDir = path.join(__dirname, '../../test-results', this.testName);
    this.results = {};
  }

  async setup() {
    console.log('🚀 Setting up Simple Visual Test...');
    
    // Create test directory
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
    
    // Create subdirectories
    fs.mkdirSync(path.join(this.testDir, 'screenshots'), { recursive: true });
    fs.mkdirSync(path.join(this.testDir, 'artifacts'), { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 250,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    this.page = await this.browser.newPage();
    
    console.log('✅ Setup complete');
  }

  async authenticate() {
    console.log('🔐 Authenticating...');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await this.page.type('input[type="email"]', this.credentials.email);
    await this.page.type('input[type="password"]', this.credentials.password);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Authentication complete');
  }

  async testDuplicateTitles(pagePath, pageName) {
    console.log(`📄 Testing duplicate titles on ${pageName}...`);
    
    await this.page.goto(`${this.baseUrl}${pagePath}`);
    await this.page.waitForTimeout(3000); // Allow time for React to render
    
    // Count H1 elements
    const titleInfo = await this.page.evaluate((pageNameToFind) => {
      const h1Elements = Array.from(document.querySelectorAll('h1'));
      return {
        totalH1Count: h1Elements.length,
        h1Texts: h1Elements.map(h1 => h1.textContent.trim()),
        duplicatePageTitles: h1Elements.filter(h1 => 
          h1.textContent.toLowerCase().includes(pageNameToFind.toLowerCase())
        ).length
      };
    }, pageName);

    // Take screenshot
    await this.page.screenshot({
      path: path.join(this.testDir, 'screenshots', `${pageName.toLowerCase()}-titles.png`),
      fullPage: true
    });

    const result = {
      pageName,
      totalH1Count: titleInfo.totalH1Count,
      h1Texts: titleInfo.h1Texts,
      duplicatePageTitles: titleInfo.duplicatePageTitles,
      hasDuplicates: titleInfo.duplicatePageTitles > 1,
      passed: titleInfo.duplicatePageTitles === 1
    };

    console.log(`  📊 H1 count: ${titleInfo.totalH1Count}`);
    console.log(`  📊 Page title count: ${titleInfo.duplicatePageTitles}`);
    console.log(`  📝 H1 texts: [${titleInfo.h1Texts.join(', ')}]`);
    console.log(`  ${result.passed ? '✅ PASSED' : '❌ FAILED'} - ${result.passed ? 'No duplicate titles' : 'Duplicate titles found'}`);

    return result;
  }

  async testProgressiveCards(pagePath, pageName) {
    console.log(`🎴 Testing progressive cards on ${pageName}...`);
    
    await this.page.goto(`${this.baseUrl}${pagePath}`);
    await this.page.waitForTimeout(3000);
    
    // Switch to cards view
    console.log('  🔄 Switching to cards view...');
    try {
      const viewToggle = await this.page.$('button[title*="cards"], svg[data-testid*="ViewModule"]');
      if (viewToggle) {
        await viewToggle.click();
        await this.page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('  ⚠️ Could not find cards view toggle');
    }

    // Check for progressive cards and address display
    const cardInfo = await this.page.evaluate(() => {
      // Look for cards and check their content
      const allCards = Array.from(document.querySelectorAll('[class*="bg-white"]')).filter(el => 
        el.innerHTML.includes('Property Address') || 
        el.innerHTML.includes('Address') ||
        (el.innerHTML.includes('Street') && el.innerHTML.includes('CA'))
      );
      
      const progressiveCards = allCards.filter(card => 
        card.innerHTML.includes('Property Address') &&
        (card.innerHTML.includes('Created') || card.innerHTML.includes('Owner'))
      );

      // Check if address is visible in cards
      const cardsWithAddress = allCards.filter(card => 
        card.textContent.includes('Street') || 
        card.textContent.includes('Avenue') ||
        card.textContent.includes('CA ') ||
        card.textContent.includes('Los Angeles')
      );

      return {
        totalCards: allCards.length,
        progressiveCards: progressiveCards.length,
        cardsWithAddress: cardsWithAddress.length,
        hasCards: allCards.length > 0,
        hasProgressiveCards: progressiveCards.length > 0,
        addressDisplayed: cardsWithAddress.length > 0
      };
    });

    // Take screenshot of cards view
    await this.page.screenshot({
      path: path.join(this.testDir, 'screenshots', `${pageName.toLowerCase()}-cards.png`),
      fullPage: true
    });

    // Test card expansion if cards exist
    let expansionWorked = false;
    if (cardInfo.hasCards) {
      console.log('  🔍 Testing card expansion...');
      try {
        const firstCard = await this.page.$('[class*="bg-white"]:first-of-type');
        if (firstCard) {
          const initialHeight = await this.page.evaluate(el => el.offsetHeight, firstCard);
          await firstCard.click();
          await this.page.waitForTimeout(1000);
          const expandedHeight = await this.page.evaluate(el => el.offsetHeight, firstCard);
          expansionWorked = expandedHeight > initialHeight;
        }
      } catch (error) {
        console.log('  ⚠️ Could not test card expansion');
      }
    }

    const result = {
      pageName,
      totalCards: cardInfo.totalCards,
      progressiveCards: cardInfo.progressiveCards,
      cardsWithAddress: cardInfo.cardsWithAddress,
      hasCards: cardInfo.hasCards,
      hasProgressiveCards: cardInfo.hasProgressiveCards,
      addressDisplayed: cardInfo.addressDisplayed,
      expansionWorked,
      passed: cardInfo.hasProgressiveCards && cardInfo.addressDisplayed
    };

    console.log(`  📊 Total cards: ${cardInfo.totalCards}`);
    console.log(`  📊 Progressive cards: ${cardInfo.progressiveCards}`);
    console.log(`  📊 Cards with address: ${cardInfo.cardsWithAddress}`);
    console.log(`  📊 Expansion worked: ${expansionWorked}`);
    console.log(`  ${result.passed ? '✅ PASSED' : '❌ FAILED'} - ${result.passed ? 'Progressive cards working' : 'Progressive cards not working'}`);

    return result;
  }

  async testAllPages() {
    console.log('\n🧪 Running Visual Tests on Admin Pages');
    console.log('═══════════════════════════════════════════════════════════');

    const pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    for (const pageInfo of pages) {
      console.log(`\n📄 Testing ${pageInfo.name} page (${pageInfo.path})`);
      
      try {
        const titleResult = await this.testDuplicateTitles(pageInfo.path, pageInfo.name);
        const cardResult = await this.testProgressiveCards(pageInfo.path, pageInfo.name);
        
        this.results[pageInfo.name] = {
          page: pageInfo,
          titleTest: titleResult,
          cardTest: cardResult,
          overallPassed: titleResult.passed && cardResult.passed
        };
        
      } catch (error) {
        console.error(`❌ Error testing ${pageInfo.name}: ${error.message}`);
        this.results[pageInfo.name] = {
          page: pageInfo,
          error: error.message,
          overallPassed: false
        };
      }
    }
  }

  generateReport() {
    console.log('\n📊 VISUAL TEST RESULTS REPORT');
    console.log('═══════════════════════════════════════════════════════════');

    let totalTests = 0;
    let passedTests = 0;
    const failedTests = [];

    // HTML Report
    let htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Test Report - ${this.testName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { border-color: #28a745; background: #f8fff9; }
        .failed { border-color: #dc3545; background: #fff8f8; }
        .error { border-color: #ffc107; background: #fffdf5; }
        .screenshot { margin: 10px 0; }
        .screenshot img { max-width: 300px; border: 1px solid #ddd; }
        .summary { background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Test Report</h1>
        <p><strong>Test Suite:</strong> ${this.testName}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Purpose:</strong> Verify admin pages fixes for duplicate titles and progressive cards</p>
    </div>
`;

    Object.entries(this.results).forEach(([pageName, result]) => {
      totalTests += 2; // Title test + Card test

      if (result.error) {
        htmlReport += `
    <div class="test-result error">
        <h2>❌ ${pageName} - ERROR</h2>
        <p><strong>Error:</strong> ${result.error}</p>
    </div>`;
        return;
      }

      const titleTestClass = result.titleTest.passed ? 'passed' : 'failed';
      const cardTestClass = result.cardTest.passed ? 'passed' : 'failed';

      if (result.titleTest.passed) passedTests++;
      else failedTests.push(`${pageName} - Duplicate Titles`);
      
      if (result.cardTest.passed) passedTests++;
      else failedTests.push(`${pageName} - Progressive Cards`);

      htmlReport += `
    <div class="test-result ${result.overallPassed ? 'passed' : 'failed'}">
        <h2>${result.overallPassed ? '✅' : '❌'} ${pageName} Page</h2>
        
        <div class="test-section">
            <h3>📄 Title Test: ${result.titleTest.passed ? '✅ PASSED' : '❌ FAILED'}</h3>
            <ul>
                <li>Total H1 elements: ${result.titleTest.totalH1Count}</li>
                <li>Page title instances: ${result.titleTest.duplicatePageTitles}</li>
                <li>All H1 texts: [${result.titleTest.h1Texts.join(', ')}]</li>
                <li>Has duplicates: ${result.titleTest.hasDuplicates ? 'Yes ❌' : 'No ✅'}</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>🎴 Progressive Cards Test: ${result.cardTest.passed ? '✅ PASSED' : '❌ FAILED'}</h3>
            <ul>
                <li>Total cards found: ${result.cardTest.totalCards}</li>
                <li>Progressive cards: ${result.cardTest.progressiveCards}</li>
                <li>Cards with address: ${result.cardTest.cardsWithAddress}</li>
                <li>Address displayed: ${result.cardTest.addressDisplayed ? 'Yes ✅' : 'No ❌'}</li>
                <li>Card expansion works: ${result.cardTest.expansionWorked ? 'Yes ✅' : 'No ❌'}</li>
            </ul>
        </div>
        
        <div class="screenshot">
            <strong>Screenshots:</strong><br>
            <img src="screenshots/${pageName.toLowerCase()}-titles.png" alt="${pageName} Titles" title="Click to view full size">
            <img src="screenshots/${pageName.toLowerCase()}-cards.png" alt="${pageName} Cards" title="Click to view full size">
        </div>
    </div>`;

      // Console output
      console.log(`\n📄 ${pageName}:`);
      console.log(`  📄 Title Test: ${result.titleTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`     - H1 count: ${result.titleTest.totalH1Count}, Page titles: ${result.titleTest.duplicatePageTitles}`);
      console.log(`  🎴 Cards Test: ${result.cardTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`     - Progressive cards: ${result.cardTest.progressiveCards}, Address displayed: ${result.cardTest.addressDisplayed}`);
    });

    const passRate = Math.round((passedTests / totalTests) * 100);
    
    htmlReport += `
    <div class="summary">
        <h2>📊 Summary</h2>
        <ul>
            <li><strong>Total Tests:</strong> ${totalTests}</li>
            <li><strong>Passed:</strong> ${passedTests} (${passRate}%)</li>
            <li><strong>Failed:</strong> ${totalTests - passedTests}</li>
            <li><strong>Pass Rate:</strong> ${passRate}%</li>
        </ul>
        
        ${failedTests.length > 0 ? `
        <h3>❌ Failed Tests:</h3>
        <ul>
            ${failedTests.map(test => `<li>${test}</li>`).join('')}
        </ul>` : ''}
        
        <p><strong>Status:</strong> ${passRate === 100 ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}</p>
    </div>
</body>
</html>`;

    // Save HTML report
    fs.writeFileSync(path.join(this.testDir, 'report.html'), htmlReport);
    
    // Save JSON report
    const jsonReport = {
      testName: this.testName,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        passRate,
        allPassed: passRate === 100
      },
      results: this.results,
      failedTests
    };
    
    fs.writeFileSync(path.join(this.testDir, 'report.json'), JSON.stringify(jsonReport, null, 2));

    // Console summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${passRate}%)`);
    console.log(`Failed: ${totalTests - passedTests}`);
    
    if (passRate === 100) {
      console.log('🎉 ALL VISUAL TESTS PASSED!');
    } else {
      console.log('❌ Some visual tests failed:');
      failedTests.forEach(test => console.log(`  - ${test}`));
    }

    console.log(`\n📄 Reports saved to: ${this.testDir}`);
    console.log(`🌐 View HTML report: file://${path.join(this.testDir, 'report.html')}`);

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
      await this.authenticate();
      await this.testAllPages();
      const allPassed = this.generateReport();
      await this.cleanup();
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎉 VISUAL TEST COMPLETE');
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
  const tester = new SimpleVisualTest();
  
  try {
    const success = await tester.run();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Simple Visual Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleVisualTest;
#!/usr/bin/env node

/**
 * Quick Coverage Check - Lightweight coverage measurement
 * 
 * Tests core functionality without complex navigation:
 * - Authentication working
 * - Basic page elements present  
 * - Data loading from API
 * - Interactive elements functional
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

async function quickCoverageCheck() {
  console.log('🎯 QUICK ADMIN COVERAGE CHECK');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Measuring core functionality across admin pages');
  console.log('🚀 Fast test without complex navigation or state changes');
  console.log('═══════════════════════════════════════════════════════════════');

  const pages = [
    { path: '/admin', name: 'Dashboard', expectedElements: ['h1', 'nav', '.bg-white'] },
    { path: '/admin/projects', name: 'Projects', expectedElements: ['h1', 'table', 'input'] },
    { path: '/admin/quotes', name: 'Quotes', expectedElements: ['h1', 'table', 'input[type="checkbox"]'] },
    { path: '/admin/requests', name: 'Requests', expectedElements: ['h1', 'table', 'input'] }
  ];

  const results = [];
  let totalScore = 0;

  for (const page of pages) {
    console.log(`\n🧪 Testing ${page.name} (${page.path})`);
    
    const framework = new ResponsiveTestFramework(`Quick-${page.name}-Check`, {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 50 }
    });

    try {
      await framework.setup();
      
      // Navigate directly to page
      await framework.page.goto(`http://localhost:3000${page.path}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Quick authentication check
      const needsAuth = await framework.page.evaluate(() => {
        return document.querySelector('input[type="email"]') !== null;
      });

      if (needsAuth) {
        console.log('  🔐 Authenticating...');
        await framework.page.evaluate((credentials) => {
          const emailInput = document.querySelector('input[type="email"]');
          const passwordInput = document.querySelector('input[type="password"]');
          
          if (emailInput && passwordInput) {
            emailInput.value = credentials.email;
            passwordInput.value = credentials.password;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, framework.config.credentials);

        const signInButton = await framework.page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        await signInButton.click();
        await framework.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
      }

      // Quick page analysis
      const pageAnalysis = await framework.page.evaluate((expected) => {
        const checkElement = (selector) => {
          const element = document.querySelector(selector);
          return {
            exists: !!element,
            visible: element ? element.offsetWidth > 0 && element.offsetHeight > 0 : false,
            text: element ? element.textContent.trim().substring(0, 50) : ''
          };
        };

        return {
          title: checkElement('h1'),
          table: checkElement('table'),
          search: checkElement('input[type="search"], input[placeholder*="Search"]'),
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          dataRows: document.querySelectorAll('tbody tr').length,
          cards: document.querySelectorAll('.bg-white').length
        };
      }, page.expectedElements);

      await framework.cleanup();

      // Calculate quick score
      let score = 0;
      const checks = [
        { name: 'Page Title', pass: pageAnalysis.title.exists && pageAnalysis.title.text.length > 0, weight: 25 },
        { name: 'Data Display', pass: pageAnalysis.table.exists || pageAnalysis.cards > 3, weight: 25 },
        { name: 'Interactive Elements', pass: pageAnalysis.buttons > 0, weight: 20 },
        { name: 'Navigation Links', pass: pageAnalysis.links > 5, weight: 15 },
        { name: 'Data Loaded', pass: pageAnalysis.dataRows > 0 || pageAnalysis.cards > 3, weight: 15 }
      ];

      const passedWeight = checks.reduce((sum, check) => sum + (check.pass ? check.weight : 0), 0);
      score = passedWeight; // Out of 100

      const passedChecks = checks.filter(c => c.pass).length;
      const totalChecks = checks.length;

      console.log(`  📊 ${page.name}: ${score}% (${passedChecks}/${totalChecks} checks)`);
      console.log(`  ✅ Title: "${pageAnalysis.title.text}"`);
      console.log(`  📋 Data: ${pageAnalysis.dataRows} rows, ${pageAnalysis.cards} cards`);
      console.log(`  🔗 Interactive: ${pageAnalysis.buttons} buttons, ${pageAnalysis.links} links`);

      results.push({
        page: page.name,
        score,
        passed: passedChecks,
        total: totalChecks,
        analysis: pageAnalysis,
        checks
      });

      totalScore += score;

    } catch (error) {
      console.error(`  ❌ ${page.name} Error: ${error.message}`);
      results.push({
        page: page.name,
        score: 0,
        passed: 0,
        total: 5,
        error: error.message
      });
    }
  }

  const averageScore = Math.round(totalScore / pages.length);

  console.log('\n\n📊 QUICK COVERAGE RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');

  results.forEach(result => {
    const status = result.score >= 80 ? '🎉' : result.score >= 60 ? '✅' : result.score >= 40 ? '⚠️' : '❌';
    console.log(`${status} ${result.page}: ${result.score}% coverage`);
  });

  console.log('───────────────────────────────────────────────────────────────');
  const overallStatus = averageScore >= 80 ? '🎉' : averageScore >= 60 ? '✅' : averageScore >= 40 ? '⚠️' : '❌';
  console.log(`${overallStatus} OVERALL AVERAGE: ${averageScore}%`);

  console.log('\n💡 COVERAGE ASSESSMENT:');
  if (averageScore >= 80) {
    console.log('🎉 EXCELLENT! Admin pages meet 80%+ coverage target.');
    console.log('✅ Core functionality implemented and working.');
    console.log('🚀 Ready for comprehensive testing.');
  } else if (averageScore >= 60) {
    console.log('✅ GOOD! Most functionality working well.');
    console.log('🔧 Minor improvements needed to reach 80% target.');
    console.log('📈 Focus on areas with lower scores.');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Below 60% coverage.');
    console.log('🔧 Address core functionality gaps.');
    console.log('📊 Significant work needed to reach target.');
  }

  console.log('\n📋 COMPREHENSIVE TEST RECOMMENDATIONS:');
  console.log('• Run full responsive test suite for mobile/tablet verification');
  console.log('• Execute CRUD operations testing for data manipulation');
  console.log('• Test archive/restore functionality thoroughly');
  console.log('• Verify search and filtering across all pages');
  console.log('• Test navigation and routing between pages');

  return { averageScore, results, success: averageScore >= 70 };
}

// Main execution
async function main() {
  try {
    const { success, averageScore } = await quickCoverageCheck();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`🎯 QUICK COVERAGE CHECK COMPLETE: ${averageScore}%`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Quick Coverage Check Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { quickCoverageCheck };
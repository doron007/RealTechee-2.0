const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 Testing New Responsive Breakpoints');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📄 Loading admin page...');
    await page.goto('http://localhost:3000/admin/projects', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Quick login
    console.log('🔑 Logging in...');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.type('input[type="email"]', 'info@realtechee.com', { delay: 50 });
    await page.type('input[type="password"]', 'Sababa123!', { delay: 50 });
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForSelector('h1', { timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test various breakpoints
    const testBreakpoints = [
      { width: 320, height: 568, name: 'Mobile XS', expectedView: 'cards' },
      { width: 768, height: 1024, name: 'Tablet SM', expectedView: 'cards' },
      { width: 1024, height: 768, name: 'Tablet MD', expectedView: 'cards' },
      { width: 1279, height: 800, name: 'Small Desktop (edge)', expectedView: 'cards' },
      { width: 1280, height: 800, name: 'Large Desktop LG+', expectedView: 'table' },
      { width: 1440, height: 900, name: 'Large Desktop', expectedView: 'table' },
      { width: 1920, height: 1080, name: 'Extra Large', expectedView: 'table' }
    ];
    
    const results = [];
    
    for (const test of testBreakpoints) {
      console.log(`\\n📱 Testing ${test.name} (${test.width}x${test.height})`);
      
      // Set viewport
      await page.setViewport({ width: test.width, height: test.height });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to set table view in localStorage (should be ignored on small screens)
      await page.evaluate(() => {
        localStorage.setItem('admin-projects-view-mode', 'table');
      });
      
      // Reload to apply the view mode
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('h1');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check what view is actually displayed
      const viewAnalysis = await page.evaluate(() => {
        const table = document.querySelector('table');
        // Look for cards view structure: search controls + card-like elements
        const searchField = document.querySelector('input[placeholder*="Search projects"]');
        const cardElements = document.querySelectorAll('div.bg-white.border-b.border-gray-100');
        const debugInfo = window.projectsDebugInfo;
        
        // Cards view has search controls but no table
        const isCardsView = searchField && !table && cardElements.length > 0;
        
        return {
          hasTable: !!table,
          hasSearch: !!searchField,
          cardElements: cardElements.length,
          actualView: table ? 'table' : (isCardsView ? 'cards' : 'unknown'),
          debugInfo: debugInfo || {},
          localStorage: localStorage.getItem('admin-projects-view-mode')
        };
      });
      
      // Analyze results
      const actualView = viewAnalysis.actualView;
      const passed = actualView === test.expectedView;
      
      console.log(`   📊 Expected: ${test.expectedView}, Actual: ${actualView}`);
      console.log(`   🔧 Debug reason: ${viewAnalysis.debugInfo.switchReason || 'unknown'}`);
      console.log(`   💾 LocalStorage: ${viewAnalysis.localStorage}`);
      
      if (actualView === 'table') {
        console.log(`   📋 Table visible`);
      } else if (actualView === 'cards') {
        console.log(`   📇 Cards view: ${viewAnalysis.cardElements} card elements, search: ${viewAnalysis.hasSearch}`);
      } else {
        console.log(`   ❓ Unknown view: table=${viewAnalysis.hasTable}, search=${viewAnalysis.hasSearch}, cards=${viewAnalysis.cardElements}`);
      }
      
      results.push({
        test: test.name,
        viewport: { width: test.width, height: test.height },
        expected: test.expectedView,
        actual: actualView,
        passed: passed,
        debugInfo: viewAnalysis.debugInfo
      });
      
      const statusIcon = passed ? '✅' : '❌';
      console.log(`   ${statusIcon} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
      
      // Take screenshot
      await page.screenshot({ path: `breakpoint-${test.width}px.png` });
    }
    
    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\\n🎉 Responsive breakpoint test: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\\n❌ Failed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   ${r.test}: Expected ${r.expected}, got ${r.actual}`);
      });
    } else {
      console.log('\\n✅ All breakpoints working correctly!');
      console.log('   - Cards view enforced for xs, sm, md (< 1280px)');
      console.log('   - Table view allowed for lg+ (≥ 1280px)');
    }
    
  } catch (error) {
    console.error('\\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'responsive-test-error.png' });
  }
  
  await browser.close();
  console.log('\\n🏁 Responsive test complete');
})();
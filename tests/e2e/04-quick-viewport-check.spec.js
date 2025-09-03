/**
 * Quick iPhone 15 Pro Viewport Check
 * Focuses on critical measurements and visual verification
 */

const { test, expect } = require('@playwright/test');

test.describe('Quick iPhone Viewport Check (393x852)', () => {
  test('verify all controls fit and measure properly', async ({ page }) => {
    test.setTimeout(60000);
    
    const VIEWPORT_WIDTH = 393;
    
    console.log('\n📱 === QUICK VIEWPORT VERIFICATION ===\n');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/quick-initial.png',
      fullPage: false 
    });
    
    // Check horizontal scroll immediately
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    console.log(`Horizontal scroll: ${hasHorizontalScroll ? '❌ DETECTED' : '✅ None'}`);
    
    // Quick measurement of key controls
    const controls = [
      'select[name="relationToProperty"]',
      'input[name="propertyAddress.streetAddress"]', 
      'input[name="propertyAddress.city"]',
      'select[name="propertyAddress.state"]',
      'input[name="propertyAddress.zip"]',
      'input[name="agentInfo.fullName"]',
      'input[name="agentInfo.email"]',
      'select[name="agentInfo.brokerage"]'
    ];
    
    const results = [];
    
    for (const selector of controls) {
      try {
        const element = await page.locator(selector);
        await element.scrollIntoViewIfNeeded();
        const box = await element.boundingBox();
        
        if (box) {
          const widthPercent = Math.round(box.width/VIEWPORT_WIDTH*100);
          const fitsViewport = (box.x + box.width) <= VIEWPORT_WIDTH;
          const rightEdge = box.x + box.width;
          
          results.push({
            selector,
            width: box.width,
            widthPercent,
            rightEdge,
            fitsViewport,
            overflow: fitsViewport ? 0 : rightEdge - VIEWPORT_WIDTH
          });
          
          console.log(`${selector}:`);
          console.log(`  Width: ${box.width}px (${widthPercent}%)`);
          console.log(`  Right edge: ${rightEdge}px (viewport: ${VIEWPORT_WIDTH}px)`);
          console.log(`  Status: ${fitsViewport ? '✅ Fits' : '❌ OVERFLOWS by ' + (rightEdge - VIEWPORT_WIDTH) + 'px'}`);
        }
      } catch (error) {
        console.log(`❌ Error measuring ${selector}: ${error.message}`);
      }
    }
    
    // Screenshot of each major section
    await page.locator('select[name="relationToProperty"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/e2e/screenshots/quick-relation.png' });
    
    await page.locator('input[name="propertyAddress.streetAddress"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/e2e/screenshots/quick-address.png' });
    
    await page.locator('input[name="agentInfo.fullName"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/e2e/screenshots/quick-agent.png' });
    
    // Test dropdown interaction
    console.log('\n🖱️ Testing dropdown interaction:');
    try {
      const dropdown = page.locator('select[name="relationToProperty"]');
      await dropdown.scrollIntoViewIfNeeded();
      await dropdown.selectOption('Real Estate Agent');
      await page.screenshot({ path: 'tests/e2e/screenshots/quick-dropdown-selected.png' });
      console.log('  ✅ Dropdown selection works');
    } catch (error) {
      console.log('  ❌ Dropdown interaction failed:', error.message);
    }
    
    // Test input interaction
    console.log('\n⌨️ Testing input interaction:');
    try {
      await page.fill('input[name="propertyAddress.streetAddress"]', 'Test');
      await page.screenshot({ path: 'tests/e2e/screenshots/quick-input-filled.png' });
      console.log('  ✅ Input typing works');
    } catch (error) {
      console.log('  ❌ Input interaction failed:', error.message);
    }
    
    // Summary
    const overflowingControls = results.filter(r => !r.fitsViewport);
    const narrowControls = results.filter(r => r.widthPercent < 50);
    
    console.log('\n📊 === SUMMARY ===');
    console.log(`Total controls tested: ${results.length}`);
    console.log(`Overflowing controls: ${overflowingControls.length}`);
    console.log(`Narrow controls (<50%): ${narrowControls.length}`);
    console.log(`Horizontal scroll: ${hasHorizontalScroll ? 'YES' : 'NO'}`);
    
    if (overflowingControls.length > 0) {
      console.log('\n❌ OVERFLOWING CONTROLS:');
      overflowingControls.forEach(c => {
        console.log(`  - ${c.selector}: overflows by ${c.overflow}px`);
      });
    }
    
    if (narrowControls.length > 0) {
      console.log('\n⚠️ NARROW CONTROLS:');
      narrowControls.forEach(c => {
        console.log(`  - ${c.selector}: only ${c.widthPercent}% width (${c.width}px)`);
      });
    }
    
    console.log('\n✨ Quick verification complete!\n');
    
    // Assertions
    expect(hasHorizontalScroll).toBe(false);
    expect(overflowingControls.length).toBe(0);
  });
});
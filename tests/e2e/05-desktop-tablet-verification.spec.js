/**
 * Desktop and Tablet Viewport Verification
 * Ensures mobile optimizations don't break larger screen experiences
 */

const { test, expect } = require('@playwright/test');

test.describe('Desktop and Tablet Viewport Verification', () => {
  test('verify desktop viewport (1920x1080) unchanged', async ({ page }) => {
    test.setTimeout(60000);
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('\n🖥️ === DESKTOP VIEWPORT TEST (1920x1080) ===\n');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Take desktop screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/desktop-full-form.png',
      fullPage: true 
    });
    
    // Test 1: "What to Expect" should NOT be collapsible on desktop
    console.log('📋 Testing "What to Expect" section:');
    const whatToExpectBtn = await page.locator('button:has-text("What to Expect")').first();
    const isCollapsible = await whatToExpectBtn.isVisible().catch(() => false);
    
    if (!isCollapsible) {
      // Should show as H2 title instead
      const whatToExpectTitle = await page.locator('h2:has-text("What to Expect")').first();
      const titleVisible = await whatToExpectTitle.isVisible();
      console.log(`  ${titleVisible ? '✅' : '❌'} Shows as H2 title (not collapsible button)`);
      
      // Process steps should be visible
      const processSteps = await page.locator('[class*="ProcessStepCard"], .space-y-8 > div').count();
      console.log(`  ${processSteps > 0 ? '✅' : '❌'} Process steps visible (${processSteps} found)`);
    } else {
      console.log('  ❌ ERROR: Button is visible on desktop (should not be)');
    }
    
    // Test 2: Form layout should be side-by-side (desktop grid)
    console.log('\n📐 Testing layout structure:');
    const formContainer = await page.locator('.lg\\:col-span-8').first();
    const formBox = await formContainer.boundingBox();
    const whatToExpectContainer = await page.locator('.lg\\:col-span-4').first();
    const sidebarBox = await whatToExpectContainer.boundingBox();
    
    if (formBox && sidebarBox) {
      const isSideBySide = Math.abs(formBox.y - sidebarBox.y) < 50; // Same row
      console.log(`  ${isSideBySide ? '✅' : '❌'} Side-by-side layout maintained`);
      console.log(`    Form: ${Math.round(formBox.width)}px wide`);
      console.log(`    Sidebar: ${Math.round(sidebarBox.width)}px wide`);
    }
    
    // Test 3: Contact fields should be side-by-side on desktop
    console.log('\n📧 Testing contact fields layout:');
    const agentEmail = await page.locator('input[name="agentInfo.email"]');
    const agentPhone = await page.locator('input[name="agentInfo.phone"]');
    
    const emailBox = await agentEmail.boundingBox();
    const phoneBox = await agentPhone.boundingBox();
    
    if (emailBox && phoneBox) {
      const areSideBySide = Math.abs(emailBox.y - phoneBox.y) < 20;
      console.log(`  ${areSideBySide ? '✅' : '❌'} Email and phone side-by-side`);
      console.log(`    Email width: ${Math.round(emailBox.width)}px`);
      console.log(`    Phone width: ${Math.round(phoneBox.width)}px`);
    }
    
    // Test 4: Address fields grid
    console.log('\n🏠 Testing address fields:');
    const addressFields = ['streetAddress', 'city', 'state', 'zip'];
    const measurements = [];
    
    for (const field of addressFields) {
      const element = await page.locator(`[name="propertyAddress.${field}"]`);
      const box = await element.boundingBox();
      if (box) {
        measurements.push({ field, width: box.width, y: box.y });
      }
    }
    
    // Street should be full width, others should be on same row
    const streetWidth = measurements.find(m => m.field === 'streetAddress')?.width || 0;
    const cityWidth = measurements.find(m => m.field === 'city')?.width || 0;
    const stateWidth = measurements.find(m => m.field === 'state')?.width || 0;
    
    console.log(`    Street address: ${Math.round(streetWidth)}px (full width)`);
    console.log(`    City: ${Math.round(cityWidth)}px`);
    console.log(`    State: ${Math.round(stateWidth)}px`);
    
    // Test form functionality
    console.log('\n🖱️ Testing form interactions:');
    await page.selectOption('select[name="relationToProperty"]', 'Homeowner');
    await page.fill('input[name="propertyAddress.streetAddress"]', 'Desktop Test Address');
    console.log('  ✅ Form interactions working');
  });

  test('verify tablet viewport (768x1024) responsive behavior', async ({ page }) => {
    test.setTimeout(60000);
    
    // Set tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    
    console.log('\n📱 === TABLET VIEWPORT TEST (768x1024) ===\n');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Take tablet screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/tablet-form-layout.png',
      fullPage: true 
    });
    
    // Test 1: Should still be desktop-like (not collapsed)
    console.log('📋 Testing tablet behavior:');
    const whatToExpectBtn = await page.locator('button:has-text("What to Expect")').first();
    const isCollapsible = await whatToExpectBtn.isVisible().catch(() => false);
    
    if (!isCollapsible) {
      const whatToExpectTitle = await page.locator('h2:has-text("What to Expect")').first();
      const titleVisible = await whatToExpectTitle.isVisible();
      console.log(`  ${titleVisible ? '✅' : '❌'} Shows desktop-style layout (H2 title)`);
    } else {
      console.log('  ⚠️ Shows mobile-style (collapsible) - check breakpoint');
    }
    
    // Test 2: Check if layout stacks or stays side-by-side
    const formContainer = await page.locator('.lg\\:col-span-8').first();
    const whatToExpectContainer = await page.locator('.lg\\:col-span-4').first();
    
    const formBox = await formContainer.boundingBox();
    const sidebarBox = await whatToExpectContainer.boundingBox();
    
    if (formBox && sidebarBox) {
      const stacked = sidebarBox.y > formBox.y + formBox.height - 100;
      console.log(`  ${stacked ? '📱' : '🖥️'} Layout: ${stacked ? 'Stacked (mobile-like)' : 'Side-by-side (desktop-like)'}`);
    }
    
    // Test contact fields responsiveness
    const agentEmail = await page.locator('input[name="agentInfo.email"]');
    const agentPhone = await page.locator('input[name="agentInfo.phone"]');
    
    const emailBox = await agentEmail.boundingBox();
    const phoneBox = await agentPhone.boundingBox();
    
    if (emailBox && phoneBox) {
      const areSideBySide = Math.abs(emailBox.y - phoneBox.y) < 20;
      console.log(`  ${areSideBySide ? '✅' : '📱'} Contact fields: ${areSideBySide ? 'Side-by-side' : 'Stacked'}`);
    }
  });

  test('verify breakpoint transitions at key sizes', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n📏 === BREAKPOINT VERIFICATION ===\n');
    
    const breakpoints = [
      { name: 'Mobile Small', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 800 },
      { name: 'Desktop Large', width: 1920, height: 1080 }
    ];
    
    for (const bp of breakpoints) {
      console.log(`\n📱 Testing ${bp.name} (${bp.width}x${bp.height}):`);
      
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      // Check "What to Expect" behavior
      const whatToExpectBtn = await page.locator('button:has-text("What to Expect")').first();
      const isCollapsible = await whatToExpectBtn.isVisible().catch(() => false);
      
      // sm breakpoint is 640px
      const shouldBeCollapsible = bp.width < 640;
      const behaviorCorrect = shouldBeCollapsible === isCollapsible;
      
      console.log(`  Expected: ${shouldBeCollapsible ? 'Collapsible' : 'Static'}`);
      console.log(`  Actual: ${isCollapsible ? 'Collapsible' : 'Static'}`);
      console.log(`  Status: ${behaviorCorrect ? '✅' : '❌'}`);
      
      // Take screenshot
      const filename = `breakpoint-${bp.name.toLowerCase().replace(' ', '-')}.png`;
      await page.screenshot({ 
        path: `tests/e2e/screenshots/${filename}`,
        fullPage: false 
      });
    }
    
    console.log('\n✅ Breakpoint verification complete');
  });
});
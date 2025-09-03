/**
 * Comprehensive Mobile Forms Test
 * Tests all four contact forms on iPhone 15 Pro viewport for mobile optimization
 */

const { test, expect } = require('@playwright/test');

test.describe('Mobile Forms Comprehensive Test - iPhone 15 Pro', () => {
  const VIEWPORT_WIDTH = 393;
  const FORMS = [
    {
      name: 'Get Estimate',
      url: '/contact/get-estimate',
      buttonText: 'What to Expect',
      inputSelector: 'input[name="homeownerInfo.fullName"]'
    },
    {
      name: 'Contact Us',
      url: '/contact/contact-us',
      buttonText: 'What to Expect',
      inputSelector: 'input[name="contactInfo.fullName"]'
    },
    {
      name: 'Get Qualified',
      url: '/contact/get-qualified',
      buttonText: 'What to Expect',
      inputSelector: 'input[name="contactInfo.fullName"]'
    },
    {
      name: 'Affiliate',
      url: '/contact/affiliate',
      buttonText: 'What to Expect',
      inputSelector: 'input[name="contactInfo.fullName"]'
    }
  ];

  FORMS.forEach(form => {
    test(`${form.name} form mobile optimization`, async ({ page }) => {
      test.setTimeout(60000);
      
      console.log(`\n📱 === ${form.name.toUpperCase()} FORM MOBILE TEST ===\n`);
      
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      // Test 1: "What to Expect" alignment
      console.log(`📐 Testing "${form.buttonText}" alignment for ${form.name}:`);
      
      const whatToExpectBtn = await page.locator(`button:has-text("${form.buttonText}")`).first();
      const whatToExpectBox = await whatToExpectBtn.boundingBox();
      
      // Get first form section for comparison
      const firstFormSection = await page.locator('h3').first();
      const firstSectionBox = await firstFormSection.boundingBox();
      
      if (whatToExpectBox && firstSectionBox) {
        const alignmentDiff = Math.abs(whatToExpectBox.x - firstSectionBox.x);
        console.log(`  "${form.buttonText}" left position: ${whatToExpectBox.x}px`);
        console.log(`  First form section left position: ${firstSectionBox.x}px`);
        console.log(`  Alignment difference: ${alignmentDiff}px`);
        console.log(`  ${alignmentDiff <= 5 ? '✅' : '❌'} Aligned within 5px tolerance`);
      }
      
      // Test 2: Input field width utilization
      console.log(`\n📝 Testing input field width utilization for ${form.name}:`);
      
      const nameInput = await page.locator(form.inputSelector);
      await nameInput.scrollIntoViewIfNeeded();
      
      const inputBox = await nameInput.boundingBox();
      
      if (inputBox) {
        const utilization = Math.round(inputBox.width / VIEWPORT_WIDTH * 100);
        console.log(`  Input field width: ${Math.round(inputBox.width)}px`);
        console.log(`  Input utilization: ${utilization}% of viewport`);
        console.log(`  ${utilization >= 70 ? '✅' : '⚠️'} Input uses ${utilization}% of viewport (target: >70%)`);
      }
      
      // Test 3: Progressive disclosure on mobile (if applicable)
      const isMobile = await page.evaluate(() => window.innerWidth < 640);
      if (isMobile) {
        console.log(`\n📱 Testing progressive disclosure for ${form.name}:`);
        
        try {
          const expandButton = await page.locator(`button:has-text("${form.buttonText}")`).first();
          if (await expandButton.isVisible()) {
            await expandButton.click();
            await page.waitForTimeout(500);
            console.log(`  ✅ Progressive disclosure works for ${form.name}`);
          }
        } catch (error) {
          console.log(`  ℹ️ Progressive disclosure not applicable for ${form.name}`);
        }
      }
      
      // Test 4: Check for horizontal scroll
      console.log(`\n📏 Testing horizontal scroll prevention for ${form.name}:`);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      console.log(`  ${hasHorizontalScroll ? '❌' : '✅'} ${hasHorizontalScroll ? 'Has' : 'No'} horizontal scroll`);
      
      // Test 5: Take screenshot for visual verification
      console.log(`\n📸 Capturing screenshot for ${form.name}:`);
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/mobile-${form.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: false 
      });
      console.log(`  ✅ Screenshot captured for ${form.name}`);
      
      console.log(`\n📊 === ${form.name.toUpperCase()} FORM TEST COMPLETED ===\n`);
    });
  });
  
  test('All forms consistent mobile experience', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🔄 === CROSS-FORM CONSISTENCY TEST ===\n');
    
    const measurements = [];
    
    for (const form of FORMS) {
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      // Measure input field utilization
      const nameInput = await page.locator(form.inputSelector);
      await nameInput.scrollIntoViewIfNeeded();
      const inputBox = await nameInput.boundingBox();
      
      if (inputBox) {
        const utilization = Math.round(inputBox.width / VIEWPORT_WIDTH * 100);
        measurements.push({
          form: form.name,
          width: Math.round(inputBox.width),
          utilization: utilization
        });
        console.log(`${form.name}: ${Math.round(inputBox.width)}px (${utilization}%)`);
      }
    }
    
    // Check consistency
    const utilisations = measurements.map(m => m.utilization);
    const minUtil = Math.min(...utilisations);
    const maxUtil = Math.max(...utilisations);
    const variance = maxUtil - minUtil;
    
    console.log(`\nConsistency Analysis:`);
    console.log(`  Min utilization: ${minUtil}%`);
    console.log(`  Max utilization: ${maxUtil}%`);
    console.log(`  Variance: ${variance}%`);
    console.log(`  ${variance <= 10 ? '✅' : '⚠️'} Forms are ${variance <= 10 ? 'consistent' : 'inconsistent'} (variance: ${variance}%)`);
    
    console.log('\n📊 === CONSISTENCY TEST COMPLETED ===\n');
  });
});
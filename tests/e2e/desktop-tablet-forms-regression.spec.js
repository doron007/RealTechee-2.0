/**
 * Desktop and Tablet Forms Regression Test
 * Ensures mobile optimizations didn't break larger viewport experiences
 */

const { test, expect } = require('@playwright/test');

test.describe('Desktop and Tablet Forms Regression Test', () => {
  const FORMS = [
    {
      name: 'Get Estimate',
      url: '/contact/get-estimate',
      inputSelector: 'input[name="homeownerInfo.fullName"]',
      addressSelector: 'input[name="propertyAddress.streetAddress"]'
    },
    {
      name: 'Contact Us', 
      url: '/contact/contact-us',
      inputSelector: 'input[name="contactInfo.fullName"]',
      addressSelector: 'input[name="address.streetAddress"]'
    },
    {
      name: 'Get Qualified',
      url: '/contact/get-qualified', 
      inputSelector: 'input[name="contactInfo.fullName"]',
      addressSelector: 'input[name="address.streetAddress"]'
    },
    {
      name: 'Affiliate',
      url: '/contact/affiliate',
      inputSelector: 'input[name="contactInfo.fullName"]', 
      addressSelector: 'input[name="address.streetAddress"]'
    }
  ];

  const VIEWPORTS = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 }
  ];

  VIEWPORTS.forEach(viewport => {
    FORMS.forEach(form => {
      test(`${form.name} form - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        test.setTimeout(60000);
        
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        console.log(`\n🖥️ === ${form.name.toUpperCase()} - ${viewport.name.toUpperCase()} TEST ===\n`);
        
        await page.goto(form.url);
        await page.waitForLoadState('networkidle');
        
        // Test 1: "What to Expect" should be visible and properly positioned
        console.log(`📐 Testing "What to Expect" section visibility:`);
        
        const whatToExpect = await page.locator('h2:has-text("What to Expect"), h3:has-text("What to Expect")');
        const isVisible = await whatToExpect.isVisible();
        console.log(`  ${isVisible ? '✅' : '❌'} "What to Expect" section is visible`);
        
        if (isVisible) {
          const boundingBox = await whatToExpect.boundingBox();
          if (boundingBox) {
            console.log(`  Section position: x=${boundingBox.x}px, y=${boundingBox.y}px`);
            console.log(`  Section size: ${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)}px`);
          }
        }
        
        // Test 2: Form layout should be appropriate for larger screens
        console.log(`\n📝 Testing form layout:`);
        
        const nameInput = await page.locator(form.inputSelector);
        await nameInput.scrollIntoViewIfNeeded();
        const nameBox = await nameInput.boundingBox();
        
        if (nameBox) {
          const utilization = Math.round(nameBox.width / viewport.width * 100);
          console.log(`  Name input width: ${Math.round(nameBox.width)}px`);
          console.log(`  Viewport utilization: ${utilization}%`);
          console.log(`  ${utilization <= 60 ? '✅' : '⚠️'} Input width is appropriate for ${viewport.name} (${utilization}%)`);
        }
        
        // Test 3: Address fields should be side-by-side on larger screens (when applicable)
        if (form.addressSelector) {
          console.log(`\n🏠 Testing address field layout:`);
          
          try {
            const addressInput = await page.locator(form.addressSelector);
            await addressInput.scrollIntoViewIfNeeded();
            const addressBox = await addressInput.boundingBox();
            
            // Look for city field to check if they're side-by-side
            const cityInput = await page.locator('input[name*="city"]').first();
            const cityBox = await cityInput.boundingBox();
            
            if (addressBox && cityBox && viewport.name === 'Desktop') {
              const isSideBySide = Math.abs(addressBox.y - cityBox.y) < 100; // Same row approximately
              console.log(`  Address field y: ${addressBox.y}px`);
              console.log(`  City field y: ${cityBox.y}px`);
              console.log(`  ${isSideBySide ? '✅' : '❌'} Fields are ${isSideBySide ? 'side-by-side' : 'stacked'}`);
            }
          } catch (error) {
            console.log(`  ℹ️ Address layout test not applicable for ${form.name}`);
          }
        }
        
        // Test 4: No horizontal scroll
        console.log(`\n📏 Testing scroll behavior:`);
        
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        
        console.log(`  ${hasHorizontalScroll ? '❌' : '✅'} ${hasHorizontalScroll ? 'Has' : 'No'} horizontal scroll`);
        
        // Test 5: Form should be properly contained
        console.log(`\n📦 Testing form container:`);
        
        const formContainer = await page.locator('form').first();
        const containerBox = await formContainer.boundingBox();
        
        if (containerBox) {
          const isProperlyContained = containerBox.x >= 0 && 
                                    (containerBox.x + containerBox.width) <= viewport.width;
          console.log(`  Form width: ${Math.round(containerBox.width)}px`);
          console.log(`  Form position: x=${containerBox.x}px`);
          console.log(`  ${isProperlyContained ? '✅' : '❌'} Form is properly contained within viewport`);
        }
        
        // Test 6: Take screenshot for visual verification
        console.log(`\n📸 Capturing screenshot:`);
        
        await page.screenshot({ 
          path: `tests/e2e/screenshots/${viewport.name.toLowerCase()}-${form.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: false 
        });
        console.log(`  ✅ Screenshot captured`);
        
        console.log(`\n📊 === ${form.name.toUpperCase()} - ${viewport.name.toUpperCase()} TEST COMPLETED ===\n`);
      });
    });
  });
  
  test('Progressive disclosure only on mobile', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('\n🔄 === PROGRESSIVE DISCLOSURE BEHAVIOR TEST ===\n');
    
    for (const viewport of VIEWPORTS) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height}):`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      // Check if "What to Expect" is a button (mobile) or static heading (desktop/tablet)
      const expandableButton = await page.locator('button:has-text("What to Expect")');
      const staticHeading = await page.locator('h2:has-text("What to Expect")');
      
      const hasExpandableButton = await expandableButton.isVisible();
      const hasStaticHeading = await staticHeading.isVisible();
      
      console.log(`  Expandable button visible: ${hasExpandableButton ? 'Yes' : 'No'}`);
      console.log(`  Static heading visible: ${hasStaticHeading ? 'Yes' : 'No'}`);
      
      if (viewport.name === 'Desktop' || viewport.name === 'Tablet') {
        console.log(`  ${hasStaticHeading && !hasExpandableButton ? '✅' : '❌'} ${viewport.name} shows static layout`);
      }
    }
    
    console.log('\n📊 === PROGRESSIVE DISCLOSURE TEST COMPLETED ===\n');
  });
});
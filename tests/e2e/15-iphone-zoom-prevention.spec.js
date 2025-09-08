/**
 * iPhone Auto-Zoom Prevention Test
 * Verifies all form inputs use 16px minimum font size to prevent auto-zoom on iOS
 */

const { test, expect } = require('@playwright/test');

test.describe('iPhone Auto-Zoom Prevention Test', () => {
  const FORMS = [
    { name: 'Get Estimate', url: '/contact/get-estimate' },
    { name: 'Contact Us', url: '/contact' },
    { name: 'Get Qualified', url: '/contact/get-qualified' },
    { name: 'Affiliate', url: '/contact/affiliate' }
  ];

  // iPhone 15 Pro viewport
  test.use({ viewport: { width: 393, height: 852 } });

  FORMS.forEach(form => {
    test(`${form.name} - Font size verification`, async ({ page }) => {
      test.setTimeout(30000);
      
      console.log(`\n📱 === ${form.name.toUpperCase()} FONT SIZE TEST ===\n`);
      
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      // Test all input types for 16px minimum font size
      const inputTypes = [
        { selector: 'input[type="text"]', name: 'Text inputs' },
        { selector: 'input[type="email"]', name: 'Email inputs' },
        { selector: 'input[type="tel"]', name: 'Phone inputs' },
        { selector: 'textarea', name: 'Textareas' },
        { selector: 'select', name: 'Dropdowns' },
        { selector: 'input[type="date"]', name: 'Date inputs' }
      ];
      
      for (const inputType of inputTypes) {
        const elements = await page.locator(inputType.selector).all();
        
        if (elements.length > 0) {
          console.log(`\n📏 Testing ${inputType.name} (${elements.length} found):`);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Get computed font size
            const fontSize = await element.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return styles.fontSize;
            });
            
            // Parse font size to pixels
            const fontSizeInPx = parseFloat(fontSize);
            
            // Verify minimum 16px
            const meetsMinimum = fontSizeInPx >= 16;
            
            console.log(`  Element ${i + 1}: ${fontSize} ${meetsMinimum ? '✅' : '❌'}`);
            
            // Assert minimum font size
            expect(fontSizeInPx).toBeGreaterThanOrEqual(16);
          }
        } else {
          console.log(`\n  ℹ️ No ${inputType.name} found in ${form.name}`);
        }
      }
      
      // Test that inputs still work correctly
      console.log(`\n🔧 Testing input functionality:`);
      
      // Find first text input and test typing
      const firstInput = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
      if (await firstInput.isVisible()) {
        await firstInput.fill('Test input');
        const value = await firstInput.inputValue();
        console.log(`  Input accepts text: ${value === 'Test input' ? '✅' : '❌'}`);
      }
      
      // Verify no horizontal scroll (important for mobile)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`  No horizontal scroll: ${hasHorizontalScroll ? '❌' : '✅'}`);
      
      console.log(`\n📊 === ${form.name.toUpperCase()} TEST COMPLETED ===\n`);
    });
  });

  test('Cross-form font size consistency', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🔄 === CROSS-FORM FONT SIZE CONSISTENCY TEST ===\n');
    
    const fontSizes = [];
    
    for (const form of FORMS) {
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      // Get font size from first input
      const firstInput = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
      if (await firstInput.isVisible()) {
        const fontSize = await firstInput.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.fontSize;
        });
        
        fontSizes.push({
          form: form.name,
          fontSize: fontSize
        });
        
        console.log(`${form.name}: ${fontSize}`);
      }
    }
    
    // Check all forms use same font size
    const uniqueFontSizes = [...new Set(fontSizes.map(f => f.fontSize))];
    const isConsistent = uniqueFontSizes.length === 1;
    
    console.log(`\nConsistency Analysis:`);
    console.log(`  Unique font sizes: ${uniqueFontSizes.join(', ')}`);
    console.log(`  ${isConsistent ? '✅' : '❌'} All forms use consistent font size`);
    
    // Verify all use at least 16px
    const allMeetMinimum = fontSizes.every(f => parseFloat(f.fontSize) >= 16);
    console.log(`  ${allMeetMinimum ? '✅' : '❌'} All forms meet 16px minimum`);
    
    console.log('\n📊 === CONSISTENCY TEST COMPLETED ===\n');
  });
});
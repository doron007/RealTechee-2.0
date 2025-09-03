/**
 * Comprehensive Form DOM Verification Test
 * Verifies ALL form elements are present in DOM and properly rendered
 * Tests both mobile (iPhone 15 Pro) and desktop viewports with data
 */

const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Form DOM Verification', () => {
  const FORMS = [
    {
      name: 'Get Estimate',
      url: '/contact/get-estimate',
      expectedElements: {
        textInputs: ['input[name="homeownerInfo.fullName"]'],
        emailInputs: ['input[name="homeownerInfo.email"]', 'input[name="agentInfo.email"]'],
        phoneInputs: ['input[name="homeownerInfo.phone"]', 'input[name="agentInfo.phone"]'],
        textareas: ['textarea[name="projectDescription"]'],
        selects: [
          'select[name="propertyAddress.state"]',
          'select[name="agentInfo.state"]', 
          'select[name="serviceType"]'
        ],
        addressInputs: [
          'input[name="propertyAddress.streetAddress"]',
          'input[name="propertyAddress.city"]',
          'input[name="propertyAddress.zip"]'
        ],
        agentAddressInputs: [
          'input[name="agentInfo.streetAddress"]',
          'input[name="agentInfo.city"]',
          'input[name="agentInfo.zip"]'
        ]
      }
    },
    {
      name: 'Contact Us',
      url: '/contact/contact-us',
      expectedElements: {
        textInputs: ['input[name="contactInfo.fullName"]'],
        emailInputs: ['input[name="contactInfo.email"]'],
        phoneInputs: ['input[name="contactInfo.phone"]'],
        textareas: ['textarea[name="inquiryDetails"]'],
        selects: ['select[name="address.state"]', 'select[name="inquiryType"]'],
        addressInputs: [
          'input[name="address.streetAddress"]',
          'input[name="address.city"]',
          'input[name="address.zip"]'
        ]
      }
    },
    {
      name: 'Get Qualified',
      url: '/contact/get-qualified',
      expectedElements: {
        textInputs: ['input[name="contactInfo.fullName"]'],
        emailInputs: ['input[name="contactInfo.email"]'],
        phoneInputs: ['input[name="contactInfo.phone"]'],
        textareas: [
          'textarea[name="businessExperience"]',
          'textarea[name="additionalInfo"]'
        ],
        selects: [
          'select[name="address.state"]',
          'select[name="businessType"]',
          'select[name="experienceLevel"]',
          'select[name="serviceAreas"]'
        ],
        addressInputs: [
          'input[name="address.streetAddress"]',
          'input[name="address.city"]',
          'input[name="address.zip"]'
        ]
      }
    },
    {
      name: 'Affiliate',
      url: '/contact/affiliate',
      expectedElements: {
        textInputs: ['input[name="contactInfo.fullName"]', 'input[name="companyName"]'],
        emailInputs: ['input[name="contactInfo.email"]'],
        phoneInputs: ['input[name="contactInfo.phone"]'],
        selects: ['select[name="address.state"]', 'select[name="serviceType"]'],
        addressInputs: [
          'input[name="address.streetAddress"]',
          'input[name="address.city"]',
          'input[name="address.zip"]'
        ]
      }
    }
  ];

  const VIEWPORTS = [
    { 
      name: 'Mobile (iPhone 15 Pro)', 
      width: 393, 
      height: 852,
      type: 'mobile'
    },
    { 
      name: 'Desktop (1920x1080)', 
      width: 1920, 
      height: 1080,
      type: 'desktop'
    }
  ];

  VIEWPORTS.forEach(viewport => {
    FORMS.forEach(form => {
      test(`${form.name} - ${viewport.name} DOM Verification`, async ({ page }) => {
        test.setTimeout(60000);
        
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        console.log(`\n📱 === ${form.name.toUpperCase()} - ${viewport.name.toUpperCase()} DOM TEST ===\n`);
        
        await page.goto(form.url);
        await page.waitForLoadState('networkidle');
        
        const results = {
          viewport: viewport.name,
          form: form.name,
          totalExpected: 0,
          totalFound: 0,
          totalVisible: 0,
          totalInViewport: 0,
          elements: {},
          issues: []
        };

        // Test each category of elements
        for (const [category, selectors] of Object.entries(form.expectedElements)) {
          console.log(`\n🔍 Testing ${category}:`);
          results.elements[category] = {
            expected: selectors.length,
            found: 0,
            visible: 0,
            inViewport: 0,
            details: []
          };
          
          results.totalExpected += selectors.length;

          for (const selector of selectors) {
            try {
              const element = page.locator(selector).first();
              const exists = await element.count() > 0;
              
              if (exists) {
                results.elements[category].found++;
                results.totalFound++;
                
                const isVisible = await element.isVisible();
                if (isVisible) {
                  results.elements[category].visible++;
                  results.totalVisible++;
                  
                  // Check if element is within viewport (not clipped)
                  const boundingBox = await element.boundingBox();
                  if (boundingBox) {
                    const isInViewport = 
                      boundingBox.x >= 0 && 
                      boundingBox.y >= 0 && 
                      boundingBox.x + boundingBox.width <= viewport.width &&
                      boundingBox.y + boundingBox.height <= viewport.height;
                    
                    const isReasonablyVisible = 
                      boundingBox.x >= -10 && // Allow small negative margins
                      boundingBox.x + boundingBox.width <= viewport.width + 10;
                    
                    if (isReasonablyVisible) {
                      results.elements[category].inViewport++;
                      results.totalInViewport++;
                    } else {
                      results.issues.push({
                        element: selector,
                        issue: 'clipped',
                        position: boundingBox
                      });
                    }
                    
                    results.elements[category].details.push({
                      selector,
                      visible: isVisible,
                      position: {
                        x: Math.round(boundingBox.x),
                        y: Math.round(boundingBox.y),
                        width: Math.round(boundingBox.width),
                        height: Math.round(boundingBox.height)
                      },
                      inViewport: isReasonablyVisible
                    });
                    
                    console.log(`  ${selector}: ✅ Found, ${isVisible ? 'Visible' : 'Hidden'}, Position: ${Math.round(boundingBox.x)},${Math.round(boundingBox.y)} Size: ${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)}`);
                  }
                } else {
                  results.issues.push({
                    element: selector,
                    issue: 'not_visible',
                    position: null
                  });
                  console.log(`  ${selector}: ⚠️ Found but not visible`);
                }
              } else {
                results.issues.push({
                  element: selector,
                  issue: 'not_found',
                  position: null
                });
                console.log(`  ${selector}: ❌ Not found in DOM`);
              }
            } catch (error) {
              results.issues.push({
                element: selector,
                issue: 'error',
                error: error.message
              });
              console.log(`  ${selector}: 🚨 Error: ${error.message}`);
            }
          }
          
          console.log(`  Summary: ${results.elements[category].found}/${results.elements[category].expected} found, ${results.elements[category].visible} visible, ${results.elements[category].inViewport} in viewport`);
        }
        
        // Overall scoring
        const foundScore = Math.round((results.totalFound / results.totalExpected) * 100);
        const visibilityScore = Math.round((results.totalVisible / results.totalExpected) * 100);
        const viewportScore = Math.round((results.totalInViewport / results.totalExpected) * 100);
        
        console.log(`\n📊 Overall Results:`);
        console.log(`  Elements Found: ${results.totalFound}/${results.totalExpected} (${foundScore}%)`);
        console.log(`  Elements Visible: ${results.totalVisible}/${results.totalExpected} (${visibilityScore}%)`);
        console.log(`  Elements in Viewport: ${results.totalInViewport}/${results.totalExpected} (${viewportScore}%)`);
        
        // Issues summary
        if (results.issues.length > 0) {
          console.log(`\n⚠️ Issues Found (${results.issues.length}):`);
          results.issues.forEach(issue => {
            console.log(`  - ${issue.element}: ${issue.issue}`);
          });
        } else {
          console.log(`\n✅ No issues found!`);
        }
        
        // Test basic form functionality
        console.log(`\n🔧 Testing form functionality:`);
        
        // Try to fill first input
        const firstInput = page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
        if (await firstInput.isVisible()) {
          await firstInput.fill('Test input');
          const value = await firstInput.inputValue();
          console.log(`  Input functionality: ${value === 'Test input' ? '✅' : '❌'}`);
        }
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        console.log(`  No horizontal scroll: ${hasHorizontalScroll ? '❌' : '✅'}`);
        
        // Take screenshot for visual verification
        await page.screenshot({ 
          path: `tests/e2e/screenshots/dom-verification-${viewport.type}-${form.name.toLowerCase().replace(/\\s+/g, '-')}.png`,
          fullPage: false 
        });
        
        console.log(`\n📸 Screenshot captured: dom-verification-${viewport.type}-${form.name.toLowerCase().replace(/\\s+/g, '-')}.png`);
        console.log(`\n📊 === ${form.name.toUpperCase()} - ${viewport.name.toUpperCase()} COMPLETED ===\n`);
        
        // Assertions for test pass/fail
        expect(foundScore).toBeGreaterThanOrEqual(100); // All elements must be found
        expect(visibilityScore).toBeGreaterThanOrEqual(90); // At least 90% visible
        expect(viewportScore).toBeGreaterThanOrEqual(90); // At least 90% properly positioned
        expect(hasHorizontalScroll).toBeFalsy(); // No horizontal scroll
      });
    });
  });
  
  test('Cross-viewport consistency check', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('\n🔄 === CROSS-VIEWPORT CONSISTENCY TEST ===\n');
    
    const consistencyResults = [];
    
    for (const form of FORMS) {
      console.log(`Testing ${form.name}:`);
      
      const formResults = {
        form: form.name,
        viewports: {}
      };
      
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(form.url);
        await page.waitForLoadState('networkidle');
        
        let totalElements = 0;
        let visibleElements = 0;
        
        for (const [category, selectors] of Object.entries(form.expectedElements)) {
          for (const selector of selectors) {
            const element = page.locator(selector).first();
            const exists = await element.count() > 0;
            if (exists) {
              totalElements++;
              const isVisible = await element.isVisible();
              if (isVisible) {
                visibleElements++;
              }
            }
          }
        }
        
        const visibilityRate = totalElements > 0 ? Math.round((visibleElements / totalElements) * 100) : 0;
        formResults.viewports[viewport.name] = {
          total: totalElements,
          visible: visibleElements,
          rate: visibilityRate
        };
        
        console.log(`  ${viewport.name}: ${visibleElements}/${totalElements} visible (${visibilityRate}%)`);
      }
      
      consistencyResults.push(formResults);
    }
    
    // Check consistency across viewports
    console.log(`\n📊 Consistency Analysis:`);
    let allConsistent = true;
    
    for (const formResult of consistencyResults) {
      const rates = Object.values(formResult.viewports).map(v => v.rate);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const variance = maxRate - minRate;
      
      console.log(`  ${formResult.form}: ${minRate}%-${maxRate}% (variance: ${variance}%)`);
      
      if (variance > 10) { // Allow 10% variance
        allConsistent = false;
      }
    }
    
    console.log(`\n${allConsistent ? '✅' : '❌'} Cross-viewport consistency: ${allConsistent ? 'PASS' : 'FAIL'}`);
    console.log('\n📊 === CONSISTENCY TEST COMPLETED ===\n');
    
    expect(allConsistent).toBeTruthy();
  });
});
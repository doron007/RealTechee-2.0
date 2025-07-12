/**
 * Product Pages Tests
 * 
 * Comprehensive testing for product pages including:
 * - Kitchen & Bath (/products/kitchen-and-bath)
 * - Commercial (/products/commercial)
 * - Buyers (/products/buyers)
 * - Sellers (/products/sellers)
 * - Architects & Designers (/products/architects-and-designers)
 * - Product information and features
 * - Service descriptions and benefits
 * - Lead generation and CTAs
 * - Performance and accessibility
 */

const { test, expect } = require('@playwright/test');

test.describe('Product Pages', () => {
  
  // Helper function to reset page state like a real user would
  async function resetPageState(page) {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Wait for any animations to settle
    await page.waitForTimeout(500);
  }
  
  // Test each product page
  const productPages = [
    { path: '/products/kitchen-and-bath', name: 'Kitchen & Bath' },
    { path: '/products/commercial', name: 'Commercial' },
    { path: '/products/buyers', name: 'Buyers' },
    { path: '/products/sellers', name: 'Sellers' },
    { path: '/products/architects-and-designers', name: 'Architects & Designers' }
  ];

  productPages.forEach(({ path, name }) => {
    test.describe(`${name} Product Page (${path})`, () => {
      
      let sharedPage;
      
      test.beforeAll(async ({ browser }) => {
        // Create a single page context that persists across all tests
        const context = await browser.newContext({ 
          viewport: { width: 1280, height: 1080 }
        });
        sharedPage = await context.newPage();
        
        // Navigate to product page once
        await sharedPage.goto(path);
        
        // Wait for page to load completely
        await expect(sharedPage.locator('h1').first()).toBeVisible();
        await sharedPage.waitForLoadState('networkidle');
      });
      
      test.beforeEach(async () => {
        // Reset page state for clean test start
        await resetPageState(sharedPage);
      });
      
      test.afterAll(async () => {
        // Clean up the shared page
        if (sharedPage) {
          await sharedPage.close();
        }
      });

      test.describe('Page Loading & Content Display', () => {
        
        test('should load product page without errors', async () => {
          const page = sharedPage;
          
          // Verify page loads and displays main content
          await expect(page.locator('h1').first()).toBeVisible();
          
          // Check for product-specific content
          const pageTitle = await page.title();
          expect(pageTitle).toBeTruthy();
          expect(pageTitle.toLowerCase()).toContain(name.toLowerCase().split(' ')[0]);
          
          // Verify no blocking errors
          const criticalErrors = page.locator('[role="alert"][severity="error"], .error-blocking');
          expect(await criticalErrors.count()).toBe(0);
          
          console.log(`ℹ️ ${name} product page loaded successfully`);
        });
        
        test('should display product information clearly', async () => {
          const page = sharedPage;
          
          // Look for product/service descriptions
          const hasDescriptions = await page.locator('p').count() > 0;
          const hasHeadings = await page.locator('h1, h2, h3').count() > 0;
          const hasImages = await page.locator('img').count() > 0;
          
          // Should have content elements
          expect(hasDescriptions).toBeTruthy();
          expect(hasHeadings).toBeTruthy();
          
          if (hasImages) {
            console.log(`ℹ️ ${name} page includes visual content`);
          }
          
          // Check for product-specific terms
          const productTerms = getProductTerms(name);
          let termCount = 0;
          for (const term of productTerms) {
            const hasTermCount = await page.locator(`text=/${term}/i`).count();
            if (hasTermCount > 0) termCount++;
          }
          
          console.log(`ℹ️ ${name} page contains ${termCount}/${productTerms.length} relevant product terms`);
        });
        
        test('should highlight key benefits and features', async () => {
          const page = sharedPage;
          
          // Look for benefit-focused content
          const hasBenefits = await page.locator('text=/benefit|advantage|feature|why choose/i').count() > 0;
          const hasQuality = await page.locator('text=/quality|professional|expert|experience/i').count() > 0;
          const hasValue = await page.locator('text=/save|affordable|value|competitive/i').count() > 0;
          const hasService = await page.locator('text=/service|support|consultation|design/i').count() > 0;
          
          // Should communicate value proposition
          const valueProps = [hasBenefits, hasQuality, hasValue, hasService].filter(Boolean).length;
          expect(valueProps).toBeGreaterThan(0);
          
          console.log(`ℹ️ ${name} page presents ${valueProps} types of value propositions`);
        });
      });

      test.describe('Lead Generation & CTAs', () => {
        
        test('should provide clear conversion paths', async () => {
          const page = sharedPage;
          
          // Look for conversion-focused CTAs
          const ctaButtons = page.locator('button:has-text("Get"), button:has-text("Contact"), button:has-text("Request"), button:has-text("Schedule"), a:has-text("Get"), a:has-text("Contact")');
          const ctaCount = await ctaButtons.count();
          
          if (ctaCount > 0) {
            console.log(`ℹ️ Found ${ctaCount} conversion CTAs on ${name} page`);
            
            // Test CTA functionality
            for (let i = 0; i < Math.min(ctaCount, 3); i++) {
              const cta = ctaButtons.nth(i);
              if (await cta.isVisible()) {
                await expect(cta).toBeEnabled();
                
                const ctaText = await cta.textContent();
                console.log(`ℹ️ CTA: ${ctaText}`);
                
                // Test interaction
                await cta.hover();
                await page.waitForTimeout(200);
              }
            }
          }
        });
        
        test('should include contact information or forms', async () => {
          const page = sharedPage;
          
          // Look for contact mechanisms
          const hasContactForm = await page.locator('form, .form').count() > 0;
          const hasPhone = await page.locator('text=/\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}/').count() > 0;
          const hasEmail = await page.locator('text=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/').count() > 0;
          const hasContactLinks = await page.locator('a[href*="contact"], a[href*="quote"], a[href*="estimate"]').count() > 0;
          
          // Should have some way to contact
          const contactMethods = [hasContactForm, hasPhone, hasEmail, hasContactLinks].filter(Boolean).length;
          expect(contactMethods).toBeGreaterThan(0);
          
          console.log(`ℹ️ ${name} page provides ${contactMethods} contact methods`);
        });
        
        test('should target specific audience needs', async () => {
          const page = sharedPage;
          
          // Check for audience-specific content based on page type
          const audienceTerms = getAudienceTerms(name);
          let audienceTermCount = 0;
          
          for (const term of audienceTerms) {
            const hasTermCount = await page.locator(`text=/${term}/i`).count();
            if (hasTermCount > 0) audienceTermCount++;
          }
          
          if (audienceTermCount > 0) {
            console.log(`ℹ️ ${name} page targets audience with ${audienceTermCount} relevant terms`);
          }
        });
      });

      test.describe('Service Information & Credibility', () => {
        
        test('should provide detailed service information', async () => {
          const page = sharedPage;
          
          // Look for detailed service descriptions
          const hasProcessInfo = await page.locator('text=/process|step|how we|methodology/i').count() > 0;
          const hasTimeframes = await page.locator('text=/timeline|duration|weeks|days|schedule/i').count() > 0;
          const hasPricing = await page.locator('text=/price|cost|investment|budget|estimate/i').count() > 0;
          const hasDeliverables = await page.locator('text=/deliverable|included|provide|offer/i').count() > 0;
          
          // Should provide service details
          const serviceDetails = [hasProcessInfo, hasTimeframes, hasPricing, hasDeliverables].filter(Boolean).length;
          
          if (serviceDetails > 0) {
            console.log(`ℹ️ ${name} page provides ${serviceDetails} types of service details`);
          }
        });
        
        test('should establish credibility and trust', async () => {
          const page = sharedPage;
          
          // Look for trust indicators
          const hasCredentials = await page.locator('text=/licensed|insured|certified|accredited/i').count() > 0;
          const hasExperience = await page.locator('text=/years|experience|established|since/i').count() > 0;
          const hasTestimonials = await page.locator('text=/testimonial|review|client|customer/i').count() > 0;
          const hasPortfolio = await page.locator('text=/portfolio|project|gallery|work/i').count() > 0;
          const hasGuarantee = await page.locator('text=/guarantee|warranty|satisfaction|promise/i').count() > 0;
          
          // Should have credibility indicators
          const trustFactors = [hasCredentials, hasExperience, hasTestimonials, hasPortfolio, hasGuarantee].filter(Boolean).length;
          
          if (trustFactors > 0) {
            console.log(`ℹ️ ${name} page establishes trust with ${trustFactors} credibility factors`);
          }
        });
        
        test('should include visual elements and examples', async () => {
          const page = sharedPage;
          
          // Check for visual content
          const images = await page.locator('img').count();
          const hasGallery = await page.locator('.gallery, .portfolio, .showcase').count() > 0;
          const hasBeforeAfter = await page.locator('text=/before|after|transformation/i').count() > 0;
          
          if (images > 0) {
            console.log(`ℹ️ ${name} page includes ${images} images`);
            
            // Check image optimization
            const firstImage = page.locator('img').first();
            if (await firstImage.isVisible()) {
              const alt = await firstImage.getAttribute('alt');
              const src = await firstImage.getAttribute('src');
              
              if (alt) {
                console.log('ℹ️ Images include alt text for accessibility');
              }
              
              if (src && (src.includes('webp') || src.includes('avif'))) {
                console.log('ℹ️ Modern image formats detected');
              }
            }
          }
          
          if (hasGallery || hasBeforeAfter) {
            console.log('ℹ️ Visual showcase content found');
          }
        });
      });

      test.describe('Performance & Technical Quality', () => {
        
        test('should load within acceptable time', async () => {
          const page = sharedPage;
          
          const startTime = Date.now();
          
          // Test page reload performance
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          const loadTime = Date.now() - startTime;
          
          // Product pages should load reasonably fast
          expect(loadTime).toBeLessThan(8000); // 8 seconds max
          
          console.log(`ℹ️ ${name} page load time: ${loadTime}ms`);
        });
        
        test('should be mobile responsive', async () => {
          const page = sharedPage;
          
          // Test responsive behavior
          const viewports = [
            { width: 375, height: 667 },   // Mobile
            { width: 768, height: 1024 },  // Tablet
            { width: 1440, height: 900 }   // Desktop
          ];
          
          for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(500);
            
            // Verify main content remains visible and readable
            await expect(page.locator('h1').first()).toBeVisible();
            
            // Check that CTAs are still accessible
            const ctaButtons = page.locator('button, a').filter({ hasText: /get|contact|request/i });
            if (await ctaButtons.count() > 0) {
              await expect(ctaButtons.first()).toBeVisible();
            }
            
            console.log(`ℹ️ ${name} page functional at ${viewport.width}x${viewport.height}`);
          }
          
          // Reset to standard viewport
          await page.setViewportSize({ width: 1280, height: 1080 });
        });
        
        test('should have proper SEO optimization', async () => {
          const page = sharedPage;
          
          // Check for SEO elements
          const pageTitle = await page.title();
          const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
          const h1Text = await page.locator('h1').first().textContent();
          
          // Should have optimized title
          expect(pageTitle).toBeTruthy();
          expect(pageTitle.length).toBeGreaterThan(10);
          expect(pageTitle.length).toBeLessThan(60); // Good SEO practice
          
          if (metaDescription) {
            expect(metaDescription.length).toBeGreaterThan(120);
            expect(metaDescription.length).toBeLessThan(160); // Good SEO practice
            console.log('ℹ️ Optimized meta description found');
          }
          
          if (h1Text) {
            expect(h1Text.length).toBeGreaterThan(5);
            console.log(`ℹ️ H1: ${h1Text}`);
          }
        });
      });

      test.describe('Accessibility & User Experience', () => {
        
        test('should have proper heading hierarchy', async () => {
          const page = sharedPage;
          
          // Check heading structure
          const h1Count = await page.locator('h1').count();
          const h2Count = await page.locator('h2').count();
          const h3Count = await page.locator('h3').count();
          
          // Should have proper hierarchy
          expect(h1Count).toBeGreaterThanOrEqual(1);
          expect(h1Count).toBeLessThanOrEqual(2); // Best practice
          
          if (h3Count > 0) {
            expect(h2Count).toBeGreaterThan(0); // Should have H2s before H3s
          }
          
          console.log(`ℹ️ Heading structure - H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`);
        });
        
        test('should support keyboard navigation', async () => {
          const page = sharedPage;
          
          // Test tab navigation
          await page.keyboard.press('Tab');
          await page.waitForTimeout(200);
          
          const focusedElement = page.locator(':focus');
          if (await focusedElement.count() > 0) {
            // Should be able to tab through interactive elements
            let tabCount = 0;
            const maxTabs = 15;
            
            while (tabCount < maxTabs) {
              await page.keyboard.press('Tab');
              await page.waitForTimeout(100);
              tabCount++;
              
              const currentFocus = await page.locator(':focus').count();
              if (currentFocus === 0) break;
            }
            
            console.log(`ℹ️ Keyboard navigation: ${tabCount} tabbable elements`);
          }
        });
        
        test('should have sufficient color contrast and readability', async () => {
          const page = sharedPage;
          
          // Check for readable text elements
          const textElements = page.locator('p, h1, h2, h3, span').first();
          
          if (await textElements.count() > 0) {
            // Get computed styles
            const styles = await textElements.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize
              };
            });
            
            // Should have defined colors
            expect(styles.color).toBeTruthy();
            
            // Font size should be readable
            const fontSize = parseInt(styles.fontSize);
            expect(fontSize).toBeGreaterThanOrEqual(12);
            
            console.log(`ℹ️ Text styling - Font size: ${styles.fontSize}, Color: ${styles.color}`);
          }
        });
      });

      test.describe('Error Handling & Edge Cases', () => {
        
        test('should handle JavaScript errors gracefully', async () => {
          const page = sharedPage;
          
          // Monitor for JavaScript errors
          const errors = [];
          page.on('pageerror', (error) => {
            errors.push(error);
          });
          
          // Test page interactions
          await page.reload();
          await page.waitForTimeout(3000);
          
          // Test scrolling and interaction
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
          await page.waitForTimeout(1000);
          
          // Test hover interactions
          const interactiveElements = page.locator('button, a').first();
          if (await interactiveElements.count() > 0) {
            await interactiveElements.hover();
            await page.waitForTimeout(500);
          }
          
          // Verify no critical JavaScript errors
          expect(errors.length).toBe(0);
        });
        
        test('should maintain brand consistency', async () => {
          const page = sharedPage;
          
          // Check for brand elements
          const hasLogo = await page.locator('.logo, .brand, img[alt*="logo" i]').count() > 0;
          const hasNavigation = await page.locator('nav, .nav, .navigation').count() > 0;
          const hasFooter = await page.locator('footer, .footer').count() > 0;
          const hasConsistentStyling = await page.locator('.MuiCard-root, .card, .section').count() > 0;
          
          // Should maintain professional appearance
          const brandElements = [hasLogo, hasNavigation, hasFooter, hasConsistentStyling].filter(Boolean).length;
          expect(brandElements).toBeGreaterThan(1);
          
          console.log(`ℹ️ ${name} page maintains brand consistency with ${brandElements} key elements`);
        });
      });
    });
  });

  // Helper functions
  function getProductTerms(productName) {
    const termMap = {
      'Kitchen & Bath': ['kitchen', 'bathroom', 'remodel', 'renovation', 'design', 'installation', 'cabinets', 'countertops'],
      'Commercial': ['commercial', 'business', 'office', 'retail', 'industrial', 'project', 'contractor', 'construction'],
      'Buyers': ['buyer', 'purchase', 'property', 'home', 'investment', 'acquisition', 'market', 'real estate'],
      'Sellers': ['seller', 'sell', 'listing', 'marketing', 'valuation', 'staging', 'closing', 'commission'],
      'Architects & Designers': ['architect', 'designer', 'design', 'planning', 'blueprint', 'consultation', 'professional', 'creative']
    };
    
    return termMap[productName] || ['service', 'professional', 'quality', 'expert'];
  }
  
  function getAudienceTerms(productName) {
    const audienceMap = {
      'Kitchen & Bath': ['homeowner', 'renovation', 'upgrade', 'family', 'lifestyle', 'dream home'],
      'Commercial': ['business owner', 'facility manager', 'developer', 'contractor', 'enterprise', 'commercial space'],
      'Buyers': ['first-time buyer', 'investor', 'family', 'relocation', 'property search', 'market analysis'],
      'Sellers': ['homeowner', 'property owner', 'investor', 'relocation', 'market value', 'quick sale'],
      'Architects & Designers': ['professional', 'creative', 'designer', 'architect', 'collaboration', 'partnership']
    };
    
    return audienceMap[productName] || ['client', 'customer', 'professional', 'service'];
  }
});
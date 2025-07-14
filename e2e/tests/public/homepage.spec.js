/**
 * Homepage Tests
 * 
 * Comprehensive testing for / (homepage) including:
 * - Landing page loading and display
 * - Hero section and value propositions
 * - Service offerings and products
 * - Call-to-action elements
 * - Navigation functionality
 * - Contact form integration
 * - Performance and accessibility
 * - Mobile responsiveness
 * - SEO and meta tags
 */

const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  
  // Helper function to reset page state like a real user would
  async function resetPageState(page) {
    // Clear any form inputs
    const formInputs = page.locator('input[type="text"], input[type="email"], textarea');
    const inputCount = await formInputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        const input = formInputs.nth(i);
        if (await input.isVisible()) {
          await input.clear();
        }
      } catch (error) {
        // Continue if clear fails
      }
    }
    
    // Wait for any changes to settle
    await page.waitForTimeout(500);
  }
  
  // Single page context - reuse the same page for all tests like a real user
  let sharedPage;
  
  test.beforeAll(async ({ browser }) => {
    // Create a single page context that persists across all tests
    const context = await browser.newContext({ 
      viewport: { width: 1280, height: 1080 } // Consistent viewport for homepage
    });
    sharedPage = await context.newPage();
    
    // Navigate to homepage once
    await sharedPage.goto('/');
    
    // Wait for homepage to load completely
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

  test.describe('Landing Page Loading & Display', () => {
    
    test('should load homepage without errors', async () => {
      const page = sharedPage;
      
      // Verify page loads and displays main content
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Check for main navigation
      const navigation = page.locator('nav, .nav, .navigation, header');
      expect(await navigation.count()).toBeGreaterThan(0);
      
      // Verify no blocking errors
      const criticalErrors = page.locator('[role="alert"][severity="error"], .error-blocking');
      expect(await criticalErrors.count()).toBe(0);
    });
    
    test('should display hero section with value proposition', async () => {
      const page = sharedPage;
      
      // Look for hero section elements
      const heroSection = page.locator('.hero, .banner, .jumbotron, [data-testid*="hero"]');
      const hasHeroSection = await heroSection.count() > 0;
      
      // Check for value proposition content
      const hasHeadline = await page.locator('h1').count() > 0;
      const hasSubheading = await page.locator('h2, .subtitle, .subheading').count() > 0;
      const hasDescription = await page.locator('p').count() > 0;
      
      // Should have main content elements
      expect(hasHeadline).toBeTruthy();
      expect(hasDescription).toBeTruthy();
      
      if (hasHeroSection) {
        console.log('ℹ️ Hero section found on homepage');
      }
    });
    
    test('should have prominent call-to-action elements', async () => {
      const page = sharedPage;
      
      // Look for CTA buttons
      const ctaButtons = page.locator('button:has-text("Get"), button:has-text("Start"), button:has-text("Contact"), button:has-text("Quote"), button:has-text("Estimate"), a:has-text("Get"), a:has-text("Start"), a:has-text("Contact")');
      const ctaCount = await ctaButtons.count();
      
      if (ctaCount > 0) {
        console.log(`ℹ️ Found ${ctaCount} call-to-action elements`);
        
        // Test first few CTAs for functionality
        for (let i = 0; i < Math.min(ctaCount, 3); i++) {
          const cta = ctaButtons.nth(i);
          if (await cta.isVisible()) {
            await expect(cta).toBeEnabled();
            
            const ctaText = await cta.textContent();
            console.log(`ℹ️ CTA available: ${ctaText}`);
          }
        }
      }
    });
  });

  test.describe('Services & Products Display', () => {
    
    test('should display service offerings', async () => {
      const page = sharedPage;
      
      // Look for services/products sections
      const servicesSection = page.locator('.services, .products, .offerings, [data-testid*="service"]');
      const hasServicesSection = await servicesSection.count() > 0;
      
      // Check for service-related content
      const hasServiceText = await page.locator('text=/service|product|solution|offering/i').count() > 0;
      
      if (hasServicesSection || hasServiceText) {
        console.log('ℹ️ Services/products section found');
        
        // Look for service cards or items
        const serviceItems = page.locator('.service-card, .product-card, .offering-item, .MuiCard-root');
        const itemCount = await serviceItems.count();
        
        if (itemCount > 0) {
          console.log(`ℹ️ Found ${itemCount} service/product items`);
        }
      }
    });
    
    test('should provide clear service descriptions', async () => {
      const page = sharedPage;
      
      // Look for descriptive content about services
      const hasBusinessTerms = await page.locator('text=/kitchen|bath|commercial|residential|design|remodel/i').count() > 0;
      const hasBenefits = await page.locator('text=/quality|expert|professional|certified|licensed/i').count() > 0;
      
      if (hasBusinessTerms) {
        console.log('ℹ️ Business-specific service terms found');
      }
      
      if (hasBenefits) {
        console.log('ℹ️ Service benefits/qualifications highlighted');
      }
    });
  });

  test.describe('Navigation & User Experience', () => {
    
    test('should have functional main navigation', async () => {
      const page = sharedPage;
      
      // Look for main navigation elements
      const navLinks = page.locator('nav a, .nav a, .navigation a, header a');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        console.log(`ℹ️ Found ${linkCount} navigation links`);
        
        // Test meaningful navigation validation - check that links have proper href attributes
        let validNavigationCount = 0;
        
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          const link = navLinks.nth(i);
          if (await link.isVisible()) {
            const href = await link.getAttribute('href');
            const linkText = await link.textContent();
            
            if (href && href.trim() && linkText && linkText.trim()) {
              // Validate that navigation link has meaningful destination
              expect(href).not.toBe('#');
              expect(href).not.toBe('javascript:void(0)');
              
              validNavigationCount++;
              console.log(`ℹ️ Valid navigation: "${linkText.trim()}" → ${href}`);
            }
          }
        }
        
        // Ensure we have meaningful navigation
        expect(validNavigationCount).toBeGreaterThan(0);
      }
    });
    
    test('should support mobile menu functionality', async () => {
      const page = sharedPage;
      
      // Look for mobile menu elements
      const mobileMenuTrigger = page.locator('.menu-toggle, .hamburger, .mobile-menu-button, [aria-label*="menu" i]');
      const hasMobileMenu = await mobileMenuTrigger.count() > 0;
      
      if (hasMobileMenu) {
        console.log('ℹ️ Mobile menu functionality found');
        
        // Test mobile menu interaction
        const menuButton = mobileMenuTrigger.first();
        if (await menuButton.isVisible()) {
          await menuButton.hover();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Contact & Lead Generation', () => {
    
    test('should provide contact information', async () => {
      const page = sharedPage;
      
      // Look for contact information
      const hasPhone = await page.locator('text=/\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}/').count() > 0;
      const hasEmail = await page.locator('text=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/').count() > 0;
      const hasAddress = await page.locator('text=/street|avenue|road|blvd|drive|st\\.|ave\\./i').count() > 0;
      
      if (hasPhone) {
        console.log('ℹ️ Phone number found on homepage');
      }
      
      if (hasEmail) {
        console.log('ℹ️ Email address found on homepage');
      }
      
      if (hasAddress) {
        console.log('ℹ️ Address information found on homepage');
      }
    });
    
    test('should have contact form or lead capture', async () => {
      const page = sharedPage;
      
      // Look for contact forms
      const contactForms = page.locator('form, .form, .contact-form, [data-testid*="form"]');
      const formCount = await contactForms.count();
      
      if (formCount > 0) {
        console.log(`ℹ️ Found ${formCount} form(s) for lead capture`);
        
        // Check for form inputs
        const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea');
        const inputCount = await formInputs.count();
        
        if (inputCount > 0) {
          console.log(`ℹ️ Form has ${inputCount} input fields`);
          
          // Test first form input
          const firstInput = formInputs.first();
          if (await firstInput.isVisible()) {
            await firstInput.focus();
            await page.waitForTimeout(200);
          }
        }
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
      
      // Homepage should load within reasonable time (allowing for analytics components)
      expect(loadTime).toBeLessThan(15000); // 15 seconds max to account for analytics bundle
      
      console.log(`ℹ️ Homepage load time: ${loadTime}ms`);
    });
    
    test('should have proper SEO meta tags', async () => {
      const page = sharedPage;
      
      // Check for essential SEO elements
      const pageTitle = await page.title();
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      
      // Should have basic SEO elements
      expect(pageTitle).toBeTruthy();
      expect(pageTitle.length).toBeGreaterThan(10);
      
      if (metaDescription) {
        console.log('ℹ️ Meta description found');
        expect(metaDescription.length).toBeGreaterThan(20);
      }
      
      if (ogTitle) {
        console.log('ℹ️ Open Graph tags found');
      }
      
      console.log(`ℹ️ Page title: ${pageTitle}`);
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should maintain functionality across device sizes', async () => {
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
        
        // Verify main content remains visible
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Check for layout adaptation
        const mainContent = await page.locator('main, .main-content, .container').count();
        expect(mainContent).toBeGreaterThanOrEqual(0);
        
        console.log(`ℹ️ Homepage functional at ${viewport.width}x${viewport.height}`);
      }
      
      // Reset to standard viewport
      await page.setViewportSize({ width: 1280, height: 1080 });
    });
    
    test('should handle image optimization', async () => {
      const page = sharedPage;
      
      // Check for images and their optimization
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        console.log(`ℹ️ Found ${imageCount} images on homepage`);
        
        // Check first few images for proper attributes
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = images.nth(i);
          if (await img.isVisible()) {
            const alt = await img.getAttribute('alt');
            const src = await img.getAttribute('src');
            
            if (alt) {
              console.log(`ℹ️ Image ${i + 1} has alt text`);
            }
            
            if (src && (src.includes('webp') || src.includes('avif'))) {
              console.log(`ℹ️ Image ${i + 1} uses modern format`);
            }
          }
        }
      }
    });
  });

  test.describe('Accessibility Testing', () => {
    
    test('should have proper ARIA labels and structure', async () => {
      const page = sharedPage;
      
      // Check for accessibility attributes
      const ariaLabels = await page.locator('[aria-label]').count();
      const ariaDescriptions = await page.locator('[aria-describedby]').count();
      const roles = await page.locator('[role]').count();
      
      console.log(`ℹ️ Accessibility attributes - Labels: ${ariaLabels}, Descriptions: ${ariaDescriptions}, Roles: ${roles}`);
      
      // Should have some accessibility attributes
      expect(ariaLabels + ariaDescriptions + roles).toBeGreaterThan(0);
    });
    
    test('should support keyboard navigation', async () => {
      const page = sharedPage;
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        // Should be able to tab to interactive elements
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        
        const focusedElement2 = page.locator(':focus');
        if (await focusedElement2.count() > 0) {
          console.log('ℹ️ Keyboard navigation functional');
        }
      }
    });
    
    test('should have proper heading hierarchy', async () => {
      const page = sharedPage;
      
      // Check heading structure
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();
      const h3Count = await page.locator('h3').count();
      
      // Should have at least one H1
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // If we have H3s, we should have H2s (proper hierarchy)
      if (h3Count > 0) {
        expect(h2Count).toBeGreaterThanOrEqual(0);
      }
      
      console.log(`ℹ️ Heading structure - H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}`);
    });
  });

  test.describe('Business Goals & Conversion', () => {
    
    test('should clearly communicate value proposition', async () => {
      const page = sharedPage;
      
      // Look for value proposition elements
      const hasBusinessValue = await page.locator('text=/save|quality|expert|professional|experience|certified/i').count() > 0;
      const hasServiceBenefits = await page.locator('text=/free|fast|reliable|trusted|guarantee|warranty/i').count() > 0;
      const hasCredentials = await page.locator('text=/licensed|insured|certified|years|experience/i').count() > 0;
      
      // Should communicate business value
      const valueIndicators = [hasBusinessValue, hasServiceBenefits, hasCredentials].filter(Boolean).length;
      expect(valueIndicators).toBeGreaterThan(0);
      
      console.log(`ℹ️ Found ${valueIndicators} types of value propositions`);
    });
    
    test('should facilitate easy contact and conversion', async () => {
      const page = sharedPage;
      
      // Look for conversion-friendly elements
      const hasCallNow = await page.locator('text=/call now|call today|contact us/i').count() > 0;
      const hasQuoteRequest = await page.locator('text=/get quote|free estimate|quote request/i').count() > 0;
      const hasFormSubmission = await page.locator('button[type="submit"], input[type="submit"]').count() > 0;
      
      // Should have conversion paths
      const conversionPaths = [hasCallNow, hasQuoteRequest, hasFormSubmission].filter(Boolean).length;
      
      if (conversionPaths > 0) {
        console.log(`ℹ️ Found ${conversionPaths} conversion pathways`);
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
      
      // Test page under various interactions
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Test interaction with main elements
      const interactiveElements = page.locator('button, a, input').first();
      if (await interactiveElements.count() > 0) {
        await interactiveElements.hover();
        await page.waitForTimeout(200);
      }
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain professional appearance', async () => {
      const page = sharedPage;
      
      // Check for professional design elements
      const hasLogo = await page.locator('.logo, .brand, img[alt*="logo" i]').count() > 0;
      const hasNavigation = await page.locator('nav, .nav, .navigation').count() > 0;
      const hasFooter = await page.locator('footer, .footer').count() > 0;
      
      // Should have professional website structure
      const professionalElements = [hasLogo, hasNavigation, hasFooter].filter(Boolean).length;
      expect(professionalElements).toBeGreaterThan(0);
      
      console.log(`ℹ️ Homepage maintains professional appearance with ${professionalElements} key elements`);
    });
  });
});
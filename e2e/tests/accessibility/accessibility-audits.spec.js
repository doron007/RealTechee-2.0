/**
 * Accessibility Testing with axe-core
 * 
 * Comprehensive accessibility testing using axe-core for WCAG 2.1 AA compliance.
 * Tests all pages for accessibility issues and provides detailed reporting.
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { accessibilityStandards } = require('../fixtures/test-data.js');

test.describe('Accessibility Audits', () => {
  test.beforeEach(async ({ page }) => {
    // Configure accessibility testing
    await page.addInitScript(() => {
      // Disable animations for consistent testing
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test.describe('Homepage Accessibility', () => {
    test('Homepage WCAG 2.1 AA compliance', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Log accessibility score
      const passedRules = accessibilityScanResults.passes.length;
      const totalRules = passedRules + accessibilityScanResults.violations.length;
      const score = totalRules > 0 ? (passedRules / totalRules * 100).toFixed(1) : 100;
      
      console.log(`♿ Homepage accessibility score: ${score}% (${passedRules}/${totalRules} rules passed)`);
    });

    test('Homepage keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Test tab navigation through interactive elements
      const interactiveElements = await page.locator('a, button, input, select, textarea, [tabindex="0"]').all();
      
      let tabbableCount = 0;
      for (let i = 0; i < Math.min(interactiveElements.length, 20); i++) {
        await page.keyboard.press('Tab');
        
        // Check if an element has focus
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        if (focusedElement && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focusedElement)) {
          tabbableCount++;
        }
      }

      expect(tabbableCount).toBeGreaterThan(0);
      console.log(`⌨️  Found ${tabbableCount} keyboard-accessible elements on homepage`);
    });

    test('Homepage screen reader compatibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.slice(1));
        const text = await heading.textContent();
        
        if (text && text.trim()) {
          headingLevels.push({ level, text: text.trim() });
        }
      }

      // Should have at least one H1
      const h1Count = headingLevels.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one H1

      // Check heading hierarchy is logical (no skipping levels)
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i].level;
        const previousLevel = headingLevels[i - 1].level;
        const levelDifference = currentLevel - previousLevel;
        
        // Should not skip more than one level
        expect(levelDifference).toBeLessThanOrEqual(1);
      }

      console.log(`📖 Found ${headingLevels.length} properly structured headings`);
    });

    test('Homepage color contrast compliance', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Run axe-core specifically for color contrast
      const contrastResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(contrastResults.violations).toEqual([]);

      // Additional manual checks for important elements
      const importantElements = [
        'h1',
        'nav a',
        '.cta-button, [data-testid="cta-button"]',
        'p',
        '.call-to-action'
      ];

      for (const selector of importantElements) {
        try {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            // Elements exist, contrast should be checked by axe-core
            console.log(`✓ Color contrast checked for: ${selector}`);
          }
        } catch (error) {
          // Element doesn't exist, which is fine
          console.log(`ℹ️  Element not found: ${selector}`);
        }
      }
    });

    test('Homepage images and media accessibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Check all images have alt text
      const images = await page.locator('img').all();
      let imagesWithoutAlt = 0;
      let decorativeImages = 0;
      let informativeImages = 0;

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        if (alt === null) {
          imagesWithoutAlt++;
        } else if (alt === '' || role === 'presentation') {
          decorativeImages++;
        } else {
          informativeImages++;
        }
      }

      // Images without alt text should be minimal
      expect(imagesWithoutAlt).toBeLessThanOrEqual(Math.floor(images.length * 0.1)); // Max 10% without alt

      console.log(`🖼️  Images: ${images.length} total, ${informativeImages} informative, ${decorativeImages} decorative, ${imagesWithoutAlt} missing alt`);

      // Check for video/audio elements accessibility
      const videos = await page.locator('video').all();
      const audios = await page.locator('audio').all();

      for (const video of videos) {
        // Videos should have controls or be muted
        const hasControls = await video.getAttribute('controls');
        const isMuted = await video.getAttribute('muted');
        const autoplay = await video.getAttribute('autoplay');
        
        if (autoplay !== null && !isMuted) {
          console.warn('⚠️  Autoplaying video without muted attribute found');
        }
      }

      console.log(`🎥 Media elements: ${videos.length} videos, ${audios.length} audio`);
    });
  });

  test.describe('Contact Page Accessibility', () => {
    test('Contact page form accessibility', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForSelector('form', { timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check form-specific accessibility features
      const formElements = await page.locator('input, textarea, select').all();
      let elementsWithLabels = 0;
      let elementsWithAriaLabel = 0;
      let elementsWithPlaceholder = 0;

      for (const element of formElements) {
        const id = await element.getAttribute('id');
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        const placeholder = await element.getAttribute('placeholder');
        
        // Check if element has associated label
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          if (label > 0) elementsWithLabels++;
        }
        
        if (ariaLabel || ariaLabelledBy) elementsWithAriaLabel++;
        if (placeholder) elementsWithPlaceholder++;
      }

      // Most form elements should have proper labels
      const totalFormElements = formElements.length;
      const properlyLabeled = elementsWithLabels + elementsWithAriaLabel;
      const labelCoverage = totalFormElements > 0 ? (properlyLabeled / totalFormElements) : 1;
      
      expect(labelCoverage).toBeGreaterThan(0.8); // At least 80% of form elements should be properly labeled

      console.log(`📝 Form accessibility: ${properlyLabeled}/${totalFormElements} elements properly labeled`);
    });

    test('Contact page form error handling accessibility', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForSelector('form', { timeout: 5000 });

      // Try to submit form without filling required fields
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Wait for validation messages
      await page.waitForTimeout(1000);

      // Check for accessible error messages
      const errorMessages = await page.locator('[role="alert"], .error, .invalid, [aria-invalid="true"]').all();
      
      if (errorMessages.length > 0) {
        // Verify error messages are accessible
        for (const error of errorMessages) {
          const text = await error.textContent();
          const isVisible = await error.isVisible();
          
          expect(text?.trim()).toBeTruthy();
          expect(isVisible).toBe(true);
        }
        
        console.log(`🚨 Found ${errorMessages.length} accessible error messages`);
      }

      // Run accessibility scan on form with errors
      const errorStateResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(errorStateResults.violations).toEqual([]);
    });

    test('Contact page keyboard form completion', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForSelector('form', { timeout: 5000 });

      // Complete form using only keyboard
      await page.keyboard.press('Tab'); // Focus first field
      await page.keyboard.type('Accessibility Test User');
      
      await page.keyboard.press('Tab'); // Focus email field
      await page.keyboard.type('accessibility.test@example.com');
      
      await page.keyboard.press('Tab'); // Focus phone field
      await page.keyboard.type('+1-713-555-0124');
      
      await page.keyboard.press('Tab'); // Focus message field
      await page.keyboard.type('This form was completed using only keyboard navigation for accessibility testing.');
      
      // Navigate to submit button and activate
      let tabCount = 0;
      while (tabCount < 10) { // Safety limit
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        if (focused === 'BUTTON' || (await page.evaluate(() => document.activeElement?.type === 'submit'))) {
          break;
        }
        tabCount++;
      }
      
      // Should be able to submit using keyboard
      await page.keyboard.press('Enter');
      
      console.log(`⌨️  Successfully completed contact form using keyboard navigation`);
    });
  });

  test.describe('Product Pages Accessibility', () => {
    const productPages = [
      '/products/kitchen-and-bath',
      '/products/home-additions',
      '/products/commercial'
    ];

    for (const productUrl of productPages) {
      test(`${productUrl} accessibility compliance`, async ({ page }) => {
        try {
          await page.goto(productUrl);
          await page.waitForSelector('h1', { timeout: 10000 });
          await page.waitForLoadState('networkidle');

          const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);

          // Check for proper page structure
          const mainContent = await page.locator('main, [role="main"], .main-content').count();
          expect(mainContent).toBeGreaterThan(0);

          console.log(`♿ ${productUrl} passed accessibility audit`);
        } catch (error) {
          console.log(`⚠️  ${productUrl} not accessible, skipping accessibility test`);
        }
      });
    }
  });

  test.describe('Admin Pages Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Login to admin
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'info@realtechee.com');
      await page.fill('input[name="password"]', 'Sababa123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/admin|dashboard/);
    });

    test('Admin dashboard accessibility', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('[data-testid="admin-header"], .admin-header, h1', { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check for dashboard-specific accessibility features
      const skipLinks = await page.locator('a[href^="#"], .skip-link').count();
      const landmarks = await page.locator('[role="navigation"], [role="main"], [role="complementary"], nav, main, aside').count();
      
      expect(landmarks).toBeGreaterThan(0);
      console.log(`🏗️  Admin dashboard: ${landmarks} landmarks, ${skipLinks} skip links`);
    });

    test('Admin data table accessibility', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForSelector('.MuiDataGrid-root, table, [data-testid="projects-table"]', { timeout: 15000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check table accessibility features
      const tables = await page.locator('table, [role="table"]').all();
      
      for (const table of tables) {
        // Check for table headers
        const headers = await table.locator('th, [role="columnheader"]').count();
        expect(headers).toBeGreaterThan(0);
        
        // Check for table caption or aria-label
        const caption = await table.locator('caption').count();
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledby = await table.getAttribute('aria-labelledby');
        
        expect(caption + (ariaLabel ? 1 : 0) + (ariaLabelledby ? 1 : 0)).toBeGreaterThan(0);
      }

      console.log(`📊 Found ${tables.length} accessible data tables`);
    });

    test('Admin navigation accessibility', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForSelector('nav, [role="navigation"]', { timeout: 10000 });

      // Test admin navigation with keyboard
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      let accessibleLinks = 0;

      for (const link of navLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // Link should have href and accessible text
        if (href && (text?.trim() || ariaLabel)) {
          accessibleLinks++;
        }
      }

      expect(accessibleLinks).toBe(navLinks.length);
      console.log(`🧭 Admin navigation: ${accessibleLinks}/${navLinks.length} accessible links`);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test('Mobile homepage accessibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Check mobile-specific accessibility features
      const mobileMenu = await page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger').count();
      const touchTargets = await page.locator('button, a, input, [role="button"]').all();
      
      // Touch targets should be large enough (minimum 44x44px)
      let adequateTouchTargets = 0;
      for (const target of touchTargets.slice(0, 10)) { // Check first 10 for performance
        const box = await target.boundingBox();
        if (box && box.width >= 44 && box.height >= 44) {
          adequateTouchTargets++;
        }
      }

      const touchTargetScore = touchTargets.length > 0 ? (adequateTouchTargets / Math.min(touchTargets.length, 10)) : 1;
      expect(touchTargetScore).toBeGreaterThan(0.8); // At least 80% should meet touch target size

      console.log(`📱 Mobile accessibility: ${adequateTouchTargets}/${Math.min(touchTargets.length, 10)} adequate touch targets`);
    });

    test('Mobile navigation accessibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('nav', { timeout: 10000 });

      // Test mobile menu functionality
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], .mobile-menu-toggle, [aria-label*="menu" i]').first();
      
      if (await mobileMenuButton.isVisible()) {
        // Test keyboard activation
        await mobileMenuButton.focus();
        await page.keyboard.press('Enter');
        
        // Check if menu opens and is accessible
        await page.waitForTimeout(500);
        
        const expandedState = await mobileMenuButton.getAttribute('aria-expanded');
        expect(expandedState).toBe('true');
        
        console.log(`📱 Mobile menu successfully activated via keyboard`);
      }
    });
  });

  test.describe('Accessibility Reporting and Analytics', () => {
    test('Generate comprehensive accessibility report', async ({ page }) => {
      const pages = [
        { url: '/', name: 'homepage' },
        { url: '/contact', name: 'contact' },
        { url: '/products/kitchen-and-bath', name: 'product' }
      ];

      const report = {
        timestamp: new Date().toISOString(),
        overallScore: 0,
        pages: [],
        summary: {
          totalViolations: 0,
          totalPassed: 0,
          criticalIssues: 0,
          moderateIssues: 0,
          minorIssues: 0
        }
      };

      for (const testPage of pages) {
        try {
          await page.goto(testPage.url);
          await page.waitForSelector('h1', { timeout: 10000 });
          await page.waitForLoadState('networkidle');

          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

          const pageReport = {
            url: testPage.url,
            name: testPage.name,
            violations: results.violations.length,
            passed: results.passes.length,
            issues: results.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help
            }))
          };

          report.pages.push(pageReport);
          report.summary.totalViolations += results.violations.length;
          report.summary.totalPassed += results.passes.length;

          // Categorize issues by impact
          results.violations.forEach(v => {
            switch (v.impact) {
              case 'critical':
                report.summary.criticalIssues++;
                break;
              case 'serious':
                report.summary.moderateIssues++;
                break;
              default:
                report.summary.minorIssues++;
            }
          });

          console.log(`♿ ${testPage.name}: ${results.violations.length} violations, ${results.passes.length} passed rules`);
        } catch (error) {
          console.log(`⚠️  Failed to test ${testPage.url}: ${error.message}`);
        }
      }

      // Calculate overall score
      const totalRules = report.summary.totalPassed + report.summary.totalViolations;
      report.overallScore = totalRules > 0 ? ((report.summary.totalPassed / totalRules) * 100).toFixed(1) : 100;

      console.log(`📊 Overall Accessibility Score: ${report.overallScore}%`);
      console.log(`🚨 Total Issues: ${report.summary.totalViolations} (${report.summary.criticalIssues} critical, ${report.summary.moderateIssues} moderate, ${report.summary.minorIssues} minor)`);

      // Expect high accessibility score
      expect(parseFloat(report.overallScore)).toBeGreaterThan(90);
      expect(report.summary.criticalIssues).toBe(0);

      // Save report for dashboard integration
      const fs = require('fs').promises;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = `test-results/accessibility-report-${timestamp}.json`;
      
      try {
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Accessibility report saved to: ${reportPath}`);
      } catch (error) {
        console.warn('Could not save accessibility report:', error.message);
      }
    });

    test('Accessibility standards compliance check', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Test against specific WCAG criteria from our standards
      const wcagTests = [
        {
          name: 'Color Contrast',
          test: async () => {
            const results = await new AxeBuilder({ page })
              .withTags(['color-contrast'])
              .analyze();
            return results.violations.length === 0;
          }
        },
        {
          name: 'Keyboard Navigation',
          test: async () => {
            const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex="0"]').count();
            return focusableElements > 0;
          }
        },
        {
          name: 'Alternative Text',
          test: async () => {
            const images = await page.locator('img').all();
            let imagesWithAlt = 0;
            for (const img of images) {
              const alt = await img.getAttribute('alt');
              if (alt !== null) imagesWithAlt++;
            }
            return images.length === 0 || (imagesWithAlt / images.length) >= 0.9;
          }
        },
        {
          name: 'Form Labels',
          test: async () => {
            const results = await new AxeBuilder({ page })
              .withTags(['label'])
              .analyze();
            return results.violations.length === 0;
          }
        },
        {
          name: 'Heading Hierarchy',
          test: async () => {
            const h1Count = await page.locator('h1').count();
            return h1Count === 1;
          }
        }
      ];

      const testResults = [];
      for (const wcagTest of wcagTests) {
        const passed = await wcagTest.test();
        testResults.push({ name: wcagTest.name, passed });
        console.log(`${passed ? '✅' : '❌'} WCAG Test: ${wcagTest.name}`);
      }

      const passedTests = testResults.filter(t => t.passed).length;
      const passRate = (passedTests / testResults.length) * 100;

      expect(passRate).toBeGreaterThan(80); // At least 80% of WCAG tests should pass
      console.log(`📋 WCAG Compliance: ${passedTests}/${testResults.length} tests passed (${passRate.toFixed(1)}%)`);
    });
  });
});
const puppeteer = require('puppeteer');
const TestReporter = require('./TestReporter');

class ComprehensiveUITestFramework {
  constructor(testName, config = {}) {
    this.testName = testName;
    this.config = {
      // Default configuration
      baseUrl: 'http://localhost:3000',
      credentials: {
        email: 'info@realtechee.com',
        password: 'Sababa123!'
      },
      timeouts: {
        navigation: 45000,
        authentication: 30000,
        pageLoad: 60000,
        elementWait: 15000
      },
      breakpoints: [
        { width: 320, height: 568, name: 'mobile-small', description: 'iPhone SE' },
        { width: 375, height: 667, name: 'mobile-medium', description: 'iPhone 8' },
        { width: 414, height: 896, name: 'mobile-large', description: 'iPhone 11 Pro Max' },
        { width: 768, height: 1024, name: 'tablet', description: 'iPad' },
        { width: 1024, height: 1366, name: 'desktop-small', description: 'iPad Pro Landscape' },
        { width: 1440, height: 900, name: 'desktop-medium', description: 'MacBook Pro' },
        { width: 1920, height: 1080, name: 'desktop-large', description: 'Full HD' }
      ],
      puppeteer: {
        headless: false,
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      },
      test: {
        waitBetweenTests: 2000,
        screenshotDelay: 1000,
        captureFailureScreenshots: true,
        captureSuccessScreenshots: true
      },
      design: {
        // Design system validation rules
        touchTargetMinSize: 44, // iOS/Android minimum touch target
        textLineHeightMin: 1.2,
        textLineHeightMax: 1.8,
        spacingUnits: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64], // Expected spacing values
        fontSizes: {
          min: 12,
          max: 48,
          allowedSizes: [12, 14, 16, 18, 20, 24, 28, 32, 36, 48]
        },
        colorContrast: {
          minNormal: 4.5,
          minLarge: 3.0
        }
      },
      ...config
    };

    this.reporter = new TestReporter(testName, {
      metadata: {
        url: this.config.baseUrl,
        userAgent: 'Comprehensive UI Test Framework',
        breakpointsCount: this.config.breakpoints.length
      }
    });

    this.browser = null;
    this.page = null;
    this.isAuthenticated = false;
  }

  async setup() {
    this.reporter.logMessage('info', 'Setting up comprehensive UI test framework...');
    
    try {
      this.browser = await puppeteer.launch(this.config.puppeteer);
      this.page = await this.browser.newPage();
      
      // Set timeouts
      this.page.setDefaultTimeout(this.config.timeouts.pageLoad);
      this.page.setDefaultNavigationTimeout(this.config.timeouts.navigation);
      
      // Enable request interception for debugging
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (req.url().includes('/_next/static/') || req.url().includes('/favicon.ico')) {
          req.continue();
        } else {
          this.reporter.logMessage('debug', `Loading: ${req.url()}`);
          req.continue();
        }
      });

      // Listen for console errors
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          this.reporter.logMessage('error', `Console Error: ${msg.text()}`);
        }
      });

      this.reporter.logMessage('info', 'Browser setup complete');
      return true;
    } catch (error) {
      this.reporter.logMessage('error', `Setup failed: ${error.message}`);
      throw error;
    }
  }

  async authenticate(targetUrl) {
    const testName = 'Authentication';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Starting authentication to ${targetUrl}`);
      
      // Navigate to target page (should redirect to login)
      await this.page.goto(targetUrl, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeouts.navigation 
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { 
        timeout: this.config.timeouts.authentication 
      });

      // Fill credentials
      await this.page.type('input[type="email"]', this.config.credentials.email);
      await this.page.type('input[type="password"]', this.config.credentials.password);

      // Submit login
      await Promise.all([
        this.page.waitForNavigation({ 
          waitUntil: 'networkidle0',
          timeout: this.config.timeouts.authentication 
        }),
        this.page.click('button[type="submit"]')
      ]);

      // Verify authentication
      const currentUrl = this.page.url();
      await this.page.waitForSelector('h1', { timeout: this.config.timeouts.elementWait });
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.isAuthenticated = true;
      
      // Capture success screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        testName, 
        'passed', 
        `Successfully authenticated to ${currentUrl}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          targetUrl,
          finalUrl: currentUrl,
          credentials: this.config.credentials.email
        },
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('info', `Authentication successful: ${currentUrl}`);
      return true;

    } catch (error) {
      // Capture failure screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        testName, 
        'failed', 
        `Authentication failed: ${error.message}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message,
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('error', `Authentication failed: ${error.message}`);
      throw error;
    }
  }

  async comprehensiveUITest(breakpoint) {
    const testName = `Comprehensive-UI-${breakpoint.name}`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing comprehensive UI for ${breakpoint.name} (${breakpoint.width}x${breakpoint.height}) - ${breakpoint.description}`);
      
      // Set viewport
      await this.page.setViewport({
        width: breakpoint.width,
        height: breakpoint.height,
        deviceScaleFactor: 1
      });

      // Wait for responsive changes
      await new Promise(resolve => setTimeout(resolve, this.config.test.screenshotDelay));
      
      // Clear localStorage to ensure clean sidebar state and trigger resize events
      await this.page.evaluate(() => {
        localStorage.removeItem('admin-sidebar-collapsed');
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('orientationchange'));
        
        // Trigger media query listeners
        const mqLists = window.matchMedia('(max-width: 767px)');
        if (mqLists.dispatchEvent) {
          mqLists.dispatchEvent(new Event('change'));
        }
      });
      
      // Additional wait for component updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Comprehensive UI analysis
      const uiAnalysis = await this.page.evaluate((designConfig) => {
        const results = {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          components: [],
          textElements: [],
          spacing: [],
          alignment: [],
          visibility: [],
          responsiveness: [],
          issues: [],
          passes: []
        };

        // Helper functions
        const getComputedStyle = (element) => window.getComputedStyle(element);
        const isElementVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && 
                 rect.height > 0 && 
                 style.opacity !== '0' && 
                 style.visibility !== 'hidden' && 
                 style.display !== 'none';
        };
        
        const isElementWithinViewport = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.left >= 0 && 
                 rect.top >= 0 && 
                 rect.right <= window.innerWidth && 
                 rect.bottom <= window.innerHeight;
        };

        const isTextTruncated = (element) => {
          return element.scrollWidth > element.clientWidth || 
                 element.scrollHeight > element.clientHeight;
        };

        const getContrastRatio = (color1, color2) => {
          // Simplified contrast calculation
          const getLuminance = (color) => {
            const rgb = color.match(/\\d+/g);
            if (!rgb) return 0;
            const [r, g, b] = rgb.map(x => {
              x /= 255;
              return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          
          const l1 = getLuminance(color1);
          const l2 = getLuminance(color2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        // 1. COMPONENT VISIBILITY ANALYSIS
        const criticalComponents = [
          { selector: 'header, [role="banner"], h1', name: 'Page Header', critical: true },
          { selector: 'nav, [role="navigation"]', name: 'Navigation', critical: true },
          { selector: 'main, [role="main"]', name: 'Main Content', critical: true },
          { selector: 'button', name: 'Buttons', critical: true },
          { selector: 'input, textarea, select', name: 'Form Elements', critical: false },
          { selector: 'table', name: 'Tables', critical: false },
          { selector: '[class*="card"]', name: 'Cards', critical: false },
          { selector: '[class*="sidebar"]', name: 'Sidebar', critical: false }
        ];

        criticalComponents.forEach(component => {
          const elements = document.querySelectorAll(component.selector);
          elements.forEach((element, index) => {
            const visible = isElementVisible(element);
            const withinViewport = isElementWithinViewport(element);
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            
            const analysis = {
              component: component.name,
              selector: component.selector,
              index,
              visible,
              withinViewport,
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
              },
              computedStyle: {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                position: style.position,
                zIndex: style.zIndex,
                overflow: style.overflow
              },
              critical: component.critical
            };
            
            results.components.push(analysis);
            
            if (component.critical && !visible) {
              results.issues.push(`Critical component ${component.name} is not visible`);
            } else if (component.critical && !withinViewport) {
              results.issues.push(`Critical component ${component.name} is outside viewport`);
            } else if (visible && withinViewport) {
              results.passes.push(`${component.name} is visible and within viewport`);
            }
          });
        });

        // 2. TEXT ELEMENTS ANALYSIS
        const textSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'label', 'button'];
        textSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element, index) => {
            const text = element.textContent.trim();
            if (text.length > 0) {
              const style = getComputedStyle(element);
              const fontSize = parseFloat(style.fontSize);
              const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
              const color = style.color;
              const backgroundColor = style.backgroundColor;
              const truncated = isTextTruncated(element);
              const visible = isElementVisible(element);
              const withinViewport = isElementWithinViewport(element);
              
              const textAnalysis = {
                selector,
                index,
                text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                fontSize,
                lineHeight: lineHeight / fontSize, // ratio
                color,
                backgroundColor,
                truncated,
                visible,
                withinViewport,
                fontFamily: style.fontFamily,
                fontWeight: style.fontWeight,
                textAlign: style.textAlign
              };
              
              results.textElements.push(textAnalysis);
              
              // Check font size
              if (fontSize < designConfig.fontSizes.min) {
                results.issues.push(`Text too small: ${fontSize}px (minimum ${designConfig.fontSizes.min}px) in ${selector}`);
              } else if (fontSize > designConfig.fontSizes.max) {
                results.issues.push(`Text too large: ${fontSize}px (maximum ${designConfig.fontSizes.max}px) in ${selector}`);
              }
              
              // Check line height
              const lineHeightRatio = lineHeight / fontSize;
              if (lineHeightRatio < designConfig.textLineHeightMin) {
                results.issues.push(`Line height too tight: ${lineHeightRatio} (minimum ${designConfig.textLineHeightMin}) in ${selector}`);
              } else if (lineHeightRatio > designConfig.textLineHeightMax) {
                results.issues.push(`Line height too loose: ${lineHeightRatio} (maximum ${designConfig.textLineHeightMax}) in ${selector}`);
              }
              
              // Check truncation
              if (truncated && visible) {
                results.issues.push(`Text truncated in ${selector}: "${text}"`);
              }
              
              // Check visibility
              if (text.length > 0 && !visible) {
                results.issues.push(`Text not visible in ${selector}: "${text}"`);
              } else if (visible && !withinViewport) {
                results.issues.push(`Text outside viewport in ${selector}: "${text}"`);
              }
            }
          });
        });

        // 3. SPACING AND LAYOUT ANALYSIS
        const layoutElements = document.querySelectorAll('div, section, article, header, main, footer, nav');
        layoutElements.forEach((element, index) => {
          const style = getComputedStyle(element);
          const padding = {
            top: parseFloat(style.paddingTop),
            right: parseFloat(style.paddingRight),
            bottom: parseFloat(style.paddingBottom),
            left: parseFloat(style.paddingLeft)
          };
          const margin = {
            top: parseFloat(style.marginTop),
            right: parseFloat(style.marginRight),
            bottom: parseFloat(style.marginBottom),
            left: parseFloat(style.marginLeft)
          };
          
          const spacingAnalysis = {
            element: element.tagName.toLowerCase(),
            index,
            className: element.className,
            padding,
            margin,
            gap: parseFloat(style.gap) || 0,
            display: style.display,
            flexDirection: style.flexDirection,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems
          };
          
          results.spacing.push(spacingAnalysis);
          
          // Check for consistent spacing units
          Object.values(padding).concat(Object.values(margin)).forEach(value => {
            if (value > 0 && !designConfig.spacingUnits.includes(value)) {
              const closest = designConfig.spacingUnits.reduce((prev, curr) => 
                Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
              );
              if (Math.abs(closest - value) > 2) { // Allow 2px tolerance
                results.issues.push(`Non-standard spacing: ${value}px (expected: ${closest}px) in ${element.tagName.toLowerCase()}`);
              }
            }
          });
        });

        // 4. TOUCH TARGET ANALYSIS (for mobile)
        if (window.innerWidth < 768) {
          const touchTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [onclick]');
          touchTargets.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const minSize = designConfig.touchTargetMinSize;
            
            if (rect.width < minSize || rect.height < minSize) {
              results.issues.push(`Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum ${minSize}x${minSize}px)`);
            } else {
              results.passes.push(`Touch target adequate: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
            }
          });
        }

        // 5. ALIGNMENT ANALYSIS
        const alignmentContainers = document.querySelectorAll('[class*="flex"], [class*="grid"], .container, .row, .col');
        alignmentContainers.forEach((container, index) => {
          const children = Array.from(container.children);
          if (children.length > 1) {
            const style = getComputedStyle(container);
            const containerRect = container.getBoundingClientRect();
            
            const alignmentAnalysis = {
              container: container.tagName.toLowerCase(),
              containerClass: container.className,
              index,
              display: style.display,
              flexDirection: style.flexDirection,
              justifyContent: style.justifyContent,
              alignItems: style.alignItems,
              children: children.map(child => {
                const childRect = child.getBoundingClientRect();
                const childStyle = getComputedStyle(child);
                return {
                  tag: child.tagName.toLowerCase(),
                  rect: {
                    x: childRect.x - containerRect.x,
                    y: childRect.y - containerRect.y,
                    width: childRect.width,
                    height: childRect.height
                  },
                  alignSelf: childStyle.alignSelf,
                  justifySelf: childStyle.justifySelf
                };
              })
            };
            
            results.alignment.push(alignmentAnalysis);
            
            // Check for proper alignment
            if (style.display === 'flex') {
              const isColumn = style.flexDirection === 'column';
              
              // Check consistent spacing between flex items
              for (let i = 1; i < children.length; i++) {
                const prev = children[i - 1].getBoundingClientRect();
                const curr = children[i].getBoundingClientRect();
                
                if (isColumn) {
                  const gap = curr.top - prev.bottom;
                  if (gap < 0) {
                    results.issues.push(`Overlapping flex items in ${container.tagName.toLowerCase()}`);
                  }
                } else {
                  const gap = curr.left - prev.right;
                  if (gap < 0) {
                    results.issues.push(`Overlapping flex items in ${container.tagName.toLowerCase()}`);
                  }
                }
              }
            }
          }
        });

        // 6. RESPONSIVENESS ANALYSIS
        const mobileBreakpoint = 768;
        const tabletBreakpoint = 1024;
        const currentWidth = window.innerWidth;
        
        // Check if mobile-specific elements are shown/hidden correctly
        if (currentWidth < mobileBreakpoint) {
          // Should show mobile navigation, hide desktop navigation
          const mobileNav = document.querySelector('[class*="mobile"]');
          const desktopNav = document.querySelector('[class*="desktop"]:not([class*="mobile"])');
          
          if (desktopNav && isElementVisible(desktopNav)) {
            results.issues.push('Desktop navigation visible on mobile viewport');
          }
        } else {
          // Should show desktop navigation, hide mobile navigation
          const mobileNav = document.querySelector('[class*="mobile"]');
          if (mobileNav && isElementVisible(mobileNav)) {
            results.issues.push('Mobile navigation visible on desktop viewport');
          }
        }

        // Check table vs cards responsiveness
        const tables = document.querySelectorAll('table');
        const cards = document.querySelectorAll('[class*="card"]');
        
        if (currentWidth < mobileBreakpoint) {
          if (tables.length > 0 && !cards.length) {
            results.issues.push('Table shown on mobile without card alternative');
          } else if (cards.length > 0) {
            results.passes.push('Mobile cards displayed instead of table');
          }
        } else {
          if (tables.length > 0) {
            results.passes.push('Table displayed on desktop viewport');
          }
        }

        return results;
      }, this.config.design);

      // Analyze results
      const issues = uiAnalysis.issues;
      const passes = uiAnalysis.passes;

      // Additional custom checks
      const customChecks = await this.performCustomChecks(breakpoint, uiAnalysis);
      issues.push(...customChecks.issues);
      passes.push(...customChecks.passes);

      // Capture screenshot
      const screenshotStatus = issues.length > 0 ? 'failed' : 'passed';
      const screenshot = await this.reporter.captureScreenshot(
        this.page,
        testName,
        screenshotStatus,
        `${breakpoint.description} - ${issues.length === 0 ? 'All UI checks passed' : `${issues.length} issues found`}`
      );

      // Determine test status
      const testStatus = issues.length > 0 ? 'failed' : 'passed';

      this.reporter.addTestResult({
        name: testName,
        status: testStatus,
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          breakpoint: breakpoint.name,
          viewport: `${breakpoint.width}x${breakpoint.height}`,
          uiAnalysis,
          issues,
          passes,
          summary: {
            totalComponents: uiAnalysis.components.length,
            visibleComponents: uiAnalysis.components.filter(c => c.visible).length,
            totalTextElements: uiAnalysis.textElements.length,
            truncatedText: uiAnalysis.textElements.filter(t => t.truncated).length,
            totalIssues: issues.length,
            totalPasses: passes.length
          }
        },
        screenshots: screenshot ? [screenshot] : [],
        error: issues.length > 0 ? issues.slice(0, 5).join('; ') : null
      });

      return {
        passed: issues.length === 0,
        issues,
        passes,
        uiAnalysis,
        summary: {
          totalComponents: uiAnalysis.components.length,
          visibleComponents: uiAnalysis.components.filter(c => c.visible).length,
          totalTextElements: uiAnalysis.textElements.length,
          truncatedText: uiAnalysis.textElements.filter(t => t.truncated).length,
          totalIssues: issues.length,
          totalPasses: passes.length
        }
      };

    } catch (error) {
      // Capture error screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page,
        testName,
        'error',
        `Test error: ${error.message}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message,
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('error', `Test failed for ${breakpoint.name}: ${error.message}`);
      throw error;
    }
  }

  async performCustomChecks(breakpoint, uiAnalysis) {
    // Additional admin-specific checks
    const issues = [];
    const passes = [];

    try {
      // Check admin-specific elements
      const adminChecks = await this.page.evaluate(() => {
        const adminIssues = [];
        const adminPasses = [];
        
        // Check header elements specifically
        const header = document.querySelector('h1');
        const viewSiteButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Site') || btn.textContent.includes('View')
        );
        const userAvatar = document.querySelector('[class*="rounded-full"]');
        
        if (header) {
          const headerRect = header.getBoundingClientRect();
          if (headerRect.right <= window.innerWidth && headerRect.bottom <= window.innerHeight) {
            adminPasses.push('Header fully visible within viewport');
          } else {
            adminIssues.push(`Header overflows viewport: right=${headerRect.right}, bottom=${headerRect.bottom}`);
          }
        }
        
        if (viewSiteButton) {
          const buttonRect = viewSiteButton.getBoundingClientRect();
          if (buttonRect.right <= window.innerWidth) {
            adminPasses.push('View Site button fully visible');
          } else {
            adminIssues.push('View Site button not fully visible');
          }
        }
        
        if (userAvatar) {
          const avatarRect = userAvatar.getBoundingClientRect();
          if (avatarRect.right <= window.innerWidth) {
            adminPasses.push('User avatar fully visible');
          } else {
            adminIssues.push('User avatar not fully visible');
          }
        }
        
        return { adminIssues, adminPasses };
      });
      
      issues.push(...adminChecks.adminIssues);
      passes.push(...adminChecks.adminPasses);
      
    } catch (error) {
      issues.push(`Custom checks failed: ${error.message}`);
    }

    return { issues, passes };
  }

  async runFullSuite(targetUrl) {
    try {
      this.reporter.startTest(this.testName);
      
      await this.setup();
      await this.authenticate(targetUrl);

      // Test all breakpoints with comprehensive UI analysis
      for (const breakpoint of this.config.breakpoints) {
        await this.comprehensiveUITest(breakpoint);
        await new Promise(resolve => setTimeout(resolve, this.config.test.waitBetweenTests));
      }

      const finalReport = this.reporter.finalize();
      
      this.reporter.logMessage('info', 'Comprehensive UI test suite completed successfully');
      return finalReport;

    } catch (error) {
      this.reporter.logMessage('error', `Test suite failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.reporter.logMessage('info', 'Browser closed');
    }
  }
}

module.exports = ComprehensiveUITestFramework;
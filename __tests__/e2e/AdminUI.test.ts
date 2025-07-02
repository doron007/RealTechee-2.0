import puppeteer, { Browser, Page } from 'puppeteer';

describe('Admin UI E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Admin Authentication Flow', () => {
    it('should redirect to login when not authenticated', async () => {
      await page.goto(`${baseURL}/admin`);
      
      // Should redirect to login page
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    it('should show access denied for unauthorized users', async () => {
      // Mock authentication for guest user
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'guest@test.com' },
          attributes: { 'custom:role': 'guest' }
        };
      });

      await page.goto(`${baseURL}/admin`);
      
      // Should show access denied message
      await page.waitForSelector('text=Access Denied', { timeout: 5000 });
      const accessDeniedText = await page.$eval('[data-testid="access-denied"]', el => el.textContent);
      expect(accessDeniedText).toContain('You don\'t have permission');
    });
  });

  describe('Admin Layout Visual Tests', () => {
    beforeEach(async () => {
      // Mock admin authentication
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'admin@realtechee.com' },
          attributes: { 'custom:role': 'admin' }
        };
      });
    });

    it('should render admin dashboard with proper layout', async () => {
      await page.goto(`${baseURL}/admin`);
      
      // Wait for admin layout to load
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      await page.waitForSelector('[data-testid="admin-header"]', { timeout: 5000 });
      
      // Check sidebar visibility
      const sidebar = await page.$('[data-testid="admin-sidebar"]');
      expect(sidebar).toBeTruthy();
      
      // Check header visibility
      const header = await page.$('[data-testid="admin-header"]');
      expect(header).toBeTruthy();
      
      // Verify no public header is present
      const publicHeader = await page.$('[data-testid="public-header"]');
      expect(publicHeader).toBeFalsy();
    });

    it('should display logo correctly in sidebar', async () => {
      await page.goto(`${baseURL}/admin`);
      
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      
      // Check logo presence and visibility
      const logo = await page.$('[data-testid="sidebar-logo"]');
      expect(logo).toBeTruthy();
      
      // Verify logo has white background for visibility
      const logoContainer = await page.$eval('[data-testid="sidebar-logo"]', el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(logoContainer).toContain('rgb(255, 255, 255)'); // white background
    });

    it('should handle sidebar collapse/expand correctly', async () => {
      await page.goto(`${baseURL}/admin`);
      
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      
      // Get initial sidebar width
      const initialWidth = await page.$eval('[data-testid="admin-sidebar"]', el => {
        return window.getComputedStyle(el).width;
      });
      
      // Click toggle button
      await page.click('[data-testid="sidebar-toggle"]');
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      // Get collapsed width
      const collapsedWidth = await page.$eval('[data-testid="admin-sidebar"]', el => {
        return window.getComputedStyle(el).width;
      });
      
      expect(collapsedWidth).not.toBe(initialWidth);
      expect(parseInt(collapsedWidth)).toBeLessThan(parseInt(initialWidth));
    });
  });

  describe('Admin Navigation Tests', () => {
    beforeEach(async () => {
      // Mock admin authentication
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'admin@realtechee.com' },
          attributes: { 'custom:role': 'admin' }
        };
      });

      await page.goto(`${baseURL}/admin`);
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
    });

    it('should navigate to dashboard when logo is clicked', async () => {
      await page.click('[data-testid="sidebar-logo"]');
      
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/admin');
      
      // Should show dashboard content
      await page.waitForSelector('text=Total Projects', { timeout: 3000 });
    });

    it('should navigate to legacy admin sections', async () => {
      // Navigate to users
      await page.click('[data-testid="nav-users"]');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/admin-legacy?tab=users');
      
      // Navigate to contacts
      await page.click('[data-testid="nav-contacts"]');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/admin-legacy?tab=contacts');
      
      // Navigate to notifications
      await page.click('[data-testid="nav-notifications"]');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/admin-legacy?tab=notifications');
    });

    it('should show alerts for unimplemented sections', async () => {
      // Set up alert handler
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      // Click on unimplemented section
      await page.click('[data-testid="nav-projects"]');
      
      await page.waitForTimeout(500);
      expect(alertMessage).toContain('Projects management will be implemented');
    });

    it('should highlight active navigation items', async () => {
      // Check dashboard is active initially
      const dashboardButton = await page.$('[data-testid="nav-dashboard"]');
      const dashboardClasses = await page.evaluate(el => el.className, dashboardButton);
      expect(dashboardClasses).toContain('bg-blue-600');
      
      // Navigate to users and check active state
      await page.click('[data-testid="nav-users"]');
      await page.waitForTimeout(1000);
      
      const usersButton = await page.$('[data-testid="nav-users"]');
      const usersClasses = await page.evaluate(el => el.className, usersButton);
      expect(usersClasses).toContain('bg-blue-600');
    });
  });

  describe('Admin Dashboard Visual Tests', () => {
    beforeEach(async () => {
      // Mock admin authentication and API responses
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'admin@realtechee.com' },
          attributes: { 'custom:role': 'admin' }
        };
        
        // Mock API responses
        (window as any).mockAPIResponses = {
          projects: [{ id: '1', title: 'Test Project' }],
          quotes: [{ id: '1', title: 'Test Quote' }],
          requests: [{ id: '1', title: 'Test Request' }],
          contacts: [{ id: '1', email: 'test@test.com' }],
        };
      });

      await page.goto(`${baseURL}/admin`);
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
    });

    it('should display dashboard statistics correctly', async () => {
      // Wait for stats to load
      await page.waitForSelector('[data-testid="stats-projects"]', { timeout: 5000 });
      
      // Check all stat cards are present
      const projectStats = await page.$('[data-testid="stats-projects"]');
      const quoteStats = await page.$('[data-testid="stats-quotes"]');
      const requestStats = await page.$('[data-testid="stats-requests"]');
      const contactStats = await page.$('[data-testid="stats-contacts"]');
      
      expect(projectStats).toBeTruthy();
      expect(quoteStats).toBeTruthy();
      expect(requestStats).toBeTruthy();
      expect(contactStats).toBeTruthy();
    });

    it('should handle loading states properly', async () => {
      // Mock slow API responses
      await page.evaluateOnNewDocument(() => {
        (window as any).mockSlowAPI = true;
      });

      await page.reload();
      
      // Should show loading indicators
      await page.waitForSelector('text=Loading...', { timeout: 3000 });
      const loadingElements = await page.$$('text=Loading...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design Tests', () => {
    beforeEach(async () => {
      // Mock admin authentication
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'admin@realtechee.com' },
          attributes: { 'custom:role': 'admin' }
        };
      });
    });

    it('should work correctly on mobile devices', async () => {
      await page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await page.goto(`${baseURL}/admin`);
      
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      
      // Sidebar should be collapsed by default on mobile
      const sidebarWidth = await page.$eval('[data-testid="admin-sidebar"]', el => {
        return window.getComputedStyle(el).width;
      });
      
      expect(parseInt(sidebarWidth)).toBeLessThan(100); // Should be collapsed
    });

    it('should work correctly on tablet devices', async () => {
      await page.setViewport({ width: 768, height: 1024 }); // iPad
      await page.goto(`${baseURL}/admin`);
      
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      
      // Layout should be functional on tablet
      const sidebar = await page.$('[data-testid="admin-sidebar"]');
      const dashboard = await page.$('[data-testid="admin-dashboard"]');
      
      expect(sidebar).toBeTruthy();
      expect(dashboard).toBeTruthy();
    });

    it('should work correctly on desktop', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`${baseURL}/admin`);
      
      await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 5000 });
      
      // Sidebar should be expanded by default on desktop
      const sidebarWidth = await page.$eval('[data-testid="admin-sidebar"]', el => {
        return window.getComputedStyle(el).width;
      });
      
      expect(parseInt(sidebarWidth)).toBeGreaterThan(200); // Should be expanded
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      // Mock admin authentication
      await page.evaluateOnNewDocument(() => {
        (window as any).mockUser = {
          signInDetails: { loginId: 'admin@realtechee.com' },
          attributes: { 'custom:role': 'admin' }
        };
      });
    });

    it('should load admin dashboard within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(`${baseURL}/admin`);
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    it('should not have console errors', async () => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(`${baseURL}/admin`);
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
      
      // Filter out expected test-related errors
      const unexpectedErrors = consoleErrors.filter(error => 
        !error.includes('mock') && 
        !error.includes('test') &&
        !error.includes('jsdom')
      );
      
      expect(unexpectedErrors).toHaveLength(0);
    });
  });
});
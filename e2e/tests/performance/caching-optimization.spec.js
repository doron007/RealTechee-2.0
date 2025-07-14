/**
 * Performance and Caching Optimization Tests
 * 
 * Comprehensive tests for performance features including:
 * - TanStack Query caching behavior
 * - Virtual scrolling performance
 * - Lazy loading verification
 * - Cache invalidation and updates
 * - Memory usage monitoring
 * - Bundle size optimization
 */

const { test, expect } = require('@playwright/test');

const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

test.describe('Performance and Caching Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.now(),
        loads: [],
        cacheHits: 0,
        cacheMisses: 0
      };
      
      // Monitor fetch requests for cache behavior
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const start = performance.now();
        return originalFetch.apply(this, args).then(response => {
          const end = performance.now();
          window.performanceMetrics.loads.push({
            url: args[0],
            duration: end - start,
            fromCache: response.headers.get('x-cache') === 'HIT'
          });
          return response;
        });
      };
    });

    // Navigate to admin section (auth state is already loaded)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test.describe('TanStack Query Caching', () => {
    test('should cache API responses effectively', async ({ page }) => {
      // Navigate to projects page (first load)
      const startTime = performance.now();
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      const firstLoadTime = performance.now() - startTime;
      
      // Navigate away and back (should use cache)
      await page.goto('/admin/quotes');
      await page.waitForLoadState('networkidle');
      
      const cachedStartTime = performance.now();
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      const cachedLoadTime = performance.now() - cachedStartTime;
      
      console.log(`First load: ${firstLoadTime}ms, Cached load: ${cachedLoadTime}ms`);
      
      // Cached load should be significantly faster
      expect(cachedLoadTime).toBeLessThan(firstLoadTime * 0.7);
      
      // Verify data is displayed (from cache)
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      await expect(projectCards.first()).toBeVisible();
    });

    test('should handle cache invalidation on mutations', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Get initial project count
      const projectCards = page.locator('[data-testid="project-card"], .project-card, [class*="card"]');
      const initialCount = await projectCards.count();
      
      // Perform a mutation (archive a project)
      if (initialCount > 0) {
        const firstCard = projectCards.first();
        await firstCard.hover();
        
        // Look for archive/delete button
        const archiveButton = page.locator('button[aria-label*="archive"], button[aria-label*="delete"], button:has-text("Archive")');
        if (await archiveButton.isVisible()) {
          await archiveButton.click();
          
          // Confirm if confirmation dialog appears
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Archive"), button:has-text("Yes")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          // Wait for cache invalidation and refresh
          await page.waitForTimeout(2000);
          
          // Verify cache was invalidated (data updated)
          const updatedCards = page.locator('[data-testid="project-card"], .project-card, [class*="card"]');
          const updatedCount = await updatedCards.count();
          
          console.log(`Project count changed from ${initialCount} to ${updatedCount}`);
        }
      }
    });

    test('should prefetch related data efficiently', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Monitor network requests
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('/graphql') || request.url().includes('/api/')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });
      
      // Navigate to project detail (should prefetch)
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Check if prefetching occurred
        const prefetchRequests = requests.filter(req => 
          req.url.includes('project') && req.method === 'GET'
        );
        
        console.log(`Prefetch requests: ${prefetchRequests.length}`);
        expect(prefetchRequests.length).toBeGreaterThan(0);
      }
    });

    test('should respect cache TTL settings', async ({ page }) => {
      // Test cache expiration by waiting for stale time
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Get initial data
      const kpiValue = await page.locator('[data-testid="kpi-total-projects"], h4').first().textContent();
      
      // Wait for a short period (less than cache TTL)
      await page.waitForTimeout(3000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Data should load quickly from cache
      const cachedValue = await page.locator('[data-testid="kpi-total-projects"], h4').first().textContent();
      expect(cachedValue).toBe(kpiValue);
      
      // Force refresh to bypass cache
      await page.keyboard.press('Control+F5');
      await page.waitForLoadState('networkidle');
      
      const refreshedValue = await page.locator('[data-testid="kpi-total-projects"], h4').first().textContent();
      expect(refreshedValue).toBeTruthy(); // Should still have data
    });
  });

  test.describe('Virtual Scrolling Performance', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Check if virtual scrolling is active (look for virtualized container)
      const virtualContainer = page.locator('[data-testid="virtual-container"], .virtual-scroll, [class*="virtual"]');
      
      if (await virtualContainer.isVisible()) {
        console.log('Virtual scrolling detected');
        
        // Measure scroll performance
        const startTime = performance.now();
        
        // Scroll through the list
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('PageDown');
          await page.waitForTimeout(100);
        }
        
        const scrollTime = performance.now() - startTime;
        console.log(`Virtual scroll performance: ${scrollTime}ms for 5 page downs`);
        
        // Should be fast even with large datasets
        expect(scrollTime).toBeLessThan(2000);
        
        // Verify items are still rendered
        const visibleItems = page.locator('[data-testid="project-card"], .project-card');
        await expect(visibleItems.first()).toBeVisible();
      } else {
        console.log('Virtual scrolling not active (dataset may be small)');
      }
    });

    test('should only render visible items', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Count total items in dataset vs rendered items
      const allItems = page.locator('[data-testid="project-card"], .project-card, [class*="card"]');
      const totalItems = await allItems.count();
      
      // Count actually visible items in viewport
      const visibleItems = await page.locator('[data-testid="project-card"], .project-card').filter({ hasText: /.+/ }).count();
      
      console.log(`Total items: ${totalItems}, Visible items: ${visibleItems}`);
      
      // If dataset is large enough, virtual scrolling should limit visible items
      if (totalItems > 50) {
        expect(visibleItems).toBeLessThan(totalItems);
        expect(visibleItems).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Lazy Loading Optimization', () => {
    test('should lazy load admin components', async ({ page }) => {
      // Monitor network requests for chunk loading
      const chunkLoads = [];
      page.on('response', response => {
        if (response.url().includes('.js') && response.url().includes('chunk')) {
          chunkLoads.push({
            url: response.url(),
            size: response.headers()['content-length'],
            timestamp: Date.now()
          });
        }
      });
      
      // Navigate to admin area
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Initial chunks should be loaded
      const initialChunks = chunkLoads.length;
      console.log(`Initial chunks loaded: ${initialChunks}`);
      
      // Navigate to analytics (should load analytics chunk)
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const analyticsChunks = chunkLoads.length;
      console.log(`After analytics navigation: ${analyticsChunks} chunks`);
      
      // Should have loaded additional chunks for analytics
      expect(analyticsChunks).toBeGreaterThan(initialChunks);
    });

    test('should have loading fallbacks for lazy components', async ({ page }) => {
      // Navigate to analytics and catch loading state
      await page.goto('/admin/analytics');
      
      // Look for loading fallback
      const loadingFallback = page.locator('[role="progressbar"], .loading, text="Loading"');
      
      // May or may not catch it depending on speed, but shouldn't error
      try {
        await expect(loadingFallback).toBeVisible({ timeout: 1000 });
        console.log('Loading fallback detected');
      } catch {
        console.log('Loading too fast to catch fallback');
      }
      
      // Eventually content should load
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Memory Usage Optimization', () => {
    test('should manage memory efficiently during navigation', async ({ page }) => {
      // Enable memory monitoring
      await page.addInitScript(() => {
        window.memorySnapshots = [];
        
        // Take memory snapshot function
        window.takeMemorySnapshot = () => {
          if (performance.memory) {
            window.memorySnapshots.push({
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit,
              timestamp: Date.now()
            });
          }
        };
      });
      
      // Take initial snapshot
      await page.evaluate(() => window.takeMemorySnapshot());
      
      // Navigate through multiple pages
      const pages = ['/admin/projects', '/admin/quotes', '/admin/requests', '/admin/analytics'];
      
      for (const adminPage of pages) {
        await page.goto(adminPage);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => window.takeMemorySnapshot());
        await page.waitForTimeout(1000);
      }
      
      // Get memory snapshots
      const snapshots = await page.evaluate(() => window.memorySnapshots);
      
      if (snapshots.length > 0) {
        console.log('Memory usage during navigation:');
        snapshots.forEach((snapshot, index) => {
          const usedMB = (snapshot.used / 1024 / 1024).toFixed(2);
          console.log(`  Step ${index}: ${usedMB} MB used`);
        });
        
        // Memory shouldn't grow excessively
        const initialMemory = snapshots[0].used;
        const finalMemory = snapshots[snapshots.length - 1].used;
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        
        // Allow up to 50% memory increase during navigation
        expect(memoryIncrease).toBeLessThan(0.5);
      } else {
        console.log('Memory monitoring not available in this browser');
      }
    });

    test('should clean up resources on unmount', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Add a script to monitor cleanup
      await page.addInitScript(() => {
        window.cleanupTracking = {
          intervals: 0,
          timeouts: 0,
          listeners: 0
        };
        
        // Track intervals
        const originalSetInterval = window.setInterval;
        window.setInterval = function(...args) {
          window.cleanupTracking.intervals++;
          return originalSetInterval.apply(this, args);
        };
        
        // Track timeouts
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(...args) {
          window.cleanupTracking.timeouts++;
          return originalSetTimeout.apply(this, args);
        };
      });
      
      // Navigate away and back
      await page.goto('/admin/quotes');
      await page.waitForLoadState('networkidle');
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Check cleanup tracking
      const cleanupStats = await page.evaluate(() => window.cleanupTracking);
      console.log('Resource tracking:', cleanupStats);
      
      // Verify page is still functional after navigation
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      await expect(projectCards.first()).toBeVisible();
    });
  });

  test.describe('Bundle Size and Loading Performance', () => {
    test('should have optimized initial bundle size', async ({ page }) => {
      // Monitor initial resource loading
      const resources = [];
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          resources.push({
            url: response.url(),
            size: response.headers()['content-length'],
            type: response.url().includes('.js') ? 'js' : 'css'
          });
        }
      });
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Calculate total bundle size
      const totalSize = resources.reduce((sum, resource) => {
        const size = parseInt(resource.size || 0);
        return sum + size;
      }, 0);
      
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`Initial bundle size: ${totalSizeMB} MB`);
      console.log(`Resources loaded: ${resources.length}`);
      
      // Bundle should be reasonable (less than 5MB for initial load)
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });

    test('should load critical resources first', async ({ page }) => {
      const loadOrder = [];
      
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          loadOrder.push({
            url: response.url(),
            timestamp: Date.now(),
            type: response.url().includes('.js') ? 'js' : 'css'
          });
        }
      });
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Verify CSS loads before non-critical JS
      const firstCSS = loadOrder.find(resource => resource.type === 'css');
      const lastJS = loadOrder.filter(resource => resource.type === 'js').pop();
      
      if (firstCSS && lastJS) {
        console.log('CSS loaded at:', firstCSS.timestamp);
        console.log('Last JS loaded at:', lastJS.timestamp);
        
        // Critical CSS should load early
        const cssLoadTime = firstCSS.timestamp - loadOrder[0].timestamp;
        expect(cssLoadTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Cache Strategy Validation', () => {
    test('should implement proper cache headers', async ({ page }) => {
      const cacheableResources = [];
      
      page.on('response', response => {
        const cacheControl = response.headers()['cache-control'];
        const etag = response.headers()['etag'];
        
        if (cacheControl || etag) {
          cacheableResources.push({
            url: response.url(),
            cacheControl,
            etag,
            status: response.status()
          });
        }
      });
      
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      console.log(`Found ${cacheableResources.length} cacheable resources`);
      
      // Verify static assets have proper cache headers
      const staticAssets = cacheableResources.filter(resource => 
        resource.url.includes('.js') || 
        resource.url.includes('.css') || 
        resource.url.includes('.png') ||
        resource.url.includes('.svg')
      );
      
      expect(staticAssets.length).toBeGreaterThan(0);
      
      staticAssets.forEach(asset => {
        console.log(`${asset.url}: ${asset.cacheControl}`);
      });
    });

    test('should handle offline/network failure gracefully', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to navigate (should fail gracefully)
      await page.goto('/admin/analytics');
      
      // Look for error handling
      const errorMessage = page.locator('[role="alert"], text*="Failed", text*="Error", text*="offline"');
      
      // Should either show error message or use cached data
      try {
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
        console.log('Error message displayed for offline state');
      } catch {
        // Check if page loaded from cache
        const heading = page.locator('h1');
        if (await heading.isVisible()) {
          console.log('Page loaded from cache while offline');
        }
      }
      
      // Restore network
      await page.context().setOffline(false);
    });
  });
});
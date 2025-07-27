const { test, expect } = require('@playwright/test');

test.describe('MUI Gallery Visual Consistency Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project page with gallery
    await page.goto('http://localhost:3000');
    await page.click('a[href="/projects"]');
    await page.waitForLoadState('networkidle');
    
    // Find and click on first project
    const projectLinks = await page.locator('a, button').all();
    for (const link of projectLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && href.includes('/project') || text?.toLowerCase().includes('view')) {
        await link.click();
        break;
      }
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('should maintain exact visual layout - desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check gallery container dimensions and styling
    const gallery = page.locator('[class*="Gallery"], .gallery, [data-testid*="gallery"]').first();
    
    if (await gallery.count() > 0) {
      // Verify main container styling
      const galleryBox = await gallery.boundingBox();
      expect(galleryBox.height).toBeCloseTo(620, 50); // Within 50px tolerance
      
      // Check for thumbnails at bottom
      const thumbnails = page.locator('img').filter({ hasText: /thumbnail|thumb/i });
      const thumbnailBoxes = await thumbnails.all();
      
      if (thumbnailBoxes.length > 1) {
        const firstThumbnail = await thumbnailBoxes[0].boundingBox();
        const lastThumbnail = await thumbnailBoxes[thumbnailBoxes.length - 1].boundingBox();
        
        // Thumbnails should be in horizontal row at bottom
        expect(firstThumbnail.y).toBeCloseTo(lastThumbnail.y, 10);
        expect(lastThumbnail.x).toBeGreaterThan(firstThumbnail.x);
      }
      
      // Check for navigation arrows
      const prevButton = page.locator('button[aria-label*="Previous"], button[aria-label*="prev"]').first();
      const nextButton = page.locator('button[aria-label*="Next"], button[aria-label*="next"]').first();
      
      if (await prevButton.count() > 0 && await nextButton.count() > 0) {
        const prevBox = await prevButton.boundingBox();
        const nextBox = await nextButton.boundingBox();
        
        // Arrows should be on opposite sides
        expect(nextBox.x).toBeGreaterThan(prevBox.x);
        
        // Arrows should be vertically centered relative to main image
        expect(Math.abs(prevBox.y - nextBox.y)).toBeLessThan(20);
      }
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const gallery = page.locator('[class*="Gallery"], .gallery, [data-testid*="gallery"]').first();
    
    if (await gallery.count() > 0) {
      const galleryBox = await gallery.boundingBox();
      
      // Gallery should be smaller on tablet
      expect(galleryBox.height).toBeLessThan(620);
      expect(galleryBox.height).toBeGreaterThan(300);
      
      // Check thumbnails are still visible and properly sized
      const thumbnails = page.locator('img').filter({ hasText: /thumbnail|thumb/i });
      if (await thumbnails.count() > 1) {
        const firstThumbnail = await thumbnails.first().boundingBox();
        expect(firstThumbnail.width).toBeLessThan(80); // Smaller than desktop
        expect(firstThumbnail.width).toBeGreaterThan(40); // But still usable
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const gallery = page.locator('[class*="Gallery"], .gallery, [data-testid*="gallery"]').first();
    
    if (await gallery.count() > 0) {
      const galleryBox = await gallery.boundingBox();
      
      // Gallery should be much smaller on mobile
      expect(galleryBox.height).toBeLessThan(400);
      expect(galleryBox.height).toBeGreaterThan(200);
      
      // Check touch-friendly elements
      const thumbnails = page.locator('img').filter({ hasText: /thumbnail|thumb/i });
      if (await thumbnails.count() > 1) {
        const firstThumbnail = await thumbnails.first().boundingBox();
        expect(firstThumbnail.width).toBeGreaterThan(30); // Touch-friendly minimum
      }
      
      // Navigation buttons should be touch-friendly
      const navButtons = page.locator('button[aria-label*="Previous"], button[aria-label*="Next"]');
      if (await navButtons.count() > 0) {
        const buttonBox = await navButtons.first().boundingBox();
        expect(buttonBox.width).toBeGreaterThan(32); // iOS minimum touch target
        expect(buttonBox.height).toBeGreaterThan(32);
      }
    }
  });

  test('should show counter in top right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Look for image counter
    const counter = page.locator('text=/\\d+ \\/ \\d+/').first();
    
    if (await counter.count() > 0) {
      const galleryContainer = page.locator('[class*="Gallery"], .gallery, [data-testid*="gallery"]').first();
      const containerBox = await galleryContainer.boundingBox();
      const counterBox = await counter.boundingBox();
      
      // Counter should be in top-right area of gallery
      expect(counterBox.x).toBeGreaterThan(containerBox.x + containerBox.width * 0.7);
      expect(counterBox.y).toBeLessThan(containerBox.y + containerBox.height * 0.3);
    }
  });

  test('should open modal on main image click', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Find main image (largest image that's not a thumbnail)
    const images = await page.locator('img').all();
    let mainImage = null;
    let maxArea = 0;
    
    for (const img of images) {
      const box = await img.boundingBox();
      if (box) {
        const area = box.width * box.height;
        if (area > maxArea) {
          maxArea = area;
          mainImage = img;
        }
      }
    }
    
    if (mainImage) {
      // Click main image
      await mainImage.click();
      
      // Wait for modal
      await page.waitForTimeout(500);
      
      // Check for modal elements
      const modal = page.locator('[role="dialog"], .modal, [class*="Modal"]').first();
      const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="close"]').first();
      
      if (await modal.count() > 0) {
        expect(await modal.isVisible()).toBe(true);
        
        // Modal should be larger than original image
        const modalBox = await modal.boundingBox();
        const originalBox = await mainImage.boundingBox();
        expect(modalBox.width).toBeGreaterThan(originalBox.width);
        
        // Close modal
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(300);
          expect(await modal.isVisible()).toBe(false);
        }
      }
    }
  });

  test('should have no image reload on thumbnail clicks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Track network requests for images
    const imageRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (request.resourceType() === 'image' || url.match(/\\.(jpg|jpeg|png|webp|gif|avif)$/i)) {
        imageRequests.push({
          url: url,
          timestamp: Date.now()
        });
      }
    });
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    const initialRequestCount = imageRequests.length;
    
    // Clear counter for thumbnail testing
    imageRequests.length = 0;
    
    // Find thumbnails and click them
    const thumbnails = page.locator('img').filter({ hasText: /thumbnail|thumb/i });
    const thumbnailElements = await thumbnails.all();
    
    if (thumbnailElements.length > 1) {
      // Click multiple thumbnails
      for (let i = 1; i < Math.min(thumbnailElements.length, 4); i++) {
        const requestsBefore = imageRequests.length;
        
        await thumbnailElements[i].click();
        await page.waitForTimeout(1000);
        
        const requestsAfter = imageRequests.length;
        const newRequests = requestsAfter - requestsBefore;
        
        // Should have zero new image requests
        expect(newRequests).toBe(0);
      }
      
      // Final verification
      expect(imageRequests.length).toBe(0);
    }
  });

  test('should have smooth thumbnail selection animation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    const thumbnails = page.locator('img').filter({ hasText: /thumbnail|thumb/i });
    
    if (await thumbnails.count() > 1) {
      const firstThumbnail = thumbnails.first();
      const secondThumbnail = thumbnails.nth(1);
      
      // Check initial state
      const firstInitialClass = await firstThumbnail.getAttribute('class') || '';
      
      // Click second thumbnail
      await secondThumbnail.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Check that selection changed
      const firstAfterClass = await firstThumbnail.getAttribute('class') || '';
      const secondAfterClass = await secondThumbnail.getAttribute('class') || '';
      
      // Visual feedback should be different (classes should change)
      expect(firstAfterClass !== firstInitialClass || 
             secondAfterClass.includes('selected') || 
             secondAfterClass.includes('active')).toBe(true);
    }
  });

  test('should maintain black background styling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    const gallery = page.locator('[class*="Gallery"], .gallery, [data-testid*="gallery"]').first();
    
    if (await gallery.count() > 0) {
      // Check background color is black or very dark
      const backgroundColor = await gallery.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Should be black (rgb(0, 0, 0)) or very dark
      expect(backgroundColor === 'rgb(0, 0, 0)' || 
             backgroundColor === 'rgba(0, 0, 0, 1)' ||
             backgroundColor.includes('0, 0, 0')).toBe(true);
    }
  });
});
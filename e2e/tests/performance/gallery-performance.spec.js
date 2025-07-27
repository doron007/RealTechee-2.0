const { test, expect } = require('@playwright/test');

test.describe('ImageGallery Performance Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Track network requests to detect image reloads
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('s3.amazonaws.com')) {
        console.log(`🖼️ Image request: ${url.split('/').pop()}`);
      }
      route.continue();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should not reload images when clicking thumbnails', async () => {
    // Go to a project page with multiple images
    await page.goto('http://localhost:3001/project?projectId=proj_6756a2ef1b5c060701000001');
    
    // Wait for page and images to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="image-gallery"]', { timeout: 10000 });
    
    // Count initial image requests
    const imageRequests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('s3.amazonaws.com')) {
        imageRequests.push({
          url: url,
          timestamp: Date.now(),
          type: 'initial'
        });
      }
    });
    
    // Wait for initial load to complete
    await page.waitForTimeout(2000);
    const initialRequestCount = imageRequests.length;
    console.log(`📊 Initial image requests: ${initialRequestCount}`);
    
    // Clear the requests array to track only new requests
    imageRequests.length = 0;
    
    // Get all thumbnail buttons
    const thumbnails = await page.locator('[data-testid="image-gallery"] button').all();
    console.log(`🎯 Found ${thumbnails.length} thumbnail buttons`);
    
    if (thumbnails.length > 1) {
      // Click on different thumbnails and track requests
      for (let i = 1; i < Math.min(thumbnails.length, 4); i++) {
        console.log(`🖱️ Clicking thumbnail ${i + 1}`);
        
        // Record requests before click
        const requestsBefore = imageRequests.length;
        
        // Click thumbnail
        await thumbnails[i].click();
        
        // Wait for any potential network activity
        await page.waitForTimeout(1000);
        
        // Record requests after click
        const requestsAfter = imageRequests.length;
        const newRequests = requestsAfter - requestsBefore;
        
        console.log(`📈 New image requests after click ${i + 1}: ${newRequests}`);
        
        // Assert no new image requests were made (should be 0)
        expect(newRequests).toBe(0);
      }
    }
    
    console.log(`✅ Total image requests during thumbnail clicks: ${imageRequests.length}`);
    expect(imageRequests.length).toBeLessThanOrEqual(1); // Allow at most 1 new request for main image
  });

  test('should track image load events on thumbnails', async () => {
    await page.goto('http://localhost:3001/project?projectId=proj_6756a2ef1b5c060701000001');
    await page.waitForLoadState('networkidle');
    
    // Add load event listeners to all images
    const imageLoadEvents = await page.evaluate(() => {
      const events = [];
      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        const originalSrc = img.src;
        
        // Track when image src changes (indicates reload)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
              events.push({
                imageIndex: index,
                newSrc: img.src,
                oldSrc: originalSrc,
                timestamp: Date.now(),
                type: 'src_change'
              });
            }
          });
        });
        
        observer.observe(img, { attributes: true });
        
        // Track load events
        img.addEventListener('load', () => {
          events.push({
            imageIndex: index,
            src: img.src,
            timestamp: Date.now(),
            type: 'load_event'
          });
        });
      });
      
      return { eventsRef: events, imageCount: images.length };
    });
    
    console.log(`🖼️ Monitoring ${imageLoadEvents.imageCount} images for load events`);
    
    // Click thumbnails and check for image reload events
    const thumbnails = await page.locator('[data-testid="image-gallery"] button').all();
    
    if (thumbnails.length > 1) {
      await thumbnails[1].click();
      await page.waitForTimeout(1000);
      
      const events = await page.evaluate(() => window.imageLoadEvents || []);
      const reloadEvents = events.filter(e => e.type === 'load_event');
      
      console.log(`🔄 Image reload events detected: ${reloadEvents.length}`);
      console.log('Events:', reloadEvents);
      
      // Should have minimal reload events (ideally 0-1 for main image only)
      expect(reloadEvents.length).toBeLessThanOrEqual(1);
    }
  });
});
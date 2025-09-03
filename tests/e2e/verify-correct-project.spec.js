const { test, expect } = require('@playwright/test');

test('Verify correct project with multiple gallery images', async ({ page }) => {
  console.log('🔍 Navigating to the specific project URL...');
  
  // Navigate to the EXACT URL provided
  await page.goto('http://localhost:3000/project?projectId=ce1b5212-c72a-2adc-9af3-5158955a182b');
  
  console.log('⏳ Waiting for page to fully load...');
  
  // Wait longer for the project to load
  await page.waitForTimeout(8000);
  
  // Check if we can find project content
  const pageTitle = await page.great. textContent('title');
  console.log('📄 Page title:', pageTitle);
  
  // Check for loading states
  const isLoading = await page.locator('text=Loading').count();
  const isInitializing = await page.locator('text=Initializing').count();
  
  console.log('🔄 Loading states:', { isLoading, isInitializing });
  
  // Take a screenshot to see what's actually loaded
  await page.screenshot({ 
    path: 'debug-project-page.png',
    fullPage: true 
  });
  
  // Try to find gallery images with more flexible selectors
  const gallerySelectors = [
    'img[alt*="Project image"]',
    'img[alt*="Thumbnail"]', 
    'img[alt*="gallery"]',
    '[class*="gallery"] img',
    '[class*="Gallery"] img',
    'img[src*="gallery"]'
  ];
  
  let foundImages = [];
  
  for (const selector of gallerySelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      const images = await page.$$eval(selector, (imgs) => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
      );
      foundImages.push({ selector, count, images: images.slice(0, 3) });
    }
  }
  
  console.log('🖼️  Gallery Image Search Results:');
  foundImages.forEach(result => {
    console.log(`   Selector: ${result.selector}`);
    console.log(`   Count: ${result.count}`);
    console.log(`   Sample images:`, result.images);
  });
  
  // Check for any project-specific content
  const projectContent = await page.evaluate(() => {
    const body = document.body.textContent || '';
    return {
      hasPropertyDetails: body.includes('Property Details'),
      hasProjectDetails: body.includes('Project Details'),
      hasComments: body.includes('Project Comments') || body.includes('Comments'),
      hasMilestones: body.includes('Milestones'),
      hasPayments: body.includes('Payment'),
      projectIdInUrl: window.location.search.includes('ce1b5212-c72a-2adc-9af3-5158955a182b')
    };
  });
  
  console.log('📋 Project Content Check:', projectContent);
  
  // Look for any error messages or console errors
  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('404') || msg.text().includes('failed')) {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  await page.waitForTimeout(2000);
  
  if (consoleLogs.length > 0) {
    console.log('❌ Error Messages Found:');
    consoleLogs.forEach(log => console.log(`   ${log}`));
  }
  
  // Final check - what's actually on the page
  const bodyText = await page.textContent('body');
  const bodyPreview = bodyText?.substring(0, 500) || 'No body content';
  console.log('📄 Body Content Preview:', bodyPreview);
});
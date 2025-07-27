// Debug script to understand what's on the project page
const { chromium } = require('playwright');

async function debugGallery() {
  console.log('🔍 Debugging ImageGallery presence...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();
  
  console.log('📄 Loading project page...');
  await page.goto('http://localhost:3000/project?projectId=proj_6756a2ef1b5c060701000001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for various gallery-related elements
  console.log('\n🔍 Searching for gallery elements...');
  
  const testSelectors = [
    '[data-testid="image-gallery"]',
    '[data-thumbnail-index]',
    'button:has(img)',
    'img',
    '.aspect-square',
    '.ring-2',
    'button'
  ];
  
  for (const selector of testSelectors) {
    const count = await page.locator(selector).count();
    console.log(`${selector}: ${count} elements found`);
  }
  
  // Get page title and URL to confirm we're on the right page
  const title = await page.title();
  const url = page.url();
  console.log(`\nPage: ${title}`);
  console.log(`URL: ${url}`);
  
  // Check if there are any error messages
  const errorMessages = await page.locator('.text-amber-600, .text-red-600').allTextContents();
  if (errorMessages.length > 0) {
    console.log('\n⚠️ Error messages found:');
    errorMessages.forEach(msg => console.log(`  - ${msg}`));
  }
  
  // Check for loading states
  const loadingElements = await page.locator('[class*="loading"], [class*="animate-pulse"]').count();
  console.log(`\nLoading elements: ${loadingElements}`);
  
  // Get all images on the page
  const images = await page.locator('img').all();
  console.log(`\nTotal images on page: ${images.length}`);
  
  for (let i = 0; i < Math.min(images.length, 5); i++) {
    const src = await images[i].getAttribute('src');
    const alt = await images[i].getAttribute('alt');
    console.log(`  Image ${i + 1}: ${alt || 'No alt'} - ${src?.substring(0, 50)}...`);
  }
  
  console.log('\n👀 Browser staying open for manual inspection...');
  console.log('🔍 Check the page manually to see if gallery is present');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(60000);
  
  await browser.close();
}

debugGallery().catch(console.error);
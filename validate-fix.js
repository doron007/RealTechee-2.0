// Simple validation script for the ImageGallery fix
const { chromium } = require('playwright');

async function validateFix() {
  console.log('🔍 Validating ImageGallery fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visual confirmation
  });
  const page = await browser.newPage();
  
  // Track image requests
  const imageRequests = [];
  page.on('request', request => {
    const url = request.url();
    const isImage = request.resourceType() === 'image' || 
                   url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
                   url.includes('s3.amazonaws.com');
    
    if (isImage) {
      imageRequests.push({
        filename: url.split('/').pop(),
        timestamp: Date.now()
      });
    }
  });
  
  console.log('📄 Loading project page...');
  await page.goto('http://localhost:3000/project?projectId=proj_6756a2ef1b5c060701000001');
  await page.waitForLoadState('networkidle');
  
  console.log('⏳ Waiting for page to fully load...');
  await page.waitForTimeout(3000);
  
  const initialImageCount = imageRequests.length;
  console.log(`📊 Initial image requests: ${initialImageCount}`);
  
  // Clear counter for thumbnail testing
  imageRequests.length = 0;
  
  // Look for any button with an image inside
  const allButtons = await page.locator('button').all();
  let thumbnailButtons = [];
  
  for (const button of allButtons) {
    const hasImage = await button.locator('img').count() > 0;
    if (hasImage) {
      thumbnailButtons.push(button);
    }
  }
  
  console.log(`🎯 Found ${thumbnailButtons.length} buttons with images`);
  
  if (thumbnailButtons.length > 1) {
    console.log('\n🖱️ Testing thumbnail clicks...');
    
    // Test clicking different thumbnails
    for (let i = 1; i < Math.min(thumbnailButtons.length, 4); i++) {
      const requestsBefore = imageRequests.length;
      
      console.log(`\n🖱️ Clicking thumbnail ${i + 1}...`);
      await thumbnailButtons[i].click({ force: true });
      await page.waitForTimeout(2000);
      
      const requestsAfter = imageRequests.length;
      const newRequests = requestsAfter - requestsBefore;
      
      if (newRequests === 0) {
        console.log('✅ No image reloads - GOOD!');
      } else {
        console.log(`❌ ${newRequests} image reloads detected`);
      }
    }
    
    const totalReloads = imageRequests.length;
    console.log(`\n📊 FINAL RESULT: ${totalReloads} total image reloads during thumbnail navigation`);
    
    if (totalReloads === 0) {
      console.log('🎉 SUCCESS: ImageGallery fix is working!');
      console.log('✅ Zero image reloads during thumbnail clicks');
    } else {
      console.log('❌ ISSUE: Still seeing image reloads');
    }
  } else {
    console.log('⚠️ Could not find enough thumbnail buttons for testing');
  }
  
  console.log('\n👀 Browser will stay open for 30 seconds for manual verification...');
  console.log('📱 Please manually click thumbnails and check Network tab');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

validateFix().catch(console.error);
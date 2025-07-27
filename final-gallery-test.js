// Final comprehensive test to validate ImageGallery fix
const { chromium } = require('playwright');

async function finalGalleryTest() {
  console.log('🔍 FINAL ImageGallery Fix Validation Test');
  console.log('==========================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: false,
    slowMo: 500 // Slow down for visual inspection
  });
  const page = await browser.newPage();
  
  // Track ALL image requests with detailed logging
  const imageRequests = [];
  page.on('request', request => {
    const url = request.url();
    const isImage = request.resourceType() === 'image' || 
                   url.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i) ||
                   url.includes('s3.amazonaws.com') ||
                   url.includes('gallery') ||
                   url.includes('project');
    
    if (isImage) {
      const timestamp = new Date().toISOString();
      const filename = url.split('/').pop() || 'unknown';
      
      imageRequests.push({
        filename,
        timestamp,
        url,
        resourceType: request.resourceType()
      });
      
      console.log(`🖼️ [${timestamp}] ${filename}`);
    }
  });
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  try {
    console.log('\n📄 Step 1: Loading homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Homepage loaded successfully');
    
    console.log('\n📄 Step 2: Navigating to Projects page...');
    await page.click('a[href="/projects"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📊 Looking for project links...');
    const projectLinks = await page.locator('a[href*="/project"]').all();
    console.log(`Found ${projectLinks.length} project links`);
    
    if (projectLinks.length > 0) {
      console.log('\n📄 Step 3: Clicking on first project...');
      await projectLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Give time for gallery to load
      
      console.log('📊 Analyzing page content...');
      
      // Look for gallery elements
      const galleryContainer = await page.locator('[data-testid="image-gallery"]').count();
      const thumbnailButtons = await page.locator('[data-thumbnail-index]').count();
      const allImages = await page.locator('img').count();
      const allButtons = await page.locator('button').count();
      
      console.log(`Gallery containers: ${galleryContainer}`);
      console.log(`Thumbnail buttons: ${thumbnailButtons}`);
      console.log(`Total images: ${allImages}`);
      console.log(`Total buttons: ${allButtons}`);
      
      if (thumbnailButtons > 1) {
        console.log('\n🎯 GALLERY FOUND! Starting click test...');
        
        // Record baseline
        const initialImageRequests = imageRequests.length;
        console.log(`📊 Baseline: ${initialImageRequests} initial image requests`);
        
        // Clear counter for testing
        imageRequests.length = 0;
        
        // Get all thumbnail buttons
        const thumbnails = await page.locator('[data-thumbnail-index]').all();
        console.log(`🎯 Testing with ${thumbnails.length} thumbnails`);
        
        // Test clicking different thumbnails
        for (let i = 1; i < Math.min(thumbnails.length, 4); i++) {
          const requestsBefore = imageRequests.length;
          
          console.log(`\n🖱️ Click Test ${i}: Clicking thumbnail ${i + 1}...`);
          await thumbnails[i].click();
          await page.waitForTimeout(2000); // Wait for any potential requests
          
          const requestsAfter = imageRequests.length;
          const newRequests = requestsAfter - requestsBefore;
          
          console.log(`📊 New image requests: ${newRequests}`);
          
          if (newRequests === 0) {
            console.log('✅ EXCELLENT: No image reloads detected');
          } else {
            console.log('❌ PROBLEM: Image reloads detected:');
            imageRequests.slice(requestsBefore).forEach(req => {
              console.log(`   - ${req.filename} (${req.resourceType})`);
            });
          }
        }
        
        // Final assessment
        const totalReloads = imageRequests.length;
        console.log('\n' + '='.repeat(50));
        console.log('🏁 FINAL TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`📊 Total image reloads during thumbnail clicks: ${totalReloads}`);
        
        if (totalReloads === 0) {
          console.log('🎉 ✅ SUCCESS: ImageGallery fix is WORKING!');
          console.log('🎯 Zero image requests during thumbnail navigation');
          console.log('🚀 AJAX-like behavior achieved');
        } else {
          console.log('❌ ❌ FAILURE: ImageGallery still has issues');
          console.log('🔧 Image reloads are still occurring');
          console.log('📋 Requests detected:');
          imageRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ${req.filename} at ${req.timestamp}`);
          });
        }
        
        console.log('\n👀 Browser will stay open for manual verification...');
        console.log('🔍 Please click thumbnails manually and verify in Network tab');
        console.log('⏱️ Waiting 60 seconds for manual testing...');
        
        await page.waitForTimeout(60000);
        
      } else if (allImages > 0) {
        console.log('\n⚠️ Images found but no thumbnail gallery detected');
        console.log('🔍 This might not be a project with an image gallery');
      } else {
        console.log('\n⚠️ No images found on this project page');
      }
      
    } else {
      console.log('\n⚠️ No project links found on projects page');
      console.log('🔍 Manual navigation needed');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('🔍 Manual verification needed');
  }
  
  console.log('\n🔍 Keeping browser open for final manual verification...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  return {
    totalRequests: imageRequests.length,
    isFixed: imageRequests.length === 0
  };
}

// Run the test
finalGalleryTest().then(result => {
  console.log('\n🎯 TEST SUMMARY:');
  console.log(`Image reload requests: ${result.totalRequests}`);
  console.log(`Fix status: ${result.isFixed ? 'WORKING ✅' : 'NEEDS WORK ❌'}`);
}).catch(console.error);
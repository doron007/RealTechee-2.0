const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Staging Comment Upload Debug', () => {
  test('reproduce comment image upload error on staging', async ({ page }) => {
    console.log('🔍 TESTING STAGING COMMENT UPLOAD ERROR');
    
    // Navigate to the problematic project page on staging
    const stagingUrl = 'https://staging.d200k2wsaf8th3.amplifyapp.com/project?projectId=2beb0166-72b0-61ae-b8f8-ba920ee9e355';
    
    await page.goto(stagingUrl);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');
    
    // Listen for console errors specifically related to S3
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('Storage not configured') || msg.text().includes('AccessDenied')) {
        console.log(`🚨 CONSOLE ERROR: ${msg.text()}`);
      }
      if (msg.text().includes('INFO') && msg.text().includes('useCommentsData')) {
        console.log(`ℹ️  INFO: ${msg.text()}`);
      }
    });
    
    // Listen for network failures
    page.on('response', (response) => {
      if (response.url().includes('s3.') && response.status() >= 400) {
        console.log(`🚨 S3 NETWORK ERROR: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Scroll down to find comments section
    await page.keyboard.press('End');
    await page.waitForTimeout(1000);
    
    // Look for the comments section - try multiple selectors
    let commentsSection = null;
    try {
      commentsSection = await page.waitForSelector('[data-testid="comments-section"], .comments, [class*="comment"], h3:has-text("Comments"), h2:has-text("Comments")', { timeout: 5000 });
      console.log('✅ Comments section found');
    } catch (e) {
      // Try scrolling more and looking for any form or input elements
      console.log('⚠️  Comments section not found with standard selectors, trying alternative approach');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // Check for any form elements that might be the comment form
      const forms = await page.locator('form, textarea, input[type="file"]');
      const formCount = await forms.count();
      console.log(`📝 Found ${formCount} form elements on page`);
      
      if (formCount === 0) {
        console.log('❌ No comment form found - may require authentication');
        return;
      }
      commentsSection = forms.first();
    }
    
    // Check if there's an "Add Comment" or similar button/form
    const commentForm = await page.locator('form, [data-testid*="comment"], button:has-text("Add"), button:has-text("Comment")').first();
    
    if (await commentForm.count() > 0) {
      console.log('✅ Comment form/button found');
      
      // Look for file input - could be hidden
      const fileInput = await page.locator('input[type="file"]');
      
      if (await fileInput.count() > 0) {
        console.log('✅ File input found');
        
        // Create a test image file
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        
        // Try to upload the file
        try {
          await fileInput.setInputFiles(testImagePath);
          console.log('✅ File selected successfully');
          
          // Wait a bit and check for any immediate errors
          await page.waitForTimeout(2000);
          
        } catch (error) {
          console.log(`❌ File upload failed: ${error.message}`);
        }
        
      } else {
        console.log('⚠️  No file input found - checking page structure');
        
        // Log the page content to understand the structure
        const pageContent = await page.locator('body').innerHTML();
        console.log('📋 Comment section structure contains:', pageContent.includes('comment') ? 'comment elements' : 'no comment elements');
      }
    } else {
      console.log('❌ No comment form found');
    }
    
    // Wait for any async operations
    await page.waitForTimeout(3000);
    
    console.log('🔚 Test completed - check console output above for errors');
  });
  
  test('check staging amplify configuration', async ({ page }) => {
    console.log('🔍 CHECKING STAGING AMPLIFY CONFIG');
    
    const stagingUrl = 'https://staging.d200k2wsaf8th3.amplifyapp.com/project?projectId=2beb0166-72b0-61ae-b8f8-ba920ee9e355';
    
    // Add script to capture any amplify-related global variables
    await page.addInitScript(() => {
      window.captureAmplifyConfig = () => {
        const results = {};
        
        // Check various possible locations for amplify config
        if (window.amplifyOutputs) results.amplifyOutputs = window.amplifyOutputs;
        if (window.aws_exports) results.aws_exports = window.aws_exports;
        if (window.Amplify) results.amplifyLib = 'Present';
        if (window.__AMPLIFY_CONFIG__) results.__AMPLIFY_CONFIG__ = window.__AMPLIFY_CONFIG__;
        
        // Check for any objects with 'storage' property
        Object.keys(window).forEach(key => {
          if (window[key] && typeof window[key] === 'object' && window[key].storage) {
            results[key] = { hasStorage: true, storage: window[key].storage };
          }
        });
        
        return Object.keys(results).length > 0 ? results : 'No amplify config found';
      };
    });
    
    await page.goto(stagingUrl);
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any async config loading
    await page.waitForTimeout(3000);
    
    // Extract the amplify configuration
    const amplifyConfig = await page.evaluate(() => {
      return window.captureAmplifyConfig();
    });
    
    console.log('📊 STAGING AMPLIFY CONFIG:');
    if (typeof amplifyConfig === 'object' && amplifyConfig !== null) {
      Object.entries(amplifyConfig).forEach(([key, value]) => {
        console.log(`   ${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
        
        if (value && typeof value === 'object' && value.storage) {
          console.log(`   🗄️  ${key} Storage Config:`);
          console.log(`      Region: ${value.storage.aws_region || 'N/A'}`);
          console.log(`      Bucket: ${value.storage.bucket_name || 'N/A'}`);
          if (value.storage.buckets) {
            value.storage.buckets.forEach((bucket, idx) => {
              console.log(`      Bucket ${idx + 1}: ${bucket.bucket_name || 'N/A'}`);
            });
          }
        }
      });
    } else {
      console.log(`   ❌ ${amplifyConfig}`);
    }
    
    // Try to get the actual bucket being used in network requests
    const responses = [];
    page.on('response', (response) => {
      if (response.url().includes('s3') || response.url().includes('amazonaws')) {
        responses.push(response.url());
      }
    });
    
    // Trigger some activity that might make S3 requests
    await page.evaluate(() => {
      // Try to trigger any initialization that might make S3 calls
      if (window.Amplify && window.Amplify.configure) {
        console.log('Amplify library detected');
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (responses.length > 0) {
      console.log('🌐 AWS NETWORK REQUESTS DETECTED:');
      responses.forEach(url => {
        if (url.includes('amplify') || url.includes('s3')) {
          console.log(`   ${url}`);
          // Extract bucket name from URL
          const bucketMatch = url.match(/([a-z0-9-]+)\.s3\.([a-z0-9-]+)\.amazonaws\.com/);
          if (bucketMatch) {
            console.log(`   🪣 BUCKET: ${bucketMatch[1]} (Region: ${bucketMatch[2]})`);
          }
        }
      });
    }
  });
});
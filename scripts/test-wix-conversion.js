/**
 * Test script for validating the server-side Wix media URL conversion
 * Run this with: node ./scripts/test-wix-conversion.js
 */

const axios = require('axios');

// Define a set of test cases
const testUrls = [
  // Basic Wix URL
  "wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg",
  
  // JSON with slug
  '{"slug":"daeed6_265c29464acb4f0689fef1333bdde83c~mv2"}',
  
  // JSON array with description
  '[{"description":"Image 1","uri":"wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg"}]',
  
  // Standard URL (should remain unchanged)
  "https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg",
  
  // Malformed data (should return placeholder)
  '{invalid json]'
];

// Gallery test case
const galleryTest = [
  "wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg",
  "wix:image://v1/abcdef_123456789abcdef123456789abcdef~mv2.jpg/photo.jpg",
  '{"slug":"12345_abcdefghi~mv2"}'
];

// Test harness
async function runTests() {
  console.log("Testing Wix Media URL Conversion API");
  console.log("====================================");
  
  // Test individual URL conversion
  console.log("\n1. Testing Single URL Conversion:");
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    try {
      console.log(`\nTest Case ${i+1}: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`);
      
      const response = await axios.post('http://localhost:3000/api/media/convert', {
        url: url
      });
      
      console.log(`Result: ${response.data.url}`);
      
      if (response.data.url && response.data.url.startsWith('http')) {
        console.log('✅ Success: Valid URL returned');
      } else if (response.data.url && response.data.url.startsWith('/assets/images/placeholder.jpg')) {
        console.log('✅ Success: Placeholder returned for invalid input');
      } else {
        console.log('❌ Failed: Invalid response');
      }
    } catch (error) {
      console.error(`❌ Error testing URL conversion: ${error.message}`);
    }
  }
  
  // Test gallery conversion
  console.log("\n\n2. Testing Gallery Conversion:");
  try {
    const response = await axios.post('http://localhost:3000/api/media/convert', {
      gallery: galleryTest
    });
    
    console.log(`Results: ${response.data.urls.length} URLs returned`);
    
    response.data.urls.forEach((url, i) => {
      console.log(`[${i+1}] ${url}`);
    });
    
    if (response.data.urls && response.data.urls.length > 0 && 
        response.data.urls.every(url => url.startsWith('http') || url.startsWith('/assets'))) {
      console.log('✅ Success: Valid gallery URLs returned');
    } else {
      console.log('❌ Failed: Invalid gallery response');
    }
  } catch (error) {
    console.error(`❌ Error testing gallery conversion: ${error.message}`);
  }
  
  console.log("\n====================================");
  console.log("Test complete!");
}

// Run the tests (make sure server is running)
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
});

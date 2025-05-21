// JavaScript version of the Wix URL converter for testing purposes
// This avoids TypeScript import/export issues with direct node execution

/**
 * Converts a Wix media URL to a standard URL that can be used in web applications
 * 
 * Based on real-world testing and observed patterns:
 * - Regular image: wix:image://v1/{mediaId}/{fileName} → https://static.wixstatic.com/media/{mediaId}
 * - SVG format: wix:image://v1/shapes_{mediaId}/{fileName} → https://static.wixstatic.com/shapes/{mediaId}.svg
 * 
 * @param {string} wixUrl - The Wix media URL (e.g. wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg)
 * @returns {string} A standard URL to the media resource
 */
function convertWixMediaUrl(wixUrl) {
  // Check if this is already a fully qualified URL
  if (!wixUrl || typeof wixUrl !== 'string') {
    return wixUrl;
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    return wixUrl;
  }
  
  // Check if it's a Wix media URL format
  if (!wixUrl.startsWith('wix:image://')) {
    return wixUrl;
  }

  try {
    // Remove the prefix
    const withoutPrefix = wixUrl.replace('wix:image://', '');
    
    // Remove any hash parameters (like #originWidth=480&originHeight=640)
    const withoutHash = withoutPrefix.split('#')[0];
    
    // Split by slash to separate components
    const parts = withoutHash.split('/');
    
    // Handle invalid format
    if (parts.length < 2) {
      console.warn('Invalid Wix URL format:', wixUrl);
      return wixUrl;
    }
    
    // Extract the media ID based on user's trial and error findings
    let mediaId;
    const versionPath = parts[0]; // Usually "v1"
    
    if (versionPath === 'v1' && parts.length >= 2) {
      // Format: wix:image://v1/mediaId/filename
      mediaId = parts[1];
    } else if (versionPath.startsWith('v1/')) {
      // Format: wix:image://v1/mediaId/...
      mediaId = versionPath.substring(3);
    } else {
      // Fallback if format is unexpected
      mediaId = parts[0];
    }
    
    // Get the last part which is usually the filename
    const fileName = parts[parts.length - 1].toLowerCase();
    const isSvgFile = fileName.endsWith('.svg');
    
    // Determine if this is an SVG file or has 'shapes_' prefix in the ID
    if (mediaId.includes('shapes_')) {
      // Extract the actual ID part after 'shapes_'
      return `https://static.wixstatic.com/shapes/${mediaId.replace('shapes_', '')}.svg`;
    } else if (isSvgFile) {
      // Handle SVG files differently based on their extension
      return `https://static.wixstatic.com/media/${mediaId}`;
    }
    
    // Based on user's findings, the correct format for standard images is:
    // https://static.wixstatic.com/media/{mediaId}
    return `https://static.wixstatic.com/media/${mediaId}`;
  } catch (error) {
    console.error('Error converting Wix media URL:', error);
    return wixUrl; // Return the original URL in case of an error
  }
}

// The example URL from the user's findings
const exampleUrl = 'wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg#originWidth=480&originHeight=640';
const expectedConversion = 'https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg';

// Test cases
const testCases = [
  {
    input: exampleUrl,
    expected: expectedConversion,
    description: 'User-confirmed working example'
  },
  {
    input: 'wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg',
    expected: 'https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg',
    description: 'Same example without hash parameters'
  },
  {
    input: 'wix:image://v1/77ca98_83c4cb3351df4035b4047bfce44f84cc.svg/logo.svg',
    expected: 'https://static.wixstatic.com/media/77ca98_83c4cb3351df4035b4047bfce44f84cc.svg',
    description: 'SVG image (regular format)'
  },
  {
    input: 'wix:image://v1/shapes_77ca98_83c4cb3351df4035b4047bfce44f84cc/icon.svg',
    expected: 'https://static.wixstatic.com/shapes/77ca98_83c4cb3351df4035b4047bfce44f84cc.svg',
    description: 'SVG with shapes in the ID'
  },
  {
    input: 'https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg',
    expected: 'https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg',
    description: 'Already converted URL (should remain unchanged)'
  }
];

// Main validation logic
console.log('Wix Media URL Converter Validation\n');

// Test the first example specifically
console.log('MAIN EXAMPLE:');
console.log(`Input:    ${exampleUrl}`);
const mainResult = convertWixMediaUrl(exampleUrl);
console.log(`Output:   ${mainResult}`);
console.log(`Expected: ${expectedConversion}`);
console.log(`Matches expected result: ${mainResult === expectedConversion ? 'YES ✓' : 'NO ✗'}`);
console.log('-----------------------------------\n');

// Run all test cases
console.log('ALL TEST CASES:');
let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  const result = convertWixMediaUrl(test.input);
  const passes = result === test.expected;
  
  if (passes) {
    passedTests++;
  } else {
    failedTests++;
  }
  
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`Input:    ${test.input}`);
  console.log(`Output:   ${result}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result:   ${passes ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log('-----------------------------------\n');
});

// Summary
console.log(`SUMMARY: ${passedTests} tests passed, ${failedTests} tests failed`);
if (failedTests === 0) {
  console.log('✅ All tests passed! The Wix URL converter is working correctly.');
} else {
  console.log('❌ Some tests failed. The Wix URL converter needs additional fixes.');
}
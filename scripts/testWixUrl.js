// Test script for Wix URL conversion
// This script demonstrates how to convert Wix media URLs to standard web URLs

/**
 * Converts a Wix media URL to a standard URL that can be used in web applications
 * 
 * Based on Wix documentation and observed patterns:
 * - Regular image: wix:image://v1/{mediaId}/{fileName}
 * - SVG format: https://static.wixstatic.com/shapes/{mediaId}.svg
 * 
 * @param {string} wixUrl - The Wix media URL
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
    
    // Split by slash to separate components
    const parts = withoutPrefix.split('/');
    
    // Handle invalid format
    if (parts.length < 2) {
      console.warn('Invalid Wix URL format:', wixUrl);
      return wixUrl;
    }
    
    // Extract the media ID - typically comes after "v1/"
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
    
    // Get the filename
    const fileName = parts[parts.length - 1];
    
    // Determine if this might be an SVG based on filename or ID format
    // SVG files in Wix typically use the shapes subdomain
    if (fileName.endsWith('.svg') || mediaId.includes('shapes_')) {
      return `https://static.wixstatic.com/shapes/${mediaId}.svg`;
    }
    
    // Regular image format
    return `https://static.wixstatic.com/media/${mediaId}/${fileName}`;
  } catch (error) {
    console.error('Error converting Wix media URL:', error);
    return wixUrl; // Return the original URL in case of an error
  }
}

// Test URLs with expected outputs
const testCases = [
  {
    input: 'wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg',
    description: 'Standard Wix image URL'
  },
  {
    input: 'wix:image://v1/77ca98_83c4cb3351df4035b4047bfce44f84cc/some-image.svg',
    description: 'SVG image in standard format'
  },
  {
    input: 'https://static.wixstatic.com/shapes/77ca98_83c4cb3351df4035b4047bfce44f84cc.svg',
    description: 'Already a static Wix URL (should be unchanged)'
  },
  {
    input: 'wix:image://v1/abcdef_123456/image.png',
    description: 'PNG image'
  },
  {
    input: 'wix:image://v1/shapes_77ca98_83c4cb3351df4035b4047bfce44f84cc/logo.png',
    description: 'Image with shapes in ID'
  },
  {
    input: '',
    description: 'Empty string (edge case)'
  }
];

// Test the conversion
console.log('Testing Wix Media URL conversion:\n');

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1}: ${testCase.description}`);
  console.log(`Input:  ${testCase.input}`);
  
  const result = convertWixMediaUrl(testCase.input);
  console.log(`Output: ${result}`);
  console.log('-----------------------------------\n');
});

// Show example of the specific URL from the question
console.log('Example from question:');
console.log('Input:  wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg');
console.log(`Output: ${convertWixMediaUrl('wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg')}`);
console.log('-----------------------------------');

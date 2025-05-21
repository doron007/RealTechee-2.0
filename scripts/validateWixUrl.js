// Updated Wix URL test script based on real-world findings
console.log('Testing Updated Wix Media URL Conversion\n');

// Import the utility function from our TypeScript file using require to avoid module issues
const { convertWixMediaUrl } = require('../utils/wixMediaUtils');

// The example URL from the user's findings
const exampleUrl = 'wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg#originWidth=480&originHeight=640';
const expectedConversion = 'https://static.wixstatic.com/media/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg';

// Additional test cases
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

// Test the first example specifically
console.log('MAIN EXAMPLE:');
console.log(`Input:    ${exampleUrl}`);
console.log(`Output:   ${convertWixMediaUrl(exampleUrl)}`);
console.log(`Expected: ${expectedConversion}`);
console.log(`Matches expected result: ${convertWixMediaUrl(exampleUrl) === expectedConversion ? 'YES ✓' : 'NO ✗'}`);
console.log('-----------------------------------\n');

// Run all test cases
console.log('ADDITIONAL TEST CASES:');
testCases.forEach((test, index) => {
  const result = convertWixMediaUrl(test.input);
  const passes = result === test.expected;
  
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`Input:    ${test.input}`);
  console.log(`Output:   ${result}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result:   ${passes ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log('-----------------------------------\n');
});

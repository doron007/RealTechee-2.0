/**
 * Test script for Wix media URL conversion
 */
import { convertWixMediaUrl } from '../utils/wixMediaUtils';

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
process.stdout.write('Testing Wix Media URL conversion:\n\n');

testCases.forEach((testCase, index) => {
  process.stdout.write(`Test Case ${index + 1}: ${testCase.description}\n`);
  process.stdout.write(`Input:  ${testCase.input}\n`);
  
  const result = convertWixMediaUrl(testCase.input);
  process.stdout.write(`Output: ${result}\n`);
  process.stdout.write('-----------------------------------\n\n');
});

// Show example of the specific URL from the question
process.stdout.write('Example from question:\n');
process.stdout.write('Input:  wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg\n');
process.stdout.write(`Output: ${convertWixMediaUrl('wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg')}\n`);
process.stdout.write('-----------------------------------\n');

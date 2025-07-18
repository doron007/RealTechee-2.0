#!/usr/bin/env node

// Manual validation of assignment fixes
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Validating Assignment System Fixes...\n');

// Test 1: Check if form page loads
console.log('1. Testing form page accessibility...');
try {
  const result = execSync('curl -s "http://localhost:3000/contact/get-estimate" | grep -o "Get Your Estimate" | head -1', { encoding: 'utf8' });
  if (result.trim() === 'Get Your Estimate') {
    console.log('   ✅ Form page loads successfully');
  } else {
    console.log('   ❌ Form page not accessible');
  }
} catch (error) {
  console.log('   ❌ Error accessing form page:', error.message);
}

// Test 2: Check if admin page loads
console.log('\n2. Testing admin page accessibility...');
try {
  const result = execSync('curl -s "http://localhost:3000/admin" | grep -o "Sign in" | head -1', { encoding: 'utf8' });
  if (result.trim() === 'Sign in') {
    console.log('   ✅ Admin page loads successfully');
  } else {
    console.log('   ❌ Admin page not accessible');
  }
} catch (error) {
  console.log('   ❌ Error accessing admin page:', error.message);
}

// Test 3: Check backend tables
console.log('\n3. Testing backend table access...');
try {
  const result = execSync('aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --max-items 5 --query "Items[*].name.S" --output text', { encoding: 'utf8' });
  const aes = result.trim().split('\t').filter(Boolean);
  console.log(`   ✅ Found ${aes.length} AEs in database: ${aes.join(', ')}`);
  
  const hasUnassigned = aes.includes('Unassigned');
  console.log(`   ${hasUnassigned ? '✅' : '❌'} "Unassigned" ${hasUnassigned ? 'found' : 'not found'} in database`);
} catch (error) {
  console.log('   ❌ Error accessing backend tables:', error.message);
}

// Test 4: Create a manual test request 
console.log('\n4. Creating manual test request...');
console.log('   📋 Manual Test Steps:');
console.log('   1. Open http://localhost:3000/contact/get-estimate');
console.log('   2. Fill out the form with test data');
console.log('   3. Submit the form');
console.log('   4. Check if request ID is displayed');
console.log('   5. Go to admin page and check if request was auto-assigned');
console.log('   6. Test assignment dropdown for duplicates');
console.log('   7. Test assignment save functionality');

// Test 5: Build validation
console.log('\n5. Testing code compilation...');
try {
  console.log('   ⏳ Running TypeScript type check...');
  execSync('npm run type-check', { stdio: 'pipe' });
  console.log('   ✅ TypeScript types are valid');
} catch (error) {
  console.log('   ❌ TypeScript type errors found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Open the form: http://localhost:3000/contact/get-estimate');
console.log('2. Fill with test data:');
console.log('   - Agent name: Test Agent Validation');
console.log('   - Email: test.validation@example.com');
console.log('   - Phone: (555) 123-4567');
console.log('   - Address: 123 Test Assignment St, Test City, CA 90210');
console.log('3. Submit and verify auto-assignment works');
console.log('4. Check admin panel for assignment dropdown functionality');

console.log('\n📋 Expected Results:');
console.log('✅ Form submits successfully');
console.log('✅ Request ID is displayed');
console.log('✅ Request is auto-assigned to actual AE (not "Unassigned")');
console.log('✅ Admin dropdown shows only one "Unassigned" option');
console.log('✅ Assignment changes save without reverting');
console.log('✅ Notifications queue successfully (no form failure)');
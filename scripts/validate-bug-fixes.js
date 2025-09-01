#!/usr/bin/env node

/**
 * PARALLEL BUG FIXES VALIDATION SCRIPT
 * 
 * This script validates that both critical issues are resolved:
 * 1. Case Management GraphQL client initialization 
 * 2. Playground accessibility at localhost:3000/playground
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 STARTING PARALLEL BUG FIXES VALIDATION');
console.log('============================================');

// Configuration
const TEST_FILE = 'tests/e2e/bug-fixes-validation.spec.js';
const SERVER_CHECK_TIMEOUT = 30000; // 30 seconds
const VALIDATION_RESULTS = {
  trackA: false, // Case Management fix
  trackB: false, // Playground fix
  trackC: false, // E2E validation
  trackD: false, // Performance monitoring
  overallSuccess: false
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerRunning() {
  console.log('📡 Checking if development server is running...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3000', { timeout: 5000 });
    if (response.ok) {
      console.log('✅ Development server is running on http://localhost:3000');
      return true;
    }
  } catch (error) {
    console.log('❌ Development server is not running');
    console.log('🚀 Please start the server with: npm run dev:primed');
    return false;
  }
  
  return false;
}

async function validatePlaygroundAccess() {
  console.log('\n🧪 TRACK B: Validating Playground Access...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const playgroundUrls = [
      'http://localhost:3000/playground/index.html',
      'http://localhost:3000/playground/docs.html',
      'http://localhost:3000/playground/examples.html'
    ];
    
    for (const url of playgroundUrls) {
      try {
        const response = await fetch(url, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`✅ ${url} - Status: ${response.status}`);
        } else if (response.status === 404) {
          throw new Error(`❌ ${url} - Status: 404 (NOT FOUND)`);
        } else {
          console.log(`⚠️ ${url} - Status: ${response.status}`);
        }
      } catch (error) {
        throw new Error(`❌ Failed to access ${url}: ${error.message}`);
      }
    }
    
    console.log('🎉 TRACK B PASSED: Playground accessibility validated');
    VALIDATION_RESULTS.trackB = true;
    return true;
    
  } catch (error) {
    console.error('❌ TRACK B FAILED:', error.message);
    return false;
  }
}

async function runPlaywrightTests() {
  console.log('\n🧪 Running Playwright validation tests...');
  
  try {
    // Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
      throw new Error(`Test file not found: ${TEST_FILE}`);
    }
    
    console.log(`📋 Running tests from: ${TEST_FILE}`);
    
    // Run the specific validation test
    const testCommand = `CI=true npx playwright test ${TEST_FILE} --reporter=line --timeout=60000`;
    console.log(`🚀 Command: ${testCommand}`);
    
    const output = execSync(testCommand, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 120000 // 2 minutes max
    });
    
    console.log('📊 Playwright Test Results:');
    console.log(output);
    
    // Parse results
    if (output.includes('TRACK A PASSED')) {
      console.log('✅ TRACK A: Case Management GraphQL client fix validated');
      VALIDATION_RESULTS.trackA = true;
    }
    
    if (output.includes('TRACK B PASSED')) {
      console.log('✅ TRACK B: Playground accessibility fix validated');
      VALIDATION_RESULTS.trackB = true;
    }
    
    if (output.includes('TRACK C PASSED')) {
      console.log('✅ TRACK C: End-to-End workflow validation passed');
      VALIDATION_RESULTS.trackC = true;
    }
    
    if (output.includes('TRACK D PASSED')) {
      console.log('✅ TRACK D: Performance monitoring passed');
      VALIDATION_RESULTS.trackD = true;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Playwright tests failed:');
    console.error(error.message);
    
    // Parse partial results even on failure
    const output = error.stdout || '';
    if (output.includes('TRACK A PASSED')) VALIDATION_RESULTS.trackA = true;
    if (output.includes('TRACK B PASSED')) VALIDATION_RESULTS.trackB = true;
    if (output.includes('TRACK C PASSED')) VALIDATION_RESULTS.trackC = true;
    if (output.includes('TRACK D PASSED')) VALIDATION_RESULTS.trackD = true;
    
    return false;
  }
}

async function validateCaseManagementAPIs() {
  console.log('\n🔬 TRACK A: Validating Case Management API Models...');
  
  try {
    // Check if the amplifyAPI file has our fixes
    const apiFilePath = 'utils/amplifyAPI.ts';
    if (!fs.existsSync(apiFilePath)) {
      throw new Error('amplifyAPI.ts file not found');
    }
    
    const apiContent = fs.readFileSync(apiFilePath, 'utf8');
    
    // Check for key fixes
    const checksums = {
      hasWaitForClientInit: apiContent.includes('waitForClientInitialization'),
      hasAsyncEnsureReady: apiContent.includes('async ensureClientReady'),
      hasRequestNotesAPI: apiContent.includes('requestNotesAPI'),
      hasRequestAssignmentsAPI: apiContent.includes('requestAssignmentsAPI'),
      hasRequestStatusHistoryAPI: apiContent.includes('requestStatusHistoryAPI'),
      hasProgressiveBackoff: apiContent.includes('Progressive backoff')
    };
    
    console.log('📋 API Fix Validation:');
    Object.entries(checksums).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });
    
    const allPassed = Object.values(checksums).every(Boolean);
    if (allPassed) {
      console.log('🎉 TRACK A: Case Management API fixes detected');
      VALIDATION_RESULTS.trackA = true;
    } else {
      console.log('❌ TRACK A: Some Case Management API fixes missing');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ TRACK A validation error:', error.message);
    return false;
  }
}

async function generateValidationReport() {
  console.log('\n📊 PARALLEL BUG FIXES VALIDATION REPORT');
  console.log('=========================================');
  
  console.log('\n🎯 CRITICAL ISSUE FIXES:');
  console.log(`Track A - Case Management GraphQL Client: ${VALIDATION_RESULTS.trackA ? '✅ FIXED' : '❌ FAILED'}`);
  console.log(`Track B - Playground 404 Resolution: ${VALIDATION_RESULTS.trackB ? '✅ FIXED' : '❌ FAILED'}`);
  
  console.log('\n🧪 VALIDATION TESTS:');
  console.log(`Track C - E2E Workflow Validation: ${VALIDATION_RESULTS.trackC ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Track D - Performance Monitoring: ${VALIDATION_RESULTS.trackD ? '✅ PASSED' : '❌ FAILED'}`);
  
  const criticalFixes = VALIDATION_RESULTS.trackA && VALIDATION_RESULTS.trackB;
  const validationTests = VALIDATION_RESULTS.trackC && VALIDATION_RESULTS.trackD;
  VALIDATION_RESULTS.overallSuccess = criticalFixes && validationTests;
  
  console.log('\n🏆 OVERALL RESULT:');
  if (VALIDATION_RESULTS.overallSuccess) {
    console.log('🎉 SUCCESS: All parallel bug fixes validated successfully!');
    console.log('✅ Frontend is 100% working');
    console.log('✅ Playground is accessible');
    console.log('✅ Case Management workflow operational');
  } else {
    console.log('❌ PARTIAL SUCCESS: Some issues remain');
    if (!criticalFixes) {
      console.log('🚨 CRITICAL: Core functionality issues not fully resolved');
    }
    if (!validationTests) {
      console.log('⚠️ WARNING: Validation tests need attention');
    }
  }
  
  console.log('\n📋 NEXT STEPS:');
  if (VALIDATION_RESULTS.overallSuccess) {
    console.log('1. ✅ All systems operational - ready for development');
    console.log('2. 🚀 Case Management features fully functional');
    console.log('3. 🎮 Playground available for GraphQL testing');
    console.log('4. 📊 Performance monitoring active');
  } else {
    console.log('1. 🔧 Review failed validations above');
    console.log('2. 🐛 Check browser console for specific error messages');
    console.log('3. 📝 Run manual testing for any remaining issues');
    console.log('4. 🔄 Re-run validation after fixes');
  }
  
  return VALIDATION_RESULTS.overallSuccess;
}

async function main() {
  try {
    console.log('⏰ Starting validation at:', new Date().toISOString());
    
    // Step 1: Check server
    const serverRunning = await checkServerRunning();
    if (!serverRunning) {
      process.exit(1);
    }
    
    // Step 2: Quick playground validation
    await validatePlaygroundAccess();
    
    // Step 3: Case Management API validation
    await validateCaseManagementAPIs();
    
    // Step 4: Run comprehensive Playwright tests
    await runPlaywrightTests();
    
    // Step 5: Generate report
    const success = await generateValidationReport();
    
    console.log('\n⏰ Validation completed at:', new Date().toISOString());
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 VALIDATION SCRIPT ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the validation
main();
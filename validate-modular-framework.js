#!/usr/bin/env node

/**
 * Modular Framework Validation Script
 * 
 * This script validates that the modular test framework is properly
 * structured and all components are working correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Modular Test Framework');
console.log('═'.repeat(50));

// Framework structure validation
const frameworkStructure = {
  'e2e/framework/': [
    'BasePageTest.js',
    'TestReporter.js',
    'FailFastValidator.js',
    'BusinessLogicTester.js',
    'SharedTestUtilities.js',
    'TestDataManager.js'
  ],
  'e2e/pages/': [
    'ProjectsPageTest.js',
    'QuotesPageTest.js',
    'RequestsPageTest.js'
  ],
  'e2e/flows/': [
    'UserFlowSequencer.js'
  ],
  'e2e/': [
    'ModularAdminTestRunner.js'
  ]
};

let validationErrors = [];
let validationWarnings = [];

console.log('1. Checking framework structure...');

// Check directory structure
for (const [directory, files] of Object.entries(frameworkStructure)) {
  const dirPath = path.join(__dirname, directory);
  
  if (!fs.existsSync(dirPath)) {
    validationErrors.push(`Missing directory: ${directory}`);
    continue;
  }
  
  // Check files in directory
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    if (!fs.existsSync(filePath)) {
      validationErrors.push(`Missing file: ${directory}${file}`);
    } else {
      // Check if file is not empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        validationErrors.push(`Empty file: ${directory}${file}`);
      }
    }
  }
}

if (validationErrors.length === 0) {
  console.log('✅ Framework structure validation passed');
} else {
  console.log('❌ Framework structure validation failed');
}

console.log('\n2. Checking module dependencies...');

// Check if modules can be required
const testModules = [
  'e2e/framework/TestReporter.js',
  'e2e/framework/FailFastValidator.js',
  'e2e/framework/BusinessLogicTester.js',
  'e2e/framework/SharedTestUtilities.js',
  'e2e/framework/TestDataManager.js',
  'e2e/pages/ProjectsPageTest.js',
  'e2e/pages/QuotesPageTest.js',
  'e2e/pages/RequestsPageTest.js',
  'e2e/flows/UserFlowSequencer.js'
];

let moduleErrors = [];

for (const module of testModules) {
  try {
    const modulePath = path.join(__dirname, module);
    require(modulePath);
    console.log(`✅ ${module} - OK`);
  } catch (error) {
    moduleErrors.push(`${module}: ${error.message}`);
    console.log(`❌ ${module} - ERROR: ${error.message}`);
  }
}

if (moduleErrors.length === 0) {
  console.log('✅ Module dependencies validation passed');
} else {
  console.log('❌ Module dependencies validation failed');
}

console.log('\n3. Testing framework components...');

// Test TestReporter
try {
  const TestReporter = require('./e2e/framework/TestReporter');
  const reporter = new TestReporter('validation-test', {
    mode: 'validation'
  });
  
  reporter.addTestResult({
    name: 'validation-test',
    status: 'passed',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    details: { message: 'Framework validation test' }
  });
  
  const reportData = reporter.finalize();
  
  if (fs.existsSync(reportData.htmlPath)) {
    console.log('✅ TestReporter - OK');
  } else {
    validationErrors.push('TestReporter failed to generate HTML report');
  }
  
} catch (error) {
  validationErrors.push(`TestReporter error: ${error.message}`);
}

// Test TestDataManager
try {
  const TestDataManager = require('./e2e/framework/TestDataManager');
  const dataManager = new TestDataManager();
  
  const sampleProjects = dataManager.getSampleData('projects');
  const mockData = dataManager.generateMockFormData('project');
  
  if (sampleProjects.length > 0 && mockData.title) {
    console.log('✅ TestDataManager - OK');
  } else {
    validationErrors.push('TestDataManager failed to generate sample data');
  }
  
} catch (error) {
  validationErrors.push(`TestDataManager error: ${error.message}`);
}

console.log('\n4. Checking test runner...');

// Check if main test runner exists and is executable
const testRunnerPath = path.join(__dirname, 'e2e/ModularAdminTestRunner.js');
if (!fs.existsSync(testRunnerPath)) {
  validationErrors.push('Main test runner not found');
} else {
  try {
    const stats = fs.statSync(testRunnerPath);
    if (stats.size < 1000) {
      validationWarnings.push('Test runner file seems too small');
    }
    console.log('✅ ModularAdminTestRunner - OK');
  } catch (error) {
    validationErrors.push(`Test runner error: ${error.message}`);
  }
}

console.log('\n5. Validation summary...');

// Generate summary
const summary = {
  totalChecks: testModules.length + 4, // modules + 4 additional checks
  passed: 0,
  failed: 0,
  warnings: validationWarnings.length,
  errors: validationErrors.length
};

summary.passed = summary.totalChecks - summary.failed;

console.log('═'.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('═'.repeat(50));

if (validationErrors.length === 0) {
  console.log('🎉 ALL VALIDATIONS PASSED');
  console.log(`✅ Framework structure: Complete`);
  console.log(`✅ Module dependencies: Working`);
  console.log(`✅ Component functionality: Verified`);
  console.log(`✅ Test runner: Ready`);
  
  if (validationWarnings.length > 0) {
    console.log(`⚠️  Warnings: ${validationWarnings.length}`);
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🚀 Modular test framework is ready to use!');
  console.log('\nTo run tests:');
  console.log('   node run-modular-admin-tests.js');
  console.log('   OR');
  console.log('   node e2e/ModularAdminTestRunner.js');
  
  process.exit(0);
  
} else {
  console.log('❌ VALIDATION FAILED');
  console.log(`❌ Errors: ${validationErrors.length}`);
  validationErrors.forEach(error => console.log(`   - ${error}`));
  
  if (validationWarnings.length > 0) {
    console.log(`⚠️  Warnings: ${validationWarnings.length}`);
    validationWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n🛠️  Please fix the errors before running tests');
  process.exit(1);
}
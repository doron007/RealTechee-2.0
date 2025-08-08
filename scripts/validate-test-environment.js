#!/usr/bin/env node

/**
 * Test Environment Validation Script
 * 
 * Validates that the backend validation testing environment is properly configured.
 */

const fs = require('fs');
const path = require('path');

async function validateEnvironment() {
  console.log('🔍 Validating Backend Testing Environment...\n');

  const validations = [];
  let hasErrors = false;

  // 1. Check Amplify outputs
  try {
    const amplifyOutputsPath = path.join(__dirname, '..', 'amplify_outputs.json');
    if (fs.existsSync(amplifyOutputsPath)) {
      const amplifyOutputs = require(amplifyOutputsPath);
      
      if (amplifyOutputs.data && amplifyOutputs.data.tables) {
        validations.push('✅ Amplify configuration found');
        validations.push(`   - Region: ${amplifyOutputs.data.aws_region}`);
        validations.push(`   - Tables: ${amplifyOutputs.data.tables.length} configured`);
        
        // Check for required tables
        const tableNames = amplifyOutputs.data.tables.map(t => t.name);
        const requiredModels = ['Requests', 'Contacts', 'Properties', 'ContactUs', 'NotificationQueue'];
        
        requiredModels.forEach(model => {
          const hasTable = tableNames.some(name => name.startsWith(model + '-'));
          if (hasTable) {
            validations.push(`   - ${model} table: ✅`);
          } else {
            validations.push(`   - ${model} table: ❌ Missing`);
            hasErrors = true;
          }
        });
      } else {
        validations.push('❌ Amplify configuration invalid - no tables found');
        hasErrors = true;
      }
    } else {
      validations.push('❌ amplify_outputs.json not found');
      validations.push('   Run: npx ampx sandbox');
      hasErrors = true;
    }
  } catch (error) {
    validations.push('❌ Amplify configuration error: ' + error.message);
    hasErrors = true;
  }

  // 2. Check AWS credentials
  try {
    const hasEnvCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    const credentialsPath = path.join(require('os').homedir(), '.aws', 'credentials');
    const hasCredentialsFile = fs.existsSync(credentialsPath);

    if (hasEnvCredentials) {
      validations.push('✅ AWS credentials found (environment variables)');
      validations.push(`   - Region: ${process.env.AWS_REGION || 'default'}`);
    } else if (hasCredentialsFile) {
      validations.push('✅ AWS credentials found (~/.aws/credentials)');
    } else {
      validations.push('❌ AWS credentials not configured');
      validations.push('   Set environment variables or run: aws configure');
      hasErrors = true;
    }
  } catch (error) {
    validations.push('❌ AWS credentials check failed: ' + error.message);
    hasErrors = true;
  }

  // 3. Check test files
  const testFiles = [
    'tests/helpers/awsConfig.js',
    'tests/helpers/backendValidation.js',
    'tests/helpers/testDataGenerator.js',
    'tests/e2e/form-validation-get-estimate.spec.js',
    'tests/e2e/form-validation-contact-us.spec.js'
  ];

  let testFilesOk = true;
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      validations.push(`✅ ${file}`);
    } else {
      validations.push(`❌ ${file} missing`);
      testFilesOk = false;
      hasErrors = true;
    }
  });

  if (testFilesOk) {
    validations.push('✅ All test helper files found');
  }

  // 4. Check package dependencies
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = require(packagePath);
    
    const requiredDeps = [
      '@playwright/test',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb'
    ];

    const allDeps = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    };

    let depsOk = true;
    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        validations.push(`✅ ${dep}: ${allDeps[dep]}`);
      } else {
        validations.push(`❌ ${dep}: Not installed`);
        depsOk = false;
        hasErrors = true;
      }
    });

    if (depsOk) {
      validations.push('✅ All required dependencies installed');
    }
  } catch (error) {
    validations.push('❌ Package.json check failed: ' + error.message);
    hasErrors = true;
  }

  // 5. Test AWS connection
  if (!hasErrors) {
    try {
      validations.push('\n🔌 Testing AWS Connection...');
      
      // Import and test AWS configuration
      const { setupAWS } = require('../tests/helpers/awsConfig');
      const awsConfig = await setupAWS();
      
      validations.push('✅ AWS connection successful');
      validations.push(`   - Region: ${awsConfig.envInfo.region}`);
      validations.push(`   - Environment: ${awsConfig.envInfo.environment}`);
      
    } catch (error) {
      validations.push('❌ AWS connection failed: ' + error.message);
      hasErrors = true;
    }
  }

  // Print results
  console.log(validations.join('\n'));
  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('\nCommon issues and solutions:');
    console.log('1. Missing backend: npx ampx sandbox');
    console.log('2. Missing AWS credentials: aws configure');
    console.log('3. Missing dependencies: npm install');
    console.log('\nSee tests/helpers/README.md for detailed setup instructions.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation PASSED');
    console.log('\nBackend validation testing environment is ready!');
    console.log('\nRun tests with:');
    console.log('  npm run test:e2e -- form-validation');
    console.log('  npm run test:e2e:headed -- form-validation-get-estimate');
    process.exit(0);
  }
}

// Run validation
validateEnvironment().catch(error => {
  console.error('❌ Validation script failed:', error.message);
  process.exit(1);
});
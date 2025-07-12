#!/usr/bin/env node

/**
 * Modular Admin Test Runner Script
 * 
 * This script provides a clean interface to run the new modular test suite
 * with proper setup and cleanup.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Modular Admin Test Suite');
console.log('═'.repeat(60));

// Check if required files exist
const requiredFiles = [
  'e2e/ModularAdminTestRunner.js',
  'e2e/framework/TestReporter.js',
  'e2e/framework/FailFastValidator.js',
  'e2e/framework/BusinessLogicTester.js',
  'e2e/framework/SharedTestUtilities.js',
  'e2e/pages/ProjectsPageTest.js',
  'e2e/pages/QuotesPageTest.js',
  'e2e/pages/RequestsPageTest.js',
  'e2e/flows/UserFlowSequencer.js'
];

console.log('🔍 Checking required files...');
const missingFiles = requiredFiles.filter(file => 
  !fs.existsSync(path.join(__dirname, file))
);

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

console.log('✅ All required files found');

// Function to run command and return promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      cwd: __dirname,
      ...options 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // Clean up any existing Node processes
    console.log('🧹 Cleaning up existing Node processes...');
    try {
      await runCommand('killall', ['node']);
    } catch (error) {
      // Ignore if no processes to kill
    }
    
    // Start dev server
    console.log('🏃 Starting development server...');
    const devServer = spawn('npm', ['run', 'dev'], { 
      cwd: __dirname,
      stdio: 'pipe' // Don't inherit stdio for dev server
    });
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Run the modular test suite
    console.log('🔍 Running modular admin test suite...');
    await runCommand('node', ['e2e/ModularAdminTestRunner.js']);
    
    // Clean up dev server
    console.log('🧹 Cleaning up development server...');
    devServer.kill();
    
    console.log('✅ Test suite completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    
    // Clean up any remaining processes
    try {
      await runCommand('killall', ['node']);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted by user');
  
  try {
    await runCommand('killall', ['node']);
  } catch (error) {
    // Ignore cleanup errors
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Test terminated');
  
  try {
    await runCommand('killall', ['node']);
  } catch (error) {
    // Ignore cleanup errors
  }
  
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
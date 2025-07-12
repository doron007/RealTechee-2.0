#!/usr/bin/env node

/**
 * Robust Admin Test Runner
 * 
 * This script runs the comprehensive admin tests with the new
 * robust test framework that includes:
 * - Fail-fast validation
 * - Business logic testing
 * - Complete error handling
 * - Comprehensive reporting
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Robust Admin Test Suite');
console.log('═'.repeat(60));

// Clean up any existing Node processes first
console.log('🧹 Cleaning up existing Node processes...');
spawn('killall', ['node'], { stdio: 'inherit' }).on('close', (code) => {
  console.log('✅ Node processes cleaned up');
  
  // Start dev server
  console.log('🏃 Starting development server...');
  const devServer = spawn('npm', ['run', 'dev'], { 
    cwd: '/Users/doron/Projects/RealTechee 2.0',
    stdio: 'inherit' 
  });
  
  // Wait for server to start
  setTimeout(() => {
    console.log('✅ Development server started');
    
    // Run the comprehensive test
    console.log('🔍 Running comprehensive admin functional tests...');
    const testProcess = spawn('node', [
      path.join(__dirname, 'e2e/admin/comprehensive-admin-functional-test.js')
    ], { 
      cwd: '/Users/doron/Projects/RealTechee 2.0',
      stdio: 'inherit' 
    });
    
    testProcess.on('close', (code) => {
      console.log(`\n🎯 Test process finished with code: ${code}`);
      
      // Clean up dev server
      console.log('🧹 Cleaning up development server...');
      devServer.kill();
      
      // Exit with test result code
      process.exit(code);
    });
    
    testProcess.on('error', (error) => {
      console.error('❌ Test process error:', error);
      devServer.kill();
      process.exit(1);
    });
    
  }, 5000); // Wait 5 seconds for server startup
  
  devServer.on('error', (error) => {
    console.error('❌ Dev server error:', error);
    process.exit(1);
  });
});

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(0);
});
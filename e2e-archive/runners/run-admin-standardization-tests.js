#!/usr/bin/env node

/**
 * Admin Standardization Test Runner
 * 
 * Runs comprehensive standardization tests for admin pages and ensures 100% pass rate
 */

const { spawn } = require('child_process');
const path = require('path');

class AdminStandardizationTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Admin Standardization Comprehensive',
        script: '../admin/admin-standardization-comprehensive.js',
        description: 'Tests all standardization features across Projects, Quotes, and Requests'
      },
      {
        name: 'Admin Responsive Framework',
        script: '../admin/admin-responsive-standardized.js', 
        description: 'Tests responsive design and framework functionality'
      }
    ];
    
    this.results = [];
  }

  // Kill any existing node processes to prevent conflicts
  async killExistingProcesses() {
    console.log('🧹 Cleaning up existing node processes...');
    
    return new Promise((resolve) => {
      const killProcess = spawn('killall', ['node'], { stdio: 'inherit' });
      
      killProcess.on('close', (code) => {
        console.log(`✅ Process cleanup complete (exit code: ${code})`);
        // Wait a moment for processes to fully terminate
        setTimeout(resolve, 2000);
      });
      
      killProcess.on('error', (err) => {
        console.log('ℹ️ No existing node processes found to clean up');
        resolve();
      });
    });
  }

  // Start development server
  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      this.devServer = spawn('npm', ['run', 'dev'], {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'pipe',
        detached: false
      });

      let serverReady = false;
      
      this.devServer.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        
        if (output.includes('Ready in') || output.includes('✓ Ready')) {
          if (!serverReady) {
            serverReady = true;
            console.log('✅ Development server ready');
            // Wait a bit more for full compilation
            setTimeout(resolve, 3000);
          }
        }
      });

      this.devServer.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('webpack-hmr')) {
          process.stderr.write(output);
        }
      });

      this.devServer.on('error', reject);
      
      // Timeout after 60 seconds
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Development server failed to start within 60 seconds'));
        }
      }, 60000);
    });
  }

  // Stop development server
  async stopDevServer() {
    if (this.devServer) {
      console.log('🛑 Stopping development server...');
      this.devServer.kill('SIGTERM');
      
      return new Promise((resolve) => {
        this.devServer.on('close', () => {
          console.log('✅ Development server stopped');
          resolve();
        });
        
        // Force kill after 5 seconds if graceful shutdown fails
        setTimeout(() => {
          if (this.devServer) {
            this.devServer.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    }
  }

  // Run a single test suite
  async runTestSuite(testSuite) {
    console.log(`\n🧪 Running ${testSuite.name}...`);
    console.log(`📝 ${testSuite.description}`);
    console.log('───────────────────────────────────────────────────────────────');
    
    const scriptPath = path.resolve(__dirname, testSuite.script);
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..')
      });

      const startTime = Date.now();
      
      testProcess.on('close', (code) => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const success = code === 0;
        
        const result = {
          name: testSuite.name,
          success,
          code,
          duration
        };
        
        if (success) {
          console.log(`✅ ${testSuite.name} PASSED (${duration}s)`);
        } else {
          console.log(`❌ ${testSuite.name} FAILED (exit code: ${code}, ${duration}s)`);
        }
        
        this.results.push(result);
        resolve(result);
      });

      testProcess.on('error', (err) => {
        console.error(`💥 Error running ${testSuite.name}:`, err.message);
        this.results.push({
          name: testSuite.name,
          success: false,
          error: err.message,
          duration: Math.round((Date.now() - startTime) / 1000)
        });
        resolve({ success: false, error: err.message });
      });
    });
  }

  // Generate final report
  generateFinalReport() {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 ADMIN STANDARDIZATION TEST SUITE FINAL REPORT');
    console.log('═'.repeat(70));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`   Pass Rate: ${passRate}% ${passRate === 100 ? '🎉' : passRate >= 80 ? '👍' : '⚠️'}`);
    console.log(`   Total Duration: ${totalDuration}s`);

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? `${result.duration}s` : 'N/A';
      console.log(`   ${index + 1}. ${result.name}: ${status} (${duration})`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (passRate === 100) {
      console.log('   🎉 Perfect! All admin standardization features are working correctly.');
      console.log('   ✅ Your admin pages are fully standardized and ready for production.');
    } else if (passRate >= 80) {
      console.log('   👍 Good! Most standardization features are working.');
      console.log('   🔧 Review failed tests and address any remaining issues.');
    } else {
      console.log('   ⚠️ Standardization improvements needed.');
      console.log('   🚨 Several features require attention before deployment.');
      console.log('   📋 Prioritize fixing failed tests for better user experience.');
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`🎯 FINAL RESULT: ${passRate === 100 ? 'SUCCESS' : 'NEEDS WORK'} (${passRate}% pass rate)`);
    console.log('═'.repeat(70));

    return passRate === 100;
  }

  // Run all standardization tests
  async runAllTests() {
    console.log('🔄 ADMIN STANDARDIZATION COMPREHENSIVE TEST RUNNER');
    console.log('═'.repeat(70));
    console.log('🎯 Goal: Ensure 100% pass rate for all admin standardization features');
    console.log('📊 Testing: Archive Toggle, Refresh, Filters, StatusPill, Actions, Responsive');
    console.log('═'.repeat(70));

    const startTime = Date.now();

    try {
      // Step 1: Clean up existing processes
      await this.killExistingProcesses();

      // Step 2: Start development server
      await this.startDevServer();

      // Step 3: Run all test suites
      console.log('\n🧪 EXECUTING TEST SUITES:');
      for (const testSuite of this.testSuites) {
        await this.runTestSuite(testSuite);
      }

      // Step 4: Stop development server
      await this.stopDevServer();

      // Step 5: Generate final report
      const allTestsPassed = this.generateFinalReport();

      const totalDuration = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n⏱️ Total execution time: ${totalDuration}s`);

      return allTestsPassed;

    } catch (error) {
      console.error('\n💥 Test Runner Error:', error.message);
      
      // Ensure server is stopped on error
      await this.stopDevServer();
      
      return false;
    }
  }
}

// Main execution
async function main() {
  const runner = new AdminStandardizationTestRunner();
  
  try {
    const success = await runner.runAllTests();
    
    if (success) {
      console.log('\n🎉 All admin standardization tests PASSED! ');
      console.log('✅ Ready for production deployment.');
    } else {
      console.log('\n⚠️ Some tests FAILED. Review issues before deployment.');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test Runner Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminStandardizationTestRunner;
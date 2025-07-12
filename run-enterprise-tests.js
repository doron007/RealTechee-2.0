#!/usr/bin/env node

/**
 * Enterprise Test Runner
 * 
 * Multi-mode test execution system:
 * - Semi-Automatic (Default): Human-AI collaborative testing
 * - Fully-Automatic: Complete automation (existing system)
 * - Validation-Only: Framework validation without browser testing
 */

const SemiAutoTestCoordinator = require('./e2e/SemiAutoTestCoordinator');
const ModularAdminTestRunner = require('./e2e/ModularAdminTestRunner');
const { execSync } = require('child_process');

class EnterpriseTestRunner {
  constructor() {
    this.modes = {
      'semi-auto': {
        name: 'Semi-Automatic (Human-AI Collaborative)',
        description: 'Human handles setup/priming, AI handles testing',
        recommended: true,
        reliability: 'High',
        setupTime: '5-15 minutes',
        testingTime: '10-20 minutes'
      },
      'fully-auto': {
        name: 'Fully-Automatic',
        description: 'Complete automation including server management',
        recommended: false,
        reliability: 'Variable (depends on system state)',
        setupTime: '1-5 minutes',
        testingTime: '10-20 minutes'
      },
      'validation-only': {
        name: 'Framework Validation Only',
        description: 'Test framework components without browser automation',
        recommended: false,
        reliability: 'High',
        setupTime: '30 seconds',
        testingTime: '2-5 minutes'
      }
    };
  }

  /**
   * Display available modes and get user selection
   */
  async selectMode() {
    console.log('\n🏢 ENTERPRISE TEST RUNNER');
    console.log('═'.repeat(60));
    console.log('👥 Human-AI Collaborative Quality Assurance System');
    console.log('═'.repeat(60));
    
    console.log('\n📋 AVAILABLE TEST MODES:\n');
    
    Object.entries(this.modes).forEach(([key, mode], index) => {
      const recommended = mode.recommended ? '⭐ RECOMMENDED' : '';
      console.log(`${index + 1}. ${mode.name} ${recommended}`);
      console.log(`   📝 ${mode.description}`);
      console.log(`   🎯 Reliability: ${mode.reliability}`);
      console.log(`   ⏱️  Setup: ${mode.setupTime} | Testing: ${mode.testingTime}`);
      console.log('');
    });
    
    console.log('💡 RECOMMENDATION:');
    console.log('   Use Semi-Automatic mode for most reliable results.');
    console.log('   It combines human reliability for setup with AI precision for testing.\n');
    
    // Get mode from command line argument or prompt user
    const args = process.argv.slice(2);
    if (args.length > 0) {
      const modeArg = args[0];
      if (this.modes[modeArg]) {
        return modeArg;
      } else {
        console.log(`❌ Invalid mode: ${modeArg}`);
        console.log(`Valid modes: ${Object.keys(this.modes).join(', ')}`);
        process.exit(1);
      }
    }
    
    // Default to semi-auto if no argument provided
    console.log('🎯 No mode specified - defaulting to Semi-Automatic mode');
    console.log('   Use: node run-enterprise-tests.js [mode] to specify different mode\n');
    
    return 'semi-auto';
  }

  /**
   * Execute tests in selected mode
   */
  async executeMode(mode) {
    console.log(`\n🚀 EXECUTING: ${this.modes[mode].name}`);
    console.log('═'.repeat(60));
    
    try {
      switch (mode) {
        case 'semi-auto':
          await this.executeSemiAutoMode();
          break;
          
        case 'fully-auto':
          await this.executeFullyAutoMode();
          break;
          
        case 'validation-only':
          await this.executeValidationMode();
          break;
          
        default:
          throw new Error(`Unknown mode: ${mode}`);
      }
      
    } catch (error) {
      console.error(`💥 ${this.modes[mode].name} failed:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Execute semi-automatic mode
   */
  async executeSemiAutoMode() {
    console.log('👥 Starting Human-AI Collaborative Testing (Streamlined)');
    console.log('🎯 Optimized UX with auto-execution and numbered responses');
    
    const StreamlinedTestCoordinator = require('./e2e/StreamlinedTestCoordinator');
    const coordinator = new StreamlinedTestCoordinator({
      mode: 'semi-auto',
      baseUrl: 'http://localhost:3000'
    });
    
    await coordinator.run();
  }

  /**
   * Execute fully automatic mode
   */
  async executeFullyAutoMode() {
    console.log('🤖 Starting Fully Automatic Testing');
    console.log('⚠️  Note: This mode may be less reliable due to variable build/server timing');
    
    console.log('\n🧹 Cleaning existing processes...');
    try {
      execSync('killall "node"', { stdio: 'ignore' });
    } catch (error) {
      // Ignore error if no processes to kill
    }
    
    console.log('🏗️  Starting development server...');
    // This would need to be implemented with proper server management
    // For now, advise user to use semi-auto mode
    
    console.log('\n💡 RECOMMENDATION: Use Semi-Automatic mode for better reliability');
    console.log('   The fully-automatic mode requires additional server management logic');
    console.log('   Run: node run-enterprise-tests.js semi-auto');
    
    // Fallback to existing modular test runner
    const testRunner = new ModularAdminTestRunner();
    await testRunner.run();
  }

  /**
   * Execute validation-only mode
   */
  async executeValidationMode() {
    console.log('🔍 Starting Framework Validation');
    console.log('📋 Testing framework components without browser automation');
    
    try {
      console.log('\n1. Framework Component Validation...');
      execSync('node test-framework-components.js', { stdio: 'inherit' });
      
      console.log('\n2. Module Structure Validation...');
      execSync('node validate-modular-framework.js', { stdio: 'inherit' });
      
      console.log('\n✅ VALIDATION COMPLETE');
      console.log('🎯 All framework components operational');
      console.log('📋 Ready for browser-based testing when server is available');
      
    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Main execution
   */
  async run() {
    try {
      const selectedMode = await this.selectMode();
      await this.executeMode(selectedMode);
      
    } catch (error) {
      console.error('💥 Enterprise test runner error:', error.message);
      process.exit(1);
    }
  }
}

// Usage instructions
function showUsage() {
  console.log('\n📖 USAGE:');
  console.log('node run-enterprise-tests.js [mode]');
  console.log('\nMODES:');
  console.log('  semi-auto      Semi-Automatic (Human-AI Collaborative) [DEFAULT]');
  console.log('  fully-auto     Fully-Automatic (Complete automation)');
  console.log('  validation-only Framework validation without browser testing');
  console.log('\nEXAMPLES:');
  console.log('  node run-enterprise-tests.js                # Semi-automatic mode');
  console.log('  node run-enterprise-tests.js semi-auto      # Semi-automatic mode');
  console.log('  node run-enterprise-tests.js fully-auto     # Fully-automatic mode');
  console.log('  node run-enterprise-tests.js validation-only # Validation only');
}

// Handle help requests
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the enterprise test runner
const runner = new EnterpriseTestRunner();
runner.run().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});
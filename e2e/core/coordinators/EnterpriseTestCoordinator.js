/**
 * Enterprise Test Coordinator
 * 
 * Clean, enterprise-grade test coordinator that orchestrates
 * all test phases using the hierarchical reporting structure
 */

const EnhancedTestReporter = require('../framework/EnhancedTestReporter');
const TestConfig = require('../../config/TestConfig');
const SystemPrimingTests = require('../../tests/system-priming/SystemPrimingTests');
const AuthenticationTests = require('../../tests/authentication/AuthenticationTests');
const ProjectsPageTests = require('../../tests/pages/projects/ProjectsPageTests');

const puppeteer = require('puppeteer');
const readline = require('readline');

class EnterpriseTestCoordinator {
  constructor(options = {}) {
    this.config = TestConfig.getConfig(options);
    this.mode = options.mode || 'enterprise';
    
    this.reporter = new EnhancedTestReporter('enterprise-test-suite', {
      baseDir: this.config.reporting.baseDir,
      mode: this.mode,
      metadata: {
        testType: 'enterprise-automated',
        mode: this.mode,
        coordinator: 'enterprise-grade'
      }
    });
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser for testing
   */
  async initializeBrowser() {
    console.log('🔧 Initializing browser...');
    
    this.browser = await puppeteer.launch(this.config.browser);
    this.page = await this.browser.newPage();
    
    const timeouts = this.config.timeouts;
    this.page.setDefaultNavigationTimeout(timeouts.navigation);
    this.page.setDefaultTimeout(timeouts.element);
    
    console.log('✅ Browser initialized');
    return true;
  }

  /**
   * Execute System Priming Phase
   */
  async executeSystemPrimingPhase() {
    console.log('\n🏗️ SYSTEM PRIMING PHASE');
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('systemPriming');
    
    const systemTests = new SystemPrimingTests(this.reporter);
    const result = await systemTests.executeAll();
    
    this.reporter.completePhase('systemPriming');
    
    console.log(`✅ System Priming: ${result.success ? 'PASSED' : 'FAILED'}`);
    
    if (result.criticalFailed) {
      console.log('🛑 Critical system priming failed - cannot continue');
      return false;
    }
    
    return result.success;
  }

  /**
   * Execute Authentication Phase
   */
  async executeAuthenticationPhase() {
    console.log('\n🔐 AUTHENTICATION PHASE');
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('authentication');
    
    const authTests = new AuthenticationTests(
      this.reporter, 
      this.config.credentials
    );
    
    const result = await authTests.executeAll(this.page, this.config.baseUrl);
    
    this.reporter.completePhase('authentication');
    
    console.log(`✅ Authentication: ${result.success ? 'PASSED' : 'FAILED'}`);
    
    if (result.criticalFailed) {
      console.log('🛑 Critical authentication failed - cannot continue');
      return false;
    }
    
    return result.success;
  }

  /**
   * Execute Pages Phase
   */
  async executePagesPhase() {
    console.log('\n📄 PAGES TESTING PHASE');
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('pages');
    
    const results = [];
    
    // Test Projects Page
    console.log('\n📋 Testing Projects Page...');
    const projectsTests = new ProjectsPageTests(this.reporter);
    const projectsResult = await projectsTests.executeAll(this.page, this.config.baseUrl);
    results.push(projectsResult.overall);
    
    console.log(`✅ Projects Page: ${projectsResult.overall ? 'PASSED' : 'FAILED'}`);
    console.log(`   📱 Responsiveness: ${projectsResult.responsiveness ? 'PASSED' : 'FAILED'}`);
    console.log(`   ⚙️ Functionality: ${projectsResult.functionality ? 'PASSED' : 'FAILED'}`);
    
    // TODO: Add other pages (Quotes, Requests, Dashboard) as needed
    // This modular structure makes it easy to add more page tests
    
    this.reporter.completePhase('pages');
    
    const allPagesPassed = results.every(result => result === true);
    console.log(`\\n✅ All Pages: ${allPagesPassed ? 'PASSED' : 'FAILED'}`);
    
    return allPagesPassed;
  }

  /**
   * Generate final consolidated report
   */
  async generateFinalReport() {
    const reportData = this.reporter.finalize();
    
    console.log('\\n📊 ENTERPRISE TEST EXECUTION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`📊 Total Tests: ${reportData.results.summary.totalTests}`);
    console.log(`✅ Passed: ${reportData.results.summary.passed}`);
    console.log(`❌ Failed: ${reportData.results.summary.failed}`);
    console.log(`⚠️ Errors: ${reportData.results.summary.errors}`);
    console.log(`📸 Screenshots: ${reportData.results.screenshots.length}`);
    console.log(`📁 Report Directory: ${reportData.reportDir}`);
    console.log(`📄 HTML Report: ${reportData.htmlPath}`);
    
    // Show detailed phase breakdown
    console.log('\\n📋 DETAILED PHASE RESULTS:');
    console.log('─'.repeat(40));
    Object.entries(reportData.results.phases).forEach(([phaseKey, phase]) => {
      const icon = phase.status === 'passed' ? '✅' : 
                   phase.status === 'failed' ? '❌' : 
                   phase.status === 'error' ? '⚠️' : '⏭️';
      console.log(`${icon} ${phase.name}: ${phase.summary.passed}/${phase.summary.total} passed`);
      
      if (phaseKey === 'pages') {
        Object.entries(phase.pages).forEach(([pageKey, page]) => {
          const totalTests = page.responsiveness.summary.total + page.functionality.summary.total + page.tests.length;
          if (totalTests > 0) {
            const pageIcon = page.status === 'passed' ? '✅' : 
                           page.status === 'failed' ? '❌' : 
                           page.status === 'error' ? '⚠️' : '⏭️';
            console.log(`   ${pageIcon} ${page.name}:`);
            console.log(`      📱 Responsiveness: ${page.responsiveness.summary.passed}/${page.responsiveness.summary.total}`);
            console.log(`      ⚙️ Functionality: ${page.functionality.summary.passed}/${page.functionality.summary.total}`);
          }
        });
      }
    });
    
    const successRate = ((reportData.results.summary.passed / reportData.results.summary.totalTests) * 100).toFixed(1);
    console.log(`\\n📈 Overall Success Rate: ${successRate}%`);
    
    if (reportData.results.summary.failed === 0 && reportData.results.summary.errors === 0) {
      console.log('\\n🎉 ALL TESTS PASSED - ENTERPRISE SUCCESS!');
    } else {
      console.log('\\n⚠️ Some tests failed - check detailed report for analysis');
    }
    
    console.log('\\n🔍 View detailed hierarchical report:');
    console.log(`   ${reportData.htmlPath}`);
    
    return reportData;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    this.rl.close();
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🏢 ENTERPRISE TEST EXECUTION');
      console.log('═'.repeat(60));
      console.log('🎯 Mode: Enterprise Automated Testing');
      console.log('📋 Structure: Hierarchical Phase-Based Testing');
      console.log('📊 Reporting: Enhanced Drill-Down Reports');
      
      this.reporter.startTest('enterprise-automated-test');
      
      // Initialize browser
      await this.initializeBrowser();
      
      // Execute test phases in sequence
      const systemPrimingResult = await this.executeSystemPrimingPhase();
      if (!systemPrimingResult) {
        console.log('🛑 System priming failed - stopping execution');
        return;
      }
      
      const authResult = await this.executeAuthenticationPhase();
      if (!authResult) {
        console.log('🛑 Authentication failed - stopping execution');
        return;
      }
      
      const pagesResult = await this.executePagesPhase();
      
      // Generate final report
      await this.generateFinalReport();
      
      const overallSuccess = systemPrimingResult && authResult && pagesResult;
      console.log(`\\n🏁 ENTERPRISE TEST RESULT: ${overallSuccess ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
      
    } catch (error) {
      console.error('💥 Enterprise test execution error:', error.message);
      console.error(error.stack);
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = EnterpriseTestCoordinator;
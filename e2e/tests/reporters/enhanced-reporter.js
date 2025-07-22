/**
 * Enhanced Playwright Reporter
 * 
 * Custom reporter that maintains compatibility with our previous rich reporting
 * while leveraging Playwright's native capabilities.
 */

class EnhancedReporter {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      startTime: null,
      endTime: null,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      projects: {},
      suites: {}
    };
  }

  onBegin(config, suite) {
    this.results.startTime = new Date().toISOString();
    console.log('🚀 Starting Enhanced Playwright Test Suite');
    console.log('═'.repeat(60));
    
    // Display configured projects
    if (config.projects && config.projects.length > 0) {
      console.log('📋 Configured Test Projects:');
      config.projects.forEach(project => {
        console.log(`   • ${project.name}: ${project.testMatch || project.testDir || 'All tests'}`);
      });
      console.log('');
    }
  }

  onTestBegin(test, result) {
    const projectName = test.parent?.project()?.name || 'default';
    if (!this.results.projects[projectName]) {
      this.results.projects[projectName] = {
        name: projectName,
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0
      };
    }
  }

  onTestEnd(test, result) {
    this.results.totalTests++;
    const projectName = test.parent?.project()?.name || 'default';
    const project = this.results.projects[projectName];
    
    // Update counts
    switch (result.status) {
      case 'passed':
        this.results.passed++;
        project.passed++;
        console.log(`   ✅ ${test.title}`);
        break;
      case 'failed':
        this.results.failed++;
        project.failed++;
        console.log(`   ❌ ${test.title}`);
        if (result.error) {
          console.log(`      Error: ${result.error.message}`);
        }
        break;
      case 'skipped':
        this.results.skipped++;
        project.skipped++;
        console.log(`   ⏭️ ${test.title} (skipped)`);
        break;
      case 'timedOut':
        this.results.failed++;
        project.failed++;
        console.log(`   ⏰ ${test.title} (timeout)`);
        break;
    }

    // Store test details
    project.tests.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message || null,
      attachments: result.attachments || []
    });
  }

  onEnd(result) {
    this.results.endTime = new Date().toISOString();
    const duration = result.duration || 0;
    
    console.log('\n' + '═'.repeat(60));
    console.log('🏁 Enhanced Test Suite Complete');
    console.log('═'.repeat(60));
    
    // Overall results
    console.log('📊 Overall Results:');
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   ⏭️ Skipped: ${this.results.skipped}`);
    console.log(`   ⏱️ Duration: ${this.formatDuration(duration)}`);
    
    const successRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(1)
      : 0;
    console.log(`   📈 Success Rate: ${successRate}%`);
    
    // Project breakdown
    if (Object.keys(this.results.projects).length > 1) {
      console.log('\n📋 Project Breakdown:');
      Object.values(this.results.projects).forEach(project => {
        console.log(`   ${project.name}: ${project.passed}/${project.tests.length} passed`);
      });
    }
    
    // Report locations
    console.log('\n📊 Reports Generated:');
    console.log('   📄 HTML Report: npx playwright show-report');
    console.log('   📄 JSON Results: test-results/playwright-results.json');
    console.log('   📸 Screenshots: Available in HTML report');
    
    // Performance insights
    if (duration > 60000) {
      console.log(`\n⚠️ Long test duration detected: ${this.formatDuration(duration)}`);
      console.log('   Consider running tests in parallel or optimizing slow tests');
    }
    
    // Summary
    const status = this.results.failed === 0 ? 'PASSED' : 'FAILED';
    const emoji = this.results.failed === 0 ? '🎉' : '💥';
    console.log(`\n${emoji} Test Suite: ${status}`);
    
    if (this.results.failed > 0) {
      console.log('❌ Failed tests require attention before deployment');
    } else {
      console.log('✅ All tests passed - ready for deployment');
    }
    
    console.log('═'.repeat(60));
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // Compatibility methods for potential future extensions
  captureScreenshot() {
    // Screenshots are handled automatically by Playwright
    return 'Handled by Playwright';
  }

  generateReport() {
    // HTML report is generated automatically by Playwright
    return 'Generated by Playwright HTML reporter';
  }
}

module.exports = EnhancedReporter;
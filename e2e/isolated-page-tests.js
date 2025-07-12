/**
 * Isolated Page Testing Menu
 * 
 * This script allows testing specific pages independently, assuming:
 * - System is already primed (dev server running)
 * - User is already logged in (session active)
 * - Can run individual page tests without full system setup
 */

const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// Import test frameworks and page tests
const ResponsiveTestFramework = require('./test-framework/ResponsiveTestFramework');
const ProjectsPageTests = require('./tests/pages/projects/ProjectsPageTests');

class IsolatedPageTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.credentials = { 
      email: 'info@realtechee.com', 
      password: 'Sababa123!' 
    };
    this.availablePages = {
      'admin-projects': {
        name: 'Admin Projects',
        path: '/admin/projects',
        testClass: ProjectsPageTests,
        description: 'Comprehensive testing for Projects management page including data grid, search, filters, and card views'
      },
      // Future pages can be added here
      'admin-quotes': {
        name: 'Admin Quotes',
        path: '/admin/quotes', 
        testClass: null, // To be implemented
        description: 'Testing for Quotes management page (not yet implemented)'
      },
      'admin-requests': {
        name: 'Admin Requests',
        path: '/admin/requests',
        testClass: null, // To be implemented  
        description: 'Testing for Requests management page (not yet implemented)'
      }
    };
  }

  async showMenu() {
    console.log('\n🔬 Isolated Page Testing Menu');
    console.log('=====================================');
    console.log('⚠️  Prerequisites:');
    console.log('   • Dev server must be running (npm run dev)');
    console.log('   • User must be logged in with admin credentials');
    console.log('   • System should be in a stable state\n');
    
    console.log('📋 Available Page Tests:');
    Object.entries(this.availablePages).forEach(([key, page], index) => {
      const status = page.testClass ? '✅' : '🚧';
      console.log(`   ${index + 1}. ${status} ${page.name} - ${page.description}`);
    });
    
    console.log('\n📋 Additional Options:');
    console.log('   0. Exit');
    console.log('   h. Show help');
    console.log('   s. System status check');
    
    return this.getUserChoice();
  }

  async getUserChoice() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n👉 Select option (1-' + Object.keys(this.availablePages).length + ', 0, h, s): ', (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  async handleUserChoice(choice) {
    switch (choice) {
      case '0':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
        
      case 'h':
        await this.showHelp();
        break;
        
      case 's':
        await this.checkSystemStatus();
        break;
        
      default:
        const pageIndex = parseInt(choice) - 1;
        const pageKeys = Object.keys(this.availablePages);
        
        if (pageIndex >= 0 && pageIndex < pageKeys.length) {
          const pageKey = pageKeys[pageIndex];
          const page = this.availablePages[pageKey];
          
          if (page.testClass) {
            await this.runPageTest(pageKey, page);
          } else {
            console.log(`❌ Tests for ${page.name} are not yet implemented`);
          }
        } else {
          console.log('❌ Invalid option. Please try again.');
        }
    }
  }

  async showHelp() {
    console.log('\n📖 Help - Isolated Page Testing');
    console.log('=================================');
    console.log('');
    console.log('🎯 Purpose:');
    console.log('   Run tests for specific admin pages without full system setup');
    console.log('');
    console.log('🔧 Prerequisites:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Login to admin: http://localhost:3000/admin');
    console.log('   3. Use credentials: info@realtechee.com / Sababa123!');
    console.log('   4. Keep browser session active');
    console.log('');
    console.log('📋 Test Coverage:');
    console.log('   • Data loading and display verification');
    console.log('   • Search functionality across multiple fields');
    console.log('   • Filter operations (status, product, etc.)');
    console.log('   • View mode switching (table/cards)');
    console.log('   • Responsive design across breakpoints');
    console.log('   • Action button functionality');
    console.log('   • Pagination and sorting controls');
    console.log('');
    console.log('📊 Test Results:');
    console.log('   Results saved to: test-results/[TestName]-[Timestamp]/');
    console.log('   • Interactive HTML reports');
    console.log('   • Screenshots for passed/failed tests');
    console.log('   • Detailed JSON data');
    console.log('   • Test execution logs');
  }

  async checkSystemStatus() {
    console.log('\n🔍 Checking System Status...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Check if dev server is running
      console.log('   📡 Checking dev server...');
      try {
        await page.goto(this.baseUrl, { timeout: 5000 });
        console.log('   ✅ Dev server is running');
      } catch (error) {
        console.log('   ❌ Dev server not accessible');
        console.log('   💡 Run: npm run dev');
        return;
      }
      
      // Check if user is logged in
      console.log('   🔐 Checking authentication...');
      try {
        await page.goto(`${this.baseUrl}/admin`, { timeout: 10000 });
        
        // Wait for either login form or admin content
        const loginForm = await page.$('input[type="email"], input[type="password"]');
        const adminContent = await page.$('h1, .admin-layout, [data-testid="admin-data-grid"]');
        
        if (loginForm && !adminContent) {
          console.log('   ⚠️  User not logged in');
          console.log('   💡 Login at: http://localhost:3000/admin');
          console.log('   💡 Use: info@realtechee.com / Sababa123!');
        } else if (adminContent) {
          console.log('   ✅ User is logged in');
        } else {
          console.log('   ❓ Authentication status unclear');
        }
      } catch (error) {
        console.log('   ❌ Cannot access admin pages');
      }
      
      // Check specific page accessibility  
      console.log('   📋 Checking page accessibility...');
      for (const [key, pageInfo] of Object.entries(this.availablePages)) {
        if (pageInfo.testClass) {
          try {
            await page.goto(`${this.baseUrl}${pageInfo.path}`, { timeout: 8000 });
            const hasContent = await page.$('h1, .admin-layout, [data-testid="admin-data-grid"]');
            console.log(`   ${hasContent ? '✅' : '❌'} ${pageInfo.name}`);
          } catch (error) {
            console.log(`   ❌ ${pageInfo.name} - ${error.message}`);
          }
        }
      }
      
    } finally {
      await browser.close();
    }
  }

  async runPageTest(pageKey, pageInfo) {
    console.log(`\n🚀 Running tests for ${pageInfo.name}...`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Create test framework instance
      const testFramework = new ResponsiveTestFramework(`Isolated-${pageInfo.name.replace(/\s+/g, '-')}`, {
        baseUrl: this.baseUrl,
        credentials: this.credentials,
        skipSystemPrime: true,  // Skip system setup
        // Let authentication run normally using existing AuthenticationTests
        browser: {
          headless: false,  // Use visible browser like working tests
          slowMo: 0,
          defaultViewport: { width: 1200, height: 800 },
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      
      // Create page test instance
      const pageTestInstance = new pageInfo.testClass(testFramework.reporter);
      
      // Define custom tests for this page
      const customTests = {
        functionality: [
          { 
            name: 'data-loading', 
            testFn: pageTestInstance.executeDataLoadingTest.bind(pageTestInstance) 
          },
          { 
            name: 'search-functionality', 
            testFn: pageTestInstance.executeSearchFunctionalityTest.bind(pageTestInstance) 
          },
          { 
            name: 'filter-operations', 
            testFn: pageTestInstance.executeFilterFunctionalityTest.bind(pageTestInstance) 
          },
          { 
            name: 'view-mode-toggle', 
            testFn: pageTestInstance.executeViewModeToggleTest.bind(pageTestInstance) 
          },
          { 
            name: 'archive-toggle', 
            testFn: pageTestInstance.executeArchiveToggleTest.bind(pageTestInstance) 
          },
          { 
            name: 'action-buttons', 
            testFn: pageTestInstance.executeActionButtonsTest.bind(pageTestInstance) 
          },
          { 
            name: 'pagination', 
            testFn: pageTestInstance.executePaginationTest.bind(pageTestInstance) 
          }
        ],
        responsive: [] // Will use default responsive tests
      };
      
      // Run the test suite
      await testFramework.runFullSuite(pageInfo.path, customTests);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✨ Test completed in ${duration}s`);
      
      // Show results location
      const resultsDir = testFramework.reporter.getResultsPath();
      console.log(`📊 Results: ${resultsDir}/report.html`);
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      console.error('Stack trace:', error.stack);
    }
  }

  async run() {
    console.log('🔬 Isolated Page Test Runner');
    console.log('============================');
    
    try {
      while (true) {
        const choice = await this.showMenu();
        await this.handleUserChoice(choice);
        
        // Add small delay before showing menu again
        if (choice !== '0') {
          console.log('\n' + '─'.repeat(50));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('❌ Runner error:', error.message);
      process.exit(1);
    }
  }
}

// Run the isolated test runner if called directly
if (require.main === module) {
  const runner = new IsolatedPageTestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = IsolatedPageTestRunner;
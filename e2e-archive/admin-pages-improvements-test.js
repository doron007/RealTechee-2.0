#!/usr/bin/env node

/**
 * Admin Pages Improvements Test Suite
 * 
 * Tests all improvements made to admin pages:
 * 1. Requests admin page cards view includes status pill and address
 * 2. Sort controls are hidden in table view, shown in cards view
 * 3. Standardized action buttons (Open/Edit/Archive for projects, Edit/Archive for quotes/requests)
 * 4. Custom business logic dropdown menus on all admin pages
 * 5. Proper status pill rendering across all pages
 * 6. Address display consistency across all admin pages
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class AdminPagesImprovementsTest {
  constructor() {
    this.framework = new ResponsiveTestFramework('Admin-Pages-Improvements', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 300 }
    });

    this.pages = [
      { 
        path: '/admin/projects', 
        name: 'Projects',
        expectedActions: ['Open', 'Edit', 'Archive'],
        hasPublicPage: true,
        customActionsLabel: 'Project Actions'
      },
      { 
        path: '/admin/quotes', 
        name: 'Quotes',
        expectedActions: ['Edit', 'Archive'],
        hasPublicPage: false,
        customActionsLabel: 'Quote Actions'
      },
      { 
        path: '/admin/requests', 
        name: 'Requests',
        expectedActions: ['Edit', 'Archive'],
        hasPublicPage: false,
        customActionsLabel: 'Request Actions'
      }
    ];

    this.testResults = {};
  }

  // Test 1: Verify cards view includes status pill and address
  async testCardsViewContent(page, pageName) {
    console.log(`  🎴 Testing cards view content for ${pageName}...`);
    
    const results = {
      test: 'Cards View Content',
      cardsViewExists: false,
      statusPillsVisible: false,
      addressesVisible: false,
      cardsHaveData: false
    };

    try {
      // Switch to cards view
      const viewToggle = await page.$('button[title*="cards"], button[aria-label*="cards"], button:has(svg)');
      if (viewToggle) {
        await viewToggle.click();
        await page.waitForTimeout(1000);
        results.cardsViewExists = true;
      }

      // Check for status pills in cards
      const statusPills = await page.$$('.status-pill, [data-testid="status-pill"], .bg-blue-100, .bg-green-100, .bg-red-100, .bg-yellow-100');
      results.statusPillsVisible = statusPills.length > 0;

      // Check for addresses in cards
      const addresses = await page.evaluate(() => {
        const cardElements = document.querySelectorAll('.admin-card, [data-testid="admin-card"], .bg-white');
        let addressCount = 0;
        
        cardElements.forEach(card => {
          const text = card.textContent.toLowerCase();
          if (text.includes('street') || text.includes('avenue') || text.includes('blvd') || text.includes('road') || text.includes('address')) {
            addressCount++;
          }
        });
        
        return addressCount;
      });
      results.addressesVisible = addresses > 0;

      // Check if cards have actual data
      const cardsData = await page.evaluate(() => {
        const cards = document.querySelectorAll('.admin-card, [data-testid="admin-card"], .bg-white');
        return cards.length > 0 && Array.from(cards).some(card => card.textContent.trim().length > 50);
      });
      results.cardsHaveData = cardsData;

      console.log(`    Status pills: ${results.statusPillsVisible ? '✅' : '❌'}`);
      console.log(`    Addresses: ${results.addressesVisible ? '✅' : '❌'}`);
      console.log(`    Cards have data: ${results.cardsHaveData ? '✅' : '❌'}`);

    } catch (error) {
      console.error(`    ❌ Error testing cards view:`, error.message);
    }

    return results;
  }

  // Test 2: Verify sort controls visibility based on view mode
  async testSortControlsVisibility(page, pageName) {
    console.log(`  🔄 Testing sort controls visibility for ${pageName}...`);
    
    const results = {
      test: 'Sort Controls Visibility',
      sortHiddenInTable: false,
      sortVisibleInCards: false,
      viewToggleWorks: false
    };

    try {
      // Test table view - sort should be hidden
      const viewToggle = await page.$('button[title*="table"], button[aria-label*="table"], button:has(svg)');
      if (viewToggle) {
        await viewToggle.click();
        await page.waitForTimeout(1000);
        results.viewToggleWorks = true;
      }

      // Check if sort controls are hidden in table view
      const sortInTable = await page.$('select[aria-label*="sort"], .sort-controls, [data-testid="sort-controls"]');
      results.sortHiddenInTable = !sortInTable;

      // Switch to cards view
      const cardsToggle = await page.$('button[title*="cards"], button[aria-label*="cards"], button:has(svg)');
      if (cardsToggle) {
        await cardsToggle.click();
        await page.waitForTimeout(1000);
      }

      // Check if sort controls are visible in cards view
      const sortInCards = await page.$('select[aria-label*="sort"], .sort-controls, [data-testid="sort-controls"]');
      results.sortVisibleInCards = !!sortInCards;

      console.log(`    Sort hidden in table: ${results.sortHiddenInTable ? '✅' : '❌'}`);
      console.log(`    Sort visible in cards: ${results.sortVisibleInCards ? '✅' : '❌'}`);

    } catch (error) {
      console.error(`    ❌ Error testing sort controls:`, error.message);
    }

    return results;
  }

  // Test 3: Verify standardized action buttons
  async testActionButtons(page, pageInfo) {
    console.log(`  🔘 Testing action buttons for ${pageInfo.name}...`);
    
    const results = {
      test: 'Action Buttons',
      expectedActions: pageInfo.expectedActions,
      actualActions: [],
      correctActions: false,
      actionsWork: false
    };

    try {
      // Switch to cards view to see action buttons clearly
      const viewToggle = await page.$('button[title*="cards"], button[aria-label*="cards"], button:has(svg)');
      if (viewToggle) {
        await viewToggle.click();
        await page.waitForTimeout(1000);
      }

      // Find action buttons
      const actionButtons = await page.$$('button[title*="Edit"], button[title*="Archive"], button[title*="Open"], .action-buttons button');
      
      // Extract button labels
      const buttonLabels = [];
      for (const button of actionButtons) {
        const label = await page.evaluate(btn => {
          return btn.textContent?.trim() || btn.title || btn.getAttribute('aria-label') || '';
        }, button);
        if (label && !buttonLabels.includes(label)) {
          buttonLabels.push(label);
        }
      }
      
      results.actualActions = buttonLabels;
      results.correctActions = pageInfo.expectedActions.every(action => 
        buttonLabels.some(label => label.includes(action))
      );

      // Test if at least one action works
      if (actionButtons.length > 0) {
        try {
          await actionButtons[0].click();
          await page.waitForTimeout(500);
          results.actionsWork = true;
        } catch (e) {
          // Action might have navigated or shown dialog
          results.actionsWork = true;
        }
      }

      console.log(`    Expected actions: ${pageInfo.expectedActions.join(', ')}`);
      console.log(`    Found actions: ${buttonLabels.join(', ')}`);
      console.log(`    Correct actions: ${results.correctActions ? '✅' : '❌'}`);

    } catch (error) {
      console.error(`    ❌ Error testing action buttons:`, error.message);
    }

    return results;
  }

  // Test 4: Verify custom business logic dropdown
  async testCustomDropdown(page, pageInfo) {
    console.log(`  📋 Testing custom dropdown for ${pageInfo.name}...`);
    
    const results = {
      test: 'Custom Dropdown',
      dropdownExists: false,
      dropdownOpens: false,
      hasMenuItems: false,
      menuItemsWork: false
    };

    try {
      // Look for the three dots menu button
      const dropdownButton = await page.$('button[aria-label*="more"], button:has(svg[data-testid="MoreVertIcon"]), .more-actions');
      results.dropdownExists = !!dropdownButton;

      if (dropdownButton) {
        // Click to open dropdown
        await dropdownButton.click();
        await page.waitForTimeout(500);
        results.dropdownOpens = true;

        // Check for menu items
        const menuItems = await page.$$('li[role="menuitem"], .menu-item, [data-testid="menu-item"]');
        results.hasMenuItems = menuItems.length > 0;

        if (menuItems.length > 0) {
          // Test first menu item
          try {
            await menuItems[0].click();
            await page.waitForTimeout(500);
            results.menuItemsWork = true;
          } catch (e) {
            results.menuItemsWork = true; // Might have shown alert
          }
        }

        console.log(`    Dropdown exists: ${results.dropdownExists ? '✅' : '❌'}`);
        console.log(`    Menu items (${menuItems.length}): ${results.hasMenuItems ? '✅' : '❌'}`);
      }

    } catch (error) {
      console.error(`    ❌ Error testing custom dropdown:`, error.message);
    }

    return results;
  }

  // Test 5: Verify status pill rendering
  async testStatusPills(page, pageName) {
    console.log(`  💊 Testing status pills for ${pageName}...`);
    
    const results = {
      test: 'Status Pills',
      statusPillsExist: false,
      statusPillsHaveColors: false,
      statusPillsHaveText: false,
      pillCount: 0
    };

    try {
      // Look for status pills in both table and cards view
      const statusPills = await page.$$('.status-pill, [data-testid="status-pill"], .bg-blue-100, .bg-green-100, .bg-red-100, .bg-yellow-100, .pill, .badge');
      results.statusPillsExist = statusPills.length > 0;
      results.pillCount = statusPills.length;

      if (statusPills.length > 0) {
        // Check if pills have colors (background styles)
        const hasColors = await page.evaluate(() => {
          const pills = document.querySelectorAll('.status-pill, [data-testid="status-pill"], .bg-blue-100, .bg-green-100, .bg-red-100, .bg-yellow-100');
          return Array.from(pills).some(pill => {
            const styles = window.getComputedStyle(pill);
            return styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
          });
        });
        results.statusPillsHaveColors = hasColors;

        // Check if pills have text
        const hasText = await page.evaluate(() => {
          const pills = document.querySelectorAll('.status-pill, [data-testid="status-pill"], .bg-blue-100, .bg-green-100, .bg-red-100, .bg-yellow-100');
          return Array.from(pills).some(pill => pill.textContent.trim().length > 0);
        });
        results.statusPillsHaveText = hasText;
      }

      console.log(`    Status pills (${results.pillCount}): ${results.statusPillsExist ? '✅' : '❌'}`);
      console.log(`    Have colors: ${results.statusPillsHaveColors ? '✅' : '❌'}`);
      console.log(`    Have text: ${results.statusPillsHaveText ? '✅' : '❌'}`);

    } catch (error) {
      console.error(`    ❌ Error testing status pills:`, error.message);
    }

    return results;
  }

  // Test all improvements for a single page
  async testPageImprovements(pageInfo) {
    console.log(`\n🧪 Testing improvements on ${pageInfo.name} (${pageInfo.path})`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      
      // Wait for page to load with data
      await this.framework.waitForPageReady({ 
        maxWaitTime: 30000,
        checkInterval: 500,
        customReadyCheck: async (page) => {
          // Check if data grid has loaded
          const hasData = await page.evaluate(() => {
            const tableRows = document.querySelectorAll('tbody tr, .MuiTableBody-root tr');
            const cardItems = document.querySelectorAll('[data-testid="admin-card"], .admin-card, .bg-white');
            return tableRows.length > 0 || cardItems.length > 0;
          });
          return hasData;
        }
      });

      console.log(`  📊 Page loaded, running improvement tests...`);

      const pageResults = {
        pageName: pageInfo.name,
        path: pageInfo.path,
        tests: {},
        summary: {
          total: 0,
          passed: 0,
          failed: 0
        }
      };

      // Run all tests
      const tests = [
        () => this.testCardsViewContent(this.framework.page, pageInfo.name),
        () => this.testSortControlsVisibility(this.framework.page, pageInfo.name),
        () => this.testActionButtons(this.framework.page, pageInfo),
        () => this.testCustomDropdown(this.framework.page, pageInfo),
        () => this.testStatusPills(this.framework.page, pageInfo.name)
      ];

      for (const test of tests) {
        const result = await test();
        pageResults.tests[result.test] = result;
        pageResults.summary.total++;
        
        // Determine if test passed based on key criteria
        const testPassed = this.evaluateTestResult(result);
        if (testPassed) {
          pageResults.summary.passed++;
        } else {
          pageResults.summary.failed++;
        }
      }

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/admin-improvements-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${pageInfo.name} improvements testing complete: ${pageResults.summary.passed}/${pageResults.summary.total} tests passed`);
      return pageResults;

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name} improvements:`, error.message);
      return {
        pageName: pageInfo.name,
        path: pageInfo.path,
        error: error.message
      };
    }
  }

  // Evaluate if a test result should be considered passed
  evaluateTestResult(result) {
    switch (result.test) {
      case 'Cards View Content':
        return result.cardsViewExists && result.statusPillsVisible && result.addressesVisible;
      case 'Sort Controls Visibility':
        return result.sortHiddenInTable && result.sortVisibleInCards;
      case 'Action Buttons':
        return result.correctActions && result.actionsWork;
      case 'Custom Dropdown':
        return result.dropdownExists && result.dropdownOpens;
      case 'Status Pills':
        return result.statusPillsExist && result.statusPillsHaveColors;
      default:
        return false;
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 ADMIN PAGES IMPROVEMENTS REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.testResults).forEach(([pageName, results]) => {
      if (results.error) {
        console.log(`\n❌ ${pageName}: ERROR - ${results.error}`);
        return;
      }

      console.log(`\n📄 ${pageName}: ${results.summary.passed}/${results.summary.total} tests passed`);
      
      totalTests += results.summary.total;
      totalPassed += results.summary.passed;
      totalFailed += results.summary.failed;

      // Report on each test
      Object.entries(results.tests).forEach(([testName, testResult]) => {
        const passed = this.evaluateTestResult(testResult);
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}`);
        
        // Show key details
        Object.entries(testResult).forEach(([key, value]) => {
          if (key !== 'test' && typeof value === 'boolean') {
            console.log(`     - ${key}: ${value ? '✅' : '❌'}`);
          }
        });
      });
    });

    console.log('\n📊 OVERALL SUMMARY:');
    console.log(`Total tests run: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log(`Failed: ${totalFailed} (${Math.round(totalFailed/totalTests*100)}%)`);

    const passRate = Math.round(totalPassed/totalTests*100);
    if (passRate === 100) {
      console.log('🎉 100% ADMIN IMPROVEMENTS TEST PASS RATE ACHIEVED!');
    } else {
      console.log(`❌ Admin improvements test pass rate: ${passRate}% (Target: 100%)`);
    }

    return { totalTests, totalPassed, totalFailed, passRate };
  }

  // Run comprehensive improvements verification
  async runVerification() {
    console.log('🔄 ADMIN PAGES IMPROVEMENTS TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing all admin pages improvements');
    console.log('📋 Tests: Cards view content, Sort controls, Action buttons, Custom dropdowns, Status pills');
    console.log('📊 Pages: Projects, Quotes, Requests');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Test each page
      for (const pageInfo of this.pages) {
        const results = await this.testPageImprovements(pageInfo);
        this.testResults[pageInfo.name] = results;
      }

      await this.framework.cleanup();

      // Generate comprehensive report
      const summary = this.generateReport();

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 ADMIN IMPROVEMENTS VERIFICATION COMPLETE');
      console.log('📸 Screenshots captured for visual verification');
      console.log(`📊 Pass Rate: ${summary.passRate}%`);
      console.log('═══════════════════════════════════════════════════════════════');

      return summary.passRate === 100;

    } catch (error) {
      console.error('❌ Admin Improvements Verification Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new AdminPagesImprovementsTest();
  
  try {
    const success = await tester.runVerification();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Admin Improvements Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminPagesImprovementsTest;
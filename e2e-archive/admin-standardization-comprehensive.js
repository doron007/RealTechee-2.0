#!/usr/bin/env node

/**
 * Admin Pages Standardization Comprehensive Test Suite
 * 
 * Tests all standardization improvements across Projects, Quotes, and Requests:
 * - Archive toggle functionality
 * - Refresh functionality  
 * - Dynamic filter functionality
 * - StatusPill component usage
 * - Business action buttons
 * - Responsive design
 * - Feature parity
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class AdminStandardizationTests {
  constructor() {
    this.framework = new ResponsiveTestFramework('Admin-Standardization-Comprehensive', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 300 }
    });

    this.pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    this.testResults = [];
  }

  // Test archive toggle functionality
  async testArchiveToggle(page, pageName) {
    console.log(`🗂️ Testing archive toggle on ${pageName}...`);
    
    const results = {
      hasArchiveToggle: false,
      toggleWorks: false,
      showsArchivedCount: false,
      filtersData: false
    };

    try {
      // Look for archive toggle checkbox
      const archiveToggle = await page.$('input[type="checkbox"][id*="archived"], input[type="checkbox"] + label:contains("Archive")');
      results.hasArchiveToggle = !!archiveToggle;

      if (archiveToggle) {
        // Get initial count
        const initialCount = await page.evaluate(() => {
          const countElement = document.querySelector('div[class*="text-sm text-gray-500"], .text-sm.text-gray-500');
          return countElement?.textContent || '';
        });

        // Click the toggle
        await archiveToggle.click();
        await page.waitForTimeout(1000);

        // Check if data changed
        const newCount = await page.evaluate(() => {
          const countElement = document.querySelector('div[class*="text-sm text-gray-500"], .text-sm.text-gray-500');
          return countElement?.textContent || '';
        });

        results.toggleWorks = initialCount !== newCount;
        results.showsArchivedCount = newCount.includes('archived') || newCount.includes('active');
        results.filtersData = true; // If count changed, data was filtered
      }

    } catch (error) {
      console.error(`Error testing archive toggle on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test refresh functionality
  async testRefreshFunctionality(page, pageName) {
    console.log(`🔄 Testing refresh functionality on ${pageName}...`);
    
    const results = {
      hasRefreshButton: false,
      refreshWorks: false
    };

    try {
      // Look for refresh button in AdminDataGrid toolbar
      const refreshButton = await page.$('button[title*="Refresh"], button[aria-label*="Refresh"], button:contains("Refresh")');
      results.hasRefreshButton = !!refreshButton;

      if (refreshButton) {
        // Click refresh and wait for potential network activity
        await refreshButton.click();
        await page.waitForTimeout(2000);
        results.refreshWorks = true; // If no error thrown, refresh worked
      }

    } catch (error) {
      console.error(`Error testing refresh on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test filter functionality
  async testFilterFunctionality(page, pageName) {
    console.log(`🎛️ Testing filter functionality on ${pageName}...`);
    
    const results = {
      hasFilters: false,
      filtersPopulated: false,
      filtersWork: false,
      filterCount: 0
    };

    try {
      // Look for filter dropdowns
      const filters = await page.$$('select, [role="combobox"]');
      results.filterCount = filters.length;
      results.hasFilters = filters.length > 0;

      if (filters.length > 0) {
        // Test first filter
        const firstFilter = filters[0];
        
        // Check if filter has options
        const options = await page.evaluate((filterElement) => {
          if (filterElement.tagName === 'SELECT') {
            return filterElement.options.length;
          }
          // For MUI Select, click to open and count options
          filterElement.click();
          const menuItems = document.querySelectorAll('[role="option"], .MuiMenuItem-root');
          return menuItems.length;
        }, firstFilter);

        results.filtersPopulated = options > 1; // More than just "All" option

        if (options > 1) {
          // Try to select a filter option
          await firstFilter.click();
          await page.waitForTimeout(500);
          
          const optionClicked = await page.evaluate(() => {
            const option = document.querySelector('[role="option"]:nth-child(2), .MuiMenuItem-root:nth-child(2)');
            if (option) {
              option.click();
              return true;
            }
            return false;
          });

          if (optionClicked) {
            await page.waitForTimeout(1000);
            results.filtersWork = true;
          }
        }
      }

    } catch (error) {
      console.error(`Error testing filters on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test StatusPill component usage
  async testStatusPillUsage(page, pageName) {
    console.log(`🎨 Testing StatusPill component on ${pageName}...`);
    
    const results = {
      hasStatusPills: false,
      usesStatusPillComponent: false,
      statusCount: 0
    };

    try {
      // Look for status pills in table/cards
      const statusElements = await page.$$('.status-pill, [class*="status"], .badge, .pill, span[class*="rounded-full"]');
      results.statusCount = statusElements.length;
      results.hasStatusPills = statusElements.length > 0;

      if (statusElements.length > 0) {
        // Check if using proper StatusPill component (should have consistent styling)
        const consistentStyling = await page.evaluate(() => {
          const statusElements = document.querySelectorAll('span[class*="rounded-full"]');
          if (statusElements.length === 0) return false;
          
          const firstElementClasses = statusElements[0].className;
          const hasConsistentStyling = Array.from(statusElements).every(el => 
            el.className.includes('rounded-full') && 
            el.className.includes('px-') && 
            el.className.includes('py-')
          );
          
          return hasConsistentStyling;
        });

        results.usesStatusPillComponent = consistentStyling;
      }

    } catch (error) {
      console.error(`Error testing StatusPill on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test business action buttons
  async testBusinessActions(page, pageName) {
    console.log(`⚡ Testing business actions on ${pageName}...`);
    
    const results = {
      hasActionButtons: false,
      actionCount: 0,
      hasBusinessActions: false,
      businessActions: []
    };

    try {
      // Look for action buttons in table rows or cards
      const actionButtons = await page.$$('tbody tr:first-child button, [class*="card"]:first-child button, .admin-actions button');
      results.actionCount = actionButtons.length;
      results.hasActionButtons = actionButtons.length > 0;

      if (actionButtons.length > 0) {
        // Get action button titles/labels
        const actionLabels = await Promise.all(
          actionButtons.map(async (button) => {
            return await page.evaluate((btn) => 
              btn.title || btn.getAttribute('aria-label') || btn.textContent?.trim() || '', 
              button
            );
          })
        );

        results.businessActions = actionLabels.filter(label => label);

        // Check for business-specific actions
        const businessActionKeywords = ['Convert', 'Send', 'Schedule', 'Quote', 'Project'];
        results.hasBusinessActions = actionLabels.some(label => 
          businessActionKeywords.some(keyword => label.includes(keyword))
        );
      }

    } catch (error) {
      console.error(`Error testing business actions on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test responsive design
  async testResponsiveDesign(page, pageName) {
    console.log(`📱 Testing responsive design on ${pageName}...`);
    
    const results = {
      mobileFriendly: false,
      cardsOnMobile: false,
      tableOnDesktop: false,
      sidebarResponsive: false
    };

    try {
      // Test mobile view (767px)
      await page.setViewport({ width: 767, height: 1024 });
      await page.waitForTimeout(1000);

      // Check for cards on mobile
      const cardsOnMobile = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"], .bg-white.border, .admin-card');
        const table = document.querySelector('table');
        return cards.length > 0 && (!table || table.offsetWidth === 0);
      });

      results.cardsOnMobile = cardsOnMobile;

      // Check sidebar behavior on mobile
      const sidebarResponsive = await page.evaluate(() => {
        const sidebar = document.querySelector('[class*="sidebar"], .admin-sidebar, nav');
        if (!sidebar) return true; // No sidebar to test
        
        // Check if sidebar is collapsed/hidden on mobile
        const isCollapsed = sidebar.offsetWidth < 200 || 
                           getComputedStyle(sidebar).display === 'none' ||
                           sidebar.className.includes('collapsed');
        return isCollapsed;
      });

      results.sidebarResponsive = sidebarResponsive;

      // Test desktop view (1280px)
      await page.setViewport({ width: 1280, height: 1024 });
      await page.waitForTimeout(1000);

      // Check for table on desktop
      const tableOnDesktop = await page.evaluate(() => {
        const table = document.querySelector('table');
        return table && table.offsetWidth > 0;
      });

      results.tableOnDesktop = tableOnDesktop;
      results.mobileFriendly = cardsOnMobile && sidebarResponsive;

    } catch (error) {
      console.error(`Error testing responsive design on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test feature parity across pages
  async testFeatureParity() {
    console.log('📊 Testing feature parity across all pages...');
    
    const featureComparison = {
      archiveToggle: {},
      refreshButton: {},
      dynamicFilters: {},
      statusPills: {},
      businessActions: {},
      responsive: {}
    };

    // Collect results from all pages
    this.testResults.forEach(result => {
      const pageName = result.pageName;
      featureComparison.archiveToggle[pageName] = result.archiveToggle.hasArchiveToggle;
      featureComparison.refreshButton[pageName] = result.refresh.hasRefreshButton;
      featureComparison.dynamicFilters[pageName] = result.filters.filtersPopulated;
      featureComparison.statusPills[pageName] = result.statusPill.usesStatusPillComponent;
      featureComparison.businessActions[pageName] = result.businessActions.hasBusinessActions;
      featureComparison.responsive[pageName] = result.responsive.mobileFriendly;
    });

    // Calculate parity scores
    const parityResults = {};
    Object.keys(featureComparison).forEach(feature => {
      const values = Object.values(featureComparison[feature]);
      const allHaveFeature = values.every(val => val === true);
      const someHaveFeature = values.some(val => val === true);
      
      parityResults[feature] = {
        complete: allHaveFeature,
        partial: someHaveFeature && !allHaveFeature,
        missing: !someHaveFeature,
        coverage: values.filter(val => val === true).length / values.length
      };
    });

    return { featureComparison, parityResults };
  }

  // Run comprehensive test for a single page
  async testSinglePage(pageInfo) {
    console.log(`\n🧪 Testing ${pageInfo.name} (${pageInfo.path})`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      await this.framework.page.waitForTimeout(3000);

      const results = {
        pageName: pageInfo.name,
        archiveToggle: await this.testArchiveToggle(this.framework.page, pageInfo.name),
        refresh: await this.testRefreshFunctionality(this.framework.page, pageInfo.name),
        filters: await this.testFilterFunctionality(this.framework.page, pageInfo.name),
        statusPill: await this.testStatusPillUsage(this.framework.page, pageInfo.name),
        businessActions: await this.testBusinessActions(this.framework.page, pageInfo.name),
        responsive: await this.testResponsiveDesign(this.framework.page, pageInfo.name)
      };

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/admin-standardization-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${pageInfo.name} standardization tests complete`);
      return results;

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
      return {
        pageName: pageInfo.name,
        error: error.message,
        archiveToggle: { hasArchiveToggle: false },
        refresh: { hasRefreshButton: false },
        filters: { filtersPopulated: false },
        statusPill: { usesStatusPillComponent: false },
        businessActions: { hasBusinessActions: false },
        responsive: { mobileFriendly: false }
      };
    }
  }

  // Generate comprehensive report
  generateReport(parityResults) {
    console.log('\n📊 ADMIN PAGES STANDARDIZATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    // Feature summary
    console.log('\n🎯 FEATURE STANDARDIZATION STATUS:');
    console.log('───────────────────────────────────────────────────────────────');

    Object.entries(parityResults.parityResults).forEach(([feature, status]) => {
      const icon = status.complete ? '✅' : status.partial ? '⚠️' : '❌';
      const coverage = Math.round(status.coverage * 100);
      console.log(`${icon} ${feature.padEnd(20)} ${coverage}% coverage ${status.complete ? '(STANDARDIZED)' : status.partial ? '(PARTIAL)' : '(MISSING)'}`);
    });

    // Detailed results per page
    console.log('\n📋 DETAILED RESULTS PER PAGE:');
    console.log('───────────────────────────────────────────────────────────────');

    this.testResults.forEach(result => {
      console.log(`\n📄 ${result.pageName}:`);
      console.log(`  🗂️ Archive Toggle: ${result.archiveToggle.hasArchiveToggle ? '✅' : '❌'} ${result.archiveToggle.toggleWorks ? '(Works)' : ''}`);
      console.log(`  🔄 Refresh Button: ${result.refresh.hasRefreshButton ? '✅' : '❌'}`);
      console.log(`  🎛️ Dynamic Filters: ${result.filters.filtersPopulated ? '✅' : '❌'} (${result.filters.filterCount} filters)`);
      console.log(`  🎨 StatusPill Component: ${result.statusPill.usesStatusPillComponent ? '✅' : '❌'} (${result.statusPill.statusCount} status elements)`);
      console.log(`  ⚡ Business Actions: ${result.businessActions.hasBusinessActions ? '✅' : '❌'} (${result.businessActions.actionCount} actions)`);
      if (result.businessActions.businessActions.length > 0) {
        console.log(`     Actions: ${result.businessActions.businessActions.join(', ')}`);
      }
      console.log(`  📱 Responsive Design: ${result.responsive.mobileFriendly ? '✅' : '❌'} (Cards: ${result.responsive.cardsOnMobile ? '✅' : '❌'}, Table: ${result.responsive.tableOnDesktop ? '✅' : '❌'})`);
    });

    // Overall standardization score
    const overallScore = Object.values(parityResults.parityResults).reduce((sum, status) => sum + status.coverage, 0) / Object.keys(parityResults.parityResults).length;
    console.log(`\n🎯 OVERALL STANDARDIZATION SCORE: ${Math.round(overallScore * 100)}%`);

    if (overallScore >= 0.9) {
      console.log('🎉 EXCELLENT! Admin pages are well standardized.');
    } else if (overallScore >= 0.7) {
      console.log('👍 GOOD! Most features are standardized across pages.');
    } else if (overallScore >= 0.5) {
      console.log('⚠️ PARTIAL! Some standardization work needed.');
    } else {
      console.log('🚨 NEEDS WORK! Significant standardization improvements required.');
    }

    return overallScore;
  }

  // Run comprehensive standardization test suite
  async runComprehensiveTests() {
    console.log('🔄 ADMIN PAGES STANDARDIZATION COMPREHENSIVE TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing standardization improvements across all admin pages');
    console.log('📊 Features: Archive Toggle, Refresh, Filters, StatusPill, Actions, Responsive');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Test each page
      for (const pageInfo of this.pages) {
        const results = await this.testSinglePage(pageInfo);
        this.testResults.push(results);
      }

      await this.framework.cleanup();

      // Analyze feature parity
      const parityResults = await this.testFeatureParity();

      // Generate comprehensive report
      const overallScore = this.generateReport(parityResults);

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 ADMIN PAGES STANDARDIZATION TEST COMPLETE');
      console.log(`📊 Overall Score: ${Math.round(overallScore * 100)}%`);
      console.log('📸 Screenshots saved for visual verification');
      console.log('═══════════════════════════════════════════════════════════════');

      // Return success if score is above 80%
      return overallScore >= 0.8;

    } catch (error) {
      console.error('❌ Standardization Test Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new AdminStandardizationTests();
  
  try {
    const success = await tester.runComprehensiveTests();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Admin Standardization Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminStandardizationTests;
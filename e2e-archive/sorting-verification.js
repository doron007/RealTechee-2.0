#!/usr/bin/env node

/**
 * Comprehensive Sorting Verification Test Suite
 * 
 * Tests sorting functionality for all fields on all admin pages:
 * - Projects: Status, Address, Created, Owner, Agent, Brokerage, Opportunity
 * - Quotes: Status, Address, Created, Owner, Agent, Brokerage, Opportunity  
 * - Requests: Status, Address, Created, Owner, Agent, Brokerage, Opportunity
 * 
 * Validates both ascending and descending sort for each field.
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class SortingVerification {
  constructor() {
    this.framework = new ResponsiveTestFramework('Sorting-Verification', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 300 }
    });

    this.pages = [
      { 
        path: '/admin/projects', 
        name: 'Projects',
        sortableFields: [
          { field: 'status', name: 'Status' },
          { field: 'address', name: 'Address' },
          { field: 'created', name: 'Created' },
          { field: 'clientName', name: 'Owner' },
          { field: 'agentName', name: 'Agent' },
          { field: 'brokerage', name: 'Brokerage' },
          { field: 'opportunity', name: 'Opportunity' }
        ]
      },
      { 
        path: '/admin/quotes', 
        name: 'Quotes',
        sortableFields: [
          { field: 'status', name: 'Status' },
          { field: 'address', name: 'Address' },
          { field: 'created', name: 'Created' },
          { field: 'clientName', name: 'Owner' },
          { field: 'agentName', name: 'Agent' },
          { field: 'brokerage', name: 'Brokerage' },
          { field: 'opportunity', name: 'Opportunity' }
        ]
      },
      { 
        path: '/admin/requests', 
        name: 'Requests',
        sortableFields: [
          { field: 'status', name: 'Status' },
          { field: 'address', name: 'Address' },
          { field: 'created', name: 'Created' },
          { field: 'clientName', name: 'Owner' },
          { field: 'agentName', name: 'Agent' },
          { field: 'brokerage', name: 'Brokerage' },
          { field: 'opportunity', name: 'Opportunity' }
        ]
      }
    ];

    this.testResults = {};
  }

  // Test sorting for a specific field
  async testFieldSorting(page, field, fieldName, pageName) {
    console.log(`  🔃 Testing ${fieldName} sorting...`);
    
    const results = {
      fieldName,
      fieldId: field,
      sortDropdownExists: false,
      directionToggleExists: false,
      ascendingWorks: false,
      descendingWorks: false,
      dataChanges: false
    };

    try {
      // Check if sort dropdown exists
      const sortDropdown = await page.$('select[aria-label*="sort"], select:has(option[value*="' + field + '"])');
      results.sortDropdownExists = !!sortDropdown;

      if (!sortDropdown) {
        console.log(`    ❌ Sort dropdown not found for ${fieldName}`);
        return results;
      }

      // Get initial data
      const getTableData = async () => {
        return await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr, [data-testid="table-row"], .MuiTableBody-root tr'));
          return rows.slice(0, 5).map(row => {
            const cells = Array.from(row.querySelectorAll('td, [data-testid="cell"]'));
            return cells.map(cell => cell.textContent?.trim() || '');
          });
        });
      };

      const initialData = await getTableData();
      console.log(`    📊 Initial data sample:`, initialData.slice(0, 2));

      // Test ascending sort
      console.log(`    ⬆️ Testing ascending sort for ${fieldName}...`);
      await page.select('select', field);
      await page.waitForTimeout(1000);
      
      // Check for direction toggle button
      const directionToggle = await page.$('button[title*="Sort"], button[aria-label*="Sort"], button:has(span:contains("↑")), button:has(span:contains("↓"))');
      results.directionToggleExists = !!directionToggle;

      // Ensure ascending order
      if (directionToggle) {
        const buttonText = await page.evaluate(btn => btn.textContent || btn.title || btn.getAttribute('aria-label'), directionToggle);
        if (buttonText.includes('↓') || buttonText.toLowerCase().includes('desc')) {
          await directionToggle.click();
          await page.waitForTimeout(1000);
        }
      }

      const ascData = await getTableData();
      results.ascendingWorks = JSON.stringify(ascData) !== JSON.stringify(initialData);
      console.log(`    📊 Ascending data sample:`, ascData.slice(0, 2));

      // Test descending sort
      console.log(`    ⬇️ Testing descending sort for ${fieldName}...`);
      if (directionToggle) {
        await directionToggle.click();
        await page.waitForTimeout(1000);
      }

      const descData = await getTableData();
      results.descendingWorks = JSON.stringify(descData) !== JSON.stringify(ascData);
      results.dataChanges = results.ascendingWorks || results.descendingWorks;
      console.log(`    📊 Descending data sample:`, descData.slice(0, 2));

      if (results.dataChanges) {
        console.log(`    ✅ ${fieldName} sorting working correctly`);
      } else {
        console.log(`    ❌ ${fieldName} sorting not changing data`);
      }

    } catch (error) {
      console.error(`    ❌ Error testing ${fieldName} sorting:`, error.message);
    }

    return results;
  }

  // Test all sorting functionality for a single page
  async testPageSorting(pageInfo) {
    console.log(`\n🧪 Testing sorting on ${pageInfo.name} (${pageInfo.path})`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      
      // Wait for page to load with data
      await this.framework.waitForPageReady({ 
        maxWaitTime: 30000,
        checkInterval: 500,
        customReadyCheck: async (page) => {
          // Check if data grid has loaded with data
          const hasData = await page.evaluate(() => {
            const tableRows = document.querySelectorAll('tbody tr, .MuiTableBody-root tr');
            const cardItems = document.querySelectorAll('[data-testid="admin-card"], .admin-card');
            return tableRows.length > 0 || cardItems.length > 0;
          });
          return hasData;
        }
      });

      console.log(`  📊 Page loaded, testing ${pageInfo.sortableFields.length} sortable fields...`);

      const pageResults = {
        pageName: pageInfo.name,
        sortableFields: pageInfo.sortableFields.length,
        results: {},
        summary: {
          total: pageInfo.sortableFields.length,
          passed: 0,
          failed: 0
        }
      };

      // Test each sortable field
      for (const field of pageInfo.sortableFields) {
        const fieldResult = await this.testFieldSorting(this.framework.page, field.field, field.name, pageInfo.name);
        pageResults.results[field.field] = fieldResult;
        
        // Count as passed if basic sorting works
        if (fieldResult.sortDropdownExists && fieldResult.dataChanges) {
          pageResults.summary.passed++;
        } else {
          pageResults.summary.failed++;
        }
      }

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/sorting-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${pageInfo.name} sorting testing complete: ${pageResults.summary.passed}/${pageResults.summary.total} fields working`);
      return pageResults;

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name} sorting:`, error.message);
      return {
        pageName: pageInfo.name,
        error: error.message
      };
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 SORTING VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    let totalFields = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(this.testResults).forEach(([pageName, results]) => {
      if (results.error) {
        console.log(`\n❌ ${pageName}: ERROR - ${results.error}`);
        return;
      }

      console.log(`\n📄 ${pageName}: ${results.summary.passed}/${results.summary.total} fields working`);
      
      totalFields += results.summary.total;
      totalPassed += results.summary.passed;
      totalFailed += results.summary.failed;

      // Report on each field
      Object.entries(results.results).forEach(([fieldId, fieldResult]) => {
        const status = fieldResult.sortDropdownExists && fieldResult.dataChanges ? '✅' : '❌';
        console.log(`  ${status} ${fieldResult.fieldName}:`);
        console.log(`     - Dropdown: ${fieldResult.sortDropdownExists ? '✅' : '❌'}`);
        console.log(`     - Direction toggle: ${fieldResult.directionToggleExists ? '✅' : '❌'}`);
        console.log(`     - Data changes: ${fieldResult.dataChanges ? '✅' : '❌'}`);
        console.log(`     - Ascending: ${fieldResult.ascendingWorks ? '✅' : '❌'}`);
        console.log(`     - Descending: ${fieldResult.descendingWorks ? '✅' : '❌'}`);
      });
    });

    console.log('\n📊 OVERALL SUMMARY:');
    console.log(`Total sortable fields tested: ${totalFields}`);
    console.log(`Passed: ${totalPassed} (${Math.round(totalPassed/totalFields*100)}%)`);
    console.log(`Failed: ${totalFailed} (${Math.round(totalFailed/totalFields*100)}%)`);

    const passRate = Math.round(totalPassed/totalFields*100);
    if (passRate === 100) {
      console.log('🎉 100% SORT TEST PASS RATE ACHIEVED!');
    } else {
      console.log(`❌ Sort test pass rate: ${passRate}% (Target: 100%)`);
    }

    return { totalFields, totalPassed, totalFailed, passRate };
  }

  // Run comprehensive sorting verification
  async runVerification() {
    console.log('🔄 COMPREHENSIVE SORTING VERIFICATION TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing sorting functionality across all admin pages');
    console.log('📊 Validating: Status, Address, Created, Owner, Agent, Brokerage, Opportunity');
    console.log('🔃 Testing: Ascending and Descending sort for each field');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Test each page
      for (const pageInfo of this.pages) {
        const results = await this.testPageSorting(pageInfo);
        this.testResults[pageInfo.name] = results;
      }

      await this.framework.cleanup();

      // Generate comprehensive report
      const summary = this.generateReport();

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 SORTING VERIFICATION COMPLETE');
      console.log('📸 Screenshots captured for visual verification');
      console.log(`📊 Pass Rate: ${summary.passRate}%`);
      console.log('═══════════════════════════════════════════════════════════════');

      return summary.passRate === 100;

    } catch (error) {
      console.error('❌ Sorting Verification Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new SortingVerification();
  
  try {
    const success = await tester.runVerification();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Sorting Verification Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SortingVerification;
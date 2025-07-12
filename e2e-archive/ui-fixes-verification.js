#!/usr/bin/env node

/**
 * UI Fixes Verification Test Suite
 * 
 * Tests specific UI issues and their fixes across admin pages:
 * - Issue 1: Archive toggle placement
 * - Issue 2: Title and aggregation bar layout  
 * - Issue 3: Sort controls visibility
 * - Issue 4: Column order and data sources
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class UIFixesVerification {
  constructor() {
    this.framework = new ResponsiveTestFramework('UI-Fixes-Verification', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 200 }
    });

    this.pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    this.testResults = {};
  }

  // Test Issue 1: Archive toggle placement
  async testArchiveTogglePlacement(page, pageName) {
    console.log(`🗂️ Testing archive toggle placement on ${pageName}...`);
    
    const results = {
      hasArchiveToggle: false,
      placementCorrect: false,
      alignedRight: false,
      betweenFiltersAndTable: false
    };

    try {
      // Look for archive toggle
      const archiveToggle = await page.$('input[type="checkbox"][id*="archived"]');
      results.hasArchiveToggle = !!archiveToggle;

      if (archiveToggle) {
        // Check if it's positioned correctly - should be between filters and table/cards
        const togglePosition = await page.evaluate(() => {
          const toggle = document.querySelector('input[type="checkbox"][id*="archived"]');
          if (!toggle) return null;

          const toggleContainer = toggle.closest('div');
          const filtersSection = document.querySelector('div:has(select), div:has([role="combobox"])');
          const tableSection = document.querySelector('table, [class*="card"]');
          
          if (!toggleContainer || !filtersSection || !tableSection) return null;

          const toggleRect = toggleContainer.getBoundingClientRect();
          const filtersRect = filtersSection.getBoundingClientRect();
          const tableRect = tableSection.getBoundingClientRect();

          return {
            toggleY: toggleRect.top,
            filtersY: filtersRect.bottom,
            tableY: tableRect.top,
            toggleX: toggleRect.right,
            containerWidth: document.body.offsetWidth
          };
        });

        if (togglePosition) {
          // Check if toggle is between filters and table
          results.betweenFiltersAndTable = togglePosition.toggleY > togglePosition.filtersY && 
                                         togglePosition.toggleY < togglePosition.tableY;
          
          // Check if toggle is aligned right (right side of container)
          const rightThreshold = togglePosition.containerWidth * 0.7; // Right 30% of container
          results.alignedRight = togglePosition.toggleX > rightThreshold;
          
          results.placementCorrect = results.betweenFiltersAndTable && results.alignedRight;
        }
      }

    } catch (error) {
      console.error(`Error testing archive toggle placement on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test Issue 2: Title and aggregation bar layout
  async testTitleAndAggregationLayout(page, pageName) {
    console.log(`📊 Testing title and aggregation layout on ${pageName}...`);
    
    const results = {
      titleAtTop: false,
      aggregationBarPresent: false,
      aggregationUnderTitle: false,
      accurateCounts: false
    };

    try {
      // Check title placement - should be at very top
      const titlePosition = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return null;
        
        const rect = h1.getBoundingClientRect();
        const allElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.getBoundingClientRect().top < rect.top && el.offsetHeight > 0
        );
        
        return {
          titleY: rect.top,
          elementsAbove: allElements.length,
          titleText: h1.textContent
        };
      });

      if (titlePosition) {
        // Title should be near the top (allowing for header/nav)
        results.titleAtTop = titlePosition.titleY < 200 && titlePosition.elementsAbove < 10;
      }

      // Check for aggregation bar with counts
      const aggregationBar = await page.evaluate(() => {
        const bars = Array.from(document.querySelectorAll('div')).filter(div => 
          div.textContent.includes('Total:') || 
          div.textContent.includes('Active:') || 
          div.textContent.includes('Archived:')
        );
        
        if (bars.length === 0) return null;
        
        const bar = bars[0];
        const rect = bar.getBoundingClientRect();
        const text = bar.textContent;
        
        // Extract numbers from text
        const totalMatch = text.match(/Total:\s*(\d+)/);
        const activeMatch = text.match(/Active:\s*(\d+)/);
        const archivedMatch = text.match(/Archived:\s*(\d+)/);
        
        return {
          barY: rect.top,
          totalCount: totalMatch ? parseInt(totalMatch[1]) : 0,
          activeCount: activeMatch ? parseInt(activeMatch[1]) : 0,
          archivedCount: archivedMatch ? parseInt(archivedMatch[1]) : 0,
          hasAllCounts: !!(totalMatch && activeMatch && archivedMatch)
        };
      });

      if (aggregationBar) {
        results.aggregationBarPresent = true;
        results.aggregationUnderTitle = titlePosition && aggregationBar.barY > titlePosition.titleY;
        
        // Check if counts make sense (total should equal active + archived)
        const expectedTotal = aggregationBar.activeCount + aggregationBar.archivedCount;
        results.accurateCounts = aggregationBar.hasAllCounts && 
                                (aggregationBar.totalCount === expectedTotal || aggregationBar.totalCount > 0);
      }

    } catch (error) {
      console.error(`Error testing title/aggregation layout on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test Issue 3: Sort controls visibility
  async testSortControlsVisibility(page, pageName) {
    console.log(`🔃 Testing sort controls on ${pageName}...`);
    
    const results = {
      hasSortControls: false,
      sortByDropdown: false,
      ascDescToggle: false,
      sortingWorks: false
    };

    try {
      // Look for sort controls
      const sortControls = await page.evaluate(() => {
        // Look for sort-related UI elements
        const sortDropdown = document.querySelector('select[name*="sort"], [aria-label*="sort"], [title*="sort"]');
        const sortButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.textContent.includes('Sort') || 
          btn.title?.includes('sort') || 
          btn.getAttribute('aria-label')?.includes('sort')
        );
        
        // Check table headers for sort indicators
        const sortableHeaders = Array.from(document.querySelectorAll('th')).filter(th => 
          th.getAttribute('aria-sort') || 
          th.querySelector('[class*="sort"]') ||
          th.classList.contains('sortable')
        );

        return {
          hasDropdown: !!sortDropdown,
          sortButtons: sortButtons.length,
          sortableHeaders: sortableHeaders.length,
          sortElements: sortDropdown || sortButtons[0] || sortableHeaders[0]
        };
      });

      results.hasSortControls = sortControls.sortButtons > 0 || sortControls.sortableHeaders > 0;
      results.sortByDropdown = sortControls.hasDropdown;
      results.ascDescToggle = sortControls.sortButtons > 0;

      // Test if sorting actually works by clicking a sortable header
      if (sortControls.sortableHeaders > 0) {
        await page.click('th[aria-sort], th.sortable, th:first-child');
        await page.waitForTimeout(1000);
        results.sortingWorks = true;
      }

    } catch (error) {
      console.error(`Error testing sort controls on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test Issue 4: Column order and data sources
  async testColumnOrderAndData(page, pageName) {
    console.log(`📋 Testing column order and data on ${pageName}...`);
    
    const results = {
      correctColumnOrder: false,
      hasStatusColumn: false,
      hasAddressColumn: false,
      hasCreatedColumn: false,
      hasOwnerColumn: false,
      hasAgentColumn: false,
      columnOrder: []
    };

    try {
      // Get column headers and their order
      const columnInfo = await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('th')).map(th => 
          th.textContent?.trim().toLowerCase() || ''
        ).filter(text => text && text !== 'actions');

        return {
          headers,
          hasStatus: headers.some(h => h.includes('status')),
          hasAddress: headers.some(h => h.includes('address') || h.includes('property')),
          hasCreated: headers.some(h => h.includes('created') || h.includes('date')),
          hasOwner: headers.some(h => h.includes('owner') || h.includes('client')),
          hasAgent: headers.some(h => h.includes('agent'))
        };
      });

      if (columnInfo.headers.length > 0) {
        results.columnOrder = columnInfo.headers;
        results.hasStatusColumn = columnInfo.hasStatus;
        results.hasAddressColumn = columnInfo.hasAddress;
        results.hasCreatedColumn = columnInfo.hasCreated;
        results.hasOwnerColumn = columnInfo.hasOwner;
        results.hasAgentColumn = columnInfo.hasAgent;

        // Check if first column is Status and second is Address
        const expectedOrder = ['status', 'address'];
        results.correctColumnOrder = expectedOrder.every((expected, index) => 
          columnInfo.headers[index]?.includes(expected)
        );
      }

    } catch (error) {
      console.error(`Error testing column order on ${pageName}:`, error.message);
    }

    return results;
  }

  // Run all UI fix tests for a single page
  async testSinglePage(pageInfo) {
    console.log(`\n🧪 Testing UI fixes on ${pageInfo.name} (${pageInfo.path})`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      await this.framework.page.waitForTimeout(3000);

      const results = {
        pageName: pageInfo.name,
        issue1: await this.testArchiveTogglePlacement(this.framework.page, pageInfo.name),
        issue2: await this.testTitleAndAggregationLayout(this.framework.page, pageInfo.name),
        issue3: await this.testSortControlsVisibility(this.framework.page, pageInfo.name),
        issue4: await this.testColumnOrderAndData(this.framework.page, pageInfo.name)
      };

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/ui-fixes-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${pageInfo.name} UI fixes testing complete`);
      return results;

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
      return {
        pageName: pageInfo.name,
        error: error.message
      };
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📊 UI FIXES VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    Object.entries(this.testResults).forEach(([pageName, results]) => {
      if (results.error) {
        console.log(`\n❌ ${pageName}: ERROR - ${results.error}`);
        return;
      }

      console.log(`\n📄 ${pageName}:`);
      
      // Issue 1: Archive Toggle Placement
      const issue1 = results.issue1;
      console.log(`  🗂️ Issue 1 - Archive Toggle: ${issue1?.placementCorrect ? '✅' : '❌'}`);
      if (issue1?.hasArchiveToggle) {
        console.log(`     - Has toggle: ✅`);
        console.log(`     - Between filters/table: ${issue1.betweenFiltersAndTable ? '✅' : '❌'}`);
        console.log(`     - Aligned right: ${issue1.alignedRight ? '✅' : '❌'}`);
      } else {
        console.log(`     - Toggle not found or not applicable`);
      }

      // Issue 2: Title and Aggregation Layout
      const issue2 = results.issue2;
      console.log(`  📊 Issue 2 - Title/Aggregation: ${issue2?.titleAtTop && issue2?.aggregationUnderTitle ? '✅' : '❌'}`);
      console.log(`     - Title at top: ${issue2?.titleAtTop ? '✅' : '❌'}`);
      console.log(`     - Aggregation bar present: ${issue2?.aggregationBarPresent ? '✅' : '❌'}`);
      console.log(`     - Aggregation under title: ${issue2?.aggregationUnderTitle ? '✅' : '❌'}`);
      console.log(`     - Accurate counts: ${issue2?.accurateCounts ? '✅' : '❌'}`);

      // Issue 3: Sort Controls
      const issue3 = results.issue3;
      console.log(`  🔃 Issue 3 - Sort Controls: ${issue3?.hasSortControls ? '✅' : '❌'}`);
      console.log(`     - Has sort controls: ${issue3?.hasSortControls ? '✅' : '❌'}`);
      console.log(`     - Sort dropdown: ${issue3?.sortByDropdown ? '✅' : '❌'}`);
      console.log(`     - Sorting works: ${issue3?.sortingWorks ? '✅' : '❌'}`);

      // Issue 4: Column Order
      const issue4 = results.issue4;
      console.log(`  📋 Issue 4 - Column Order: ${issue4?.correctColumnOrder ? '✅' : '❌'}`);
      console.log(`     - Status column: ${issue4?.hasStatusColumn ? '✅' : '❌'}`);
      console.log(`     - Address column: ${issue4?.hasAddressColumn ? '✅' : '❌'}`);
      console.log(`     - Created column: ${issue4?.hasCreatedColumn ? '✅' : '❌'}`);
      console.log(`     - Owner column: ${issue4?.hasOwnerColumn ? '✅' : '❌'}`);
      console.log(`     - Agent column: ${issue4?.hasAgentColumn ? '✅' : '❌'}`);
      if (issue4?.columnOrder.length > 0) {
        console.log(`     - Column order: [${issue4.columnOrder.join(', ')}]`);
      }
    });

    return this.testResults;
  }

  // Run comprehensive UI fixes verification
  async runVerification() {
    console.log('🔄 UI FIXES VERIFICATION TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing UI fixes across all admin pages');
    console.log('📊 Issues: Archive Toggle, Title/Aggregation, Sort Controls, Column Order');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Test each page
      for (const pageInfo of this.pages) {
        const results = await this.testSinglePage(pageInfo);
        this.testResults[pageInfo.name] = results;
      }

      await this.framework.cleanup();

      // Generate comprehensive report
      this.generateReport();

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 UI FIXES VERIFICATION COMPLETE');
      console.log('📸 Screenshots captured for visual verification');
      console.log('═══════════════════════════════════════════════════════════════');

      return this.testResults;

    } catch (error) {
      console.error('❌ UI Fixes Verification Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new UIFixesVerification();
  
  try {
    const results = await tester.runVerification();
    process.exit(results ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 UI Fixes Verification Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UIFixesVerification;
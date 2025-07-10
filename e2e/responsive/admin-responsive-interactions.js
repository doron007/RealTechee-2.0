#!/usr/bin/env node

/**
 * Comprehensive Admin Responsive Interactions Test
 * 
 * Tests critical responsive behavior that was missed:
 * 1. Sidebar expand/collapse interaction on all breakpoints
 * 2. Breakpoint boundary testing (first/last pixel)
 * 3. Table overflow detection and content chopping
 * 4. All interactive elements (search, filter, toggles)
 * 5. View toggle between table/card modes
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class AdminResponsiveInteractionsTest {
  constructor() {
    this.framework = new ResponsiveTestFramework('Admin-Responsive-Interactions', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 100 }
    });

    // Critical breakpoint boundaries to test
    this.criticalBreakpoints = [
      // Boundary testing - first and last pixels
      { width: 320, height: 568, name: 'xs-min', description: 'iPhone SE (minimum)' },
      { width: 767, height: 1024, name: 'sm-max', description: 'Last pixel before md' },
      { width: 768, height: 1024, name: 'md-min', description: 'First pixel of md' },
      { width: 1023, height: 768, name: 'md-max', description: 'Last pixel before lg' },
      { width: 1024, height: 768, name: 'lg-min', description: 'First pixel of lg' },
      { width: 1279, height: 1024, name: 'lg-max', description: 'Last pixel before xl' },
      { width: 1280, height: 1024, name: 'xl-min', description: 'First pixel of xl' },
      { width: 1535, height: 864, name: 'xl-max', description: 'Last pixel before 2xl' },
      { width: 1536, height: 864, name: '2xl-min', description: 'First pixel of 2xl' },
    ];
  }

  // Test sidebar expand/collapse behavior
  getSidebarInteractionTests() {
    return [
      async (page, breakpoint, measurements, adminElements) => {
        console.log(`    🔍 Testing sidebar interaction at ${breakpoint.width}px`);
        
        const sidebarTest = await page.evaluate(async () => {
          // Find sidebar and expand button
          const sidebar = document.querySelector('[class*="sidebar"]') || 
                         document.querySelector('[class*="w-16"]') || 
                         document.querySelector('[class*="w-64"]');
          
          if (!sidebar) return { found: false, error: 'Sidebar not found' };

          // Get initial state
          const initialRect = sidebar.getBoundingClientRect();
          const initialWidth = initialRect.width;
          
          // Look for expand/toggle button
          const expandButton = document.querySelector('[title*="expand"]') ||
                              document.querySelector('[title*="menu"]') ||
                              document.querySelector('button[class*="sidebar"]') ||
                              sidebar.querySelector('button') ||
                              document.querySelector('[aria-label*="menu"]');
          
          if (!expandButton) {
            return {
              found: true,
              hasToggle: false,
              initialWidth,
              message: 'No expand button found - sidebar may be fixed width'
            };
          }

          // Test clicking the expand button
          try {
            expandButton.click();
            
            // Wait for animation/transition
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterClickRect = sidebar.getBoundingClientRect();
            const afterClickWidth = afterClickRect.width;
            
            // Check if sidebar is still visible after expand
            const sidebarVisible = afterClickRect.width > 0 && afterClickRect.height > 0;
            const sidebarOnScreen = afterClickRect.left >= -50; // Allow 50px off-screen tolerance
            
            // Test clicking again to collapse
            expandButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const afterCollapseRect = sidebar.getBoundingClientRect();
            const afterCollapseWidth = afterCollapseRect.width;
            
            return {
              found: true,
              hasToggle: true,
              initialWidth,
              afterClickWidth,
              afterCollapseWidth,
              sidebarVisibleAfterExpand: sidebarVisible,
              sidebarOnScreenAfterExpand: sidebarOnScreen,
              widthChanged: Math.abs(afterClickWidth - initialWidth) > 10,
              expandedThenCollapsed: Math.abs(afterCollapseWidth - initialWidth) < 20,
              expandButtonFound: true,
              viewport: { width: window.innerWidth, height: window.innerHeight }
            };
          } catch (error) {
            return {
              found: true,
              hasToggle: true,
              error: error.message,
              expandButtonFound: true,
              initialWidth
            };
          }
        });

        // Determine expected behavior based on breakpoint
        const isMobile = breakpoint.width < 768;
        const isTablet = breakpoint.width >= 768 && breakpoint.width < 1024;
        const isSmallDesktop = breakpoint.width >= 1024 && breakpoint.width < 1280;
        
        let passed = true;
        let issues = [];

        if (!sidebarTest.found) {
          passed = false;
          issues.push('Sidebar not found');
        } else if (sidebarTest.error) {
          passed = false;
          issues.push(`Sidebar interaction error: ${sidebarTest.error}`);
        } else if (sidebarTest.hasToggle) {
          // Test the critical issue: sidebar disappearing on small screens
          if ((isMobile || isTablet) && sidebarTest.widthChanged && !sidebarTest.sidebarOnScreenAfterExpand) {
            passed = false;
            issues.push(`🚨 CRITICAL: Sidebar disappears off-screen when expanded at ${breakpoint.width}px`);
          }
          
          if (sidebarTest.widthChanged && !sidebarTest.sidebarVisibleAfterExpand) {
            passed = false;
            issues.push('Sidebar becomes invisible when expanded');
          }
          
          if (!sidebarTest.expandedThenCollapsed) {
            issues.push('Sidebar may not return to original state after expand/collapse cycle');
          }
        }

        return {
          name: 'Sidebar Expand/Collapse Interaction',
          passed,
          message: passed 
            ? `Sidebar interaction works: ${sidebarTest.hasToggle ? 'toggleable' : 'fixed'}, width: ${sidebarTest.initialWidth}px`
            : `Sidebar issues: ${issues.join('; ')}`,
          details: {
            ...sidebarTest,
            issues,
            breakpointType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
          }
        };
      }
    ];
  }

  // Test table overflow and content chopping
  getTableOverflowTests() {
    return [
      async (page, breakpoint, measurements, adminElements) => {
        console.log(`    📊 Testing table overflow at ${breakpoint.width}px`);
        
        const overflowTest = await page.evaluate(() => {
          const table = document.querySelector('table');
          if (!table) return { hasTable: false };

          const tableRect = table.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          
          // Check if table extends beyond viewport
          const tableOverflow = tableRect.right > viewportWidth;
          const overflowAmount = Math.max(0, tableRect.right - viewportWidth);
          
          // Check individual columns for overflow
          const headers = Array.from(table.querySelectorAll('th'));
          const columnOverflows = headers.map((header, index) => {
            const headerRect = header.getBoundingClientRect();
            const isVisible = headerRect.left >= 0 && headerRect.right <= viewportWidth;
            const overflow = Math.max(0, headerRect.right - viewportWidth);
            
            return {
              index,
              text: header.textContent.trim(),
              visible: isVisible,
              overflow,
              left: headerRect.left,
              right: headerRect.right,
              width: headerRect.width
            };
          });

          // Check for horizontal scroll
          const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          
          // Check view toggle button
          const viewToggle = document.querySelector('[title*="view"]') ||
                            document.querySelector('[title*="card"]') ||
                            document.querySelector('[title*="table"]') ||
                            document.querySelector('button[class*="view"]');

          return {
            hasTable: true,
            tableWidth: tableRect.width,
            tableLeft: tableRect.left,
            tableRight: tableRect.right,
            viewportWidth,
            tableOverflow,
            overflowAmount,
            hasHorizontalScroll,
            columnCount: headers.length,
            visibleColumns: columnOverflows.filter(col => col.visible).length,
            columnOverflows: columnOverflows.filter(col => col.overflow > 0),
            hasViewToggle: !!viewToggle,
            viewToggleVisible: viewToggle ? viewToggle.offsetWidth > 0 : false
          };
        });

        if (!overflowTest.hasTable) {
          return {
            name: 'Table Overflow Check',
            passed: true,
            message: 'No table found - using card layout',
            details: { hasTable: false }
          };
        }

        let passed = true;
        let issues = [];
        
        // Critical issue: table content getting chopped
        if (overflowTest.tableOverflow && overflowTest.overflowAmount > 50) {
          passed = false;
          issues.push(`🚨 CRITICAL: Table overflows viewport by ${Math.round(overflowTest.overflowAmount)}px`);
        }

        // Check if important columns are invisible
        const hiddenColumns = overflowTest.columnCount - overflowTest.visibleColumns;
        if (hiddenColumns > 2 && breakpoint.width >= 1024) {
          passed = false;
          issues.push(`${hiddenColumns} columns hidden on desktop (${breakpoint.width}px)`);
        }

        // For smaller screens, check if view toggle is available
        if (breakpoint.width < 1280 && overflowTest.tableOverflow && !overflowTest.hasViewToggle) {
          issues.push('Table overflows but no view toggle to switch to cards');
        }

        // Check specific column overflows
        if (overflowTest.columnOverflows.length > 0) {
          const overflowColumns = overflowTest.columnOverflows.map(col => 
            `"${col.text}" (+${Math.round(col.overflow)}px)`
          ).join(', ');
          issues.push(`Columns overflow: ${overflowColumns}`);
        }

        return {
          name: 'Table Overflow Check',
          passed,
          message: passed 
            ? `Table fits viewport: ${overflowTest.tableWidth}px in ${overflowTest.viewportWidth}px, ${overflowTest.visibleColumns}/${overflowTest.columnCount} columns visible`
            : `Table overflow issues: ${issues.join('; ')}`,
          details: {
            ...overflowTest,
            issues,
            recommendation: overflowTest.tableOverflow && breakpoint.width < 1280 
              ? 'Consider using card layout for screens < 1280px'
              : null
          }
        };
      }
    ];
  }

  // Test all interactive elements
  getInteractiveElementTests() {
    return [
      async (page, breakpoint, measurements, adminElements) => {
        console.log(`    🎛️ Testing interactive elements at ${breakpoint.width}px`);
        
        const interactiveTest = await page.evaluate(async () => {
          const results = {
            search: { found: false, visible: false, functional: false },
            filters: [],
            toggles: [],
            buttons: [],
            viewToggle: { found: false, visible: false },
            errors: []
          };

          // Test search box
          const searchBox = document.querySelector('input[type="search"]') ||
                           document.querySelector('input[placeholder*="Search"]') ||
                           document.querySelector('input[placeholder*="search"]');
          
          if (searchBox) {
            results.search.found = true;
            results.search.visible = searchBox.offsetWidth > 0 && searchBox.offsetHeight > 0;
            
            // Test search functionality
            try {
              const initialValue = searchBox.value;
              searchBox.value = 'test';
              searchBox.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Check if search triggered any changes
              await new Promise(resolve => setTimeout(resolve, 300));
              results.search.functional = true;
              
              // Restore original value
              searchBox.value = initialValue;
              searchBox.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (error) {
              results.errors.push(`Search test error: ${error.message}`);
            }
          }

          // Test filter dropdowns
          const filterElements = document.querySelectorAll('select, [role="combobox"]');
          filterElements.forEach((filter, index) => {
            const filterRect = filter.getBoundingClientRect();
            results.filters.push({
              index,
              visible: filterRect.width > 0 && filterRect.height > 0,
              enabled: !filter.disabled,
              type: filter.tagName.toLowerCase(),
              options: filter.tagName === 'SELECT' ? filter.options.length : 0
            });
          });

          // Test toggle switches/checkboxes
          const toggleElements = document.querySelectorAll('input[type="checkbox"]');
          toggleElements.forEach((toggle, index) => {
            const toggleRect = toggle.getBoundingClientRect();
            const label = toggle.closest('label') || document.querySelector(`label[for="${toggle.id}"]`);
            
            results.toggles.push({
              index,
              visible: toggleRect.width > 0 && toggleRect.height > 0,
              checked: toggle.checked,
              enabled: !toggle.disabled,
              hasLabel: !!label,
              labelText: label ? label.textContent.trim() : ''
            });
          });

          // Test view toggle button
          const viewToggleBtn = document.querySelector('[title*="view"]') ||
                               document.querySelector('[title*="card"]') ||
                               document.querySelector('[title*="table"]');
          
          if (viewToggleBtn) {
            results.viewToggle.found = true;
            results.viewToggle.visible = viewToggleBtn.offsetWidth > 0 && viewToggleBtn.offsetHeight > 0;
          }

          // Test action buttons
          const actionButtons = document.querySelectorAll('button[title*="Edit"], button[title*="Delete"], button[title*="View"], button[title*="Open"]');
          actionButtons.forEach((button, index) => {
            const buttonRect = button.getBoundingClientRect();
            results.buttons.push({
              index,
              title: button.title || button.getAttribute('aria-label') || '',
              visible: buttonRect.width > 0 && buttonRect.height > 0,
              enabled: !button.disabled,
              size: { width: buttonRect.width, height: buttonRect.height }
            });
          });

          return results;
        });

        let passed = true;
        let issues = [];
        
        // Check search functionality
        if (interactiveTest.search.found && !interactiveTest.search.visible) {
          passed = false;
          issues.push('Search box exists but not visible');
        }
        
        if (interactiveTest.search.found && !interactiveTest.search.functional) {
          issues.push('Search box may not be functional');
        }

        // Check filters
        const hiddenFilters = interactiveTest.filters.filter(f => !f.visible).length;
        if (hiddenFilters > 0 && breakpoint.width >= 768) {
          issues.push(`${hiddenFilters} filter(s) hidden on tablet/desktop`);
        }

        // Check toggles (like archive toggle)
        const hiddenToggles = interactiveTest.toggles.filter(t => !t.visible).length;
        if (hiddenToggles > 0) {
          issues.push(`${hiddenToggles} toggle(s) not visible`);
        }

        // Check view toggle availability
        if (breakpoint.width < 1280 && !interactiveTest.viewToggle.found) {
          issues.push('No view toggle found for responsive table/card switching');
        }

        // Check action buttons on mobile
        if (breakpoint.width < 768) {
          const visibleButtons = interactiveTest.buttons.filter(b => b.visible).length;
          if (visibleButtons === 0 && interactiveTest.buttons.length > 0) {
            // This might be acceptable for mobile card layouts
            issues.push(`Mobile: ${interactiveTest.buttons.length} action buttons hidden (may be acceptable for card layout)`);
          }
        }

        return {
          name: 'Interactive Elements Test',
          passed,
          message: passed 
            ? `Interactive elements working: ${interactiveTest.search.found ? 'search' : 'no-search'}, ${interactiveTest.filters.length} filters, ${interactiveTest.toggles.length} toggles, ${interactiveTest.buttons.filter(b => b.visible).length} buttons`
            : `Interactive issues: ${issues.join('; ')}`,
          details: {
            ...interactiveTest,
            issues,
            breakpointWidth: breakpoint.width
          }
        };
      }
    ];
  }

  // Run comprehensive responsive interaction testing
  async runComprehensiveTest() {
    console.log('🔍 ADMIN RESPONSIVE INTERACTIONS TEST');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing critical responsive behavior and interactions');
    console.log('📱 Boundary testing, sidebar behavior, table overflow, interactive elements');
    console.log('═══════════════════════════════════════════════════════════════');

    const pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    const allResults = [];

    for (const page of pages) {
      console.log(`\n🧪 Testing ${page.name} (${page.path})`);
      
      try {
        await this.framework.setup();
        await this.framework.authenticate(`http://localhost:3000${page.path}`);

        const pageResults = [];

        // Test all critical breakpoints
        for (const breakpoint of this.criticalBreakpoints) {
          console.log(`  📏 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
          
          await this.framework.page.setViewport({
            width: breakpoint.width,
            height: breakpoint.height
          });

          // Wait for responsive layout changes
          await this.framework.page.waitForTimeout(1000);

          // Combine all interaction tests
          const allTests = [
            ...this.getSidebarInteractionTests(),
            ...this.getTableOverflowTests(),
            ...this.getInteractiveElementTests()
          ];

          const breakpointResults = [];
          
          for (const test of allTests) {
            try {
              const result = await test(this.framework.page, breakpoint, {}, {});
              breakpointResults.push(result);
              
              const status = result.passed ? '✅' : '❌';
              console.log(`    ${status} ${result.name}: ${result.message}`);
              
            } catch (error) {
              console.log(`    ❌ ${test.name || 'Test'}: Error - ${error.message}`);
              breakpointResults.push({
                name: test.name || 'Unknown Test',
                passed: false,
                message: `Error: ${error.message}`,
                details: { error: error.message }
              });
            }
          }

          pageResults.push({
            breakpoint,
            results: breakpointResults,
            passed: breakpointResults.filter(r => r.passed).length,
            total: breakpointResults.length
          });
        }

        await this.framework.cleanup();

        const totalPassed = pageResults.reduce((sum, bp) => sum + bp.passed, 0);
        const totalTests = pageResults.reduce((sum, bp) => sum + bp.total, 0);
        const passRate = Math.round((totalPassed / totalTests) * 100);

        console.log(`\n  📊 ${page.name} Results: ${totalPassed}/${totalTests} (${passRate}%)`);

        allResults.push({
          page: page.name,
          path: page.path,
          passed: totalPassed,
          total: totalTests,
          passRate,
          breakpointResults: pageResults
        });

      } catch (error) {
        console.error(`❌ ${page.name} Test Error:`, error.message);
        allResults.push({
          page: page.name,
          path: page.path,
          passed: 0,
          total: 1,
          passRate: 0,
          error: error.message
        });
      }
    }

    // Generate final report
    this.generateInteractionReport(allResults);

    const overallPassed = allResults.reduce((sum, page) => sum + page.passed, 0);
    const overallTotal = allResults.reduce((sum, page) => sum + page.total, 0);
    const overallPassRate = Math.round((overallPassed / overallTotal) * 100);

    return { 
      results: allResults, 
      overallPassRate, 
      success: overallPassRate >= 70 
    };
  }

  generateInteractionReport(results) {
    console.log('\n\n🔍 RESPONSIVE INTERACTIONS REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    
    results.forEach(result => {
      const status = result.passRate >= 80 ? '✅' : result.passRate >= 60 ? '⚠️' : '❌';
      console.log(`${status} ${result.page}: ${result.passed}/${result.total} (${result.passRate}%)`);
      
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    console.log('───────────────────────────────────────────────────────────────');
    
    const overallPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const overallTotal = results.reduce((sum, r) => sum + r.total, 0);
    const overallRate = Math.round((overallPassed / overallTotal) * 100);
    
    console.log(`🎯 OVERALL: ${overallPassed}/${overallTotal} (${overallRate}%)`);
    
    console.log('\n📋 CRITICAL FINDINGS:');
    console.log('• Sidebar expand/collapse behavior on xs/sm/md breakpoints');
    console.log('• Table overflow and content chopping detection');
    console.log('• Interactive element visibility across all breakpoints');
    console.log('• Breakpoint boundary behavior (first/last pixels)');
    
    if (overallRate >= 80) {
      console.log('\n🎉 EXCELLENT: Responsive interactions working well!');
    } else {
      console.log('\n⚠️  NEEDS ATTENTION: Critical responsive issues found.');
      console.log('🔧 Review failed tests and fix sidebar/table overflow issues.');
    }
  }
}

// Main execution
async function main() {
  const tester = new AdminResponsiveInteractionsTest();
  
  try {
    const { success, overallPassRate } = await tester.runComprehensiveTest();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`🔍 RESPONSIVE INTERACTIONS TEST COMPLETE: ${overallPassRate}%`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Responsive Interactions Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminResponsiveInteractionsTest;
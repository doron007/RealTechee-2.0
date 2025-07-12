#!/usr/bin/env node

/**
 * Critical Responsive Issues Test & Fix Verification
 * 
 * Tests the specific issues identified:
 * 1. Sidebar disappearing when expanded on mobile/tablet
 * 2. Table overflow at breakpoint boundaries
 * 3. Interactive elements visibility
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class CriticalResponsiveFixesTest {
  constructor() {
    this.framework = new ResponsiveTestFramework('Critical-Responsive-Fixes', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 200 }
    });

    // Test critical breakpoint boundaries
    this.criticalBreakpoints = [
      { width: 767, height: 1024, name: 'sm-max', description: 'Last pixel before md' },
      { width: 768, height: 1024, name: 'md-min', description: 'First pixel of md' },
      { width: 1023, height: 768, name: 'md-max', description: 'Last pixel before lg' },
      { width: 1024, height: 768, name: 'lg-min', description: 'First pixel of lg' },
      { width: 1279, height: 1024, name: 'lg-max', description: 'Last pixel before xl' },
      { width: 1280, height: 1024, name: 'xl-min', description: 'First pixel of xl' }
    ];
  }

  // Test sidebar disappearing issue
  async testSidebarBehavior(page, breakpoint) {
    console.log(`    🔍 Testing sidebar behavior at ${breakpoint.width}px`);
    
    const sidebarTest = await page.evaluate(async () => {
      const sidebar = document.querySelector('[class*="sidebar"]') || 
                     document.querySelector('div.fixed.left-0.top-0') ||
                     document.querySelector('.w-16, .w-64');
      
      if (!sidebar) return { error: 'Sidebar not found' };

      // Get initial state
      const initialRect = sidebar.getBoundingClientRect();
      const initialWidth = initialRect.width;
      const initialVisible = initialRect.width > 0 && initialRect.height > 0;
      const initialClasses = sidebar.className;
      
      // Look for expand button - try multiple selectors
      const expandButton = sidebar.querySelector('button[aria-label*="ollapse"]') ||
                          sidebar.querySelector('button[title*="xpand"]') ||
                          document.querySelector('[title*="expand"]') ||
                          document.querySelector('button[class*="rotate"]') ||
                          Array.from(sidebar.querySelectorAll('button')).find(btn => 
                            btn.querySelector('img[src*="arrow"]')
                          );
      
      if (!expandButton) {
        return {
          success: true,
          initialWidth,
          initialVisible,
          hasExpandButton: false,
          message: 'No expand button found - fixed width sidebar'
        };
      }

      // Test clicking expand
      try {
        expandButton.click();
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait for animation
        
        const afterExpandRect = sidebar.getBoundingClientRect();
        const afterExpandVisible = afterExpandRect.width > 0 && afterExpandRect.height > 0;
        const afterExpandClasses = sidebar.className;
        
        return {
          success: true,
          initialWidth,
          initialVisible,
          afterExpandWidth: afterExpandRect.width,
          afterExpandVisible,
          hasExpandButton: true,
          initialClasses,
          afterExpandClasses,
          expandWorked: Math.abs(afterExpandRect.width - initialWidth) > 50,
          sidebarDisappeared: !afterExpandVisible,
          hasHiddenClass: afterExpandClasses.includes('hidden')
        };
      } catch (error) {
        return {
          error: `Expand test failed: ${error.message}`,
          initialWidth,
          initialVisible,
          hasExpandButton: true
        };
      }
    });

    const isMobile = breakpoint.width < 768;
    const isTablet = breakpoint.width >= 768 && breakpoint.width < 1024;
    
    let passed = true;
    let issues = [];

    if (sidebarTest.error) {
      passed = false;
      issues.push(sidebarTest.error);
    } else if (sidebarTest.hasExpandButton) {
      // Critical test: sidebar should not disappear when expanded
      if (sidebarTest.sidebarDisappeared) {
        passed = false;
        issues.push(`🚨 CRITICAL: Sidebar disappears when expanded at ${breakpoint.width}px`);
      }
      
      if (sidebarTest.hasHiddenClass) {
        passed = false;
        issues.push(`🚨 CRITICAL: Sidebar gets 'hidden' class when expanded`);
      }
      
      if ((isMobile || isTablet) && sidebarTest.expandWorked && !sidebarTest.afterExpandVisible) {
        passed = false;
        issues.push(`Mobile/tablet sidebar becomes invisible after expand`);
      }
    }

    return {
      name: 'Sidebar Expand/Collapse Critical Test',
      passed,
      message: passed 
        ? `Sidebar behavior OK: ${sidebarTest.initialWidth}px → ${sidebarTest.afterExpandWidth || sidebarTest.initialWidth}px, visible: ${sidebarTest.afterExpandVisible !== false}`
        : `Sidebar issues: ${issues.join('; ')}`,
      details: sidebarTest,
      issues,
      breakpointType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    };
  }

  // Test table overflow at boundaries
  async testTableOverflow(page, breakpoint) {
    console.log(`    📊 Testing table overflow at ${breakpoint.width}px`);
    
    const overflowTest = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return { hasTable: false };

      const tableRect = table.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // Detailed overflow analysis
      const tableOverflowRight = Math.max(0, tableRect.right - viewportWidth);
      const tableOverflowLeft = Math.max(0, -tableRect.left);
      
      // Check each column
      const headers = Array.from(table.querySelectorAll('th'));
      const columnDetails = headers.map((header, index) => {
        const rect = header.getBoundingClientRect();
        return {
          index,
          text: header.textContent.trim(),
          left: rect.left,
          right: rect.right,
          width: rect.width,
          visible: rect.left >= 0 && rect.right <= viewportWidth,
          overflowRight: Math.max(0, rect.right - viewportWidth),
          overflowLeft: Math.max(0, -rect.left)
        };
      });

      // Check for table container
      const tableContainer = table.closest('.overflow-x-auto') || table.closest('[style*="overflow"]');
      const hasScrollContainer = !!tableContainer;
      
      return {
        hasTable: true,
        tableLeft: tableRect.left,
        tableRight: tableRect.right,
        tableWidth: tableRect.width,
        viewportWidth,
        tableOverflowRight,
        tableOverflowLeft,
        hasScrollContainer,
        totalColumns: headers.length,
        visibleColumns: columnDetails.filter(col => col.visible).length,
        columnDetails,
        worstOverflow: Math.max(...columnDetails.map(col => col.overflowRight))
      };
    });

    if (!overflowTest.hasTable) {
      return {
        name: 'Table Overflow Test',
        passed: true,
        message: 'No table - using card layout',
        details: { hasTable: false }
      };
    }

    let passed = true;
    let issues = [];
    
    // Critical: Table content getting chopped
    if (overflowTest.tableOverflowRight > 10) {
      passed = false;
      issues.push(`🚨 CRITICAL: Table overflows right by ${Math.round(overflowTest.tableOverflowRight)}px at ${breakpoint.width}px`);
    }

    // Check for significant column overflows
    const hiddenColumns = overflowTest.totalColumns - overflowTest.visibleColumns;
    if (hiddenColumns > 0 && breakpoint.width >= 1280) {
      issues.push(`${hiddenColumns} columns hidden on xl+ screen`);
    }

    if (overflowTest.worstOverflow > 50) {
      passed = false;
      issues.push(`Worst column overflow: ${Math.round(overflowTest.worstOverflow)}px`);
    }

    // Check scroll container
    if (overflowTest.tableOverflowRight > 0 && !overflowTest.hasScrollContainer) {
      issues.push('Table overflows but no scroll container');
    }

    return {
      name: 'Table Overflow Boundary Test',
      passed,
      message: passed 
        ? `Table fits: ${overflowTest.tableWidth}px in ${overflowTest.viewportWidth}px viewport, ${overflowTest.visibleColumns}/${overflowTest.totalColumns} columns visible`
        : `Table overflow: ${issues.join('; ')}`,
      details: overflowTest,
      issues,
      recommendation: overflowTest.tableOverflowRight > 0 ? 'Add horizontal scroll or switch to card layout' : null
    };
  }

  // Test interactive elements
  async testInteractiveElements(page, breakpoint) {
    console.log(`    🎛️ Testing interactive elements at ${breakpoint.width}px`);
    
    const interactiveTest = await page.evaluate(() => {
      const results = {
        search: null,
        viewToggle: null,
        archiveToggle: null,
        actionButtons: [],
        issues: []
      };

      // Test search box
      const searchBox = document.querySelector('input[type="search"], input[placeholder*="Search"]');
      if (searchBox) {
        const rect = searchBox.getBoundingClientRect();
        results.search = {
          found: true,
          visible: rect.width > 0 && rect.height > 0,
          width: rect.width,
          left: rect.left,
          right: rect.right
        };
      }

      // Test view toggle
      const viewToggle = document.querySelector('[title*="view"], [title*="card"], [title*="table"]');
      if (viewToggle) {
        const rect = viewToggle.getBoundingClientRect();
        results.viewToggle = {
          found: true,
          visible: rect.width > 0 && rect.height > 0,
          enabled: !viewToggle.disabled
        };
      }

      // Test archive toggle
      const archiveToggle = document.querySelector('input[type="checkbox"]');
      if (archiveToggle) {
        const rect = archiveToggle.getBoundingClientRect();
        const label = archiveToggle.closest('label') || document.querySelector(`label[for="${archiveToggle.id}"]`);
        results.archiveToggle = {
          found: true,
          visible: rect.width > 0 && rect.height > 0,
          hasLabel: !!label,
          labelText: label ? label.textContent.trim() : ''
        };
      }

      // Test action buttons
      const actionButtons = document.querySelectorAll('button[title*="Edit"], button[title*="Delete"], button[title*="View"]');
      actionButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        results.actionButtons.push({
          title: button.title,
          visible: rect.width > 0 && rect.height > 0,
          enabled: !button.disabled,
          size: Math.min(rect.width, rect.height)
        });
      });

      return results;
    });

    let passed = true;
    let issues = [];

    // Check search visibility
    if (interactiveTest.search && !interactiveTest.search.visible) {
      passed = false;
      issues.push('Search box not visible');
    }

    // Check for minimum touch targets on mobile
    if (breakpoint.width < 768) {
      const smallButtons = interactiveTest.actionButtons.filter(btn => btn.size < 44);
      if (smallButtons.length > 3) {
        issues.push(`${smallButtons.length} buttons < 44px touch target`);
      }
    }

    return {
      name: 'Interactive Elements Test',
      passed,
      message: passed 
        ? `Interactive elements OK: search=${!!interactiveTest.search?.visible}, buttons=${interactiveTest.actionButtons.filter(b => b.visible).length}`
        : `Interactive issues: ${issues.join('; ')}`,
      details: interactiveTest,
      issues
    };
  }

  // Run focused critical tests
  async runCriticalTests() {
    console.log('🚨 CRITICAL RESPONSIVE ISSUES TEST');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing specific responsive issues identified');
    console.log('🔍 Sidebar disappearing, table overflow, interactive elements');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();
      await this.framework.authenticate('http://localhost:3000/admin/projects');

      const allResults = [];

      for (const breakpoint of this.criticalBreakpoints) {
        console.log(`\n📏 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
        
        await this.framework.page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height
        });
        
        await this.framework.page.waitForTimeout(1500); // Wait for layout changes

        const tests = [
          await this.testSidebarBehavior(this.framework.page, breakpoint),
          await this.testTableOverflow(this.framework.page, breakpoint),
          await this.testInteractiveElements(this.framework.page, breakpoint)
        ];

        tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          console.log(`    ${status} ${test.name}: ${test.message}`);
        });

        allResults.push({
          breakpoint,
          tests,
          passed: tests.filter(t => t.passed).length,
          total: tests.length
        });
      }

      await this.framework.cleanup();

      // Generate report
      this.generateCriticalReport(allResults);

      const totalPassed = allResults.reduce((sum, bp) => sum + bp.passed, 0);
      const totalTests = allResults.reduce((sum, bp) => sum + bp.total, 0);
      const passRate = Math.round((totalPassed / totalTests) * 100);

      return { results: allResults, passRate, success: passRate >= 70 };

    } catch (error) {
      console.error('❌ Critical Test Error:', error.message);
      return { results: [], passRate: 0, success: false, error: error.message };
    }
  }

  generateCriticalReport(results) {
    console.log('\n\n🚨 CRITICAL ISSUES REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const criticalIssues = [];
    const minorIssues = [];
    
    results.forEach(result => {
      result.tests.forEach(test => {
        if (!test.passed && test.issues) {
          test.issues.forEach(issue => {
            if (issue.includes('🚨 CRITICAL')) {
              criticalIssues.push(`${result.breakpoint.name}: ${issue}`);
            } else {
              minorIssues.push(`${result.breakpoint.name}: ${issue}`);
            }
          });
        }
      });
    });
    
    console.log('🔥 CRITICAL ISSUES:');
    if (criticalIssues.length === 0) {
      console.log('   ✅ No critical issues found!');
    } else {
      criticalIssues.forEach(issue => console.log(`   ❌ ${issue}`));
    }
    
    console.log('\n⚠️  MINOR ISSUES:');
    if (minorIssues.length === 0) {
      console.log('   ✅ No minor issues found!');
    } else {
      minorIssues.forEach(issue => console.log(`   📝 ${issue}`));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (criticalIssues.length > 0) {
      console.log('   🔧 Fix critical issues immediately - they break core functionality');
      console.log('   📱 Test sidebar expand behavior on mobile/tablet screens');
      console.log('   📊 Review table layout for content overflow');
    } else {
      console.log('   🎉 All critical responsive behavior working correctly!');
    }
  }
}

// Main execution
async function main() {
  const tester = new CriticalResponsiveFixesTest();
  
  try {
    const { success, passRate } = await tester.runCriticalTests();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`🚨 CRITICAL RESPONSIVE TEST COMPLETE: ${passRate}%`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Critical Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CriticalResponsiveFixesTest;
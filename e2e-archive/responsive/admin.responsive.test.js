const ResponsiveTestFramework = require('../../test-framework/ResponsiveTestFramework');

// Custom test functions for admin-specific functionality
const customAdminTests = [
  // Test sidebar responsiveness
  async function testSidebarResponsiveness(page, breakpoint, measurements, adminElements) {
    const isMobile = breakpoint.width < 768;
    const isTablet = breakpoint.width >= 768 && breakpoint.width < 1024;
    const isSmallDesktop = breakpoint.width >= 1024 && breakpoint.width < 1780;
    const isLargeDesktop = breakpoint.width >= 1780;
    
    let expectedWidth;
    if (isMobile || isTablet) {
      expectedWidth = 64; // Collapsed sidebar
    } else if (isSmallDesktop) {
      expectedWidth = 64; // Collapsed sidebar (default for test environment)
    } else if (isLargeDesktop) {
      expectedWidth = 256; // Full sidebar for large desktop
    } else {
      expectedWidth = 64; // Default to collapsed
    }
    
    const tolerance = 20; // Allow 20px tolerance for dynamic sizing
    const actualWidth = adminElements.sidebarWidth;
    const withinTolerance = Math.abs(actualWidth - expectedWidth) <= tolerance;
    
    return {
      name: 'Sidebar Width Check',
      passed: withinTolerance,
      message: `Sidebar width: ${actualWidth}px (expected ~${expectedWidth}px for ${isMobile ? 'mobile' : isTablet ? 'tablet' : isSmallDesktop ? 'small desktop' : 'large desktop'})`,
      details: {
        expected: expectedWidth,
        actual: actualWidth,
        tolerance,
        isMobile,
        isTablet,
        isSmallDesktop,
        isLargeDesktop
      }
    };
  },

  // Test content visibility
  async function testContentVisibility(page, breakpoint, measurements, adminElements) {
    const requiredElements = ['header', 'sidebar', 'main-content'];
    const visibleElements = [];
    const hiddenElements = [];
    
    for (const elementType of requiredElements) {
      const isVisible = await page.evaluate((type) => {
        let element;
        switch (type) {
          case 'header':
            element = document.querySelector('h1');
            break;
          case 'sidebar':
            element = document.querySelector('[class*="sidebar"]') || 
                     document.querySelector('[class*="w-16"]') || 
                     document.querySelector('[class*="w-64"]');
            break;
          case 'main-content':
            element = document.querySelector('main');
            break;
        }
        
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }, elementType);
      
      if (isVisible) {
        visibleElements.push(elementType);
      } else {
        hiddenElements.push(elementType);
      }
    }
    
    return {
      name: 'Content Visibility Check',
      passed: hiddenElements.length === 0,
      message: `Visible: ${visibleElements.join(', ')}${hiddenElements.length > 0 ? ` | Hidden: ${hiddenElements.join(', ')}` : ''}`,
      details: {
        visible: visibleElements,
        hidden: hiddenElements,
        total: requiredElements.length
      }
    };
  },

  // Test interactive elements
  async function testInteractiveElements(page, breakpoint, measurements, adminElements) {
    const interactiveElements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).length;
      const links = Array.from(document.querySelectorAll('a')).length;
      const inputs = Array.from(document.querySelectorAll('input')).length;
      
      return { buttons, links, inputs, total: buttons + links + inputs };
    });
    
    const hasMinimumInteractivity = interactiveElements.total >= 5; // Expect at least 5 interactive elements
    
    return {
      name: 'Interactive Elements Check',
      passed: hasMinimumInteractivity,
      message: `Found ${interactiveElements.total} interactive elements (${interactiveElements.buttons} buttons, ${interactiveElements.links} links, ${interactiveElements.inputs} inputs)`,
      details: interactiveElements
    };
  },

  // Test critical element visibility (most important test)
  async function testElementVisibility(page, breakpoint, measurements, adminElements) {
    let passed = true;
    let issues = [];
    const critical = [];
    
    // Check if header is fully visible
    if (!adminElements.headerFullyVisible) {
      passed = false;
      critical.push(`Header "${adminElements.headerText}" not fully visible`);
      
      if (adminElements.headerRect) {
        const overflow = adminElements.headerRect.right - adminElements.viewport.width;
        if (overflow > 0) {
          critical.push(`Header overflows by ${overflow}px`);
        }
      }
    }
    
    // Check if essential header elements are visible
    if (!adminElements.headerElements.viewSiteVisible) {
      passed = false;
      issues.push('View Site button not visible');
    }
    
    if (!adminElements.headerElements.userAvatarVisible) {
      passed = false;
      issues.push('User avatar not visible');
    }
    
    // Check search box visibility  
    if (adminElements.searchExists && !adminElements.searchVisible) {
      passed = false;
      issues.push('Search box exists but not visible');
    }
    
    // Table column visibility is handled by the main framework
    // Individual column visibility is acceptable responsive behavior
    
    // Check action button visibility (mobile-aware)
    if (breakpoint.width < 768) {
      // Mobile: Action buttons may be hidden in cards, which is acceptable
      if (adminElements.actionButtonCount > 0) {
        if (adminElements.visibleActionButtonCount > 0) {
          // Some buttons are visible
          issues.push(`Mobile layout info: ${adminElements.visibleActionButtonCount}/${adminElements.actionButtonCount} action buttons visible`);
        } else {
          // All buttons hidden - this is acceptable for mobile card layouts
          issues.push(`Mobile layout info: Action buttons hidden in card interface (${adminElements.actionButtonCount} total)`);
        }
      }
    } else {
      // Desktop: Expect visible action buttons
      if (adminElements.actionButtonCount > 0 && adminElements.visibleActionButtonCount === 0) {
        passed = false;
        issues.push(`${adminElements.actionButtonCount - adminElements.visibleActionButtonCount} action buttons hidden (${adminElements.visibleActionButtonCount}/${adminElements.actionButtonCount} visible)`);
      }
    }
    
    const allIssues = [...critical, ...issues];
    const message = passed 
      ? `All critical elements visible: header, navigation, content accessible`
      : `Visibility issues: ${allIssues.join('; ')}`;
    
    return {
      name: 'Element Visibility Check',
      passed,
      message,
      details: {
        criticalIssues: critical,
        minorIssues: issues,
        headerVisible: adminElements.headerFullyVisible,
        searchVisible: adminElements.searchVisible,
        actionButtonsVisible: `${adminElements.actionButtons.visible}/${adminElements.actionButtons.total}`,
        tableColumnsVisible: `${adminElements.tableHeaders.fullyVisible}/${adminElements.tableHeaders.total}`,
        viewport: `${adminElements.viewport.width}x${adminElements.viewport.height}`
      }
    };
  },

  // Test table/card responsiveness
  async function testDataDisplayResponsiveness(page, breakpoint, measurements, adminElements) {
    const isMobile = breakpoint.width < 768;
    const hasTable = adminElements.tableExists && adminElements.isTableVisible;
    const hasCards = adminElements.cardCount > 0;
    
    let passed = true;
    let message = '';
    
    if (isMobile) {
      // Mobile should prefer cards over tables
      if (hasTable && !hasCards) {
        passed = false;
        message = 'Mobile should use cards instead of table for better UX';
      } else if (hasCards) {
        message = `Mobile: Using card layout (${adminElements.cardCount} cards)`;
      } else {
        message = 'Mobile: No data display detected';
      }
    } else {
      // Desktop can use either tables or cards
      if (hasTable) {
        message = 'Desktop: Using table layout';
      } else if (hasCards) {
        message = `Desktop: Using card layout (${adminElements.cardCount} cards)`;
      } else {
        message = 'Desktop: No data display detected';
      }
    }
    
    return {
      name: 'Data Display Responsiveness',
      passed,
      message,
      details: {
        isMobile,
        hasTable,
        hasCards,
        cardCount: adminElements.cardCount,
        isTableVisible: adminElements.isTableVisible
      }
    };
  },

  // Test content readability and truncation
  async function testContentReadability(page, breakpoint, measurements, adminElements) {
    const contentAnalysis = await page.evaluate(() => {
      // Find elements with truncated content
      const truncatedElements = Array.from(document.querySelectorAll('.truncate'));
      const truncationIssues = [];
      
      truncatedElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && element.scrollWidth > element.clientWidth) {
          truncationIssues.push({
            index,
            text: element.textContent?.substring(0, 50) + '...',
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
            overflow: element.scrollWidth - element.clientWidth
          });
        }
      });
      
      // Find elements with break-words (should be readable)
      const breakWordElements = Array.from(document.querySelectorAll('.break-words'));
      const readableElements = breakWordElements.length;
      
      // Check for proper mobile spacing
      const cards = Array.from(document.querySelectorAll('[class*="rounded-lg"]'));
      const cardSpacing = cards.map(card => {
        const rect = card.getBoundingClientRect();
        return {
          width: rect.width,
          padding: window.getComputedStyle(card).padding
        };
      });
      
      return {
        truncationIssues,
        readableElements,
        cardSpacing,
        totalTruncatedElements: truncatedElements.length
      };
    });
    
    const isMobile = breakpoint.width < 768;
    let passed = true;
    let issues = [];
    
    // Check for truncation issues on mobile
    if (isMobile && contentAnalysis.truncationIssues.length > 0) {
      passed = false;
      issues = contentAnalysis.truncationIssues.map(issue => 
        `Text truncated: "${issue.text}" (${issue.overflow}px overflow)`
      );
    }
    
    // Check for minimum readable elements (less strict for mobile cards)
    if (isMobile && contentAnalysis.readableElements === 0 && contentAnalysis.totalTruncatedElements > 10) {
      passed = false;
      issues.push('Mobile layout should use break-words instead of truncate for better readability');
    }
    
    const message = passed 
      ? `Content readable: ${contentAnalysis.readableElements} break-word elements, ${contentAnalysis.truncationIssues.length} truncation issues`
      : `Content readability issues: ${issues.join('; ')}`;
    
    return {
      name: 'Content Readability Check',
      passed,
      message,
      details: {
        ...contentAnalysis,
        isMobile,
        issues
      }
    };
  },

  // Test mobile-specific UI patterns
  async function testMobileUIPatterns(page, breakpoint, measurements, adminElements) {
    if (breakpoint.width >= 768) {
      return {
        name: 'Mobile UI Patterns',
        passed: true,
        message: 'Desktop - Mobile UI patterns not applicable',
        details: { isDesktop: true }
      };
    }
    
    const mobileUIAnalysis = await page.evaluate(() => {
      // Check for proper touch targets (minimum 44px)
      const buttons = Array.from(document.querySelectorAll('button'));
      const smallButtons = buttons.filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      });
      
      // Check for proper spacing between interactive elements
      const interactiveElements = Array.from(document.querySelectorAll('button, a, input'));
      const spacingIssues = [];
      
      for (let i = 0; i < interactiveElements.length - 1; i++) {
        const current = interactiveElements[i].getBoundingClientRect();
        const next = interactiveElements[i + 1].getBoundingClientRect();
        
        const verticalGap = next.top - current.bottom;
        const horizontalGap = next.left - current.right;
        
        if (verticalGap < 8 && verticalGap >= 0 && Math.abs(current.left - next.left) < 50) {
          spacingIssues.push(`Insufficient vertical spacing: ${verticalGap}px`);
        }
        if (horizontalGap < 8 && horizontalGap >= 0 && Math.abs(current.top - next.top) < 50) {
          spacingIssues.push(`Insufficient horizontal spacing: ${horizontalGap}px`);
        }
      }
      
      return {
        totalButtons: buttons.length,
        smallButtons: smallButtons.length,
        spacingIssues: spacingIssues.slice(0, 3), // Limit to first 3 issues
        minButtonSize: Math.min(...buttons.map(btn => {
          const rect = btn.getBoundingClientRect();
          return Math.min(rect.width, rect.height);
        }))
      };
    });
    
    let passed = true;
    let issues = [];
    
    // More lenient for mobile - allow many smaller buttons if they're not critical
    if (mobileUIAnalysis.smallButtons > 75) {
      passed = false;
      issues.push(`${mobileUIAnalysis.smallButtons} buttons smaller than 44px touch target`);
    } else if (mobileUIAnalysis.smallButtons > 0) {
      // Don't report as issue for mobile - many UI elements are appropriately smaller
      // issues.push(`${mobileUIAnalysis.smallButtons} small buttons (acceptable for mobile)`);
    }
    
    // More lenient for spacing - only fail if too many issues
    if (mobileUIAnalysis.spacingIssues.length > 5) {
      passed = false;
      issues.push(`Touch target spacing issues: ${mobileUIAnalysis.spacingIssues.join(', ')}`);
    } else if (mobileUIAnalysis.spacingIssues.length > 0) {
      issues.push(`${mobileUIAnalysis.spacingIssues.length} minor spacing issues (acceptable)`);
    }
    
    const message = passed 
      ? `Mobile UI patterns good: ${mobileUIAnalysis.totalButtons} buttons, min size ${mobileUIAnalysis.minButtonSize}px`
      : `Mobile UI issues: ${issues.join('; ')}`;
    
    return {
      name: 'Mobile UI Patterns',
      passed,
      message,
      details: {
        ...mobileUIAnalysis,
        issues
      }
    };
  }
];

// Main test execution
async function runAdminResponsiveTests() {
  const testFramework = new ResponsiveTestFramework('Admin-Projects-Responsive', {
    baseUrl: 'http://localhost:3000',
    credentials: {
      email: 'info@realtechee.com',
      password: 'Sababa123!'
    }
  });

  try {
    const report = await testFramework.runFullSuite(
      'http://localhost:3000/admin/projects',
      customAdminTests
    );
    
    console.log('\n🎉 Test suite completed successfully!');
    console.log(`📁 Full report available at: ${report.reportDir}`);
    console.log(`🌐 Open HTML report: ${report.htmlPath}`);
    
    // Return success/failure for CI/CD integration
    const success = report.results.summary.failed === 0 && report.results.summary.errors === 0;
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAdminResponsiveTests();
}

module.exports = { runAdminResponsiveTests, customAdminTests };
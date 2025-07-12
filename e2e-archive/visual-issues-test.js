#!/usr/bin/env node

/**
 * Visual Issues Test Suite
 * 
 * Tests for visual issues that were recently fixed:
 * - Duplicate page titles 
 * - Progressive card expansion functionality
 * - Proper address display in cards
 * - Sort controls visibility in cards view only
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class VisualIssuesTest {
  constructor() {
    this.framework = new ResponsiveTestFramework('Visual-Issues-Test', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 300 }
    });

    this.pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    this.testResults = {};
  }

  // Test for duplicate page titles
  async testDuplicateTitles(page, pageName) {
    console.log(`📄 Testing for duplicate titles on ${pageName}...`);
    
    const results = {
      titleCount: 0,
      duplicateTitles: false,
      titleElements: [],
      hasSingleTitle: false
    };

    try {
      // Count all H1 elements containing the page name
      const titleInfo = await page.evaluate((pageNameToFind) => {
        const h1Elements = Array.from(document.querySelectorAll('h1'));
        const pageNameElements = h1Elements.filter(h1 => 
          h1.textContent.toLowerCase().includes(pageNameToFind.toLowerCase())
        );
        
        return {
          totalH1Count: h1Elements.length,
          pageNameH1Count: pageNameElements.length,
          allH1Texts: h1Elements.map(h1 => h1.textContent.trim()),
          pageNameH1Texts: pageNameElements.map(h1 => h1.textContent.trim())
        };
      }, pageName);

      results.titleCount = titleInfo.pageNameH1Count;
      results.titleElements = titleInfo.pageNameH1Texts;
      results.duplicateTitles = titleInfo.pageNameH1Count > 1;
      results.hasSingleTitle = titleInfo.pageNameH1Count === 1;

      console.log(`    📊 Found ${titleInfo.totalH1Count} total H1 elements`);
      console.log(`    📊 Found ${titleInfo.pageNameH1Count} H1 elements with "${pageName}"`);
      console.log(`    📝 H1 texts: [${titleInfo.allH1Texts.join(', ')}]`);

      if (results.duplicateTitles) {
        console.log(`    ❌ DUPLICATE TITLES DETECTED: ${results.titleElements.join(', ')}`);
      } else {
        console.log(`    ✅ No duplicate titles found`);
      }

    } catch (error) {
      console.error(`Error testing duplicate titles on ${pageName}:`, error.message);
    }

    return results;
  }

  // Test progressive card functionality
  async testProgressiveCards(page, pageName) {
    console.log(`🎴 Testing progressive card functionality on ${pageName}...`);
    
    const results = {
      hasCardsView: false,
      hasProgressiveCards: false,
      cardExpansionWorks: false,
      addressVisibleInCollapsed: false,
      addressVisibleInExpanded: false,
      cardInteractionTest: 'not_tested'
    };

    try {
      // Switch to cards view first
      console.log(`    🔄 Switching to cards view...`);
      const viewToggle = await page.$('button[title*="cards"], button[aria-label*="cards"], button:has(svg)');
      if (viewToggle) {
        await viewToggle.click();
        await page.waitForTimeout(2000);
      }

      // Check if cards view is active
      const cardsViewActive = await page.evaluate(() => {
        // Look for card elements - progressive cards should have specific structure
        const cards = document.querySelectorAll('[class*="card"], [data-testid*="card"]');
        const progressiveCards = Array.from(cards).filter(card => 
          card.innerHTML.includes('Property Address') || 
          card.innerHTML.includes('propertyAddress') ||
          card.querySelector('[class*="flex items-center"]')
        );
        
        return {
          totalCards: cards.length,
          progressiveCards: progressiveCards.length,
          hasCards: cards.length > 0
        };
      });

      results.hasCardsView = cardsViewActive.hasCards;
      results.hasProgressiveCards = cardsViewActive.progressiveCards > 0;

      console.log(`    📊 Found ${cardsViewActive.totalCards} total cards`);
      console.log(`    📊 Found ${cardsViewActive.progressiveCards} progressive cards`);

      if (results.hasProgressiveCards) {
        // Test card expansion
        console.log(`    🔍 Testing card expansion...`);
        
        // Click on first card to expand it
        const firstCard = await page.$('[class*="card"]:first-of-type, [data-testid*="card"]:first-of-type');
        if (firstCard) {
          // Check initial state (collapsed)
          const initialState = await page.evaluate(() => {
            const firstCard = document.querySelector('[class*="card"]:first-of-type, [data-testid*="card"]:first-of-type');
            return {
              hasAddress: firstCard ? firstCard.textContent.includes('Address') || 
                                    firstCard.textContent.includes('Street') ||
                                    firstCard.textContent.includes('CA ') ||
                                    firstCard.textContent.includes('Los Angeles') : false,
              cardHeight: firstCard ? firstCard.offsetHeight : 0
            };
          });

          results.addressVisibleInCollapsed = initialState.hasAddress;
          console.log(`    📍 Address visible in collapsed state: ${results.addressVisibleInCollapsed ? '✅' : '❌'}`);

          // Click to expand
          await firstCard.click();
          await page.waitForTimeout(1000);

          // Check expanded state
          const expandedState = await page.evaluate(() => {
            const firstCard = document.querySelector('[class*="card"]:first-of-type, [data-testid*="card"]:first-of-type');
            return {
              hasAddress: firstCard ? firstCard.textContent.includes('Property Address') || 
                                    firstCard.textContent.includes('Address') : false,
              cardHeight: firstCard ? firstCard.offsetHeight : 0,
              hasMoreDetails: firstCard ? firstCard.textContent.includes('Created') || 
                                         firstCard.textContent.includes('Owner') ||
                                         firstCard.textContent.includes('Agent') : false
            };
          });

          results.addressVisibleInExpanded = expandedState.hasAddress;
          results.cardExpansionWorks = expandedState.cardHeight > initialState.cardHeight && expandedState.hasMoreDetails;

          console.log(`    📍 Address visible in expanded state: ${results.addressVisibleInExpanded ? '✅' : '❌'}`);
          console.log(`    📏 Card expansion works: ${results.cardExpansionWorks ? '✅' : '❌'}`);
          
          results.cardInteractionTest = 'completed';
        } else {
          results.cardInteractionTest = 'no_cards_found';
        }
      } else {
        console.log(`    ❌ No progressive cards found - may be using generic cards`);
        results.cardInteractionTest = 'no_progressive_cards';
      }

    } catch (error) {
      console.error(`Error testing progressive cards on ${pageName}:`, error.message);
      results.cardInteractionTest = 'error';
    }

    return results;
  }

  // Test sort controls visibility (should only show in cards view)
  async testSortControlsVisibility(page, pageName) {
    console.log(`🔃 Testing sort controls visibility on ${pageName}...`);
    
    const results = {
      tableViewSortHidden: false,
      cardsViewSortVisible: false,
      viewToggleWorks: false
    };

    try {
      // Test table view first - sort controls should be hidden
      console.log(`    📋 Testing table view - sort should be hidden...`);
      const tableViewToggle = await page.$('button[title*="table"], button[aria-label*="table"], button:has(svg)');
      if (tableViewToggle) {
        await tableViewToggle.click();
        await page.waitForTimeout(2000);

        const tableViewSortVisible = await page.evaluate(() => {
          const sortElements = document.querySelectorAll(
            '[aria-label*="Sort"], [title*="Sort"], select:has(option), button:contains("Sort")'
          );
          return Array.from(sortElements).some(el => 
            el.offsetHeight > 0 && el.offsetWidth > 0 && 
            window.getComputedStyle(el).display !== 'none'
          );
        });

        results.tableViewSortHidden = !tableViewSortVisible;
        console.log(`    📋 Sort hidden in table view: ${results.tableViewSortHidden ? '✅' : '❌'}`);
      }

      // Test cards view - sort controls should be visible
      console.log(`    🎴 Testing cards view - sort should be visible...`);
      const cardsViewToggle = await page.$('button[title*="cards"], button[aria-label*="cards"], button:has(svg)');
      if (cardsViewToggle) {
        await cardsViewToggle.click();
        await page.waitForTimeout(2000);

        const cardsViewSortVisible = await page.evaluate(() => {
          const sortElements = document.querySelectorAll(
            '[aria-label*="Sort"], [title*="Sort"], select:has(option), button:contains("Sort")'
          );
          return Array.from(sortElements).some(el => 
            el.offsetHeight > 0 && el.offsetWidth > 0 && 
            window.getComputedStyle(el).display !== 'none'
          );
        });

        results.cardsViewSortVisible = cardsViewSortVisible;
        console.log(`    🎴 Sort visible in cards view: ${results.cardsViewSortVisible ? '✅' : '❌'}`);
      }

      results.viewToggleWorks = results.tableViewSortHidden && results.cardsViewSortVisible;

    } catch (error) {
      console.error(`Error testing sort controls visibility on ${pageName}:`, error.message);
    }

    return results;
  }

  // Run all visual tests for a single page
  async testSinglePage(pageInfo) {
    console.log(`\n🧪 Testing visual issues on ${pageInfo.name} (${pageInfo.path})`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      
      // Wait for page to load completely
      await this.framework.waitForPageReady({ 
        maxWaitTime: 30000,
        checkInterval: 500,
        customReadyCheck: async (page) => {
          const hasContent = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const dataElements = document.querySelectorAll('table tr, [class*="card"]');
            return !!(h1 && dataElements.length > 0);
          });
          return hasContent;
        }
      });

      const results = {
        pageName: pageInfo.name,
        duplicateTitles: await this.testDuplicateTitles(this.framework.page, pageInfo.name),
        progressiveCards: await this.testProgressiveCards(this.framework.page, pageInfo.name),
        sortControls: await this.testSortControlsVisibility(this.framework.page, pageInfo.name)
      };

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/visual-issues-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${pageInfo.name} visual issues testing complete`);
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
    console.log('\n📊 VISUAL ISSUES TEST REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    let totalTests = 0;
    let passedTests = 0;

    Object.entries(this.testResults).forEach(([pageName, results]) => {
      if (results.error) {
        console.log(`\n❌ ${pageName}: ERROR - ${results.error}`);
        return;
      }

      console.log(`\n📄 ${pageName}:`);
      
      // Test 1: Duplicate Titles
      const titlesTest = results.duplicateTitles;
      const titlesPassed = titlesTest?.hasSingleTitle && !titlesTest?.duplicateTitles;
      console.log(`  📄 Duplicate Titles Test: ${titlesPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`     - Single title: ${titlesTest?.hasSingleTitle ? '✅' : '❌'}`);
      console.log(`     - No duplicates: ${!titlesTest?.duplicateTitles ? '✅' : '❌'}`);
      console.log(`     - Title count: ${titlesTest?.titleCount || 0}`);
      totalTests++;
      if (titlesPassed) passedTests++;

      // Test 2: Progressive Cards
      const cardsTest = results.progressiveCards;
      const cardsPassed = cardsTest?.hasProgressiveCards && cardsTest?.cardExpansionWorks && 
                         cardsTest?.addressVisibleInCollapsed && cardsTest?.addressVisibleInExpanded;
      console.log(`  🎴 Progressive Cards Test: ${cardsPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`     - Has progressive cards: ${cardsTest?.hasProgressiveCards ? '✅' : '❌'}`);
      console.log(`     - Card expansion works: ${cardsTest?.cardExpansionWorks ? '✅' : '❌'}`);
      console.log(`     - Address in collapsed: ${cardsTest?.addressVisibleInCollapsed ? '✅' : '❌'}`);
      console.log(`     - Address in expanded: ${cardsTest?.addressVisibleInExpanded ? '✅' : '❌'}`);
      totalTests++;
      if (cardsPassed) passedTests++;

      // Test 3: Sort Controls
      const sortTest = results.sortControls;
      const sortPassed = sortTest?.viewToggleWorks;
      console.log(`  🔃 Sort Controls Test: ${sortPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`     - Hidden in table view: ${sortTest?.tableViewSortHidden ? '✅' : '❌'}`);
      console.log(`     - Visible in cards view: ${sortTest?.cardsViewSortVisible ? '✅' : '❌'}`);
      console.log(`     - View toggle works: ${sortTest?.viewToggleWorks ? '✅' : '❌'}`);
      totalTests++;
      if (sortPassed) passedTests++;
    });

    console.log('\n📊 OVERALL SUMMARY:');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Pass rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    const allTestsPassed = passedTests === totalTests;
    if (allTestsPassed) {
      console.log('🎉 ALL VISUAL ISSUES TESTS PASSED!');
    } else {
      console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    }

    return { totalTests, passedTests, allTestsPassed };
  }

  // Run comprehensive visual issues verification
  async runVerification() {
    console.log('🔄 VISUAL ISSUES TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Testing visual issues fixes across all admin pages');
    console.log('📊 Tests: Duplicate Titles, Progressive Cards, Sort Controls');
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
      const summary = this.generateReport();

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 VISUAL ISSUES VERIFICATION COMPLETE');
      console.log('📸 Screenshots captured for visual verification');
      console.log(`📊 Pass Rate: ${Math.round((summary.passedTests / summary.totalTests) * 100)}%`);
      console.log('═══════════════════════════════════════════════════════════════');

      return summary.allTestsPassed;

    } catch (error) {
      console.error('❌ Visual Issues Verification Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new VisualIssuesTest();
  
  try {
    const success = await tester.runVerification();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Visual Issues Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VisualIssuesTest;
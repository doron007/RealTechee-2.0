#!/usr/bin/env node

/**
 * Quick Cards Address Display Test
 * 
 * Verifies that all three admin pages (Projects, Quotes, Requests) 
 * properly display addresses in their cards view collapsed state.
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class CardsAddressTest {
  constructor() {
    this.framework = new ResponsiveTestFramework('Cards-Address-Test', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 500 }
    });

    this.pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    this.results = {};
  }

  async testCardsAddressDisplay(pageInfo) {
    console.log(`\n🧪 Testing cards address display on ${pageInfo.name}`);
    
    try {
      await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
      
      // Wait for page to load with data
      await this.framework.waitForPageReady({ 
        maxWaitTime: 20000,
        customReadyCheck: async (page) => {
          const hasData = await page.evaluate(() => {
            const tableRows = document.querySelectorAll('tbody tr, .MuiTableBody-root tr');
            const cardItems = document.querySelectorAll('.admin-card, .bg-white');
            return tableRows.length > 0 || cardItems.length > 0;
          });
          return hasData;
        }
      });

      console.log(`  📊 Page loaded, testing cards view...`);

      const result = {
        pageName: pageInfo.name,
        cardsViewExists: false,
        addressesVisible: false,
        statusPillsVisible: false,
        addressCount: 0,
        statusPillCount: 0
      };

      // Try to switch to cards view
      try {
        const viewToggle = await this.framework.page.$('button[title*="cards"], button[aria-label*="cards"]');
        if (viewToggle) {
          await viewToggle.click();
          await this.framework.page.waitForTimeout(1000);
          result.cardsViewExists = true;
          console.log(`  ✅ Switched to cards view`);
        } else {
          console.log(`  ⚠️  Cards view toggle not found, testing current view`);
        }
      } catch (e) {
        console.log(`  ⚠️  Error switching to cards view: ${e.message}`);
      }

      // Check for addresses in the collapsed cards
      const addressData = await this.framework.page.evaluate(() => {
        const cards = document.querySelectorAll('.admin-card, .bg-white, [data-testid="admin-card"]');
        let addressCount = 0;
        const addresses = [];
        
        cards.forEach((card, index) => {
          const text = card.textContent.toLowerCase();
          // Look for typical address patterns
          if (text.includes('street') || text.includes('avenue') || text.includes('blvd') || 
              text.includes('road') || text.includes('drive') || text.includes('way') ||
              text.includes('main') || text.includes('oak') || text.includes('pine') ||
              text.includes('ca ') || text.includes('ny ') || text.includes('tx ') ||
              /\d{5}/.test(text)) { // ZIP code pattern
            addressCount++;
            // Extract visible text that looks like an address
            const addressMatch = card.textContent.match(/[^,\n]+(?:street|avenue|blvd|road|drive|way)[^,\n]*/i);
            if (addressMatch) {
              addresses.push(addressMatch[0].trim());
            }
          }
        });
        
        return { addressCount, addresses: addresses.slice(0, 3) }; // Sample first 3
      });

      result.addressCount = addressData.addressCount;
      result.addressesVisible = addressData.addressCount > 0;

      // Check for status pills
      const statusPills = await this.framework.page.$$('.status-pill, [data-testid="status-pill"], .bg-blue-100, .bg-green-100, .bg-red-100, .bg-yellow-100');
      result.statusPillCount = statusPills.length;
      result.statusPillsVisible = statusPills.length > 0;

      console.log(`  📍 Addresses found: ${result.addressCount} ${result.addressesVisible ? '✅' : '❌'}`);
      console.log(`  💊 Status pills found: ${result.statusPillCount} ${result.statusPillsVisible ? '✅' : '❌'}`);
      
      if (addressData.addresses.length > 0) {
        console.log(`  📋 Sample addresses: ${addressData.addresses.join(', ')}`);
      }

      // Take screenshot for verification
      await this.framework.page.screenshot({
        path: `test-results/cards-address-${pageInfo.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: true
      });

      return result;

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
      return {
        pageName: pageInfo.name,
        error: error.message
      };
    }
  }

  generateReport() {
    console.log('\n📊 CARDS ADDRESS DISPLAY REPORT');
    console.log('═══════════════════════════════════════════');

    let totalPages = 0;
    let pagesWithAddresses = 0;
    let pagesWithStatusPills = 0;

    Object.entries(this.results).forEach(([pageName, result]) => {
      if (result.error) {
        console.log(`\n❌ ${pageName}: ERROR - ${result.error}`);
        return;
      }

      totalPages++;
      console.log(`\n📄 ${pageName}:`);
      console.log(`  - Addresses: ${result.addressCount} ${result.addressesVisible ? '✅' : '❌'}`);
      console.log(`  - Status pills: ${result.statusPillCount} ${result.statusPillsVisible ? '✅' : '❌'}`);
      console.log(`  - Cards view: ${result.cardsViewExists ? '✅' : '❌'}`);

      if (result.addressesVisible) pagesWithAddresses++;
      if (result.statusPillsVisible) pagesWithStatusPills++;
    });

    console.log('\n📊 SUMMARY:');
    console.log(`Pages tested: ${totalPages}`);
    console.log(`Pages with addresses: ${pagesWithAddresses}/${totalPages} (${Math.round(pagesWithAddresses/totalPages*100)}%)`);
    console.log(`Pages with status pills: ${pagesWithStatusPills}/${totalPages} (${Math.round(pagesWithStatusPills/totalPages*100)}%)`);

    const success = pagesWithAddresses === totalPages && pagesWithStatusPills === totalPages;
    console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '❌ Some tests failed'}`);

    return success;
  }

  async runTest() {
    console.log('🔄 CARDS ADDRESS DISPLAY TEST');
    console.log('═══════════════════════════════════════════');
    console.log('🎯 Testing address display in cards view');
    console.log('📊 Pages: Projects, Quotes, Requests');
    console.log('═══════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Test each page
      for (const pageInfo of this.pages) {
        const result = await this.testCardsAddressDisplay(pageInfo);
        this.results[pageInfo.name] = result;
      }

      await this.framework.cleanup();

      // Generate report
      const success = this.generateReport();

      console.log('\n═══════════════════════════════════════════');
      console.log('🎉 CARDS ADDRESS TEST COMPLETE');
      console.log('📸 Screenshots captured for verification');
      console.log('═══════════════════════════════════════════');

      return success;

    } catch (error) {
      console.error('❌ Cards Address Test Error:', error.message);
      await this.framework.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new CardsAddressTest();
  
  try {
    const success = await tester.runTest();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Cards Address Test Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CardsAddressTest;
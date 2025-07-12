#!/usr/bin/env node

/**
 * Admin Pages UI/UX Comparison Test
 * 
 * Compares the actual UI features between Projects, Quotes, and Requests pages
 * to identify differences and standardization opportunities.
 */

const ResponsiveTestFramework = require('../framework/ResponsiveTestFramework');

class AdminPagesComparison {
  constructor() {
    this.framework = new ResponsiveTestFramework('Admin-Pages-Comparison', {
      baseUrl: 'http://localhost:3000',
      credentials: { email: 'info@realtechee.com', password: 'Sababa123!' },
      puppeteer: { headless: false, slowMo: 500 }
    });

    this.pages = [
      { path: '/admin/projects', name: 'Projects' },
      { path: '/admin/quotes', name: 'Quotes' },
      { path: '/admin/requests', name: 'Requests' }
    ];

    this.features = {};
  }

  // Analyze page features
  async analyzePage(page, pageName) {
    console.log(`🔍 Analyzing ${pageName} page features...`);
    
    const features = await page.evaluate(() => {
      const analysis = {
        // Header and title analysis
        header: {
          title: document.querySelector('h1')?.textContent?.trim() || '',
          subtitle: document.querySelector('h2, p[class*="subtitle"]')?.textContent?.trim() || ''
        },

        // Archive toggle analysis
        archiveToggle: {
          exists: !!document.querySelector('input[type="checkbox"]'),
          visible: !!document.querySelector('input[type="checkbox"]:not([style*="display: none"])'),
          label: document.querySelector('label')?.textContent?.trim() || '',
          count: document.querySelector('div[class*="text-sm text-gray-500"]')?.textContent?.trim() || ''
        },

        // Search functionality
        search: {
          exists: !!document.querySelector('input[type="search"], input[placeholder*="Search"]'),
          placeholder: document.querySelector('input[type="search"], input[placeholder*="Search"]')?.placeholder || '',
          visible: !!document.querySelector('input[type="search"], input[placeholder*="Search"]:not([style*="display: none"])')
        },

        // Filter options
        filters: {
          count: document.querySelectorAll('select, [role="combobox"]').length,
          elements: Array.from(document.querySelectorAll('select, [role="combobox"]')).map(filter => ({
            label: filter.previousElementSibling?.textContent?.trim() || filter.getAttribute('aria-label') || '',
            options: filter.tagName === 'SELECT' ? filter.options.length : 0
          }))
        },

        // Action buttons analysis
        actions: {
          createNew: {
            exists: !!document.querySelector('button[class*="bg-blue"], button:contains("New")'),
            text: document.querySelector('button[class*="bg-blue"], button')?.textContent?.trim() || ''
          },
          refresh: {
            exists: !!document.querySelector('button[title*="Refresh"], button[aria-label*="Refresh"]'),
            visible: !!document.querySelector('button[title*="Refresh"]:not([style*="display: none"])')
          },
          viewToggle: {
            exists: !!document.querySelector('button[title*="view"], button[title*="toggle"]'),
            visible: !!document.querySelector('button[title*="view"]:not([style*="display: none"])')
          }
        },

        // Table/data analysis
        dataDisplay: {
          hasTable: !!document.querySelector('table'),
          hasCards: document.querySelectorAll('[class*="card"], .bg-white.border').length > 3,
          rowCount: document.querySelectorAll('tbody tr').length,
          cardCount: document.querySelectorAll('[class*="card"], .bg-white.border').length,
          columns: Array.from(document.querySelectorAll('th')).map(th => th.textContent?.trim()).filter(text => text)
        },

        // Row action buttons
        rowActions: {
          actionButtons: Array.from(document.querySelectorAll('tbody tr:first-child button, [class*="card"]:first-child button')).map(btn => ({
            title: btn.title || btn.getAttribute('aria-label') || '',
            text: btn.textContent?.trim() || '',
            visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
          })),
          actionCount: document.querySelectorAll('tbody tr:first-child button, [class*="card"]:first-child button').length
        },

        // Sorting indicators
        sorting: {
          sortableColumns: document.querySelectorAll('th[class*="sortable"], th[aria-sort]').length,
          currentSort: document.querySelector('th[aria-sort="ascending"], th[aria-sort="descending"]')?.textContent?.trim() || '',
          sortDirection: document.querySelector('th[aria-sort="ascending"]') ? 'asc' : 
                        document.querySelector('th[aria-sort="descending"]') ? 'desc' : 'none'
        },

        // Status indicators
        statusDisplay: {
          statusPills: document.querySelectorAll('[class*="status"], .badge, .pill').length,
          statusTypes: Array.from(document.querySelectorAll('[class*="status"], .badge, .pill')).map(el => 
            el.textContent?.trim()).filter(text => text).slice(0, 5) // First 5 status types
        },

        // Mobile responsiveness
        responsive: {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          isMobile: window.innerWidth < 768,
          layoutType: window.innerWidth < 768 && document.querySelectorAll('[class*="card"]').length > 3 ? 'cards' : 
                     document.querySelector('table') ? 'table' : 'mixed'
        }
      };

      return analysis;
    });

    // Take screenshot for visual comparison
    await page.screenshot({
      path: `test-results/admin-comparison-${pageName.toLowerCase()}-${Date.now()}.png`,
      fullPage: true
    });

    return features;
  }

  // Compare features across pages
  generateComparison() {
    console.log('\n📊 ADMIN PAGES FEATURE COMPARISON');
    console.log('═══════════════════════════════════════════════════════════════');

    const comparison = {};
    const recommendations = [];

    // Compare each feature category
    const categories = ['archiveToggle', 'search', 'filters', 'actions', 'dataDisplay', 'rowActions', 'sorting', 'statusDisplay'];

    categories.forEach(category => {
      comparison[category] = {};
      
      this.pages.forEach(({ name }) => {
        comparison[category][name] = this.features[name] ? this.features[name][category] : null;
      });
    });

    // Generate detailed comparison report
    console.log('\n🔍 DETAILED FEATURE ANALYSIS:');
    console.log('───────────────────────────────────────────────────────────────');

    // Archive Toggle Comparison
    console.log('\n📁 ARCHIVE TOGGLE:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.archiveToggle;
      const status = feature?.exists ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${feature?.exists ? `"${feature.label}" (${feature.count})` : 'Missing'}`);
    });

    if (!this.features.Projects?.archiveToggle?.exists) {
      recommendations.push('Add archive toggle to Projects page (following Quotes/Requests pattern)');
    }

    // Search Functionality
    console.log('\n🔍 SEARCH FUNCTIONALITY:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.search;
      const status = feature?.exists ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${feature?.exists ? `"${feature.placeholder}"` : 'Missing'}`);
    });

    // Filters
    console.log('\n🎛️ FILTER OPTIONS:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.filters;
      console.log(`  📊 ${name}: ${feature?.count || 0} filters`);
      feature?.elements?.forEach(filter => {
        console.log(`    - ${filter.label} (${filter.options} options)`);
      });
    });

    // Action Buttons
    console.log('\n🔘 ACTION BUTTONS:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.actions;
      console.log(`  🎯 ${name}:`);
      console.log(`    - Create New: ${feature?.createNew?.exists ? '✅' : '❌'} "${feature?.createNew?.text}"`);
      console.log(`    - Refresh: ${feature?.refresh?.exists ? '✅' : '❌'}`);
      console.log(`    - View Toggle: ${feature?.viewToggle?.exists ? '✅' : '❌'}`);
    });

    // Row Actions
    console.log('\n⚡ ROW ACTION BUTTONS:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.rowActions;
      console.log(`  🎯 ${name}: ${feature?.actionCount || 0} actions`);
      feature?.actionButtons?.slice(0, 5)?.forEach(action => {
        console.log(`    - ${action.title || action.text} ${action.visible ? '✅' : '❌'}`);
      });
    });

    // Data Display
    console.log('\n📊 DATA DISPLAY:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.dataDisplay;
      console.log(`  📋 ${name}: ${feature?.columns?.length || 0} columns, ${feature?.rowCount || 0} rows`);
      console.log(`    Columns: ${feature?.columns?.join(', ') || 'None'}`);
    });

    // Sorting
    console.log('\n🔃 SORTING CAPABILITIES:');
    this.pages.forEach(({ name }) => {
      const feature = this.features[name]?.sorting;
      console.log(`  📈 ${name}: ${feature?.sortableColumns || 0} sortable columns`);
      if (feature?.currentSort) {
        console.log(`    Current sort: ${feature.currentSort} (${feature.sortDirection})`);
      }
    });

    return { comparison, recommendations };
  }

  // Run comprehensive comparison
  async runComparison() {
    console.log('🔄 ADMIN PAGES UI/UX COMPARISON ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📱 Analyzing actual UI features across all admin pages');
    console.log('🎯 Goal: Identify differences and standardization opportunities');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
      await this.framework.setup();

      // Analyze each page
      for (const pageInfo of this.pages) {
        console.log(`\n🧪 Testing ${pageInfo.name} (${pageInfo.path})`);
        
        await this.framework.authenticate(`http://localhost:3000${pageInfo.path}`);
        
        // Wait for page to fully load
        await this.framework.page.waitForTimeout(3000);
        
        const features = await this.analyzePage(this.framework.page, pageInfo.name);
        this.features[pageInfo.name] = features;
        
        console.log(`  ✅ Analysis complete for ${pageInfo.name}`);
      }

      await this.framework.cleanup();

      // Generate comparison report
      const { comparison, recommendations } = this.generateComparison();

      // Final recommendations
      console.log('\n💡 STANDARDIZATION RECOMMENDATIONS:');
      console.log('───────────────────────────────────────────────────────────────');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });

      // Additional recommendations based on analysis
      console.log('\n🎯 ADDITIONAL UX IMPROVEMENTS:');
      console.log('• Standardize archive toggle across all pages (Quotes/Requests pattern)');
      console.log('• Add refresh functionality to Projects page');
      console.log('• Implement consistent filter options (populate filter arrays)');
      console.log('• Standardize action button sets across pages');
      console.log('• Ensure consistent sorting capabilities');
      console.log('• Maintain consistent status display patterns');

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('🎉 ADMIN PAGES COMPARISON COMPLETE');
      console.log('📊 Feature analysis saved to screenshots and console output');
      console.log('═══════════════════════════════════════════════════════════════');

      return { features: this.features, comparison, recommendations };

    } catch (error) {
      console.error('❌ Comparison Error:', error.message);
      await this.framework.cleanup();
      return null;
    }
  }
}

// Main execution
async function main() {
  const comparator = new AdminPagesComparison();
  
  try {
    const result = await comparator.runComparison();
    process.exit(result ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Admin Pages Comparison Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AdminPagesComparison;
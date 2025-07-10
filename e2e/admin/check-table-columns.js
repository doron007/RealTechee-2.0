#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkTableColumns() {
  console.log('🔍 CHECKING ACTUAL TABLE COLUMNS');
  console.log('================================');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Login
    console.log('📝 Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Try different selectors for email input
    const emailSelector = await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    await emailSelector.type('info@realtechee.com');
    
    // Try different selectors for password input
    const passwordSelector = await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 5000 });
    await passwordSelector.type('Sababa123!');
    
    // Try different selectors for submit button
    const submitSelector = await page.waitForSelector('button[type="submit"], button', { timeout: 5000 });
    await submitSelector.click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin/projects
    console.log('🏠 Navigating to admin/projects...');
    await page.goto('http://localhost:3000/admin/projects');
    await page.waitForSelector('table, .admin-data-grid', { timeout: 10000 });
    
    // Force desktop view to ensure table is visible
    await page.setViewport({ width: 1400, height: 800 });
    await page.reload();
    await page.waitForSelector('table, .admin-data-grid', { timeout: 10000 });
    
    // Check what columns are actually visible in the table
    const tableHeaders = await page.$$eval('th', headers => 
      headers.map(h => ({
        text: h.textContent?.trim() || '',
        visible: h.offsetWidth > 0 && h.offsetHeight > 0
      })).filter(header => header.text !== '')
    );
    
    console.log('\n📊 CURRENT TABLE COLUMNS:');
    console.log('========================');
    
    if (tableHeaders.length > 0) {
      tableHeaders.forEach((header, index) => {
        const status = header.visible ? '✅ VISIBLE' : '❌ HIDDEN';
        console.log(`${index + 1}. ${header.text} - ${status}`);
      });
      
      console.log('\n📋 SUMMARY:');
      console.log(`Total columns found: ${tableHeaders.length}`);
      console.log(`Visible columns: ${tableHeaders.filter(h => h.visible).length}`);
      console.log(`Hidden columns: ${tableHeaders.filter(h => !h.visible).length}`);
      
      // Check for specific required columns
      const requiredColumns = ['Status', 'Address', 'Created', 'Owner', 'Agent', 'Brokerage', 'Opportunity', 'Actions'];
      const missingColumns = requiredColumns.filter(required => 
        !tableHeaders.some(header => header.text.includes(required) && header.visible)
      );
      
      if (missingColumns.length > 0) {
        console.log('\n❌ MISSING REQUIRED COLUMNS:');
        missingColumns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('\n✅ ALL REQUIRED COLUMNS PRESENT');
      }
      
    } else {
      console.log('❌ NO TABLE HEADERS FOUND');
      
      // Check if we're in cards view instead
      const cardsFound = await page.$('.progressive-project-card, [class*="card"]');
      if (cardsFound) {
        console.log('ℹ️  Currently in cards view - table view not active');
      } else {
        console.log('❌ Neither table nor cards view found');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkTableColumns();
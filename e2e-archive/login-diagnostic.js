#!/usr/bin/env node

/**
 * Login Page Diagnostic Test
 * 
 * This test specifically checks the login page for React errors and authentication issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LoginDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.credentials = { 
      email: 'info@realtechee.com', 
      password: 'Sababa123!' 
    };
    this.browser = null;
    this.page = null;
    this.consoleErrors = [];
    this.reactErrors = [];
  }

  async setup() {
    console.log('🔧 Setting up Login Diagnostic...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Capture all console messages
    this.page.on('console', msg => {
      const text = msg.text();
      console.log(`🐛 Console [${msg.type()}]: ${text}`);
      
      // Track errors specifically
      if (msg.type() === 'error') {
        this.consoleErrors.push(text);
      }
      
      // Track React-specific errors
      if (text.includes('Warning:') || text.includes('Error:') || text.includes('TypeError:')) {
        this.reactErrors.push(text);
      }
    });
    
    // Capture page errors
    this.page.on('pageerror', error => {
      console.error(`💥 Page Error: ${error.message}`);
      this.consoleErrors.push(`Page Error: ${error.message}`);
    });
    
    console.log('✅ Setup complete');
  }

  async diagnoseLoginPage() {
    console.log('\n🔍 DIAGNOSING LOGIN PAGE');
    console.log('═'.repeat(50));
    
    try {
      // Navigate to login page
      console.log('📍 Navigating to login page...');
      await this.page.goto(`${this.baseUrl}/login`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for page to settle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check page state
      const pageState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasEmailInput: !!document.querySelector('input[type="email"]'),
          hasPasswordInput: !!document.querySelector('input[type="password"]'),
          hasSubmitButton: !!document.querySelector('button[type="submit"]'),
          bodyText: document.body.innerText.substring(0, 200),
          formCount: document.querySelectorAll('form').length
        };
      });
      
      console.log('\n📊 PAGE STATE:');
      console.log(`URL: ${pageState.url}`);
      console.log(`Title: ${pageState.title}`);
      console.log(`Email Input: ${pageState.hasEmailInput ? '✅' : '❌'}`);
      console.log(`Password Input: ${pageState.hasPasswordInput ? '✅' : '❌'}`);
      console.log(`Submit Button: ${pageState.hasSubmitButton ? '✅' : '❌'}`);
      console.log(`Forms: ${pageState.formCount}`);
      console.log(`Body preview: ${pageState.bodyText}`);
      
      // Check for React errors
      console.log('\n🐛 REACT ERROR ANALYSIS:');
      if (this.reactErrors.length === 0) {
        console.log('✅ No React errors detected');
      } else {
        console.log(`❌ Found ${this.reactErrors.length} React errors:`);
        this.reactErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      // Try authentication
      if (pageState.hasEmailInput && pageState.hasPasswordInput && pageState.hasSubmitButton) {
        await this.testAuthentication();
      } else {
        console.log('❌ Cannot test authentication - missing form elements');
      }
      
    } catch (error) {
      console.error('❌ Login page diagnostic failed:', error.message);
    }
  }

  async testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION');
    console.log('═'.repeat(50));
    
    try {
      // Clear previous errors
      this.consoleErrors = [];
      this.reactErrors = [];
      
      // Fill form
      await this.page.type('input[type="email"]', this.credentials.email);
      await this.page.type('input[type="password"]', this.credentials.password);
      
      console.log('📝 Form filled with credentials');
      
      // Submit and monitor
      console.log('🚀 Submitting form...');
      await this.page.click('button[type="submit"]');
      
      // Wait and check result
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const authResult = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          path: window.location.pathname,
          isOnLogin: window.location.pathname.includes('/login'),
          isOnAdmin: window.location.pathname.includes('/admin'),
          isOnHome: window.location.pathname === '/',
          bodyText: document.body.innerText.substring(0, 300)
        };
      });
      
      console.log('\n📊 AUTHENTICATION RESULT:');
      console.log(`Final URL: ${authResult.url}`);
      console.log(`Final Path: ${authResult.path}`);
      console.log(`Still on login: ${authResult.isOnLogin ? '❌' : '✅'}`);
      console.log(`On admin page: ${authResult.isOnAdmin ? '✅' : '❌'}`);
      console.log(`On homepage: ${authResult.isOnHome ? '⚠️' : '✅'}`);
      
      // Check for new errors after submission
      if (this.reactErrors.length > 0) {
        console.log('\n🐛 ERRORS AFTER SUBMISSION:');
        this.reactErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      // Try direct admin navigation
      await this.testDirectAdminAccess();
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
    }
  }

  async testDirectAdminAccess() {
    console.log('\n🔗 TESTING DIRECT ADMIN ACCESS');
    console.log('═'.repeat(50));
    
    try {
      console.log('📍 Attempting to navigate to /admin/projects...');
      
      const response = await this.page.goto(`${this.baseUrl}/admin/projects`, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const adminState = await this.page.evaluate(() => {
        return {
          url: window.location.href,
          path: window.location.pathname,
          title: document.title,
          hasAdminLayout: document.body.innerText.toLowerCase().includes('logged in as'),
          hasAccessDenied: document.body.innerText.toLowerCase().includes('access denied'),
          hasLoading: document.body.innerText.toLowerCase().includes('loading'),
          bodyPreview: document.body.innerText.substring(0, 200)
        };
      });
      
      console.log('\n📊 ADMIN ACCESS RESULT:');
      console.log(`Response Status: ${response.status()}`);
      console.log(`Final URL: ${adminState.url}`);
      console.log(`Final Path: ${adminState.path}`);
      console.log(`Has Admin Layout: ${adminState.hasAdminLayout ? '✅' : '❌'}`);
      console.log(`Access Denied: ${adminState.hasAccessDenied ? '❌' : '✅'}`);
      console.log(`Loading State: ${adminState.hasLoading ? '⚠️' : '✅'}`);
      console.log(`Body Preview: ${adminState.bodyPreview}`);
      
    } catch (error) {
      console.error('❌ Direct admin access failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(50));
    
    console.log(`Console Errors: ${this.consoleErrors.length}`);
    console.log(`React Errors: ${this.reactErrors.length}`);
    
    if (this.consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      this.consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.reactErrors.some(e => e.includes('hydration'))) {
      console.log('  • Fix React hydration errors in login page');
    }
    if (this.reactErrors.some(e => e.includes('HMR'))) {
      console.log('  • Resolve Hot Module Replacement issues');
    }
    if (this.consoleErrors.length > 0) {
      console.log('  • Address console errors before testing authentication');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      await this.diagnoseLoginPage();
      await this.generateReport();
      await this.cleanup();
      
      return this.reactErrors.length === 0 && this.consoleErrors.length === 0;
      
    } catch (error) {
      console.error('💥 Diagnostic failed:', error.message);
      await this.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const diagnostic = new LoginDiagnostic();
  
  try {
    const success = await diagnostic.run();
    console.log(`\n${success ? '✅ LOGIN PAGE HEALTHY' : '❌ LOGIN PAGE HAS ISSUES'}`);
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Login Diagnostic Failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LoginDiagnostic;
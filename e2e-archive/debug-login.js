#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugLogin() {
  console.log('🔍 DEBUGGING LOGIN PROCESS');
  console.log('==========================');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 500,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Listen for console messages
    page.on('console', (msg) => {
      console.log(`🖥️  Console: ${msg.text()}`);
    });
    
    // Listen for network requests
    page.on('response', (response) => {
      if (response.url().includes('/api/') || response.url().includes('cognito')) {
        console.log(`🌐 Network: ${response.status()} ${response.url()}`);
      }
    });
    
    // Go to login page
    console.log('📝 Loading login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    console.log('✅ Login page loaded');
    
    // Check current form state
    const formInfo = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        submitButtonText: submitButton ? submitButton.textContent : '',
        submitButtonDisabled: submitButton ? submitButton.disabled : false
      };
    });
    
    console.log('📋 Form state:', formInfo);
    
    // Fill in credentials
    console.log('🔐 Entering credentials...');
    await page.type('input[type="email"]', 'info@realtechee.com');
    await page.type('input[type="password"]', 'Sababa123!');
    
    // Check form validation
    const validationInfo = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        emailValue: emailInput ? emailInput.value : '',
        passwordValue: passwordInput ? passwordInput.value.length : 0,
        submitButtonDisabled: submitButton ? submitButton.disabled : false,
        emailValid: emailInput ? emailInput.checkValidity() : false,
        passwordValid: passwordInput ? passwordInput.checkValidity() : false
      };
    });
    
    console.log('✅ Form validation:', validationInfo);
    
    // Submit and watch what happens
    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait and see what happens
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const postSubmitInfo = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        title: document.title,
        hasErrorMessage: !!document.querySelector('.error, [class*="error"]'),
        hasLoadingSpinner: !!document.querySelector('.loading, [class*="loading"], [class*="spinner"]'),
        bodyText: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('📊 Post-submit state:', postSubmitInfo);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugLogin();
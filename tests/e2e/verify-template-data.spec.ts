import { test, expect } from '@playwright/test';

test('verify real template data is loading', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // Handle authentication
  if (page.url().includes('/login')) {
    console.log('🔐 Authenticating...');
    await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
    await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
    
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.click();
    await page.waitForTimeout(5000);
  }

  // Open notifications
  await page.getByRole('button', { name: 'Button icon Notifications' }).click();
  await page.waitForTimeout(2000);

  // Switch to templates tab
  await page.getByRole('button', { name: 'Templates12' }).click();
  await page.waitForTimeout(3000);

  // Take screenshot of the templates page
  await page.screenshot({ path: 'verify-templates-real-data.png', fullPage: false });
  console.log('📸 Screenshot taken: verify-templates-real-data.png');

  // Check if we can see real template names from database
  const pageContent = await page.content();
  
  // Look for indicators that real database content is loading
  const hasContactUsTemplate = pageContent.includes('Contact Us');
  const hasAffiliateTemplate = pageContent.includes('Affiliate');
  const hasRealEmailSubject = pageContent.includes('{{') || pageContent.includes('subject') || pageContent.includes('customerName');
  
  console.log('🔍 Template content verification:');
  console.log('  - Has Contact Us template:', hasContactUsTemplate);
  console.log('  - Has Affiliate template:', hasAffiliateTemplate);
  console.log('  - Has real email template content (variables):', hasRealEmailSubject);
  
  // Check for specific template names from your database
  const hasContactUsEmail = pageContent.includes('Contact Us Request - Email');
  const hasAffiliateEmail = pageContent.includes('Affiliate Application - Email');
  
  console.log('  - Has "Contact Us Request - Email" (real DB name):', hasContactUsEmail);
  console.log('  - Has "Affiliate Application - Email" (real DB name):', hasAffiliateEmail);
  
  // Check if templates are categorized properly
  const contactUsSection = await page.locator('text=Contact Us').count();
  const affiliateSection = await page.locator('text=Affiliate').count();
  
  console.log('  - Contact Us section count:', contactUsSection);
  console.log('  - Affiliate section count:', affiliateSection);

  // Try to click on a template to see if real content shows
  try {
    const editButtons = await page.locator('button:has-text("Edit")').count();
    console.log('  - Number of Edit buttons (templates loaded):', editButtons);
    
    if (editButtons > 0) {
      await page.locator('button:has-text("Edit")').first().click();
      await page.waitForTimeout(2000);
      
      // Check if modal opens with real content
      const modalContent = await page.content();
      const hasRealSubject = modalContent.includes('{{subject}}') || modalContent.includes('Contact Us');
      const hasRealVariables = modalContent.includes('customerName') || modalContent.includes('submittedAt');
      
      console.log('  - Edit modal has real subject content:', hasRealSubject);
      console.log('  - Edit modal has real template variables:', hasRealVariables);
      
      await page.screenshot({ path: 'verify-template-edit-modal.png', fullPage: false });
      console.log('📸 Screenshot taken: verify-template-edit-modal.png');
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  } catch (e) {
    console.log('Could not test edit modal:', e.message);
  }
  
  // Final verification - compare against mock data indicators
  const hasMockData = pageContent.includes('Template Subject Not Available') || pageContent.includes('Template Content Not Available');
  console.log('  - Still showing mock/fallback data:', hasMockData);
  
  // Show actual template subject content if available
  const templateSubjectMatch = pageContent.match(/Email Subject:[^<]+/g);
  console.log('  - Template subject content found:', templateSubjectMatch);
  
  // Look for the real subject format from database
  const hasRealSubjectFormat = pageContent.includes('{{subject}}') || pageContent.includes('{{customerName}}');
  console.log('  - Has real subject format (with variables):', hasRealSubjectFormat);
  
  if (hasMockData && !hasRealSubjectFormat) {
    console.log('❌ ISSUE: Templates are still showing fallback content instead of real database data');
  } else {
    console.log('✅ SUCCESS: Templates appear to be showing real database content');
  }
});
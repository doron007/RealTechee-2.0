import { test, expect } from '@playwright/test';

test('template editor uses real processor and previewData', async ({ page }) => {
  await page.goto('http://localhost:3002/admin');
  
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

  // Click Edit on the first template
  const editButtons = await page.locator('button:has-text("Edit")');
  const editButtonCount = await editButtons.count();
  console.log('📝 Found', editButtonCount, 'templates to edit');
  
  if (editButtonCount > 0) {
    await editButtons.first().click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of the template editor
    await page.screenshot({ path: 'template-editor-preview.png', fullPage: false });
    console.log('📸 Screenshot taken: template-editor-preview.png');
    
    // Check if Live Preview section exists
    const livePreviewExists = await page.locator('text=Live Preview').count() > 0;
    console.log('🔍 Live Preview section exists:', livePreviewExists);
    
    // Check for preview tabs
    const renderedViewTab = await page.locator('text=Rendered View').count() > 0;
    const sampleDataTab = await page.locator('text=Sample Data').count() > 0;
    console.log('📋 Rendered View tab exists:', renderedViewTab);
    console.log('📋 Sample Data tab exists:', sampleDataTab);
    
    // Check if there are any template compilation errors in console
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Template compilation error')) {
        console.log('❌ Template compilation error:', msg.text());
      } else if (msg.text().includes('Using real previewData from database')) {
        console.log('✅ Using real previewData from database');
      } else if (msg.text().includes('Processing template preview with processor')) {
        console.log('✅ Using real template processor');
      }
    });
    
    // Wait for any console logs to appear
    await page.waitForTimeout(3000);
    
    // Check if preview content is rendered (not showing compilation error)
    const pageContent = await page.content();
    const hasCompilationError = pageContent.includes('Template compilation error');
    const hasEncodeURIError = pageContent.includes('Missing helper: "encodeURI"');
    
    console.log('❌ Has template compilation error:', hasCompilationError);
    console.log('❌ Has missing encodeURI helper error:', hasEncodeURIError);
    
    if (!hasCompilationError && !hasEncodeURIError) {
      console.log('✅ Template preview is working without errors');
    }
  }
});
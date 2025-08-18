import { test, expect } from '@playwright/test';

test('interactive QA of admin notification functionality', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // Handle authentication
  if (page.url().includes('/login')) {
    console.log('🔐 Authenticating...');
    await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
    await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
    
    // Submit login form (Amplify Auth often doesn't cause a full navigation)
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
    await expect(signInBtn).toBeEnabled();
    await signInBtn.click();

    // Wait for either URL to change away from /login OR admin UI to appear
    await Promise.race([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
      page.waitForSelector('[data-testid="admin-layout"], .admin-layout, [data-testid="admin-data-grid"], main', { timeout: 15000 })
    ]).catch(() => {});
    
    // Additional wait for admin redirect processing
    await page.waitForTimeout(5000);
  }

  // open notifications
  await page.getByRole('button', { name: 'Button icon Notifications' }).click();

  // check History tab
  await page.getByRole('button', { name: 'History100' }).click();
  // Issue #1: The font size of getByRole('heading', { name: 'AFFILIATE_FORM_SUBMITTED_notification' }) is too large for the card.

  await page.locator('.flex > .flex > .px-3.py-1.text-sm.bg-blue-100').first().click();
  // Issue #2: The lable of getByRole('textbox', { name: 'Event Type' }) and agetByRole('textbox', { name: 'Template ID' }) are getting chopped by the header of the popup. It should be pushed down by 10px
  // Issue #3: the Payload Data json filled in getByRole('textbox', { name: 'Enter JSON payload...' }), should check if this is json it might be great if it gets beautfied (indentation and line breaks) for the view, while savng should make it raw again (if changes are made).
  await page.getByRole('button', { name: 'Cancel' }).click();

  // switch to templates tab

  await page.getByRole('button', { name: 'Templates12' }).click();
  // Critical issue #4: The templates are failing to load. We are seeing the following error in the chromium console log: "TemplateList.tsx:94 Error loading templates: Object loadTemplates	@	TemplateList.tsx:94"
  // Critical issue #5: the header getByRole('button', { name: 'View Site' }) is getting chopped and out of view. Probabaly issue with the width of the header when the side menu bar is open.

  // switch to Signals tab

  await page.getByRole('button', { name: 'Signals' }).click();
  // Critical issue #6: The signals are failing to load. We are seeing the following error in the chromium console log: 'SignalDashboard.tsx:189 Error fetching notifications: {data: null, errors: Array(1)} SignalDashboard.useCallback[fetchNotifications]	@	SignalDashboard.tsx:189 await in SignalDashboard.useCallback[fetchNotifications]		SignalDashboard.useCallback[refreshData]	@	SignalDashboard.tsx:221 SignalDashboard.useEffect	@	SignalDashboard.tsx:238'
  // Issue #7: getByText('On (30s)') the label is not places correct and is over the line of the border, looks like strikethrough.
});
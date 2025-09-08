# Testing Master Guide

**Purpose**: Comprehensive testing framework for RealTechee 2.0 with practical patterns and troubleshooting.

## 🎯 **Quick Start**

### **Run All Tests**
```bash
# Full test suite (584+ tests)
CI=true npx playwright test --reporter=line

# Specific test category
npx playwright test tests/admin/ --reporter=line
npx playwright test tests/public/ --reporter=line
npx playwright test tests/responsive/ --reporter=line
```

### **Development Testing**
```bash
# Run tests with UI (development)
npx playwright test --ui

# Debug specific test
npx playwright test --debug tests/admin/projects.spec.ts

# Record new test
npx playwright codegen http://localhost:3000
```

## 🏗️ **Testing Architecture**

### **Test Organization**
```
tests/
├── admin/              # Admin interface tests
│   ├── projects.spec.ts
│   ├── quotes.spec.ts
│   └── requests.spec.ts
├── public/             # Public website tests
│   ├── forms.spec.ts
│   ├── navigation.spec.ts
│   └── pages.spec.ts
├── responsive/         # Mobile/responsive tests
├── accessibility/      # WCAG compliance tests
├── performance/        # Load and speed tests
├── api/               # GraphQL API tests
└── visual/            # Screenshot regression tests
```

### **Test Configuration**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    reuseExistingServer: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ]
});
```

## 🚀 **Testing Patterns**

### **Business Logic Testing**
```typescript
// Test actual functionality, not just UI presence
test('should process contact form submission', async ({ page }) => {
  await page.goto('/contact');
  
  // Fill form with business-relevant data
  await page.fill('[data-testid="name"]', 'John Doe');
  await page.fill('[data-testid="email"]', 'john@example.com');
  await page.fill('[data-testid="message"]', 'Test message');
  
  // Submit and verify business outcome
  await page.click('[data-testid="submit"]');
  
  // Wait for actual success indicators
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Verify backend processing
  const requests = await page.evaluate(() => 
    fetch('/api/requests').then(r => r.json())
  );
  expect(requests.some(r => r.email === 'john@example.com')).toBe(true);
});
```

### **Admin Interface Testing**
```typescript
// Test CRUD operations with real data flows
test('should manage project lifecycle', async ({ page }) => {
  // Login as admin
  await page.goto('/admin/login');
  await page.fill('[data-testid="email"]', 'admin@test.com');
  await page.fill('[data-testid="password"]', 'test123');
  await page.click('[data-testid="login"]');
  
  // Navigate to projects
  await page.goto('/admin/projects');
  
  // Create new project
  await page.click('[data-testid="create-project"]');
  await page.fill('[data-testid="project-name"]', 'Test Project');
  await page.selectOption('[data-testid="status"]', 'Planning');
  await page.click('[data-testid="save"]');
  
  // Verify project appears in list
  await expect(page.locator('text=Test Project')).toBeVisible();
  
  // Test status update workflow
  await page.click('[data-testid="edit-project"]');
  await page.selectOption('[data-testid="status"]', 'In Progress');
  await page.click('[data-testid="save"]');
  
  // Verify status change
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('In Progress');
});
```

### **Responsive Testing**
```typescript
// Test mobile-specific interactions
test('mobile navigation works correctly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Test mobile menu
  await page.click('[data-testid="mobile-menu-button"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  
  // Test form usability on mobile
  await page.click('text=Contact');
  await page.fill('[data-testid="name"]', 'Mobile User');
  
  // Verify touch targets are adequate (44px minimum)
  const submitButton = page.locator('[data-testid="submit"]');
  const box = await submitButton.boundingBox();
  expect(box?.height).toBeGreaterThan(44);
  expect(box?.width).toBeGreaterThan(44);
});
```

### **Performance Testing**
```typescript
// Test Core Web Vitals
test('page performance meets standards', async ({ page }) => {
  // Start performance monitoring
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Measure LCP, FID, CLS
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries.map(entry => ({
          name: entry.name,
          value: entry.value,
          rating: entry.value < 2500 ? 'good' : 'needs-improvement'
        })));
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  
  expect(metrics.some(m => m.name === 'LCP' && m.rating === 'good')).toBe(true);
});
```

## 🔧 **Test Data Management**

### **Safe Test Data Patterns**
```typescript
// Use designated test data markers
const TEST_DATA = {
  leadSource: 'E2E_TEST',
  additionalNotes: `Test session: ${Date.now()}`,
  email: 'test@playwright.example.com'
};

// Clean up test data after tests
test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    // Remove test records
    const response = await fetch('/api/cleanup-test-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadSource: 'E2E_TEST' })
    });
  });
});
```

### **Database Seeding for Tests**
```typescript
// Create consistent test scenarios
test.beforeEach(async ({ page }) => {
  // Seed with known test data
  await page.evaluate(async () => {
    await fetch('/api/seed-test-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: [{ name: 'Test User', email: 'test@example.com' }],
        projects: [{ name: 'Test Project', status: 'Planning' }]
      })
    });
  });
});
```

## 🎯 **Accessibility Testing**

### **WCAG 2.1 AA Compliance**
```typescript
// Automated accessibility testing
import { injectAxe, checkA11y } from 'axe-playwright';

test('page meets accessibility standards', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-labels': { enabled: true }
    }
  });
});
```

### **Keyboard Navigation Testing**
```typescript
test('keyboard navigation works throughout app', async ({ page }) => {
  await page.goto('/contact');
  
  // Tab through form elements
  await page.keyboard.press('Tab'); // Name field
  await expect(page.locator('[data-testid="name"]')).toBeFocused();
  
  await page.keyboard.press('Tab'); // Email field  
  await expect(page.locator('[data-testid="email"]')).toBeFocused();
  
  await page.keyboard.press('Tab'); // Submit button
  await expect(page.locator('[data-testid="submit"]')).toBeFocused();
  
  // Test submit with keyboard
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
});
```

## 📊 **CI/CD Integration**

### **GitHub Actions Configuration**
```yaml
# .github/workflows/tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: CI=true npx playwright test --reporter=line
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### **Test Reporting**
```typescript
// Custom test reporter for business insights
class BusinessReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      // Log business-critical test failures
      console.log(`BUSINESS IMPACT: ${test.title} failed`);
      console.log(`User workflow affected: ${this.getWorkflowFromTest(test)}`);
    }
  }
  
  getWorkflowFromTest(test: TestCase): string {
    if (test.title.includes('form')) return 'Lead Generation';
    if (test.title.includes('admin')) return 'Business Operations';
    return 'User Experience';
  }
}
```

## 🚨 **Troubleshooting**

### **Common Test Failures**

#### **Timing Issues**
```typescript
// Bad: Using fixed timeouts
await page.waitForTimeout(5000);

// Good: Wait for specific conditions
await page.waitForSelector('[data-testid="success-message"]');
await expect(page.locator('[data-testid="data-loaded"]')).toBeVisible();
```

#### **Flaky Tests**
```typescript
// Retry unstable operations
await test.step('submit form with retry', async () => {
  for (let i = 0; i < 3; i++) {
    try {
      await page.click('[data-testid="submit"]');
      await expect(page.locator('[data-testid="success"]')).toBeVisible({ timeout: 10000 });
      break;
    } catch (error) {
      if (i === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
});
```

#### **Environment Issues**
```typescript
// Check server availability before tests
test.beforeAll(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      throw new Error('Server not available');
    }
  } catch (error) {
    console.log('Starting server...');
    // Start server if needed
  }
});
```

## 📋 **Testing Checklist**

### **Before Pushing Code**
- [ ] All existing tests pass locally
- [ ] New functionality has corresponding tests
- [ ] Mobile responsiveness tested
- [ ] Accessibility compliance verified
- [ ] Performance impact assessed

### **Test Quality Standards**
- [ ] Tests verify business outcomes, not just UI
- [ ] Error scenarios are covered
- [ ] Edge cases are tested
- [ ] Tests are maintainable and readable
- [ ] Test data is properly managed

### **Production Readiness**
- [ ] All critical user workflows tested
- [ ] Admin functionality validated
- [ ] Form submissions working correctly
- [ ] Authentication flows tested
- [ ] Data integrity verified

## 🎯 **Best Practices**

1. **Test Business Value**: Focus on user outcomes, not implementation details
2. **Use Real Data Flows**: Test actual API calls and database operations
3. **Mobile-First Testing**: Ensure mobile usability is validated
4. **Accessibility by Default**: Include a11y testing in every workflow
5. **Performance Conscious**: Monitor and test performance impact
6. **Maintainable Tests**: Write tests that survive refactoring
7. **Clear Failure Messages**: Make test failures actionable for developers

---

**This consolidated guide replaces multiple previous testing documents and provides the single source of truth for testing RealTechee 2.0.**

*Reference: `COMPLETE_TEST_INVENTORY.md` for comprehensive test catalog*  
*Reference: `admin-testing-comprehensive.md` for admin-specific test patterns*

*Last Updated: September 8, 2025*
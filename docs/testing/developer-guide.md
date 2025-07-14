# Testing Framework Developer Guide

## Getting Started

This guide helps developers understand, maintain, and extend the Playwright testing framework for RealTechee.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Chrome/Chromium browser

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Verify installation
npx playwright test --version
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npx playwright test tests/admin/projects.spec.js

# Run with UI mode
npx playwright test --ui

# Run specific test project
npx playwright test --project=isolated-admin-projects

# Generate reports
npx playwright show-report
```

## Framework Structure

### Core Components

```
tests/
├── admin/                    # Admin interface tests (60+ tests each)
│   ├── projects.spec.js      # Projects management testing
│   ├── quotes.spec.js        # Quotes management testing
│   ├── requests.spec.js      # Requests management testing
│   └── dashboard.spec.js     # Dashboard functionality testing
├── public/                   # Public pages tests (~300 tests total)
│   ├── homepage.spec.js      # Homepage functionality (~60 tests)
│   ├── contact.spec.js       # Contact pages testing (~200 tests)
│   └── products.spec.js      # Product pages testing (~200 tests)
├── auth/                     # Authentication flows (~20 tests)
│   └── auth-flows.spec.js    # Login, registration, session management
├── member/                   # Member portal tests (~25 tests)
│   └── member-portal.spec.js # Member-specific functionality
├── api/                      # Backend API tests
│   └── graphql-api.spec.js   # GraphQL mutations and queries
├── performance/              # Performance monitoring
│   └── lighthouse-audits.spec.js # Core Web Vitals and Lighthouse
├── accessibility/            # WCAG compliance tests
│   └── accessibility-audits.spec.js # axe-core integration
├── visual/                   # Visual regression tests
│   └── visual-regression.spec.js # Screenshot comparisons
├── enterprise/               # Load and stress tests
│   └── load-stress.spec.js   # Scalability and reliability
├── fixtures/                 # Test data and utilities
│   └── test-data.js         # Centralized test data management
├── utils/                    # Helper functions
│   ├── test-isolation.js    # Test isolation and sandboxing
│   ├── enterprise-helpers.js # Load testing and orchestration
│   ├── database-seeder.js   # Data seeding utilities
│   └── performance-monitor.js # Performance monitoring
├── dashboard/               # Analytics and reporting
│   └── test-analytics.js    # Test intelligence dashboard
└── reporters/               # Custom reporting
    └── enhanced-reporter.js # Enhanced test reporting
```

## Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/target-page');
  });

  test('should perform specific action', async ({ page }) => {
    // Test implementation
    await page.click('[data-testid="action-button"]');
    await expect(page.locator('.result')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
  });
});
```

### Test Data Usage

```javascript
import { testUsers, testProjects, TestDataManager } from '../fixtures/test-data.js';

test('Create project with test data', async ({ page }) => {
  // Use predefined test data
  const project = testProjects.kitchen;
  
  // Or generate isolated test data
  const isolatedProject = TestDataManager.createTestProject({
    title: 'Dynamic Test Project',
    status: 'active'
  });
  
  // Use in test
  await page.fill('[name="title"]', isolatedProject.title);
});
```

### Page Object Pattern

```javascript
class ProjectsPage {
  constructor(page) {
    this.page = page;
    this.createButton = page.locator('[data-testid="create-project"]');
    this.titleInput = page.locator('input[name="title"]');
    this.saveButton = page.locator('button[type="submit"]');
  }

  async createProject(projectData) {
    await this.createButton.click();
    await this.titleInput.fill(projectData.title);
    await this.saveButton.click();
  }

  async expectProjectCreated(title) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }
}

// Usage in tests
test('Create project using page object', async ({ page }) => {
  const projectsPage = new ProjectsPage(page);
  await projectsPage.createProject({ title: 'Test Project' });
  await projectsPage.expectProjectCreated('Test Project');
});
```

## Advanced Features

### Test Isolation

```javascript
import { TestIsolation } from '../utils/test-isolation.js';

test('Isolated test example', async ({ page }) => {
  const isolation = new TestIsolation();
  
  // Create isolated user
  const user = await isolation.createIsolatedUser(testUsers.admin);
  
  // Create isolated data
  const project = isolation.createIsolatedData(testProjects.kitchen, 'project');
  
  // Use isolated data in test
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="title"]', project.title);
  
  // Automatic cleanup
  await isolation.executeCleanup();
});
```

### Performance Testing

```javascript
import { PerformanceMonitor } from '../utils/performance-monitor.js';

test('Performance monitoring example', async ({ page }) => {
  const monitor = new PerformanceMonitor(page, 'homepage-performance');
  await monitor.startMonitoring();
  
  // Record page load
  const loadMetric = await monitor.recordPageLoad('/', ['h1', 'nav']);
  expect(loadMetric.loadTime).toBeLessThan(3000);
  
  // Record interactions
  await monitor.recordInteraction('click', 'button', 'Test button click');
  
  // Generate report
  const report = await monitor.stopMonitoring();
  expect(report.benchmarks.overall).toBe(true);
});
```

### Visual Regression Testing

```javascript
test('Visual regression example', async ({ page }) => {
  await page.goto('/contact');
  
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `*, *::before, *::after { 
      animation-duration: 0s !important; 
      transition-duration: 0s !important; 
    }`
  });
  
  // Take screenshot
  await expect(page).toHaveScreenshot('contact-page.png', {
    fullPage: true,
    animations: 'disabled'
  });
  
  // Component-level screenshot
  const form = page.locator('form');
  await expect(form).toHaveScreenshot('contact-form.png');
});
```

### API Testing

```javascript
test('GraphQL API testing', async ({ request }) => {
  const response = await request.post('/api/graphql', {
    headers: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    },
    data: {
      query: `query GetProjects { 
        listProjects { 
          items { id title status } 
        } 
      }`
    }
  });
  
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.data.listProjects.items).toBeDefined();
});
```

### Load Testing

```javascript
import { LoadTestRunner } from '../utils/enterprise-helpers.js';

test('Load testing example', async ({ browser }) => {
  const loadRunner = new LoadTestRunner({
    concurrency: 5,
    duration: 30000,
    rampUp: 5000
  });
  
  const scenario = async (page) => {
    await page.goto('/');
    await page.waitForSelector('h1');
    await page.click('a[href="/contact"]');
    await page.waitForSelector('form');
  };
  
  const context = await browser.newContext();
  const results = await loadRunner.runLoadTest(scenario, context);
  await context.close();
  
  expect(parseFloat(results.successRate)).toBeGreaterThan(95);
});
```

## Configuration

### Playwright Configuration

Key configuration options in `playwright.config.js`:

```javascript
module.exports = defineConfig({
  // Global settings
  fullyParallel: process.env.CI ? true : false,
  workers: process.env.CI ? 4 : 1,
  retries: process.env.CI ? 2 : 0,
  
  // Test projects for different scenarios
  projects: [
    {
      name: 'isolated-admin-projects',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup']
    }
  ],
  
  // Global test settings
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

### Environment Configuration

Create `.env.test` for test-specific environment variables:

```bash
# Test environment configuration
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=info@realtechee.com
TEST_USER_PASSWORD=Sababa123!
COGNITO_USER_POOL_ID=us-west-1_xxxxx
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## Test Data Management

### Creating Test Fixtures

```javascript
// In fixtures/test-data.js
export const testProjects = {
  kitchen: {
    title: 'Modern Kitchen Renovation',
    description: 'Complete kitchen remodel',
    status: 'active',
    budget: 45000,
    timeline: '8-12 weeks'
  }
};

// Helper class for dynamic data
export class TestDataManager {
  static createTestProject(overrides = {}) {
    return {
      ...testProjects.kitchen,
      ...overrides,
      id: `test-project-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
  }
}
```

### Database Seeding

```javascript
import { DatabaseSeeder } from '../utils/database-seeder.js';

// Setup test data
const seeder = new DatabaseSeeder('test');
await seeder.seedAll();

// Cleanup test data
await seeder.cleanup();
```

## Performance Guidelines

### Best Practices

1. **Use Efficient Selectors**
   ```javascript
   // Good - specific and fast
   page.locator('[data-testid="submit-button"]')
   
   // Avoid - slow and brittle
   page.locator('div > div > button:nth-child(3)')
   ```

2. **Wait Strategically**
   ```javascript
   // Wait for specific conditions
   await page.waitForSelector('[data-testid="success-message"]');
   await page.waitForLoadState('networkidle');
   
   // Avoid arbitrary timeouts
   // await page.waitForTimeout(5000); // Bad
   ```

3. **Optimize Test Data**
   ```javascript
   // Create minimal test data
   const project = TestDataManager.createTestProject({
     title: 'Minimal Test Project'
     // Only include required fields
   });
   ```

4. **Use Parallel Execution**
   ```javascript
   // Tests should be independent
   test.describe.configure({ mode: 'parallel' });
   ```

### Performance Monitoring

```javascript
import { ResourceMonitor } from '../utils/enterprise-helpers.js';

test('Memory usage monitoring', async ({ page }) => {
  const monitor = new ResourceMonitor();
  monitor.startMonitoring();
  
  // Run test operations
  await runTestScenario(page);
  
  monitor.stopMonitoring();
  const report = monitor.generateResourceReport();
  
  // Assert reasonable memory usage
  expect(report.memory.growth).toBeLessThan(100); // MB
});
```

## Debugging

### Debug Tools

1. **Visual Debugging**
   ```bash
   # Run with browser visible
   npx playwright test --headed
   
   # Run in debug mode
   npx playwright test --debug
   
   # Use UI mode
   npx playwright test --ui
   ```

2. **Screenshots and Videos**
   ```javascript
   // Manual screenshot
   await page.screenshot({ path: 'debug-screenshot.png' });
   
   // Video recording (configured in playwright.config.js)
   use: { video: 'retain-on-failure' }
   ```

3. **Trace Viewer**
   ```bash
   # View traces
   npx playwright show-trace trace.zip
   ```

### Common Issues

**Flaky Tests:**
```javascript
// Use retry logic
import { TestRetryHandler } from '../utils/test-isolation.js';

const retryHandler = new TestRetryHandler({ maxRetries: 3 });
await retryHandler.withRetry(async () => {
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

**Element Not Found:**
```javascript
// Multiple selector strategy
const button = page.locator([
  '[data-testid="submit"]',
  'button[type="submit"]',
  'input[type="submit"]'
].join(', ')).first();
```

**Timing Issues:**
```javascript
// Wait for network requests
await page.waitForLoadState('networkidle');

// Wait for element state
await page.waitForSelector('.loading', { state: 'hidden' });
```

## CI/CD Integration

### GitHub Actions Setup

```yaml
# .github/workflows/test-suite.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npx playwright test
        env:
          CI: true
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Environment-Specific Testing

```javascript
// Different configs for different environments
const config = {
  local: { baseURL: 'http://localhost:3000' },
  staging: { baseURL: 'https://staging.realtechee.com' },
  production: { baseURL: 'https://realtechee.com' }
};

// Use environment-specific config
const env = process.env.TEST_ENV || 'local';
use: config[env]
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   # Update Playwright
   npm update @playwright/test
   npx playwright install
   
   # Update other dependencies
   npm update
   ```

2. **Review Test Results**
   ```bash
   # Generate analytics
   node scripts/generate-analytics.js
   
   # Review dashboard
   open test-results/latest-dashboard.html
   ```

3. **Update Baselines**
   ```bash
   # Update visual regression baselines
   npx playwright test --update-snapshots
   
   # Update performance baselines
   node scripts/performance-monitor.js --updateBaselines
   ```

### Code Quality

1. **Linting**
   ```bash
   # ESLint for test files
   npx eslint tests/**/*.js
   
   # Prettier formatting
   npx prettier --write tests/**/*.js
   ```

2. **Type Checking**
   ```bash
   # TypeScript checking
   npx tsc --noEmit
   ```

## Extending the Framework

### Adding New Test Suites

1. **Create Test File**
   ```javascript
   // tests/new-feature/feature.spec.js
   const { test, expect } = require('@playwright/test');
   
   test.describe('New Feature', () => {
     test('should work correctly', async ({ page }) => {
       // Test implementation
     });
   });
   ```

2. **Update Configuration**
   ```javascript
   // Add to playwright.config.js projects
   {
     name: 'new-feature',
     testMatch: '**/new-feature/*.spec.js'
   }
   ```

3. **Add to CI/CD**
   ```yaml
   # Update GitHub Actions workflow
   strategy:
     matrix:
       test-project: [...existing..., 'new-feature']
   ```

### Custom Utilities

```javascript
// tests/utils/custom-helper.js
export class CustomHelper {
  constructor(page) {
    this.page = page;
  }
  
  async customAction() {
    // Implementation
  }
}

// Usage in tests
import { CustomHelper } from '../utils/custom-helper.js';

test('Custom helper example', async ({ page }) => {
  const helper = new CustomHelper(page);
  await helper.customAction();
});
```

### Custom Reporters

```javascript
// tests/reporters/custom-reporter.js
class CustomReporter {
  onBegin(config, suite) {
    console.log('Starting test run');
  }
  
  onTestEnd(test, result) {
    console.log(`Test ${test.title}: ${result.status}`);
  }
  
  onEnd(result) {
    console.log('Test run completed');
  }
}

module.exports = CustomReporter;
```

## Resources

### Documentation Links

- [Playwright Official Docs](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

### Internal Resources

- `/docs/testing/playwright-framework.md` - Framework overview
- `/tests/fixtures/test-data.js` - Test data reference
- `/playwright.config.js` - Configuration reference
- `/tests/utils/` - Utility functions documentation

### Support

For questions about the testing framework:

1. Check the documentation first
2. Review existing test examples
3. Ask in team chat or create an issue
4. Refer to Playwright community resources

---

*This developer guide is maintained by the RealTechee development team. Please keep it updated as the framework evolves.*
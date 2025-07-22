# End-to-End Testing Suite

Enterprise-grade e2e testing infrastructure using Playwright Test framework.

## Directory Structure

```
e2e/
├── README.md                    # This file - testing overview and usage
├── playwright.config.js        # Playwright configuration (moved to root)
├── playwright/                 # Playwright browser storage and auth
│   └── .auth/                  # Authentication state storage
├── playwright-report/          # HTML test reports
├── test-results/               # JSON test results and artifacts
├── tests/                      # All test files
│   ├── accessibility/          # Accessibility testing with axe-core
│   ├── admin/                  # Admin interface tests
│   ├── api/                    # GraphQL API tests
│   ├── auth/                   # Authentication flow tests
│   ├── enterprise/             # Load testing and enterprise features
│   ├── fixtures/               # Test data and utilities
│   ├── member/                 # Member portal tests
│   ├── performance/            # Lighthouse and performance tests
│   ├── public/                 # Public page tests
│   ├── reporters/              # Custom test reporters
│   ├── responsive/             # Responsive design tests
│   ├── utils/                  # Test utilities and helpers
│   └── visual/                 # Visual regression tests
└── legacy-framework/           # Legacy Puppeteer frameworks (archived)
```

## Quick Start

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test Suites
```bash
# Admin pages only
npx playwright test --project=full-admin-suite

# Public pages only  
npx playwright test --project=full-public-suite

# Responsive testing
npx playwright test --project=responsive-mobile,responsive-tablet,responsive-desktop

# Individual admin pages
npx playwright test --project=isolated-admin-projects
npx playwright test --project=isolated-admin-quotes
npx playwright test --project=isolated-admin-requests
```

### Interactive Mode
```bash
# Run with UI for debugging
npx playwright test --ui

# Debug specific test
npx playwright test tests/admin/projects.spec.js --debug
```

## Test Categories

### 🔒 Authentication Tests
- Login/logout flows
- Session management
- Role-based access control

### 👤 Admin Interface Tests  
- Projects management
- Quotes management
- Requests management
- Dashboard functionality

### 🌐 Public Page Tests
- Homepage functionality
- Contact forms
- Product pages
- Navigation

### 📱 Responsive Tests
- Cross-device compatibility
- Breakpoint testing
- Mobile-specific features

### ⚡ Performance Tests
- Lighthouse audits
- Core Web Vitals
- Load time optimization

### ♿ Accessibility Tests
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation

### 🎨 Visual Regression Tests
- Screenshot comparisons
- UI consistency checks
- Cross-browser rendering

### 🔧 API Tests
- GraphQL endpoint testing
- Data integrity checks
- Error handling

## Test Data Management

### Fixtures
Test data is managed through fixtures in `tests/fixtures/`:
- `test-data.js` - Standardized test data
- Database seeding utilities
- Isolated test environments

### Authentication
- Shared authentication state in `e2e/playwright/.auth/user.json`
- Automatic login setup for authenticated tests
- Clean session state for auth testing

## Reports and Results

### HTML Reports
```bash
npx playwright show-report
```
Interactive HTML reports with:
- Test execution details
- Screenshots and videos
- Error traces and debugging info

### JSON Results
Structured test results in `test-results/playwright-results.json`

### CI Integration
- Parallel execution in CI environments
- Automatic retry on failure
- Report generation and archiving

## Enterprise Features

### 🏗️ Test Isolation
- Sandboxed test environments
- Isolated test data creation
- Automatic cleanup

### 📊 Load Testing
- Concurrent user simulation
- Performance bottleneck identification
- Scalability validation

### 📈 Test Analytics
- Test execution metrics
- Performance trend analysis
- Quality health scoring

### 🔄 Database Seeding
- Automated test data setup
- Consistent test environments
- Data rollback capabilities

## Configuration

Main configuration in `/playwright.config.js`:
- Project-based test execution
- Device and browser settings
- Timeout and retry policies
- Report generation settings

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Management**: Use fixtures for consistent test data
3. **Page Objects**: Centralize element selectors and actions
4. **Assertions**: Use Playwright's built-in assertions
5. **Debugging**: Leverage Playwright's debugging tools
6. **Performance**: Monitor test execution times

## Troubleshooting

### Common Issues
- **Port conflicts**: Ensure dev server is running on port 3000
- **Authentication**: Check auth state in `e2e/playwright/.auth/user.json`
- **Timeouts**: Increase timeouts for slow operations
- **Screenshots**: Check `test-results/` for failure artifacts

### Debug Commands
```bash
# Enable verbose logging
DEBUG=pw:api npx playwright test

# Run single test with debugging
npx playwright test --debug tests/admin/projects.spec.js

# Generate trace for failed tests
npx playwright test --trace=retain-on-failure
```

For more detailed information, see:
- [Playwright Framework Documentation](../docs/testing/playwright-framework.md)
- [Developer Guide](../docs/testing/developer-guide.md)
- [Testing Strategy](../docs/05-testing/testing-strategy-and-organization.md)
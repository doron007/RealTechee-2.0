# Enterprise Test Framework

Clean, scalable, enterprise-grade test system for RealTechee admin pages with hierarchical reporting structure.

## 🏗️ Architecture

```
e2e/
├── core/                          # Core framework components
│   ├── coordinators/              # Test execution coordinators
│   │   ├── EnterpriseTestCoordinator.js    # Main enterprise coordinator
│   │   └── StreamlinedTestCoordinator.js   # Semi-automatic coordinator
│   └── framework/                 # Testing framework
│       └── EnhancedTestReporter.js         # Hierarchical reporting
│
├── tests/                         # Test implementations (mirrors report structure)
│   ├── system-priming/            # System preparation tests
│   │   └── SystemPrimingTests.js
│   ├── authentication/            # Login and auth tests  
│   │   └── AuthenticationTests.js
│   └── pages/                     # Page-specific tests
│       ├── projects/              # Projects page tests
│       │   └── ProjectsPageTests.js
│       ├── quotes/                # Quotes page tests (coming soon)
│       ├── requests/              # Requests page tests (coming soon)
│       └── dashboard/             # Dashboard tests (coming soon)
│
└── config/                        # Configuration management
    └── TestConfig.js              # Centralized test configuration

Note: Test reports are generated in `test-results/` at project root level
```

## 📊 Test Report Structure

The test framework generates hierarchical reports that mirror the test execution phases:

### 1. **System Priming**
- Server port cleanup
- Application build process
- TypeScript validation

### 2. **Authentication & Login**
- Login page accessibility
- User authentication flow
- Session management

### 3. **Admin Pages Testing**
Each page has two test categories:

#### **📱 Responsiveness Tests**
- Mobile layout (375px)
- Tablet layout (768px) 
- Desktop layout (1200px)
- Large desktop layout (1920px)

#### **⚙️ Functionality Tests**
- Page loading and navigation
- Data display and interactions
- UI component behavior
- Error handling

## 🚀 Usage

### Quick Start
```bash
# Enterprise automated testing (recommended)
node test-admin.js enterprise

# Semi-automatic with user interaction
node test-admin.js semi

# Framework validation
node test-admin.js validate
```

### Test Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `enterprise` | Fully automated enterprise testing | CI/CD, comprehensive testing |
| `semi` | Semi-automatic with user prompts | Development, debugging |
| `validate` | Framework validation only | Setup verification |

## 📈 Adding New Tests

### Adding a New Page Test

1. **Create page test class:**
```javascript
// e2e/tests/pages/newpage/NewPageTests.js
class NewPageTests {
  constructor(reporter) {
    this.reporter = reporter;
    this.pageName = 'newpage';
  }
  
  async executeAllFunctionalityTests(page, baseUrl) {
    // Implement functionality tests
  }
  
  async executeAllResponsivenessTests(page, baseUrl) {
    // Implement responsiveness tests
  }
}
```

2. **Add page to config:**
```javascript
// e2e/config/TestConfig.js
pages: {
  newpage: {
    name: 'New Page',
    path: '/admin/newpage',
    key: 'newpage'
  }
}
```

3. **Integrate with coordinator:**
```javascript
// e2e/core/coordinators/EnterpriseTestCoordinator.js
const NewPageTests = require('../../tests/pages/newpage/NewPageTests');

// In executePagesPhase()
const newPageTests = new NewPageTests(this.reporter);
const result = await newPageTests.executeAll(this.page, this.config.baseUrl);
```

### Adding System-Level Tests

1. **Create test in appropriate phase:**
   - System priming: `e2e/tests/system-priming/`
   - Authentication: `e2e/tests/authentication/`

2. **Use reporter methods:**
   - `reporter.addSystemPrimingTest()`
   - `reporter.addAuthenticationTest()`
   - `reporter.addPageTest(pageName, category, testData)`

## 📊 Report Features

### Hierarchical Structure
- **Phase-level** drill-down (System → Auth → Pages)
- **Page-level** drill-down (Projects → Responsiveness/Functionality)
- **Test-level** details with artifacts

### Test Details Include
- **What Was Tested**: Clear description of test coverage
- **Test Steps**: Step-by-step execution details
- **Screenshots**: Visual verification of test states
- **Error Information**: Detailed error reporting
- **Timing Data**: Test execution duration

### Status Indicators
- ✅ **PASSED**: All tests successful
- ❌ **FAILED**: One or more test failures
- ⚠️ **ERROR**: Tests encountered errors
- ⏭️ **SKIPPED**: Tests not executed

## 🔧 Configuration

### Test Settings
All configuration is centralized in `e2e/config/TestConfig.js`:

- **Browser settings** (headless, viewport, timeouts)
- **Responsive breakpoints** 
- **Page definitions**
- **Credentials and URLs**
- **Report generation options**

### Environment Variables
```bash
NODE_ENV=development  # Test environment
TEST_HEADLESS=false   # Browser visibility
TEST_TIMEOUT=30000    # Default timeout
```

## 📁 Test Results

Reports are generated in `test-results/` (at project root) with timestamped folders:
```
test-results/
├── 2025-07-11_19-00-00_enterprise/
│   ├── report.html              # Interactive drill-down report
│   ├── report.json             # Detailed test data
│   ├── summary.txt             # Quick overview
│   └── screenshots/            # Test screenshots
│       ├── passed/             # Successful test images
│       ├── failed/             # Failed test images
│       └── errors/             # Error state images
```

## 🎯 Best Practices

### Test Organization
- One test class per page
- Separate functionality and responsiveness tests
- Use descriptive test names aligned with report structure

### Error Handling
- Always capture screenshots on failure
- Provide detailed error context
- Use appropriate test status (failed vs error)

### Scalability
- Follow the modular page test pattern
- Use TestConfig for all settings
- Maintain consistency with report hierarchy

## 🔄 Migration from Legacy

Legacy test files have been moved to `e2e-archive/` and can be safely removed from git:

```bash
# Remove archived legacy tests from git
git rm -r e2e-archive/
git commit -m "Remove legacy test files"
```

The new enterprise structure provides all functionality with better organization and maintainability.
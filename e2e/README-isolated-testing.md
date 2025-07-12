# Isolated Page Testing

Quick testing for specific admin pages without full system setup.

## Quick Start

```bash
# 1. Start dev server
npm run dev

# 2. Login to admin (keep browser session active)
# Visit: http://localhost:3000/admin
# Use: info@realtechee.com / Sababa123!

# 3. Run isolated tests
node e2e/isolated-page-tests.js
```

## Menu Options

- **1. Admin Projects** - Comprehensive testing for Projects page
- **0. Exit** - Close the test runner
- **h. Help** - Show detailed help
- **s. System Status** - Check if system is ready

## Test Coverage

Each page test includes:
- ✅ Data loading and display verification
- ✅ Search functionality across multiple fields  
- ✅ Filter operations (status, product, etc.)
- ✅ View mode switching (table/cards)
- ✅ Responsive design across 4 breakpoints
- ✅ Action button functionality
- ✅ Pagination and sorting controls

## Prerequisites

1. **Dev Server Running**: `npm run dev`
2. **Admin Login Active**: Visit `/admin` and login
3. **Stable System State**: No ongoing builds/changes

## Results

Test results saved to: `test-results/Isolated-[PageName]-[Timestamp]/`
- Interactive HTML reports
- Screenshots for passed/failed tests  
- Detailed JSON data
- Test execution logs

## Benefits vs Full Testing

| Aspect | Full Suite | Isolated |
|--------|------------|----------|
| Setup Time | ~30s | ~5s |
| Prerequisites | None | Login required |
| Coverage | Complete | Page-specific |
| Use Case | CI/CD | Development |
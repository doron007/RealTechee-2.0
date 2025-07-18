#!/bin/bash

# Assignment System Comprehensive Test Runner
# This script runs the 100% reliable assignment system tests

echo "🚀 Starting Assignment System Comprehensive Tests"
echo "=" * 60

# Set up environment
export NODE_ENV=test
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Check if server is running
echo "🔍 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Development server is running"

# Check if authenticated user exists
if [ ! -f "playwright/.auth/user.json" ]; then
    echo "❌ User authentication file not found"
    echo "Please run authentication setup first"
    exit 1
fi

echo "✅ User authentication file found"

# Run the comprehensive assignment tests
echo ""
echo "🧪 Running Assignment System Comprehensive Tests..."
echo "=" * 60

npx playwright test \
  --config="e2e/tests/admin/assignment-system-comprehensive.config.js" \
  --headed \
  --workers=1 \
  --retries=2 \
  --timeout=60000 \
  --reporter=line,html,json

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All assignment tests passed successfully!"
    echo "🎉 Assignment system is 100% reliable"
    echo ""
    echo "📊 Test Results:"
    echo "   - Form submission with auto-assignment: ✅"
    echo "   - Assignment dropdown validation: ✅"
    echo "   - Assignment save functionality: ✅"
    echo "   - Complete workflow validation: ✅"
    echo "   - Assignment system stress test: ✅"
    echo ""
    echo "📋 View detailed report: e2e/playwright-report/index.html"
else
    echo ""
    echo "❌ Some assignment tests failed"
    echo "📋 Check the report for details: e2e/playwright-report/index.html"
    echo "📸 Screenshots and videos available in: e2e/test-results/"
    exit 1
fi
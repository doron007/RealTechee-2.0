#!/bin/bash

# Admin Pages Test Suite Runner
# Comprehensive testing of all admin pages with 100% pass rate goal

echo "🚀 Admin Pages Complete Test Suite"
echo "=================================="
echo ""
echo "This script will run comprehensive tests for all admin pages:"
echo "• Admin Projects (Enhanced)"
echo "• Admin Quotes (Comprehensive)"
echo "• Admin Requests (Complete)"
echo "• Admin Dashboard"
echo ""
echo "Testing across 7 breakpoints:"
echo "• Mobile SM (375x667)"
echo "• Mobile MD (414x896)"
echo "• Tablet SM (768x1024)"
echo "• Tablet MD (1024x768)"
echo "• Desktop SM (1280x720)"
echo "• Desktop MD (1440x900)"
echo "• Desktop LG (1920x1080)"
echo ""
echo "Test Coverage:"
echo "• Data grid functionality"
echo "• Card interactions"
echo "• Responsive navigation"
echo "• Data loading states"
echo "• Accessibility"
echo "• Performance"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found. Please install Node.js first."
    exit 1
fi

# Check if the dev server is running
echo "🔍 Checking if development server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running"
else
    echo "⚠️  Development server not detected at http://localhost:3000"
    echo "Please start the development server first:"
    echo "npm run dev"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 Goal: Achieve 100% pass rate across all tests and breakpoints"
echo "📊 Results will be saved to test-results/ directory"
echo ""

# Ask user which test suite to run
echo "Select test suite to run:"
echo "1) Complete Test Runner (All tests with iterations until 100% pass)"
echo "2) Admin Projects Enhanced"
echo "3) Admin Quotes Comprehensive"
echo "4) Admin Comprehensive (All pages)"
echo "5) All Individual Test Suites"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running Complete Test Runner..."
        echo "This will iterate up to 5 times until 100% pass rate is achieved"
        echo ""
        node test-runner-admin-complete.js
        ;;
    2)
        echo ""
        echo "🚀 Running Admin Projects Enhanced Tests..."
        node ../admin/admin-comprehensive/test-admin-projects-enhanced.js
        ;;
    3)
        echo ""
        echo "🚀 Running Admin Quotes Comprehensive Tests..."
        node ../admin/admin-comprehensive/test-admin-quotes-comprehensive.js
        ;;
    4)
        echo ""
        echo "🚀 Running Admin Comprehensive Tests..."
        node ../admin/admin-comprehensive/test-admin-comprehensive.js
        ;;
    5)
        echo ""
        echo "🚀 Running All Individual Test Suites..."
        
        echo "📋 Running Admin Projects Enhanced..."
        node ../admin/admin-comprehensive/test-admin-projects-enhanced.js
        
        echo ""
        echo "📋 Running Admin Quotes Comprehensive..."
        node ../admin/admin-comprehensive/test-admin-quotes-comprehensive.js
        
        echo ""
        echo "📋 Running Admin Comprehensive..."
        node ../admin/admin-comprehensive/test-admin-comprehensive.js
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

EXIT_CODE=$?

echo ""
echo "📊 Test Results:"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo "🎉 100% pass rate achieved!"
else
    echo "❌ Some tests failed (Exit code: $EXIT_CODE)"
    echo "📋 Check the detailed reports in test-results/ directory"
fi

echo ""
echo "📁 Test results are available in:"
echo "   test-results/"
echo ""
echo "📋 Open the HTML reports in your browser to view detailed results"
echo ""

# Open the latest test results if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    LATEST_REPORT=$(find test-results -name "*.html" -type f -exec ls -t {} + | head -n1)
    if [ -n "$LATEST_REPORT" ]; then
        read -p "Open latest test report in browser? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$LATEST_REPORT"
        fi
    fi
fi

exit $EXIT_CODE
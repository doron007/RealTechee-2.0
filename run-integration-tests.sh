#!/bin/bash

# Backend Integration Test Runner
# 
# Runs comprehensive integration tests to validate all backend layers
# work together correctly: Repository ↔ Service ↔ API Hooks integration

set -e  # Exit on any error

echo "🚀 Starting Backend Integration Tests"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_status "❌ Node.js is not installed" $RED
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_status "❌ npm is not installed" $RED
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "📦 Installing dependencies..." $YELLOW
    npm install
fi

# Clean previous test reports
print_status "🧹 Cleaning previous test reports..." $BLUE
rm -rf test-reports/integration
rm -rf coverage/integration
mkdir -p test-reports/integration
mkdir -p coverage/integration

# Set integration test environment variables
export NODE_ENV=test
export INTEGRATION_TEST_MODE=true
export JEST_WORKER_ID=1

# Run integration tests with Jest
print_status "🧪 Running integration tests..." $BLUE
print_status "Testing: Repository ↔ Service ↔ API Hooks integration" $BLUE

# Run Jest with integration configuration
if npm run jest -- --config=jest.config.integration.js --verbose --detectOpenHandles --forceExit; then
    print_status "✅ Integration tests completed successfully!" $GREEN
    
    # Check if integration report was generated
    if [ -f "test-reports/integration/integration-report.md" ]; then
        print_status "📊 Integration report generated" $GREEN
        print_status "Report location: test-reports/integration/integration-report.md" $BLUE
        
        # Show integration confidence score if available
        if [ -f "test-reports/integration/integration-summary.json" ]; then
            CONFIDENCE_SCORE=$(node -pe "JSON.parse(require('fs').readFileSync('test-reports/integration/integration-summary.json')).integrationConfidenceScore")
            print_status "🎯 Integration Confidence Score: ${CONFIDENCE_SCORE}%" $GREEN
            
            if [ "$CONFIDENCE_SCORE" -ge 90 ]; then
                print_status "🎉 EXCELLENT - Backend integration is production-ready!" $GREEN
            elif [ "$CONFIDENCE_SCORE" -ge 80 ]; then
                print_status "✅ GOOD - Backend integration is solid!" $GREEN
            elif [ "$CONFIDENCE_SCORE" -ge 70 ]; then
                print_status "⚠️ NEEDS IMPROVEMENT - Some integration issues to address" $YELLOW
            else
                print_status "❌ CRITICAL - Major integration problems detected" $RED
            fi
        fi
    fi
    
    # Show coverage summary
    if [ -f "coverage/integration/lcov-report/index.html" ]; then
        print_status "📈 Coverage report: coverage/integration/lcov-report/index.html" $BLUE
    fi
    
    print_status "" $NC
    print_status "🎯 INTEGRATION VALIDATION COMPLETE" $GREEN
    print_status "All backend layers verified to work together seamlessly:" $GREEN
    print_status "✓ Repository ↔ Service integration" $GREEN
    print_status "✓ Service ↔ Hook integration" $GREEN  
    print_status "✓ End-to-end data flow validation" $GREEN
    print_status "✓ Error handling & resilience" $GREEN
    print_status "" $NC
    print_status "Frontend developers can now confidently use backend services!" $GREEN
    
    exit 0
else
    print_status "❌ Integration tests failed!" $RED
    
    # Show specific failures if available
    if [ -f "test-reports/integration/integration-summary.json" ]; then
        FAILED_COUNT=$(node -pe "JSON.parse(require('fs').readFileSync('test-reports/integration/integration-summary.json')).failedTests")
        print_status "Failed tests: ${FAILED_COUNT}" $RED
    fi
    
    print_status "Check test output above for details" $YELLOW
    print_status "Integration issues must be resolved before production" $RED
    
    exit 1
fi
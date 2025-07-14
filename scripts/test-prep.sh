#!/bin/bash
# scripts/test-prep.sh - E2E Test Preparation Script
# Prepares environment for optimal Playwright test execution

set -e

# Configuration
BASE_URL="http://localhost:3000"
TIMEOUT=30
MAX_RETRIES=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 RealTechee 2.0 - E2E Test Preparation${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to check if server is running
check_server() {
    curl -s --connect-timeout 5 "${BASE_URL}" > /dev/null 2>&1
    return $?
}

# Function to wait for server compilation
wait_for_compilation() {
    local retries=0
    echo "⏳ Waiting for server compilation to complete..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if check_server; then
            echo -e "${GREEN}✅ Server is ready${NC}"
            return 0
        fi
        
        ((retries++))
        echo "    Attempt $retries/$MAX_RETRIES - waiting 3 seconds..."
        sleep 3
    done
    
    echo -e "${RED}❌ Server failed to respond after $MAX_RETRIES attempts${NC}"
    return 1
}

# Function to prime critical test pages
prime_test_pages() {
    echo "🔄 Priming critical pages for testing..."
    
    # Use our existing prime-pages script
    if [ -f "./scripts/prime-pages.sh" ]; then
        ./scripts/prime-pages.sh
        return $?
    else
        echo -e "${YELLOW}⚠️  prime-pages.sh not found, skipping page priming${NC}"
        return 0
    fi
}

# Function to validate authentication endpoints
validate_auth_endpoints() {
    echo "🔐 Validating authentication endpoints..."
    
    # Check login page
    if curl -s --connect-timeout 10 "${BASE_URL}/login" | grep -q "input.*password" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Login page accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Login page may not be ready${NC}"
    fi
    
    # Check admin page (should redirect to login if not authenticated)
    local admin_response=$(curl -s -w "%{http_code}" "${BASE_URL}/admin" -o /dev/null 2>/dev/null)
    if [ "$admin_response" = "200" ] || [ "$admin_response" = "302" ]; then
        echo -e "${GREEN}✅ Admin page accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Admin page returned HTTP $admin_response${NC}"
    fi
}

# Function to prepare test environment
prepare_test_env() {
    echo "🛠️  Preparing test environment..."
    
    # Create necessary directories
    mkdir -p e2e/playwright/.auth
    mkdir -p e2e/test-results
    mkdir -p e2e/playwright-report
    
    # Clean up old test artifacts
    rm -f e2e/test-results/*.json 2>/dev/null || true
    rm -rf e2e/playwright-report/* 2>/dev/null || true
    
    echo -e "${GREEN}✅ Test environment prepared${NC}"
}

# Function to validate test dependencies
validate_dependencies() {
    echo "📦 Validating test dependencies..."
    
    # Check if Playwright is installed
    if command -v npx playwright > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Playwright is installed${NC}"
    else
        echo -e "${RED}❌ Playwright not found. Run: npm install${NC}"
        return 1
    fi
    
    # Check if browsers are installed
    if npx playwright install --dry-run 2>/dev/null | grep -q "already installed" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Playwright browsers installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Installing Playwright browsers...${NC}"
        npx playwright install
    fi
}

# Main execution
main() {
    echo "🚀 Starting test preparation sequence..."
    echo ""
    
    # Step 1: Validate dependencies
    if ! validate_dependencies; then
        echo -e "${RED}❌ Dependency validation failed${NC}"
        exit 1
    fi
    
    # Step 2: Prepare test environment
    prepare_test_env
    
    # Step 3: Check if server is running
    echo "🔍 Checking development server status..."
    if ! check_server; then
        echo -e "${YELLOW}⚠️  Development server not running${NC}"
        echo -e "${BLUE}💡 Tip: Start server with: npm run dev:primed${NC}"
        echo -e "${BLUE}💡 Alternative: npm run dev${NC}"
        exit 1
    fi
    
    # Step 4: Wait for compilation
    if ! wait_for_compilation; then
        echo -e "${RED}❌ Server compilation check failed${NC}"
        exit 1
    fi
    
    # Step 5: Prime test pages
    if ! prime_test_pages; then
        echo -e "${YELLOW}⚠️  Page priming failed, tests may be slower${NC}"
    fi
    
    # Step 6: Validate auth endpoints
    validate_auth_endpoints
    
    # Success
    echo ""
    echo -e "${GREEN}🎉 Test preparation complete!${NC}"
    echo -e "${GREEN}Environment is optimized for E2E testing.${NC}"
    echo ""
    echo -e "${BLUE}💡 Ready to run tests:${NC}"
    echo "  npm run test:e2e"
    echo "  npm run test:e2e:admin"
    echo "  npm run test:e2e:ui"
    echo ""
}

# Trap ctrl+c and cleanup
trap 'echo -e "\n${YELLOW}Test preparation interrupted by user${NC}"; exit 130' INT

# Run main function
main "$@"
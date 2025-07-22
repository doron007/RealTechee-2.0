#!/bin/bash
# scripts/prime-pages.sh - Automated page priming for RealTechee 2.0
# Improves development performance by pre-compiling critical pages

set -e

# Configuration
BASE_URL="http://localhost:3000"
TIMEOUT=30
RETRY_COUNT=3
PAGES=(
    "/"                                  # Homepage
    "/contact/get-estimate"              # Get estimate form (Golden User Story 01)
    "/admin"                            # Admin dashboard
    "/admin/projects"                   # Admin projects
    "/admin/quotes"                     # Admin quotes  
    "/admin/requests"                   # Admin requests
    "/about"                            # About page
    "/products/sellers"                 # Products page
    "/contact"                          # Contact page
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Progress tracking
total_pages=${#PAGES[@]}
successful_primes=0
failed_primes=0

echo -e "${BLUE}🚀 RealTechee 2.0 Page Priming Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo "Priming ${total_pages} critical pages for optimal performance..."
echo ""

# Function to check if server is running
check_server() {
    curl -s --connect-timeout 5 "${BASE_URL}" > /dev/null 2>&1
    return $?
}

# Function to prime a single page
prime_page() {
    local page_path="$1"
    local url="${BASE_URL}${page_path}"
    local attempt=1
    
    while [ $attempt -le $RETRY_COUNT ]; do
        echo -n "  Priming ${page_path}... (attempt ${attempt}/${RETRY_COUNT}) "
        
        # Use curl with timeout and follow redirects
        response=$(curl -s -w "%{http_code}" --connect-timeout $TIMEOUT --max-time $TIMEOUT -L "$url" -o /dev/null 2>/dev/null)
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ Success${NC}"
            ((successful_primes++))
            return 0
        elif [ "$response" = "000" ]; then
            echo -e "${RED}❌ Connection failed${NC}"
        else
            echo -e "${YELLOW}⚠️  HTTP $response${NC}"
        fi
        
        ((attempt++))
        if [ $attempt -le $RETRY_COUNT ]; then
            echo "    Retrying in 2 seconds..."
            sleep 2
        fi
    done
    
    echo -e "${RED}❌ Failed after ${RETRY_COUNT} attempts${NC}"
    ((failed_primes++))
    return 1
}

# Main execution
main() {
    # Check if server is running
    echo "🔍 Checking if development server is running..."
    if ! check_server; then
        echo -e "${RED}❌ Development server not responding at ${BASE_URL}${NC}"
        echo -e "${YELLOW}Please start the server with: npm run dev${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Server is running${NC}"
    echo ""
    
    # Wait a moment for server to stabilize
    echo "⏳ Waiting 3 seconds for server to stabilize..."
    sleep 3
    
    # Prime each page
    echo "🔄 Starting page priming process..."
    echo ""
    
    for page in "${PAGES[@]}"; do
        prime_page "$page"
    done
    
    # Summary
    echo ""
    echo -e "${BLUE}📊 Priming Summary${NC}"
    echo -e "${BLUE}=================${NC}"
    echo -e "Total pages: ${total_pages}"
    echo -e "${GREEN}Successful: ${successful_primes}${NC}"
    echo -e "${RED}Failed: ${failed_primes}${NC}"
    
    if [ $failed_primes -eq 0 ]; then
        echo -e "${GREEN}🎉 All pages primed successfully!${NC}"
        echo -e "${GREEN}Development server is now optimized for fast navigation.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some pages failed to prime. Development will still work but may be slower for those pages.${NC}"
        exit 1
    fi
}

# Trap ctrl+c and cleanup
trap 'echo -e "\n${YELLOW}Priming interrupted by user${NC}"; exit 130' INT

# Run main function
main "$@"
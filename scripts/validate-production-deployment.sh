#!/bin/bash

# =============================================================================
# PRODUCTION DEPLOYMENT VALIDATION SCRIPT
# =============================================================================
# Validates production environment variables before and after deployment
# Prevents reintroduction of /public prefix issue

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Production Deployment Validation${NC}"
echo "======================================"

# Critical environment variables that must be correct
CRITICAL_ENV_VARS=(
    "NEXT_PUBLIC_S3_PUBLIC_BASE_URL"
    "NEXT_PUBLIC_ENVIRONMENT"
    "NEXT_PUBLIC_BACKEND_SUFFIX"
)

# Expected values for production
declare -A EXPECTED_VALUES
EXPECTED_VALUES["NEXT_PUBLIC_S3_PUBLIC_BASE_URL"]="https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com"
EXPECTED_VALUES["NEXT_PUBLIC_ENVIRONMENT"]="production"
EXPECTED_VALUES["NEXT_PUBLIC_BACKEND_SUFFIX"]="yk6ecaswg5aehjn3ev76xzpbfe"

# Function to validate environment variable
validate_env_var() {
    local var_name="$1"
    local expected_value="${EXPECTED_VALUES[$var_name]}"
    
    echo -e "${BLUE}🔍 Checking $var_name${NC}"
    
    # Get current value from AWS
    local current_value=$(aws amplify get-branch \
        --app-id d200k2wsaf8th3 \
        --branch-name prod-v2 \
        --region us-west-1 \
        --query "branch.environmentVariables.${var_name}" \
        --output text 2>/dev/null || echo "NOT_SET")
    
    echo "  Current:  $current_value"
    echo "  Expected: $expected_value"
    
    if [[ "$current_value" == "$expected_value" ]]; then
        echo -e "  ${GREEN}✅ CORRECT${NC}"
        return 0
    elif [[ "$current_value" == "NOT_SET" ]]; then
        echo -e "  ${RED}❌ NOT SET${NC}"
        return 1
    else
        echo -e "  ${RED}❌ INCORRECT${NC}"
        
        # Special check for S3 URL /public issue
        if [[ "$var_name" == "NEXT_PUBLIC_S3_PUBLIC_BASE_URL" && "$current_value" == *"/public"* ]]; then
            echo -e "  ${RED}🚨 CRITICAL: Contains forbidden /public suffix!${NC}"
        fi
        return 1
    fi
}

# Function to fix environment variable
fix_env_var() {
    local var_name="$1"
    local correct_value="${EXPECTED_VALUES[$var_name]}"
    
    echo -e "${YELLOW}🔧 Fixing $var_name${NC}"
    
    aws amplify update-branch \
        --app-id d200k2wsaf8th3 \
        --branch-name prod-v2 \
        --region us-west-1 \
        --environment-variables "${var_name}=${correct_value}" \
        >/dev/null
    
    echo -e "  ${GREEN}✅ FIXED: Set to $correct_value${NC}"
}

# Main validation
echo -e "${BLUE}📋 Pre-deployment Environment Variable Validation${NC}"
echo "------------------------------------------------"

validation_failed=false

for var_name in "${CRITICAL_ENV_VARS[@]}"; do
    if ! validate_env_var "$var_name"; then
        validation_failed=true
    fi
    echo ""
done

# If validation failed, offer to fix
if [[ "$validation_failed" == "true" ]]; then
    echo -e "${RED}❌ Environment variable validation FAILED${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Critical issues found in production environment variables${NC}"
    echo ""
    
    read -p "Fix incorrect environment variables automatically? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}🔧 Applying fixes...${NC}"
        
        for var_name in "${CRITICAL_ENV_VARS[@]}"; do
            current_value=$(aws amplify get-branch \
                --app-id d200k2wsaf8th3 \
                --branch-name prod-v2 \
                --region us-west-1 \
                --query "branch.environmentVariables.${var_name}" \
                --output text 2>/dev/null || echo "NOT_SET")
            
            expected_value="${EXPECTED_VALUES[$var_name]}"
            
            if [[ "$current_value" != "$expected_value" ]]; then
                fix_env_var "$var_name"
            fi
        done
        
        echo ""
        echo -e "${GREEN}✅ Environment variables fixed${NC}"
        echo -e "${YELLOW}⚠️  Trigger a new build for changes to take effect${NC}"
        
        read -p "Trigger production rebuild now? (y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "${BLUE}🚀 Triggering production rebuild...${NC}"
            
            aws amplify start-job \
                --app-id d200k2wsaf8th3 \
                --branch-name prod-v2 \
                --job-type RELEASE \
                --region us-west-1 >/dev/null
            
            echo -e "${GREEN}✅ Production rebuild triggered${NC}"
            echo -e "${BLUE}ℹ️  Monitor at: https://console.aws.amazon.com/amplify/${NC}"
        fi
    else
        echo -e "${RED}❌ Deployment validation failed - manual fix required${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ All environment variables are correct${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Validation Summary${NC}"
echo "===================="
echo -e "${GREEN}✅ Production environment variables validated${NC}"
echo -e "${BLUE}ℹ️  Safe to proceed with deployment${NC}"

# Additional safety checks
echo ""
echo -e "${BLUE}🔒 Additional Safety Checks${NC}"
echo "---------------------------"

# Check if .env.production contains correct values
if [[ -f ".env.production" ]]; then
    echo -e "${BLUE}🔍 Checking local .env.production file${NC}"
    
    local_s3_url=$(grep "NEXT_PUBLIC_S3_PUBLIC_BASE_URL" .env.production | cut -d= -f2 || echo "NOT_FOUND")
    expected_s3_url="${EXPECTED_VALUES[NEXT_PUBLIC_S3_PUBLIC_BASE_URL]}"
    
    if [[ "$local_s3_url" == "$expected_s3_url" ]]; then
        echo -e "  ${GREEN}✅ Local .env.production is correct${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Local .env.production differs from AWS${NC}"
        echo "    Local:    $local_s3_url"
        echo "    AWS:      $expected_s3_url"
    fi
else
    echo -e "${YELLOW}⚠️  No .env.production file found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Production deployment validation complete${NC}"
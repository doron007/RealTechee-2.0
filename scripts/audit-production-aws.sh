#!/bin/bash

# =============================================================================
# PRODUCTION AWS ENVIRONMENT AUDIT SCRIPT
# =============================================================================
# Comprehensive audit of production AWS Amplify deployment
# Compares staging (working) vs production (issue) configurations

set -e

echo "🔍 Production AWS Environment Audit"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
log_section() {
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '%*s' ${#1} '' | tr ' ' '-')"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create audit directory
AUDIT_DIR="docs/07-operations/production-audit-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$AUDIT_DIR"

log_section "📋 1. Amplify App Configuration Audit"

# Get Amplify app details
echo "Fetching Amplify app configurations..."

# Production App (RealTechee-Gen2)
echo "🎯 Production App: RealTechee-Gen2 (d200k2wsaf8th3)"
aws amplify get-app --app-id d200k2wsaf8th3 --region us-west-1 > "$AUDIT_DIR/prod-app-config.json" 2>/dev/null || log_error "Failed to get production app config"

# Staging App (RealTechee-2.0) 
echo "🧪 Staging App: RealTechee-2.0 (d3atadjk90y9q5)"
aws amplify get-app --app-id d3atadjk90y9q5 --region us-west-1 > "$AUDIT_DIR/staging-app-config.json" 2>/dev/null || log_error "Failed to get staging app config"

log_section "📋 2. Environment Variables Comparison"

# Production environment variables
echo "Fetching production environment variables..."
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name prod-v2 --region us-west-1 > "$AUDIT_DIR/prod-branch-config.json" 2>/dev/null || log_error "Failed to get production branch config"

# Staging environment variables  
echo "Fetching staging environment variables..."
aws amplify get-branch --app-id d3atadjk90y9q5 --branch-name prod --region us-west-1 > "$AUDIT_DIR/staging-branch-config.json" 2>/dev/null || log_error "Failed to get staging branch config"

log_section "📋 3. Backend Configuration Audit"

# Production backend
echo "Fetching production backend configuration..."
aws amplify list-backends --app-id d200k2wsaf8th3 --region us-west-1 > "$AUDIT_DIR/prod-backends.json" 2>/dev/null || log_error "Failed to get production backends"

# Staging backend
echo "Fetching staging backend configuration..."  
aws amplify list-backends --app-id d3atadjk90y9q5 --region us-west-1 > "$AUDIT_DIR/staging-backends.json" 2>/dev/null || log_error "Failed to get staging backends"

log_section "📋 4. Lambda Functions Audit"

# List Lambda functions for both environments
echo "Auditing Lambda functions..."

# Production Lambda functions (look for production suffix)
aws lambda list-functions --region us-west-1 --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]" > "$AUDIT_DIR/prod-lambda-functions.json" 2>/dev/null || log_error "Failed to get production Lambda functions"

# Staging Lambda functions (look for staging suffix)
aws lambda list-functions --region us-west-1 --query "Functions[?contains(FunctionName, 'fvn7t5hbobaxjklhrqzdl4ac34')]" > "$AUDIT_DIR/staging-lambda-functions.json" 2>/dev/null || log_error "Failed to get staging Lambda functions"

log_section "📋 5. DynamoDB Tables Audit"

# Production tables
echo "Auditing DynamoDB tables..."
aws dynamodb list-tables --region us-west-1 --query "TableNames[?contains(@, 'aqnqdrctpzfwfjwyxxsmu6peoq')]" > "$AUDIT_DIR/prod-dynamodb-tables.json" 2>/dev/null || log_error "Failed to get production DynamoDB tables"

# Staging tables
aws dynamodb list-tables --region us-west-1 --query "TableNames[?contains(@, 'fvn7t5hbobaxjklhrqzdl4ac34')]" > "$AUDIT_DIR/staging-dynamodb-tables.json" 2>/dev/null || log_error "Failed to get staging DynamoDB tables"

log_section "📋 6. S3 Bucket Configuration Audit"

# Production S3 bucket
PROD_S3_BUCKET="amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii"
STAGING_S3_BUCKET="amplify-realtecheeclone-d-realtecheeuseruploadsbuc-vsohbwu6kzsf"

echo "Auditing S3 bucket configurations..."

# Production bucket policy and CORS
aws s3api get-bucket-cors --bucket "$PROD_S3_BUCKET" > "$AUDIT_DIR/prod-s3-cors.json" 2>/dev/null || log_warning "No CORS policy found for production bucket"
aws s3api get-bucket-policy --bucket "$PROD_S3_BUCKET" > "$AUDIT_DIR/prod-s3-policy.json" 2>/dev/null || log_warning "No bucket policy found for production bucket"

# Staging bucket policy and CORS
aws s3api get-bucket-cors --bucket "$STAGING_S3_BUCKET" > "$AUDIT_DIR/staging-s3-cors.json" 2>/dev/null || log_warning "No CORS policy found for staging bucket"
aws s3api get-bucket-policy --bucket "$STAGING_S3_BUCKET" > "$AUDIT_DIR/staging-s3-policy.json" 2>/dev/null || log_warning "No bucket policy found for staging bucket"

log_section "📋 7. AppSync GraphQL API Audit"

# Find AppSync APIs for both environments
echo "Auditing AppSync GraphQL APIs..."
aws appsync list-graphql-apis --region us-west-1 > "$AUDIT_DIR/all-appsync-apis.json" 2>/dev/null || log_error "Failed to get AppSync APIs"

log_section "📋 8. CloudFront Distributions Audit"

# List CloudFront distributions
echo "Auditing CloudFront distributions..."
aws cloudfront list-distributions --region us-west-1 > "$AUDIT_DIR/cloudfront-distributions.json" 2>/dev/null || log_error "Failed to get CloudFront distributions"

log_section "📋 9. Build Configuration Audit"

# Get latest build information
echo "Fetching latest build information..."

# Production builds
aws amplify list-jobs --app-id d200k2wsaf8th3 --branch-name prod-v2 --max-items 5 --region us-west-1 > "$AUDIT_DIR/prod-recent-builds.json" 2>/dev/null || log_error "Failed to get production builds"

# Staging builds
aws amplify list-jobs --app-id d3atadjk90y9q5 --branch-name prod --max-items 5 --region us-west-1 > "$AUDIT_DIR/staging-recent-builds.json" 2>/dev/null || log_error "Failed to get staging builds"

log_section "📋 10. Generating Analysis Report"

echo "Creating comprehensive analysis report..."

cat > "$AUDIT_DIR/README.md" << EOF
# Production AWS Environment Audit Report

**Date**: $(date)
**Issue**: Production images have \`/public/\` prefix in URLs while staging/local work correctly
**Status**: Code is correct, AWS deployment configuration issue suspected

## 🔍 Audit Scope

### Applications Audited
- **Production**: RealTechee-Gen2 (d200k2wsaf8th3) - Branch: prod-v2
- **Staging**: RealTechee-2.0 (d3atadjk90y9q5) - Branch: prod  

### Key Findings Expected
1. **Environment Variables**: Differences in S3 base URL configuration
2. **Build Process**: Different build-time environment injection
3. **CloudFront**: Cache configuration differences
4. **Lambda Functions**: Environment variable access differences

## 📁 Audit Files Generated

### App Configuration
- \`prod-app-config.json\` - Production Amplify app settings
- \`staging-app-config.json\` - Staging Amplify app settings
- \`prod-branch-config.json\` - Production branch environment variables
- \`staging-branch-config.json\` - Staging branch environment variables

### Backend Infrastructure  
- \`prod-backends.json\` - Production backend configuration
- \`staging-backends.json\` - Staging backend configuration
- \`prod-lambda-functions.json\` - Production Lambda functions
- \`staging-lambda-functions.json\` - Staging Lambda functions
- \`prod-dynamodb-tables.json\` - Production DynamoDB tables
- \`staging-dynamodb-tables.json\` - Staging DynamoDB tables

### Storage & CDN
- \`prod-s3-cors.json\` - Production S3 CORS policy
- \`staging-s3-cors.json\` - Staging S3 CORS policy  
- \`prod-s3-policy.json\` - Production S3 bucket policy
- \`staging-s3-policy.json\` - Staging S3 bucket policy
- \`cloudfront-distributions.json\` - All CloudFront distributions

### API & Build Info
- \`all-appsync-apis.json\` - All AppSync GraphQL APIs
- \`prod-recent-builds.json\` - Recent production builds
- \`staging-recent-builds.json\` - Recent staging builds

## 🎯 Next Steps

1. **Compare Environment Variables**: Check for S3 URL differences
2. **Analyze Build Logs**: Look for environment injection issues  
3. **Validate Lambda Permissions**: Ensure production functions have correct access
4. **Check CloudFront Cache**: Verify cache invalidation and origin settings
5. **Review Build Process**: Compare build-time vs runtime environment handling

## 🚨 Critical Investigation Points

### Environment Variable Injection
- Does production Amplify correctly inject \`.env.production\` variables?
- Are build-time vs runtime environment variables handled differently?

### S3 Configuration
- Is production S3 bucket configured with different path structure?
- Are there CloudFront origin path differences?

### Lambda Function Environment
- Do production Lambda functions have access to correct environment variables?
- Are notification/processor functions using correct S3 configuration?

EOF

log_success "Audit completed successfully!"
echo ""
echo "📁 Audit files saved to: $AUDIT_DIR"
echo "📋 Review README.md for analysis plan"
echo ""
echo "🔍 Next: Run analysis script to compare configurations"
echo "   npm run analyze:prod:audit"

echo ""
log_section "📋 Quick Environment Variables Check"

# Quick check of critical environment variables
if [ -f "$AUDIT_DIR/prod-branch-config.json" ]; then
    echo "🔍 Checking production environment variables..."
    
    # Extract environment variables from branch config
    S3_URL=$(cat "$AUDIT_DIR/prod-branch-config.json" | grep -o '"NEXT_PUBLIC_S3_PUBLIC_BASE_URL","value":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "NOT_FOUND")
    
    echo "Production S3 Base URL: $S3_URL"
    
    if [[ "$S3_URL" == *"/public"* ]]; then
        log_error "FOUND ISSUE: Production S3 URL contains /public!"
    elif [[ "$S3_URL" == "NOT_FOUND" ]]; then
        log_warning "Could not extract S3 URL from production config"
    else
        log_success "Production S3 URL looks correct (no /public)"
    fi
fi
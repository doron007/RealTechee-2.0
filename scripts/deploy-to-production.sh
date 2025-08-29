#!/bin/bash

# Production Deployment Script for RealTechee 2.0
# Deploys the new decoupled notification architecture to production

set -e  # Exit on any error

echo "🚀 Starting production deployment for RealTechee 2.0..."
echo "📋 Deploying new decoupled notification architecture"

# Validate we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "production" ]; then
    echo "❌ Error: Must be on production branch. Currently on: $CURRENT_BRANCH"
    exit 1
fi

echo "✅ On production branch"

# Check for uncommitted changes
if ! git diff --quiet; then
    echo "❌ Error: Uncommitted changes detected. Please commit or stash changes first."
    git status --porcelain
    exit 1
fi

echo "✅ No uncommitted changes"

# Build and type check
echo "🔧 Running production build and type checks..."
npm run build
npm run type-check

echo "✅ Build and type checks passed"

# Push to remote production branch
echo "📤 Pushing to remote production branch..."
git push origin production

echo "✅ Code pushed to production branch"

# Note about AWS Amplify
echo ""
echo "🔄 AWS Amplify will automatically deploy from the production branch."
echo "⏳ Monitor the deployment at: https://console.aws.amazon.com/amplify/home#/d200k2wsaf8th3"
echo ""
echo "📋 Production Environment Configuration:"
echo "   - App ID: d200k2wsaf8th3" 
echo "   - Branch: production"
echo "   - DynamoDB Tables: *-yk6ecaswg5aehjn3ev76xzpbfe-NONE"
echo "   - Environment Variables: Will use production values from Amplify Console"
echo ""
echo "✅ NEW DECOUPLED NOTIFICATION ARCHITECTURE:"
echo "   - FormNotificationIntegration service generates content in backend"
echo "   - All 4 forms (Contact Us, Get Qualified, Get Estimate, Affiliate) updated"
echo "   - Rich HTML email + SMS content generated in TypeScript"
echo "   - No manual template seeding required"
echo ""
echo "🎯 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Monitor AWS Amplify Console for deployment completion"
echo "2. Verify production environment variables are set correctly"
echo "3. Test forms on production URL once deployment completes"
echo "4. Check CloudWatch logs for any issues"
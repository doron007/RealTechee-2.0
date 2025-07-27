#!/bin/bash

# =============================================================================
# LOCAL PRODUCTION TESTING SCRIPT
# =============================================================================
# Tests production configuration locally without waiting for Amplify deployment
# Validates all environment variables, secrets, and configuration

set -e

echo "🔧 Starting Local Production Environment Testing"
echo "================================================"

# Step 1: Backup current environment
echo "📁 Backing up current .env.local..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up to .env.local.backup"
else
    echo "ℹ️  No .env.local found to backup"
fi

# Step 2: Copy production config to local
echo "🔄 Setting up local production environment..."
cp .env.production .env.local
echo "✅ Copied .env.production → .env.local"

# Step 3: Set NODE_ENV to production
echo "🌍 Setting NODE_ENV=production..."
export NODE_ENV=production

# Step 4: Validate environment variables
echo "🔍 Validating production environment variables..."
echo "-----------------------------------------------"

# Check critical variables
echo "NODE_ENV: $NODE_ENV"
echo "NEXT_PUBLIC_ENVIRONMENT: $(grep NEXT_PUBLIC_ENVIRONMENT .env.local | cut -d= -f2)"
echo "NEXT_PUBLIC_S3_PUBLIC_BASE_URL: $(grep NEXT_PUBLIC_S3_PUBLIC_BASE_URL .env.local | cut -d= -f2)"
echo "NEXT_PUBLIC_BACKEND_SUFFIX: $(grep NEXT_PUBLIC_BACKEND_SUFFIX .env.local | cut -d= -f2)"

# Step 5: Build with production config
echo "🏗️  Building with production configuration..."
npm run build

# Step 6: Start production server locally
echo "🚀 Starting local production server..."
echo "---------------------------------------"
echo "📍 URL: http://localhost:3000"
echo "🎯 Environment: Production (Local)"
echo "📊 Backend: Production tables (*-aqnqdrctpzfwfjwyxxsmu6peoq-*)"
echo "🗄️  S3: Production bucket"
echo ""
echo "🔍 Test the following:"
echo "  - Image URLs (should NOT have /public/)"
echo "  - Environment variables in browser console"
echo "  - Production backend connectivity"
echo "  - All production secrets work"
echo ""
echo "⚠️  CAUTION: This connects to PRODUCTION backend!"
echo "⚠️  Use test data only - no real production modifications"
echo ""
echo "Press Ctrl+C to stop server and restore environment"
echo ""

# Start the production server
npm start

# Cleanup on exit
cleanup() {
    echo ""
    echo "🔄 Restoring original environment..."
    if [ -f .env.local.backup ]; then
        mv .env.local.backup .env.local
        echo "✅ Restored .env.local from backup"
    else
        rm -f .env.local
        echo "✅ Removed production .env.local"
    fi
    echo "✅ Environment restored"
}

trap cleanup EXIT
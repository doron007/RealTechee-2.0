#!/bin/bash

# Script to migrate users from staging to production Cognito pool
# Production requires separate user pools for security compliance

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

STAGING_POOL="us-west-1_5pFbWcwtU"
PRODUCTION_POOL="us-west-1_1eQCIgm5h"

echo -e "${BLUE}ℹ️  INFO:${NC} Starting user migration from staging to production"
echo -e "${BLUE}ℹ️  INFO:${NC} Source pool (staging): ${STAGING_POOL}"
echo -e "${BLUE}ℹ️  INFO:${NC} Target pool (production): ${PRODUCTION_POOL}"

# Get users from staging pool
echo -e "${BLUE}ℹ️  INFO:${NC} Fetching users from staging pool..."
USERS=$(aws cognito-idp list-users --user-pool-id ${STAGING_POOL} --query 'Users[*].[Username,Attributes[?Name==`email`].Value|[0],UserStatus,Enabled]' --output text)

if [ -z "$USERS" ]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} No users found in staging pool"
    exit 0
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Found users in staging pool"
echo "$USERS"

echo ""
echo -e "${YELLOW}⚠️  WARNING:${NC} This will create users in production pool: ${PRODUCTION_POOL}"
echo -e "${YELLOW}⚠️  WARNING:${NC} Users will need to reset their passwords on first login"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ CANCELLED:${NC} User migration cancelled"
    exit 1
fi

# Migrate each user
echo "$USERS" | while IFS=$'\t' read -r username email status enabled; do
    if [ -n "$username" ] && [ -n "$email" ]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Creating user: ${email}"
        
        # Create user in production pool
        aws cognito-idp admin-create-user \
            --user-pool-id ${PRODUCTION_POOL} \
            --username "${username}" \
            --user-attributes Name=email,Value="${email}" Name=email_verified,Value=true \
            --message-action SUPPRESS \
            --temporary-password "TempPass123!" || {
            echo -e "${YELLOW}⚠️  WARNING:${NC} User ${email} may already exist in production"
            continue
        }
        
        # Set permanent password (users will still need to change it)
        aws cognito-idp admin-set-user-password \
            --user-pool-id ${PRODUCTION_POOL} \
            --username "${username}" \
            --password "TempPass123!" \
            --permanent || {
            echo -e "${YELLOW}⚠️  WARNING:${NC} Could not set permanent password for ${email}"
        }
        
        echo -e "${GREEN}✅ SUCCESS:${NC} User ${email} created in production"
    fi
done

echo ""
echo -e "${GREEN}✅ SUCCESS:${NC} User migration completed"
echo -e "${BLUE}ℹ️  INFO:${NC} Users will need to use 'TempPass123!' and reset password on first login"
echo -e "${BLUE}ℹ️  INFO:${NC} Consider sending password reset emails to all users"
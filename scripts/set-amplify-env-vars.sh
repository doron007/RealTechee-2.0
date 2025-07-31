#!/bin/bash

# Set AWS Amplify Environment Variables
# This script configures environment variables in AWS Amplify Console
# to enable environment-driven configuration without git commits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/config/environments.json"

echo -e "${BLUE}==>${NC} AWS Amplify Environment Variables Setup"

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 <environment> <app-id>"
    echo ""
    echo "Environments:"
    echo "  development   Set environment variables for development app"
    echo "  staging       Set environment variables for staging app"  
    echo "  production    Set environment variables for production app"
    echo ""
    echo "Examples:"
    echo "  $0 staging d3atadjk90y9q5"
    echo "  $0 production d200k2wsaf8th3"
    echo ""
}

# Check arguments
if [[ $# -lt 2 ]]; then
    echo -e "${RED}❌ ERROR:${NC} Missing required arguments"
    show_usage
    exit 1
fi

ENVIRONMENT="$1"
APP_ID="$2"

# Load environment configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Configuration file not found: $CONFIG_FILE"
    exit 1
fi

ENV_CONFIG=$(cat "$CONFIG_FILE" | jq -r ".environments.$ENVIRONMENT")
if [[ "$ENV_CONFIG" == "null" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Environment '$ENVIRONMENT' not found in configuration"
    exit 1
fi

# Extract configuration values
USER_POOL_ID=$(echo "$ENV_CONFIG" | jq -r '.cognito.user_pool_id')
USER_POOL_CLIENT_ID=$(echo "$ENV_CONFIG" | jq -r '.cognito.user_pool_client_id')  
IDENTITY_POOL_ID=$(echo "$ENV_CONFIG" | jq -r '.cognito.identity_pool_id')
API_URL=$(echo "$ENV_CONFIG" | jq -r '.api.graphql_url')
API_KEY=$(echo "$ENV_CONFIG" | jq -r '.api.api_key')
REGION=$(echo "$ENV_CONFIG" | jq -r '.api.region')
STORAGE_BUCKET=$(echo "$ENV_CONFIG" | jq -r '.storage.bucket_name')
BACKEND_SUFFIX=$(echo "$ENV_CONFIG" | jq -r '.amplify.backend_suffix')
SANDBOX=$(echo "$ENV_CONFIG" | jq -r '.amplify.sandbox')

echo -e "${BLUE}ℹ️  INFO:${NC} Environment: $ENVIRONMENT"
echo -e "${BLUE}ℹ️  INFO:${NC} App ID: $APP_ID"
echo -e "${BLUE}ℹ️  INFO:${NC} UserPool: $USER_POOL_ID"

# Set environment variables using AWS CLI
echo -e "${BLUE}==>${NC} Setting AWS Amplify environment variables"

# Check if AWS CLI is available
if ! command -v aws >/dev/null 2>&1; then
    echo -e "${RED}❌ ERROR:${NC} AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Set environment variables
ENV_VARS=$(cat <<EOF
{
  "AMPLIFY_USER_POOL_ID": "$USER_POOL_ID",
  "AMPLIFY_USER_POOL_CLIENT_ID": "$USER_POOL_CLIENT_ID", 
  "AMPLIFY_IDENTITY_POOL_ID": "$IDENTITY_POOL_ID",
  "AMPLIFY_API_URL": "$API_URL",
  "AMPLIFY_API_KEY": "$API_KEY",
  "AMPLIFY_REGION": "$REGION",
  "AMPLIFY_STORAGE_BUCKET": "$STORAGE_BUCKET",
  "AMPLIFY_BACKEND_SUFFIX": "$BACKEND_SUFFIX",
  "AMPLIFY_APP_ID": "$APP_ID",
  "AMPLIFY_SANDBOX": "$SANDBOX"
}
EOF
)

echo -e "${BLUE}ℹ️  INFO:${NC} Setting environment variables for app: $APP_ID"

# Update Amplify app environment variables
if aws amplify update-app \
  --app-id "$APP_ID" \
  --environment-variables "$ENV_VARS" \
  --region us-west-1 >/dev/null 2>&1; then
    
    echo -e "${GREEN}✅ SUCCESS:${NC} Environment variables set successfully"
else
    echo -e "${RED}❌ ERROR:${NC} Failed to set environment variables"
    echo -e "${BLUE}ℹ️  INFO:${NC} You may need to set them manually in AWS Amplify Console"
    echo ""
    echo "Environment Variables to set:"
    echo "$ENV_VARS" | jq .
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SETUP COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  1. Update your build settings to run: node scripts/generate-amplify-config.js $ENVIRONMENT"
echo "  2. Add amplify_outputs.json to .gitignore (if not already)"
echo "  3. Deploy your app - it will now generate config from environment variables"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Build Command:"
echo "  preBuild: node scripts/generate-amplify-config.js $ENVIRONMENT"
echo "  build: npm run build"

<system-reminder>
The TodoWrite tool hasn't been used recently. If you're working on tasks that would benefit from tracking progress, consider using the TodoWrite tool to track progress. Only use it if it's relevant to the current work. This is just a gentle reminder - ignore if not applicable.


Here are the existing contents of your todo list:

[1. [completed] Design environment variable-driven config system (high)
2. [completed] Create build-time config generation from environment variables (high)
3. [in_progress] Update deployment scripts to set AWS Amplify environment variables (high)
4. [pending] Remove config file commits from deployment scripts entirely (high)
5. [pending] Test new environment-driven deployment flow (medium)
6. [pending] Update documentation for new environment variable approach (low)]
</system-reminder>
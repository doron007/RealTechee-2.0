#!/bin/bash

# Environment Switching Script for RealTechee 2.0
# Uses centralized configuration to switch between environments

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

echo -e "${BLUE}==>${NC} Environment Switching Script - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Using centralized configuration: config/environments.json"

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 <environment>"
    echo ""
    echo "Environments:"
    echo "  development  Switch to development environment"
    echo "  staging      Switch to staging environment (shares backend with dev)"
    echo "  production   Switch to production environment (isolated backend)"
    echo "  status       Show current environment configuration"
    echo ""
    echo "Aliases:"
    echo "  dev          Alias for development"
    echo "  prod         Alias for production"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 staging"
    echo "  $0 production"
    echo "  $0 status"
    echo ""
}

# Function to detect current environment
detect_current_env() {
    if [[ ! -f "$PROJECT_ROOT/amplify_outputs.json" ]]; then
        echo "unknown"
        return
    fi
    
    # Check for environment indicators using backend suffixes from centralized config
    if grep -q "fvn7t5hbobaxjklhrqzdl4ac34" "$PROJECT_ROOT/amplify_outputs.json" 2>/dev/null; then
        echo "development"
    elif grep -q "aqnqdrctpzfwfjwyxxsmu6peoq" "$PROJECT_ROOT/amplify_outputs.json" 2>/dev/null; then
        echo "production"
    else
        echo "unknown"
    fi
}

# Function to show current status
show_status() {
    echo -e "${BLUE}==>${NC} Current Environment Status"
    
    current_env=$(detect_current_env)
    echo -e "${BLUE}ℹ️  INFO:${NC} Detected Environment: $current_env"
    
    if [[ -f "$PROJECT_ROOT/amplify_outputs.json" ]]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Available Configuration Files:"
        echo "  ✓ amplify_outputs.json (active)"
        [[ -f "$PROJECT_ROOT/config/amplify_outputs.development.json" ]] && echo "  ✓ config/amplify_outputs.development.json"
        [[ -f "$PROJECT_ROOT/config/amplify_outputs.staging.json" ]] && echo "  ✓ config/amplify_outputs.staging.json"
        [[ -f "$PROJECT_ROOT/config/amplify_outputs.production.json" ]] && echo "  ✓ config/amplify_outputs.production.json"
        
        # Show key configuration details
        echo ""
        echo -e "${BLUE}ℹ️  INFO:${NC} Active Configuration:"
        if command -v jq >/dev/null 2>&1; then
            echo "  API URL: $(jq -r '.data.url // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
            echo "  User Pool: $(jq -r '.auth.user_pool_id // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
            echo "  Region: $(jq -r '.auth.aws_region // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
            echo "  Backend Suffix: $(jq -r '._backend_suffix // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
        else
            echo "  (Install jq for detailed configuration display)"
        fi
        
        # Show environment details from centralized config
        if [[ "$current_env" != "unknown" && -f "$CONFIG_FILE" ]]; then
            echo ""
            echo -e "${BLUE}ℹ️  INFO:${NC} Environment Details:"
            if command -v jq >/dev/null 2>&1; then
                ENV_INFO=$(cat "$CONFIG_FILE" | jq -r ".environments.$current_env")
                if [[ "$ENV_INFO" != "null" ]]; then
                    echo "  App Name: $(echo "$ENV_INFO" | jq -r '.amplify.app_name')"
                    echo "  App URL: $(echo "$ENV_INFO" | jq -r '.amplify.url')"
                    echo "  Git Branch: $(echo "$ENV_INFO" | jq -r '.git_branch')"
                    echo "  Backend Suffix: $(echo "$ENV_INFO" | jq -r '.amplify.backend_suffix')"
                fi
            fi
        fi
    else
        echo -e "${RED}❌ ERROR:${NC} No amplify_outputs.json found"
    fi
}

# Function to switch environment
switch_environment() {
    local target_env="$1"
    local config_file="$PROJECT_ROOT/config/amplify_outputs.$target_env.json"
    
    echo -e "${BLUE}==>${NC} Switching to $target_env environment"
    
    # Check if centralized config exists
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo -e "${RED}❌ ERROR:${NC} Centralized configuration not found: $CONFIG_FILE"
        echo -e "${BLUE}ℹ️  INFO:${NC} Run ./scripts/generate-env-config.sh first"
        return 1
    fi
    
    # Check if target config exists
    if [[ ! -f "$config_file" ]]; then
        echo -e "${RED}❌ ERROR:${NC} Configuration file not found: $config_file"
        echo -e "${BLUE}ℹ️  INFO:${NC} Run ./scripts/generate-env-config.sh to create environment configs"
        return 1
    fi
    
    # Backup current config
    if [[ -f "$PROJECT_ROOT/amplify_outputs.json" ]]; then
        cp "$PROJECT_ROOT/amplify_outputs.json" "$PROJECT_ROOT/amplify_outputs.backup.json"
        echo -e "${GREEN}✅ SUCCESS:${NC} Current config backed up to amplify_outputs.backup.json"
    fi
    
    # Copy target config to active config
    cp "$config_file" "$PROJECT_ROOT/amplify_outputs.json"
    echo -e "${GREEN}✅ SUCCESS:${NC} Switched to $target_env environment"
    
    # Verify the switch
    new_env=$(detect_current_env)
    if [[ "$new_env" == "$target_env" ]]; then
        echo -e "${GREEN}✅ SUCCESS:${NC} Environment switch verified"
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} Environment detection shows '$new_env' but config file copied successfully"
    fi
    
    # Show environment details from centralized config
    if [[ -f "$CONFIG_FILE" ]] && command -v jq >/dev/null 2>&1; then
        echo ""
        echo -e "${BLUE}ℹ️  INFO:${NC} Active Environment Details:"
        ENV_INFO=$(cat "$CONFIG_FILE" | jq -r ".environments.$target_env")
        if [[ "$ENV_INFO" != "null" ]]; then
            echo "  Environment: $target_env"
            echo "  App Name: $(echo "$ENV_INFO" | jq -r '.amplify.app_name')"
            echo "  App URL: $(echo "$ENV_INFO" | jq -r '.amplify.url')"
            echo "  Git Branch: $(echo "$ENV_INFO" | jq -r '.git_branch')"
            echo "  User Pool: $(echo "$ENV_INFO" | jq -r '.cognito.user_pool_id')"
            
            # Show warnings for specific environments
            case "$target_env" in
                production)
                    echo ""
                    echo -e "${YELLOW}⚠️  WARNING:${NC} You are now using PRODUCTION configuration"
                    echo "  • All data operations will affect production database"
                    echo "  • Use extreme caution when running commands"
                    ;;
                staging)
                    echo ""
                    echo -e "${BLUE}ℹ️  INFO:${NC} Staging shares backend with development"
                    echo "  • Changes may affect development environment"
                    ;;
            esac
        fi
    fi
    
    echo ""
    echo -e "${BLUE}ℹ️  INFO:${NC} Next steps:"
    case "$target_env" in
        development)
            echo "  - Run 'npm run dev:primed' for local development"
            echo "  - Use 'npx ampx sandbox' for backend changes"
            ;;
        staging)
            echo "  - Configuration ready for staging deployment"
            echo "  - Run './scripts/deploy-staging.sh' to deploy"
            ;;
        production)
            echo "  - Configuration ready for production deployment"
            echo "  - Ensure you're on the correct git branch"
            echo "  - Run './scripts/deploy-production.sh' to deploy"
            ;;
    esac
}

# Main script logic
case "${1:-}" in
    "dev"|"development")
        switch_environment "development"
        ;;
    "staging")
        switch_environment "staging"
        ;;
    "prod"|"production")
        switch_environment "production"
        ;;
    "status"|"info")
        show_status
        ;;
    "")
        echo -e "${RED}❌ ERROR:${NC} Environment argument required"
        show_usage
        exit 1
        ;;
    *)
        echo -e "${RED}❌ ERROR:${NC} Invalid environment: $1"
        show_usage
        exit 1
        ;;
esac
#!/bin/bash

# Environment Switching Script for RealTechee 2.0
# Switches amplify_outputs.json between dev and production configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}==>${NC} Environment Switching Script - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Project Root: $PROJECT_ROOT"

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 <environment>"
    echo ""
    echo "Environments:"
    echo "  dev      Switch to development environment (RealTechee-2.0 app)"
    echo "  prod     Switch to production environment (RealTechee-Gen2 app)"
    echo "  status   Show current environment configuration"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 prod" 
    echo "  $0 status"
    echo ""
}

# Function to detect current environment
detect_current_env() {
    if [[ ! -f "$PROJECT_ROOT/amplify_outputs.json" ]]; then
        echo "unknown"
        return
    fi
    
    # Check for dev environment indicators
    if grep -q "fvn7t5hbobaxjklhrqzdl4ac34" "$PROJECT_ROOT/amplify_outputs.json" 2>/dev/null; then
        echo "dev"
    elif grep -q "aqnqdrctpzfwfjwyxxsmu6peoq" "$PROJECT_ROOT/amplify_outputs.json" 2>/dev/null; then
        echo "prod"
    else
        # Check GraphQL API URL patterns or other identifiers
        if grep -q "yq2katnwbbeqjecywrptfgecwa" "$PROJECT_ROOT/amplify_outputs.json" 2>/dev/null; then
            echo "dev"
        else
            echo "unknown"
        fi
    fi
}

# Function to show current status
show_status() {
    echo -e "${BLUE}==>${NC} Current Environment Status"
    
    current_env=$(detect_current_env)
    echo -e "${BLUE}ℹ️  INFO:${NC} Detected Environment: $current_env"
    
    if [[ -f "$PROJECT_ROOT/amplify_outputs.json" ]]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Configuration Files:"
        echo "  ✓ amplify_outputs.json (active)"
        [[ -f "$PROJECT_ROOT/amplify_outputs.dev.json" ]] && echo "  ✓ amplify_outputs.dev.json (available)"
        [[ -f "$PROJECT_ROOT/amplify_outputs.prod.json" ]] && echo "  ✓ amplify_outputs.prod.json (available)"
        
        # Show key configuration details
        echo ""
        echo -e "${BLUE}ℹ️  INFO:${NC} Active Configuration:"
        if command -v jq >/dev/null 2>&1; then
            echo "  API URL: $(jq -r '.data.url // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
            echo "  User Pool: $(jq -r '.auth.user_pool_id // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
            echo "  Region: $(jq -r '.auth.aws_region // "not found"' "$PROJECT_ROOT/amplify_outputs.json")"
        else
            echo "  (Install jq for detailed configuration display)"
        fi
    else
        echo -e "${RED}❌ ERROR:${NC} No amplify_outputs.json found"
    fi
}

# Function to switch environment
switch_environment() {
    local target_env="$1"
    local config_file="$PROJECT_ROOT/amplify_outputs.$target_env.json"
    
    echo -e "${BLUE}==>${NC} Switching to $target_env environment"
    
    # Check if target config exists
    if [[ ! -f "$config_file" ]]; then
        echo -e "${RED}❌ ERROR:${NC} Configuration file not found: $config_file"
        echo -e "${YELLOW}⚠️  WARNING:${NC} You may need to create this configuration file first"
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
    if [[ "$new_env" == "$target_env" ]] || [[ "$target_env" == "dev" && "$new_env" == "dev" ]]; then
        echo -e "${GREEN}✅ SUCCESS:${NC} Environment switch verified"
    else
        echo -e "${YELLOW}⚠️  WARNING:${NC} Environment detection unclear, but config file copied successfully"
    fi
    
    echo ""
    echo -e "${BLUE}ℹ️  INFO:${NC} Next steps:"
    if [[ "$target_env" == "dev" ]]; then
        echo "  - Run 'npm run dev:primed' for local development"
        echo "  - Use 'npx ampx sandbox' for backend changes"
    else
        echo "  - Configuration ready for production deployment"
        echo "  - Ensure you're on the correct git branch for deployment"
    fi
}

# Main script logic
case "${1:-}" in
    "dev"|"development")
        switch_environment "dev"
        ;;
    "prod"|"production")
        switch_environment "prod"
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
#!/bin/bash

# Script to switch Playwright configuration for VSCode
# Usage: ./scripts/switch-playwright-config.sh [dev|prod]

CONFIG_DIR=".vscode"
SETTINGS_FILE="$CONFIG_DIR/settings.json"

if [ ! -d "$CONFIG_DIR" ]; then
    echo "❌ .vscode directory not found"
    exit 1
fi

if [ ! -f "$SETTINGS_FILE" ]; then
    echo "❌ .vscode/settings.json not found"
    exit 1
fi

case "$1" in
    "prod")
        echo "🔄 Switching to production configuration..."
        sed -i '' 's/"playwright.configPath": "playwright.config.js"/"playwright.configPath": "playwright.config.prod.js"/' "$SETTINGS_FILE"
        echo "✅ VSCode Playwright now uses: playwright.config.prod.js (https://www.realtechee.com)"
        ;;
    "dev")
        echo "🔄 Switching to development configuration..."
        sed -i '' 's/"playwright.configPath": "playwright.config.prod.js"/"playwright.configPath": "playwright.config.js"/' "$SETTINGS_FILE"
        echo "✅ VSCode Playwright now uses: playwright.config.js (http://localhost:3000)"
        ;;
    *)
        echo "🎯 Current Playwright configuration:"
        grep "playwright.configPath" "$SETTINGS_FILE" || echo "Using default: playwright.config.js"
        echo ""
        echo "Usage: $0 [dev|prod]"
        echo "  dev  - Switch to development config (localhost:3000)"
        echo "  prod - Switch to production config (www.realtechee.com)"
        exit 1
        ;;
esac

echo ""
echo "💡 Reload VSCode window to apply changes (Cmd+Shift+P → Developer: Reload Window)"
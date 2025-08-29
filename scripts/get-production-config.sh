#!/bin/bash

# Script to retrieve production amplify_outputs.json
# This script helps get the actual production configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}==>${NC} Production Configuration Retrieval - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Production App: RealTechee-Gen2 (d200k2wsaf8th3)"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}⚠️  MANUAL STEP REQUIRED${NC}"
echo ""
echo "To get the production amplify_outputs.json, you need to:"
echo ""
echo "1. Navigate to the production environment directory or clone the production app"
echo "2. Run 'npx ampx generate outputs --app-id d200k2wsaf8th3' if available"
echo "3. Or copy the amplify_outputs.json from the production deployment"
echo ""
echo "Expected production values:"
echo "  - App ID: d200k2wsaf8th3"
echo "  - Backend Suffix: yk6ecaswg5aehjn3ev76xzpbfe"
echo "  - Sandbox: amplify-realtecheeclone-production-sandbox-70796fa803"
echo ""
echo "Once you have the production amplify_outputs.json:"
echo "  1. Replace the content of amplify_outputs.prod.json"
echo "  2. Test the configuration with './scripts/switch-environment.sh prod'"
echo "  3. Verify the URLs and credentials work correctly"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Current placeholder file: amplify_outputs.prod.json"
echo -e "${BLUE}ℹ️  INFO:${NC} After replacement, the production deployment will work correctly"
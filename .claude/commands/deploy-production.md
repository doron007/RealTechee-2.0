#!/bin/bash

# AWS Amplify Gen 2 Official Pattern: Production Deployment
# Zero config commits - amplify.yml handles environment-specific config generation

echo "🚀 AWS Amplify Gen 2 Production Deployment (Zero Config Commits)"
echo "ℹ️  Using official pattern: build-time config generation via amplify.yml"
echo "🛡️  Isolated production backend with comprehensive safety checks"
echo ""

# Execute the clean deployment script
exec ./scripts/deploy-production-clean.sh
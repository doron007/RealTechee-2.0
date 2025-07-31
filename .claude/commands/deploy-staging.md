#!/bin/bash

# AWS Amplify Gen 2 Official Pattern: Staging Deployment
# Zero config commits - amplify.yml handles environment-specific config generation

echo "🚀 AWS Amplify Gen 2 Staging Deployment (Zero Config Commits)"
echo "ℹ️  Using official pattern: build-time config generation via amplify.yml"
echo ""

# Execute the clean deployment script
exec ./scripts/deploy-staging-clean.sh
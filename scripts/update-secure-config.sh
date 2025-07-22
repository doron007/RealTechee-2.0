#!/bin/bash

# Update script for secure configuration in AWS Parameter Store
# This script updates parameters with API keys from environment variables
#
# Required environment variables:
# - SENDGRID_API_KEY: SendGrid API key for email notifications
# - TWILIO_ACCOUNT_SID: Twilio Account SID for SMS notifications  
# - TWILIO_AUTH_TOKEN: Twilio Auth Token for SMS notifications

set -e

echo "🔐 Updating secure configuration in AWS Parameter Store with API keys from environment"
echo "======================================================================================"

# Check required environment variables
if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ SENDGRID_API_KEY environment variable is required"
    exit 1
fi

if [ -z "$TWILIO_ACCOUNT_SID" ]; then
    echo "❌ TWILIO_ACCOUNT_SID environment variable is required"
    exit 1
fi

if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo "❌ TWILIO_AUTH_TOKEN environment variable is required"
    exit 1
fi

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Set region
REGION="us-west-1"
echo "🌎 Using region: $REGION"

# Function to update secure parameter
update_secure_parameter() {
    local name="$1"
    local value="$2"
    local description="$3"
    
    echo "📝 Updating parameter: $name"
    
    # Update parameter with actual value (without tags when overwriting)
    aws ssm put-parameter \
        --name "$name" \
        --description "$description" \
        --value "$value" \
        --type "SecureString" \
        --region "$REGION" \
        --overwrite
    
    echo "✅ Updated: $name"
}

# Update SendGrid parameters
echo ""
echo "📧 Updating SendGrid parameters..."
update_secure_parameter "/realtechee/sendgrid/api_key" "${SENDGRID_API_KEY}" "SendGrid API Key for email notifications"
update_secure_parameter "/realtechee/sendgrid/from_email" "info@realtechee.com" "SendGrid from email address"

# Update Twilio parameters
echo ""
echo "📱 Updating Twilio parameters..."
update_secure_parameter "/realtechee/twilio/account_sid" "${TWILIO_ACCOUNT_SID}" "Twilio Account SID for SMS notifications"
update_secure_parameter "/realtechee/twilio/auth_token" "${TWILIO_AUTH_TOKEN}" "Twilio Auth Token for SMS notifications"
update_secure_parameter "/realtechee/twilio/from_phone" "+15735313060" "Twilio from phone number"

# Update notification parameters
echo ""
echo "🔔 Updating notification parameters..."
update_secure_parameter "/realtechee/notifications/debug_mode" "true" "Enable debug mode for notifications"
update_secure_parameter "/realtechee/notifications/debug_email" "info@realtechee.com" "Debug email address"
update_secure_parameter "/realtechee/notifications/debug_phone" "+17135919400" "Debug phone number"

echo ""
echo "✅ All parameters updated successfully!"
echo ""
echo "📋 Configuration summary:"
echo "   SendGrid API Key: ${SENDGRID_API_KEY:0:10}***"
echo "   SendGrid From Email: info@realtechee.com"
echo "   Twilio Account SID: ${TWILIO_ACCOUNT_SID:0:10}***"
echo "   Twilio Auth Token: ${TWILIO_AUTH_TOKEN:0:10}***"
echo "   Twilio From Phone: +15735313060"
echo "   Debug Mode: true"
echo "   Debug Email: info@realtechee.com"
echo "   Debug Phone: +17135919400"
echo ""
echo "🔍 Verify parameters:"
echo "   aws ssm get-parameters-by-path --path '/realtechee/' --recursive --with-decryption --region $REGION"
echo ""
echo "🚀 Ready to test notifications!"
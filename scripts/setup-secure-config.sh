#!/bin/bash

# Setup script for secure configuration in AWS Parameter Store
# This script creates encrypted parameters for sensitive data

set -e

echo "🔐 Setting up secure configuration in AWS Parameter Store"
echo "========================================================"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Set region
REGION="us-west-1"
echo "🌎 Using region: $REGION"

# Function to create secure parameter
create_secure_parameter() {
    local name="$1"
    local description="$2"
    local placeholder="$3"
    
    echo "📝 Creating parameter: $name"
    
    # Check if parameter already exists
    if aws ssm get-parameter --name "$name" --region "$REGION" &> /dev/null; then
        echo "⚠️  Parameter $name already exists. Skipping..."
        return
    fi
    
    # Create parameter with placeholder value
    aws ssm put-parameter \
        --name "$name" \
        --description "$description" \
        --value "$placeholder" \
        --type "SecureString" \
        --region "$REGION" \
        --tags "Key=Service,Value=RealTechee" "Key=Environment,Value=dev"
    
    echo "✅ Created: $name"
}

# Create SendGrid parameters
echo ""
echo "📧 Creating SendGrid parameters..."
create_secure_parameter "/realtechee/sendgrid/api_key" "SendGrid API Key for email notifications" "SG.your_actual_sendgrid_api_key_here"
create_secure_parameter "/realtechee/sendgrid/from_email" "SendGrid from email address" "notifications@realtechee.com"

# Create Twilio parameters
echo ""
echo "📱 Creating Twilio parameters..."
create_secure_parameter "/realtechee/twilio/account_sid" "Twilio Account SID for SMS notifications" "ACyour_actual_twilio_account_sid_here"
create_secure_parameter "/realtechee/twilio/auth_token" "Twilio Auth Token for SMS notifications" "your_actual_twilio_auth_token_here"
create_secure_parameter "/realtechee/twilio/from_phone" "Twilio from phone number" "+1234567890"

# Create notification parameters
echo ""
echo "🔔 Creating notification parameters..."
create_secure_parameter "/realtechee/notifications/debug_mode" "Enable debug mode for notifications" "true"
create_secure_parameter "/realtechee/notifications/debug_email" "Debug email address" "info@realtechee.com"
create_secure_parameter "/realtechee/notifications/debug_phone" "Debug phone number" "+17135919400"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update the actual API keys in AWS Parameter Store:"
echo "      aws ssm put-parameter --name '/realtechee/sendgrid/api_key' --value 'SG.your_real_key' --type SecureString --overwrite --region $REGION"
echo "      aws ssm put-parameter --name '/realtechee/twilio/account_sid' --value 'ACyour_real_sid' --type SecureString --overwrite --region $REGION"
echo "      aws ssm put-parameter --name '/realtechee/twilio/auth_token' --value 'your_real_token' --type SecureString --overwrite --region $REGION"
echo ""
echo "   2. Set production mode:"
echo "      aws ssm put-parameter --name '/realtechee/notifications/debug_mode' --value 'false' --type SecureString --overwrite --region $REGION"
echo ""
echo "   3. Update Lambda function to use Parameter Store instead of environment variables"
echo ""
echo "🔍 View all parameters:"
echo "   aws ssm get-parameters-by-path --path '/realtechee/' --recursive --with-decryption --region $REGION"
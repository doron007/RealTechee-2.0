# Lambda Functions Validation & Permissions Guide

## 🎯 Overview

This document provides comprehensive validation procedures for AWS Lambda functions in the RealTechee 2.0 production environment, including permissions, environment variables, and monitoring setup.

---

## 📋 Expected Lambda Functions

### **Core Business Functions**

| Function Type | Purpose | Trigger | Expected Environment |
|---------------|---------|---------|---------------------|
| **notification-processor** | Email/SMS notifications | DynamoDB streams | Production tables |
| **user-admin** | User management operations | GraphQL mutations | Cognito production |
| **status-processor** | Status transitions & cleanup | Scheduled (daily) | Production backend |

### **Function Naming Convention**
```
[function-name]-[environment-suffix]-[hash]

Examples:
- notification-processor-aqnqdrctpzfwfjwyxxsmu6peoq-a1b2c3d4
- user-admin-aqnqdrctpzfwfjwyxxsmu6peoq-e5f6g7h8
- status-processor-aqnqdrctpzfwfjwyxxsmu6peoq-i9j0k1l2
```

---

## 🔍 Lambda Functions Audit

### **Discovery Commands**
```bash
# List all Lambda functions in us-west-1
aws lambda list-functions --region us-west-1

# Filter for production environment (aqnqdrctpzfwfjwyxxsmu6peoq)
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"

# Filter for Amplify-generated functions
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'amplify')]"

# Search for specific function types
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'notification')]"
```

### **Function Details Validation**
```bash
# Get specific function configuration
aws lambda get-function \
  --function-name [FUNCTION_NAME] \
  --region us-west-1

# Check function environment variables
aws lambda get-function-configuration \
  --function-name [FUNCTION_NAME] \
  --region us-west-1 \
  --query "Environment.Variables"

# Verify function permissions
aws lambda get-policy \
  --function-name [FUNCTION_NAME] \
  --region us-west-1
```

---

## ⚙️ Environment Variables Validation

### **Required Environment Variables**

#### **notification-processor Function**
```json
{
  "SENDGRID_API_KEY": "SG.production_key_here",
  "TWILIO_ACCOUNT_SID": "AC_production_sid_here", 
  "TWILIO_AUTH_TOKEN": "production_token_here",
  "TWILIO_FROM_PHONE": "+1234567890",
  "FROM_EMAIL": "notifications@realtechee.com",
  "REPLY_TO_EMAIL": "support@realtechee.com",
  "DEBUG_NOTIFICATIONS": "false",
  "DYNAMODB_TABLE_PREFIX": "aqnqdrctpzfwfjwyxxsmu6peoq"
}
```

#### **user-admin Function**
```json
{
  "COGNITO_USER_POOL_ID": "[PRODUCTION_USER_POOL_ID]",
  "COGNITO_REGION": "us-west-1",
  "DYNAMODB_TABLE_PREFIX": "aqnqdrctpzfwfjwyxxsmu6peoq",
  "LOG_LEVEL": "INFO"
}
```

#### **status-processor Function**
```json
{
  "DYNAMODB_TABLE_PREFIX": "aqnqdrctpzfwfjwyxxsmu6peoq",
  "STATUS_EXPIRATION_DAYS": "14",
  "LOG_LEVEL": "INFO",
  "SCHEDULE_ENABLED": "true"
}
```

### **Validation Script**
```bash
#!/bin/bash
# scripts/validate-lambda-env.sh

validate_lambda_env() {
    local function_name=$1
    local expected_vars=("${@:2}")
    
    echo "🔍 Validating $function_name environment variables..."
    
    local env_vars=$(aws lambda get-function-configuration \
        --function-name "$function_name" \
        --region us-west-1 \
        --query "Environment.Variables" \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ Function $function_name not found"
        return 1
    fi
    
    for var in "${expected_vars[@]}"; do
        if echo "$env_vars" | jq -e "has(\"$var\")" >/dev/null; then
            echo "✅ $var: Set"
        else
            echo "❌ $var: Missing"
        fi
    done
}

# Usage examples
validate_lambda_env "notification-processor-aqnqdrctpzfwfjwyxxsmu6peoq-xyz" \
    "SENDGRID_API_KEY" "TWILIO_ACCOUNT_SID" "FROM_EMAIL"
```

---

## 🔐 Permissions Validation

### **IAM Roles & Policies**

#### **notification-processor Permissions**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:BatchGetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-1:*:table/*-aqnqdrctpzfwfjwyxxsmu6peoq-*"
      ]
    },
    {
      "Effect": "Allow", 
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-west-1:*:*"
    }
  ]
}
```

#### **user-admin Permissions**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser", 
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers"
      ],
      "Resource": [
        "arn:aws:cognito-idp:us-west-1:*:userpool/[PRODUCTION_USER_POOL_ID]"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem", 
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-1:*:table/*-aqnqdrctpzfwfjwyxxsmu6peoq-*"
      ]
    }
  ]
}
```

### **Permissions Validation Commands**
```bash
# Get function's execution role
ROLE_ARN=$(aws lambda get-function-configuration \
  --function-name [FUNCTION_NAME] \
  --region us-west-1 \
  --query "Role" \
  --output text)

# Get role name from ARN
ROLE_NAME=$(echo $ROLE_ARN | cut -d'/' -f2)

# List attached policies
aws iam list-attached-role-policies \
  --role-name $ROLE_NAME

# Get inline policies
aws iam list-role-policies \
  --role-name $ROLE_NAME

# Get specific policy document
aws iam get-policy-version \
  --policy-arn [POLICY_ARN] \
  --version-id v1
```

---

## 🧪 Function Testing & Validation

### **notification-processor Testing**
```bash
# Test event payload
cat > test-notification.json << EOF
{
  "Records": [
    {
      "eventName": "INSERT",
      "eventSource": "aws:dynamodb",
      "dynamodb": {
        "NewImage": {
          "id": {"S": "test-notification-123"},
          "type": {"S": "email"},
          "recipient": {"S": "test@realtechee.com"},
          "subject": {"S": "Test Notification"},
          "body": {"S": "This is a test notification"}
        }
      }
    }
  ]
}
EOF

# Invoke function with test payload
aws lambda invoke \
  --function-name [NOTIFICATION_FUNCTION_NAME] \
  --region us-west-1 \
  --payload file://test-notification.json \
  response.json

# Check response
cat response.json
```

### **status-processor Testing**
```bash
# Test scheduled invocation
aws lambda invoke \
  --function-name [STATUS_FUNCTION_NAME] \
  --region us-west-1 \
  --payload '{"source": "aws.events"}' \
  response.json

# Check CloudWatch logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/[FUNCTION_NAME]" \
  --region us-west-1

# Get recent log events
aws logs get-log-events \
  --log-group-name "/aws/lambda/[FUNCTION_NAME]" \
  --log-stream-name [LOG_STREAM_NAME] \
  --region us-west-1 \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## 📊 Monitoring & Alerting

### **CloudWatch Metrics**
```bash
# Function invocation metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Invocations" \
  --dimensions Name=FunctionName,Value=[FUNCTION_NAME] \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region us-west-1

# Error rate monitoring  
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Errors" \
  --dimensions Name=FunctionName,Value=[FUNCTION_NAME] \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region us-west-1
```

### **CloudWatch Alarms**
```bash
# Create error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-NotificationProcessor-Errors" \
  --alarm-description "Lambda function error rate too high" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-west-1:[ACCOUNT]:production-alerts" \
  --dimensions Name=FunctionName,Value=[FUNCTION_NAME] \
  --region us-west-1
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Function Not Found**
```bash
# Check if function exists with different naming
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'notification')]"

# Check other regions
aws lambda list-functions \
  --region us-east-1 \
  --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"
```

#### **Permission Denied Errors**
```bash
# Check CloudWatch logs for specific errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/[FUNCTION_NAME]" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-west-1
```

#### **Environment Variable Issues**
```bash
# Update function environment variables
aws lambda update-function-configuration \
  --function-name [FUNCTION_NAME] \
  --environment "Variables={KEY1=value1,KEY2=value2}" \
  --region us-west-1
```

### **Performance Issues**
```bash
# Check function timeout and memory settings
aws lambda get-function-configuration \
  --function-name [FUNCTION_NAME] \
  --region us-west-1 \
  --query "{Timeout: Timeout, MemorySize: MemorySize, Runtime: Runtime}"

# Monitor duration metrics
aws cloudwatch get-metric-statistics \
  --namespace "AWS/Lambda" \
  --metric-name "Duration" \
  --dimensions Name=FunctionName,Value=[FUNCTION_NAME] \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --region us-west-1
```

---

## 📚 Automated Validation Scripts

### **Complete Lambda Audit**
```bash
#!/bin/bash
# scripts/audit-lambda-functions.sh

echo "🔍 Lambda Functions Production Audit"
echo "===================================="

# Find production Lambda functions
PROD_FUNCTIONS=$(aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')].FunctionName" \
  --output text)

if [ -z "$PROD_FUNCTIONS" ]; then
    echo "❌ No production Lambda functions found"
    echo "🔍 Searching for Amplify functions..."
    
    aws lambda list-functions \
      --region us-west-1 \
      --query "Functions[?contains(FunctionName, 'amplify')].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}" \
      --output table
else
    echo "✅ Found production Lambda functions:"
    for func in $PROD_FUNCTIONS; do
        echo "  - $func"
        
        # Validate environment variables
        echo "    Environment variables:"
        aws lambda get-function-configuration \
          --function-name "$func" \
          --region us-west-1 \
          --query "Environment.Variables" \
          --output json | jq 'keys[]' | head -5
        
        # Check recent invocations
        echo "    Recent errors (last hour):"
        aws logs filter-log-events \
          --log-group-name "/aws/lambda/$func" \
          --filter-pattern "ERROR" \
          --start-time $(date -d '1 hour ago' +%s)000 \
          --region us-west-1 \
          --query "events[].message" \
          --output text 2>/dev/null || echo "    No recent errors"
        
        echo ""
    done
fi
```

---

*Last Updated: July 26, 2025 - Production Lambda validation framework ✅*
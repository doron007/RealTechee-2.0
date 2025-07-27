# AWS Configuration Guide

## 🎯 Overview

Comprehensive guide for AWS Amplify configuration, environment management, and deployment troubleshooting for RealTechee 2.0 production environment.

---

## 🏗️ Environment Architecture

### **Three-Tier Deployment System**

| Environment | Purpose | App ID | Backend Tables | Branch | URL |
|-------------|---------|--------|---------------|--------|-----|
| **Development** | Local development | N/A | `*-fvn7t5h...-*` | main | localhost:3000 |
| **Staging** | Testing & validation | d3atadjk90y9q5 | `*-fvn7t5h...-*` | prod | prod.d3atadjk90y9q5.amplifyapp.com |
| **Production** | Live application | d200k2wsaf8th3 | `*-aqnqdr...-*` | prod-v2 | d200k2wsaf8th3.amplifyapp.com |

### **Backend Isolation**
```
Development/Staging (Shared Backend):
├── App: RealTechee-2.0 (d3atadjk90y9q5)
├── Tables: *-fvn7t5hbobaxjklhrqzdl4ac34-NONE
├── S3: amplify-realtecheeclone-d-realtecheeuseruploadsbuc-vsohbwu6kzsf
└── GraphQL: https://[API_ID].appsync-api.us-west-1.amazonaws.com/graphql

Production (Isolated Backend):
├── App: RealTechee-Gen2 (d200k2wsaf8th3)  
├── Tables: *-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
├── S3: amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii
└── GraphQL: https://[API_ID].appsync-api.us-west-1.amazonaws.com/graphql
```

---

## ⚙️ Environment Variables Configuration

### **Production Environment Variables**

#### **Critical Configuration (AWS Amplify Branch Settings)**
```bash
# Core Environment
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
AMPLIFY_ENVIRONMENT=production

# Backend Configuration
NEXT_PUBLIC_BACKEND_ENVIRONMENT=production
NEXT_PUBLIC_BACKEND_SUFFIX=aqnqdrctpzfwfjwyxxsmu6peoq

# S3 Storage (CRITICAL - Must NOT contain /public)
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com

# Security
NEXT_PUBLIC_STRICT_MODE=true
NEXT_PUBLIC_CSRF_PROTECTION=enforce
NEXT_PUBLIC_RATE_LIMITING=true

# Feature Flags
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
NEXT_PUBLIC_SHOW_DEBUG_INFO=false
NEXT_PUBLIC_MOCK_EXTERNAL_APIS=false
```

#### **Secrets (AWS Amplify Backend)**
```bash
# SendGrid (Email Notifications)
SENDGRID_API_KEY=SG.production_key_here
FROM_EMAIL=notifications@realtechee.com
REPLY_TO_EMAIL=support@realtechee.com

# Twilio (SMS Notifications)  
TWILIO_ACCOUNT_SID=AC_production_sid_here
TWILIO_AUTH_TOKEN=production_token_here
TWILIO_FROM_PHONE=+1234567890

# Production Settings
DEBUG_NOTIFICATIONS=false
NOTIFICATION_RETRY_COUNT=3
NOTIFICATION_TIMEOUT=30000
```

### **Environment Variable Management**

#### **Update Production Environment Variables**
```bash
# Update single variable
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com \
  --region us-west-1

# Update multiple variables
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables '{
    "NEXT_PUBLIC_S3_PUBLIC_BASE_URL": "https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com",
    "NEXT_PUBLIC_ENVIRONMENT": "production",
    "NODE_ENV": "production"
  }' \
  --region us-west-1
```

#### **Retrieve Current Environment Variables**
```bash
# Get branch configuration
aws amplify get-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --region us-west-1

# Extract environment variables only
aws amplify get-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --region us-west-1 \
  --query "branch.environmentVariables"
```

---

## 🚀 Deployment Management

### **Production Deployment Process**

#### **1. Environment Variable Validation**
```bash
# Validate production configuration
npm run validate:prod:env

# Audit AWS configuration
npm run audit:prod:aws

# Analyze configuration differences  
npm run analyze:prod:audit
```

#### **2. Code Deployment**
```bash
# Using deployment scripts
npm run deploy:prod:staging    # Deploy to staging first
npm run deploy:prod:production # Deploy to production

# Direct AWS CLI deployment
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --region us-west-1
```

#### **3. Build Monitoring**
```bash
# Monitor build progress
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-id [JOB_ID] \
  --region us-west-1

# List recent builds
aws amplify list-jobs \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --max-items 5 \
  --region us-west-1
```

### **Build Configuration**

#### **Build Specification (amplify.yml)**
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npx ampx configure --debug --path=amplify_outputs.json
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

#### **Environment-Specific Builds**
```bash
# Force clean build
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --region us-west-1

# Build with specific commit
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --commit-id [COMMIT_SHA] \
  --region us-west-1
```

---

## 🗄️ S3 Storage Configuration

### **Production S3 Bucket**
```
Bucket: amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii
Region: us-west-1
Path Structure: /assets/[category]/[filename]
```

### **S3 URL Construction**
```javascript
// Correct URL format
const baseUrl = "https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com";
const relativePath = "/assets/properties/17717-miranda-st-encino-ca-91316-usa/images/gallery-001.webp";
const fullUrl = baseUrl + relativePath;

// Result: https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com/assets/properties/17717-miranda-st-encino-ca-91316-usa/images/gallery-001.webp
```

### **S3 CORS Configuration**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://d200k2wsaf8th3.amplifyapp.com",
        "https://prod-v2.d200k2wsaf8th3.amplifyapp.com",
        "http://localhost:3000"
      ],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### **S3 Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii/assets/*"
    }
  ]
}
```

---

## 🧪 Lambda Functions Management

### **Expected Production Functions**

| Function Type | Expected Name Pattern | Purpose |
|---------------|----------------------|---------|
| **notification-processor** | `notification-processor-aqnqdrctpzfwfjwyxxsmu6peoq-[hash]` | Email/SMS notifications |
| **user-admin** | `user-admin-aqnqdrctpzfwfjwyxxsmu6peoq-[hash]` | User management |
| **status-processor** | `status-processor-aqnqdrctpzfwfjwyxxsmu6peoq-[hash]` | Status transitions |

### **Lambda Discovery & Validation**
```bash
# Find production Lambda functions
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"

# Search for Amplify-generated functions
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'amplify')]"

# Get function configuration
aws lambda get-function-configuration \
  --function-name [FUNCTION_NAME] \
  --region us-west-1
```

### **Lambda Environment Variables**
```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name [FUNCTION_NAME] \
  --environment "Variables={
    SENDGRID_API_KEY=SG.production_key_here,
    TWILIO_ACCOUNT_SID=AC_production_sid_here,
    DYNAMODB_TABLE_PREFIX=aqnqdrctpzfwfjwyxxsmu6peoq
  }" \
  --region us-west-1
```

---

## 📊 DynamoDB Configuration

### **Production Tables**
```
Table Pattern: [ModelName]-aqnqdrctpzfwfjwyxxsmu6peoq-NONE

Core Tables:
- Requests-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- Contacts-aqnqdrctpzfwfjwyxxsmu6peoq-NONE  
- Projects-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- Properties-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- Quotes-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- Users-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- NotificationQueue-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
- BackOfficeRequestStatuses-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
```

### **DynamoDB Validation**
```bash
# List production tables
aws dynamodb list-tables \
  --region us-west-1 \
  --query "TableNames[?contains(@, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"

# Get table description
aws dynamodb describe-table \
  --table-name [TABLE_NAME] \
  --region us-west-1

# Query table items (testing)
aws dynamodb scan \
  --table-name Requests-aqnqdrctpzfwfjwyxxsmu6peoq-NONE \
  --region us-west-1 \
  --limit 5
```

---

## 🌐 CloudFront & CDN Configuration

### **CloudFront Distribution**
```bash
# List distributions for Amplify app
aws cloudfront list-distributions \
  --region us-west-1 \
  --query "DistributionList.Items[?contains(Comment, 'd200k2wsaf8th3')]"

# Get distribution configuration
aws cloudfront get-distribution \
  --id [DISTRIBUTION_ID] \
  --region us-west-1
```

### **Cache Invalidation**
```bash
# Invalidate all cached content
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*" \
  --region us-west-1

# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/assets/*" "/_next/*" \
  --region us-west-1
```

---

## 🔍 Monitoring & Logging

### **CloudWatch Logs**
```bash
# List log groups for Amplify app
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/amplify/d200k2wsaf8th3" \
  --region us-west-1

# Get recent logs
aws logs filter-log-events \
  --log-group-name "/aws/amplify/d200k2wsaf8th3/build" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-west-1
```

### **Lambda Function Logs**
```bash
# List Lambda log groups
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/" \
  --region us-west-1 \
  --query "logGroups[?contains(logGroupName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"

# Get Lambda function errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/[FUNCTION_NAME]" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-west-1
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **Environment Variable Issues**
```bash
# Problem: S3 URLs contain /public/ prefix
# Solution: Update environment variable
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com \
  --region us-west-1
```

#### **Build Failures**
```bash
# Check build logs
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-id [JOB_ID] \
  --region us-west-1

# Force clean rebuild
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --region us-west-1
```

#### **Lambda Function Issues**
```bash
# Check function existence
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'aqnqdrctpzfwfjwyxxsmu6peoq')]"

# Check function permissions
aws lambda get-policy \
  --function-name [FUNCTION_NAME] \
  --region us-west-1
```

### **Emergency Procedures**

#### **Rollback to Previous Version**
```bash
# Get previous successful build
aws amplify list-jobs \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --max-items 10 \
  --region us-west-1

# Deploy specific commit
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --commit-id [PREVIOUS_COMMIT] \
  --region us-west-1
```

#### **Environment Variable Recovery**
```bash
# Restore from backup configuration
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables file://backup-env-vars.json \
  --region us-west-1
```

---

## 📚 Automation Scripts

### **Complete Health Check**
```bash
#!/bin/bash
# scripts/health-check-production.sh

echo "🏥 Production Health Check"
echo "========================="

# Check Amplify app status
aws amplify get-app --app-id d200k2wsaf8th3 --region us-west-1 \
  --query "app.defaultDomain" --output text

# Check latest build status  
aws amplify list-jobs --app-id d200k2wsaf8th3 --branch-name prod-v2 \
  --max-items 1 --region us-west-1 \
  --query "jobSummaries[0].{Status:status,StartTime:startTime}"

# Check environment variables
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name prod-v2 \
  --region us-west-1 \
  --query "branch.environmentVariables.NEXT_PUBLIC_S3_PUBLIC_BASE_URL" \
  --output text

# Check S3 bucket access
aws s3 ls s3://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii/assets/ \
  --region us-west-1 | head -5

echo "✅ Health check complete"
```

---

*Last Updated: July 26, 2025 - Production S3 environment variable fix applied ✅*
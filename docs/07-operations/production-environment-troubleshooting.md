# Production Environment Troubleshooting Guide

## 🚨 Critical Issue Resolution: S3 URL `/public` Prefix Problem

**Date**: July 26, 2025  
**Issue**: Production images failing with `/public/` prefix in URLs  
**Status**: ✅ **RESOLVED** - Root cause identified and fixed

---

## 🔍 Issue Summary

### **Problem**
- **Production**: Images URLs contained `/public/` prefix causing 404 errors
- **Staging/Local**: Working correctly without `/public/` prefix
- **Code**: Confirmed correct in all environments

### **Root Cause**
**AWS Amplify production environment variable misconfiguration**

```bash
# WRONG (Production - causing 404s)
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com/public

# CORRECT (Fixed)
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com
```

---

## 🔧 Resolution Steps

### **1. Environment Variable Audit**
```bash
# Comprehensive AWS audit
npm run audit:prod:aws

# Analyze audit results  
npm run analyze:prod:audit
```

### **2. Fix Production Environment Variable**
```bash
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --region us-west-1 \
  --environment-variables NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com
```

### **3. Trigger Clean Rebuild**
```bash
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --region us-west-1
```

### **4. Verify Fix**
```bash
# Monitor build progress
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-id [JOB_ID] \
  --region us-west-1

# Test production site
# Check: https://d200k2wsaf8th3.amplifyapp.com/projects
# Verify: Image URLs do NOT contain /public/
```

---

## 📋 Environment Configuration Matrix

| Environment | App ID | Backend Tables | S3 Base URL | Status |
|-------------|--------|----------------|-------------|---------|
| **Development** | localhost:3000 | `*-fvn7t5h...-*` | Local config | ✅ Working |
| **Staging** | d3atadjk90y9q5 | `*-fvn7t5h...-*` | Staging bucket | ✅ Working |
| **Production** | d200k2wsaf8th3 | `*-aqnqdr...-*` | Production bucket | ✅ **FIXED** |

---

## 🛠️ Diagnostic Tools

### **Local Production Testing**
```bash
# Test production config locally (fast iteration)
npm run test:prod:local

# Validate production environment variables
npm run validate:prod:env
```

### **AWS Configuration Audit**
```bash
# Comprehensive AWS audit
npm run audit:prod:aws

# Analyze configuration differences
npm run analyze:prod:audit
```

### **Environment Validation Commands**
```bash
# Check environment variables
aws amplify get-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --region us-west-1

# Check build status
aws amplify list-jobs \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --max-items 5 \
  --region us-west-1
```

---

## 🔍 Investigation Methodology

### **Systematic Debugging Approach**

1. **Code Verification** ✅
   - Local testing with production config confirmed code correctness
   - s3Utils.ts properly handles URL construction

2. **Environment Analysis** ✅  
   - AWS CLI audit revealed misconfigured environment variable
   - Production had `/public` suffix, staging did not

3. **Configuration Fix** ✅
   - Direct AWS CLI update of environment variable
   - Clean rebuild to apply changes

4. **Verification** ✅
   - Build monitoring and testing post-deployment

### **Key Learnings**

- **Local vs Cloud**: Code working locally ≠ cloud configuration correct
- **Environment Variables**: AWS Amplify environment can override local `.env` files
- **Systematic Audit**: AWS CLI comprehensive audit essential for complex issues
- **Fast Iteration**: Local production testing enables quick validation

---

## 📊 Lambda Functions & Permissions Analysis

### **Expected Lambda Functions**
Based on audit, these Lambda functions should exist in production:

```bash
# Notification system
notification-processor-[SUFFIX]

# User management  
user-admin-[SUFFIX]

# Status management
status-processor-[SUFFIX]
```

### **Current Status**
- **Production**: ⚠️ Lambda functions not found in audit
- **Investigation**: Functions may use different naming or region

### **Validation Commands**
```bash
# List all Lambda functions in region
aws lambda list-functions --region us-west-1

# Search for Amplify-generated functions
aws lambda list-functions \
  --region us-west-1 \
  --query "Functions[?contains(FunctionName, 'amplify')]"

# Check specific function
aws lambda get-function \
  --function-name [FUNCTION_NAME] \
  --region us-west-1
```

---

## 🎯 Monitoring & Prevention

### **Environment Variable Monitoring**
```bash
# Regular validation
npm run validate:prod:env

# Scheduled audit (weekly)
npm run audit:prod:aws
```

### **Health Checks**
- **Image Loading**: Monitor 404 errors on image requests
- **Environment Consistency**: Regular comparison of staging vs production
- **Build Success**: Monitor Amplify build logs for environment injection issues

### **Alerting Setup**
```bash
# CloudWatch alarms for 404 errors
# SNS notifications for build failures
# Environment variable drift detection
```

---

## 📚 Related Documentation

- **Environment Architecture**: `docs/00-overview/environment-architecture.md`
- **Deployment Procedures**: `docs/06-deployment/enterprise-deployment-procedures.md`  
- **Production Monitoring**: `docs/07-operations/production-monitoring.md`
- **AWS Configuration**: `docs/09-migration/aws-configuration-guide.md`

---

## 🚨 Emergency Procedures

### **Immediate Rollback**
```bash
# Revert to last known good environment variable
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables [PREVIOUS_WORKING_CONFIG]

# Trigger rebuild
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE
```

### **CloudFront Cache Invalidation**
```bash
# Get CloudFront distribution ID
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Comment, 'd200k2wsaf8th3')]"

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*"
```

---

*Last Updated: July 26, 2025 - Production S3 URL issue resolved ✅*
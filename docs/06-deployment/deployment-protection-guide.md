# Deployment Protection Guide

## 🛡️ Overview

This guide documents the deployment protection mechanisms implemented to prevent reintroduction of critical configuration issues (like the S3 `/public` prefix problem) in future deployments.

---

## 🚨 Critical Issue Background

### **The Problem We Solved**
- **Issue**: Production image URLs contained `/public/` prefix causing 404 errors
- **Root Cause**: AWS Amplify production environment variable was misconfigured
- **Impact**: Complete image loading failure in production
- **Resolution**: Direct AWS CLI fix + comprehensive protection system

### **Why Protection is Essential**
- Environment variables can be overwritten during deployments
- AWS Amplify may cache or inject incorrect values
- Manual deployments can introduce configuration drift
- Future team members need clear validation processes

---

## 🔧 Protection Mechanisms Implemented

### **1. Pre-Deployment Validation Script**
**Location**: `scripts/validate-production-deployment.sh`

```bash
# Usage: Run before any production deployment
npm run validate:prod:deployment

# What it does:
✅ Validates critical environment variables
✅ Checks for forbidden /public suffix in S3 URLs
✅ Compares local vs AWS configuration
✅ Auto-fixes issues with user confirmation
✅ Triggers rebuild if needed
```

**Critical Variables Validated**:
- `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` - Must NOT contain `/public`
- `NEXT_PUBLIC_ENVIRONMENT` - Must be `production`
- `NEXT_PUBLIC_BACKEND_SUFFIX` - Must be `aqnqdrctpzfwfjwyxxsmu6peoq`

### **2. Enhanced Deployment Script**
**Location**: `.claude/commands/deploy-production.md`

**New Step Added**: Environment validation before deployment
```bash
# 8. Validate production environment variables
echo_step "Validating production environment configuration"
./scripts/validate-production-deployment.sh || echo_error "Production environment validation failed"
```

**Protection Flow**:
1. **Version Validation** - Must deploy from RC
2. **Safety Checks** - TypeScript + build validation
3. **🆕 Environment Validation** - Critical variables check
4. **Deployment** - Only proceeds if all checks pass

### **3. Local Testing Framework**
**Purpose**: Test production configuration locally before AWS deployment

```bash
# Test production config locally (fast iteration)
npm run test:prod:local

# Validate local production environment
npm run validate:prod:env
```

**Benefits**:
- **Fast Feedback** - No 10-15 min AWS wait
- **Early Detection** - Catch issues before production
- **Safe Testing** - Auto-restores dev environment

### **4. Comprehensive Auditing System**
**Purpose**: Deep AWS infrastructure analysis

```bash
# Full AWS configuration audit
npm run audit:prod:aws

# Analyze audit results
npm run analyze:prod:audit
```

**What it Audits**:
- Environment variables (AWS vs local)
- Lambda functions and permissions
- S3 bucket configuration
- DynamoDB tables
- CloudFront distributions
- Build history and logs

---

## 📋 Deployment Checklist

### **Before Every Production Deployment**

#### **1. Environment Validation**
```bash
# Validate production environment variables
npm run validate:prod:deployment

# Expected output:
✅ NEXT_PUBLIC_S3_PUBLIC_BASE_URL: CORRECT
✅ NEXT_PUBLIC_ENVIRONMENT: CORRECT  
✅ NEXT_PUBLIC_BACKEND_SUFFIX: CORRECT
✅ All environment variables are correct
```

#### **2. Local Production Testing**
```bash
# Test production config locally
npm run test:prod:local

# Verify:
- Image URLs do NOT contain /public/
- All features work with production backend
- Environment variables load correctly
```

#### **3. Use Protected Deployment**
```bash
# Use enhanced deployment script (includes validation)
/deploy-production

# OR manual with validation
npm run validate:prod:deployment
git push origin prod-v2  # Only after validation passes
```

### **After Production Deployment**

#### **1. Immediate Verification**
```bash
# Check build status
aws amplify get-job --app-id d200k2wsaf8th3 --branch-name prod-v2 --job-id [ID] --region us-west-1

# Verify environment variables
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name prod-v2 --region us-west-1 --query "branch.environmentVariables"
```

#### **2. Live Site Testing**
- **Production URL**: `https://d200k2wsaf8th3.amplifyapp.com/projects`
- **Verify**: Image URLs are correct (no `/public/` prefix)
- **Test**: All functionality works as expected

---

## 🚨 Critical Environment Variables

### **Production S3 URL Configuration**
```bash
# ✅ CORRECT (what we want)
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com

# ❌ INCORRECT (causes 404 errors)
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com/public
```

### **Backend Configuration**
```bash
# Production backend identifier
NEXT_PUBLIC_BACKEND_SUFFIX=aqnqdrctpzfwfjwyxxsmu6peoq

# Must match production tables pattern
# Tables: *-aqnqdrctpzfwfjwyxxsmu6peoq-NONE
```

### **Environment Identification**
```bash
# Clear production identification
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
AMPLIFY_ENVIRONMENT=production
```

---

## 🔧 Manual Fix Procedures

### **If Environment Variables Get Corrupted Again**

#### **Quick Fix**
```bash
# Run auto-fix validation
npm run validate:prod:deployment

# Say 'y' to auto-fix when prompted
# Say 'y' to trigger rebuild when prompted
```

#### **Manual AWS CLI Fix**
```bash
# Fix S3 URL directly
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --environment-variables NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com \
  --region us-west-1

# Trigger rebuild
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --job-type RELEASE \
  --region us-west-1
```

### **If Validation Script Fails**
```bash
# Check AWS CLI access
aws sts get-caller-identity

# Verify region is correct
aws configure get region  # Should be us-west-1

# Test Amplify access
aws amplify list-apps --region us-west-1
```

---

## 📊 Monitoring & Alerting

### **Environment Drift Detection**
```bash
# Daily validation (recommended)
npm run validate:prod:deployment

# Weekly comprehensive audit
npm run audit:prod:aws
npm run analyze:prod:audit
```

### **Health Check Script**
```bash
#!/bin/bash
# scripts/daily-health-check.sh

echo "🏥 Daily Production Health Check"

# Check environment variables
npm run validate:prod:deployment --quiet

# Check recent builds
aws amplify list-jobs \
  --app-id d200k2wsaf8th3 \
  --branch-name prod-v2 \
  --max-items 1 \
  --region us-west-1

# Check site accessibility
curl -s -o /dev/null -w "%{http_code}" https://d200k2wsaf8th3.amplifyapp.com/
```

### **Automated Monitoring Setup**
```bash
# CloudWatch alarm for build failures
aws cloudwatch put-metric-alarm \
  --alarm-name "Amplify-Production-Build-Failures" \
  --alarm-description "Alert on production build failures" \
  --metric-name "Build" \
  --namespace "AWS/Amplify" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --region us-west-1
```

---

## 🎯 Best Practices

### **Deployment Workflow**
1. **Always** run validation before deployment
2. **Never** skip environment variable checks
3. **Always** test production config locally first
4. **Monitor** builds and verify post-deployment
5. **Document** any configuration changes

### **Team Guidelines**
- **Environment Variables**: Never modify directly in AWS console
- **Deployments**: Always use protected deployment scripts
- **Testing**: Validate locally before AWS deployment
- **Monitoring**: Check health daily, audit weekly

### **Emergency Procedures**
- **Immediate Issue**: Use auto-fix validation script
- **Persistent Problems**: Escalate with audit results
- **Rollback**: Deploy previous working commit
- **Recovery**: Document root cause and update protection

---

## 📚 Related Documentation

- **Troubleshooting**: `docs/07-operations/production-environment-troubleshooting.md`
- **AWS Configuration**: `docs/09-migration/aws-configuration-guide.md`
- **Deployment Procedures**: `docs/06-deployment/enterprise-deployment-procedures.md`
- **Lambda Validation**: `docs/07-operations/lambda-functions-validation.md`

---

*Last Updated: July 26, 2025 - Deployment protection system implemented after S3 URL fix ✅*
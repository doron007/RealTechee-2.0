# Environment Variable Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting procedures for environment variable issues in AWS Amplify Gen 2 deployments, covering the modern dynamic mapping architecture implemented in August 2025.

## Architecture Overview

### Environment Variable Flow Chain

```
AWS Amplify Console Environment Variables
            ↓
.env.staging / .env.production (build-time resolution)
            ↓
Next.js Build Process (NEXT_PUBLIC_* injection)
            ↓
Client Runtime Configuration
            ↓
Browser Console (Environment Config object)
```

### Current Architecture Pattern

**Modern Dynamic Mapping** (Current):
```bash
# .env.staging
NEXT_PUBLIC_BACKEND_SUFFIX=${BACKEND_SUFFIX}
NEXT_PUBLIC_GRAPHQL_URL=${GRAPHQL_URL}
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://${S3_BUCKET}.s3.us-west-1.amazonaws.com
NEXT_PUBLIC_ENVIRONMENT=${NODE_ENV}
```

**Legacy Build-Time Injection** (Deprecated):
```yaml
# amplify.yml (removed approach)
- echo "NEXT_PUBLIC_BACKEND_SUFFIX=$BACKEND_SUFFIX" >> .env.production
```

## Common Issues & Solutions

### 1. Environment Display Shows Wrong Environment

#### Symptom
```javascript
🧩 Environment Config (client) {
  environment: 'staging',     // ❌ Wrong
  build: {nodeEnv: 'production'}  // ✅ Correct
}
```

#### Root Cause
Missing or incorrect `NODE_ENV` override in AWS Amplify Console.

#### Solution
**AWS Amplify Console Configuration**:
```
All branches:     NODE_ENV = staging
production:       NODE_ENV = production  (override)
```

#### Verification Commands
```bash
# Check AWS Amplify environment variables
aws amplify get-app --app-id d200k2wsaf8th3

# Verify environment resolution during build
grep -r "NEXT_PUBLIC_ENVIRONMENT" .env.*
```

### 2. S3 Image Loading 400 Errors

#### Symptom
```
GET /_next/image?url=https%3A%2F%2Famplify-bucket-name.s3.amazonaws.com%2Fimage.jpg 400 (Bad Request)
```

#### Root Cause
Missing S3 bucket hostname in Next.js image remote patterns.

#### Diagnosis Steps
```bash
# 1. Check if S3 URL works directly
curl -I "https://amplify-bucket-name.s3.us-west-1.amazonaws.com/path/image.jpg"

# 2. Verify Next.js configuration
grep -A 20 "remotePatterns" next.config.js

# 3. Check browser console for exact S3 bucket name
# Look for: storage.publicBaseUrl
```

#### Solution Template
```javascript
// next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'EXACT_S3_BUCKET_NAME_FROM_CONSOLE.s3.us-west-1.amazonaws.com'
    }
  ]
}
```

### 3. Missing Environment Variables

#### Symptom
```javascript
🧩 Environment Config (client) {
  backendSuffix: undefined,
  graphqlUrl: undefined
}
```

#### Diagnosis Checklist
```bash
# 1. Verify AWS Amplify Console has required variables
echo "Required variables:"
echo "- BACKEND_SUFFIX"
echo "- GRAPHQL_URL" 
echo "- S3_BUCKET"
echo "- USER_POOL_ID"
echo "- USER_POOL_CLIENT_ID"

# 2. Check .env file variable mapping
cat .env.staging | grep -E "(BACKEND_SUFFIX|GRAPHQL_URL)"

# 3. Verify build-time resolution
# Check Amplify build logs for variable substitution
```

#### Solution Steps
1. **Add missing variables** in AWS Amplify Console
2. **Trigger fresh deployment** with version bump
3. **Verify resolution** in browser console

### 4. Backend Suffix Mismatch

#### Symptom
```
DynamoDB table not found: TableName-wrongsuffix-NONE
```

#### Environment-Specific Expected Values
```bash
# Development (local sandbox)
BACKEND_SUFFIX=fvn7t5hbobaxjklhrqzdl4ac34

# Staging (shared with main)
BACKEND_SUFFIX=irgzgwsfnzba3fqtum5k2eyp4m

# Production (isolated)
BACKEND_SUFFIX=yk6ecaswg5aehjn3ev76xzpbfe
```

#### Verification Commands
```bash
# Check current environment suffix
aws dynamodb list-tables --region us-west-1 | grep -E "(Contact|Project|Request)"

# Verify Amplify environment variables
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name production
```

## Troubleshooting Procedures

### Procedure 1: Complete Environment Variable Audit

```bash
#!/bin/bash
# Environment Variable Audit Script

echo "=== AWS Amplify Environment Variables ==="
aws amplify get-app --app-id d200k2wsaf8th3

echo "=== Local Environment Files ==="
for env_file in .env.development .env.staging .env.production; do
  echo "--- $env_file ---"
  if [ -f "$env_file" ]; then
    grep -E "NEXT_PUBLIC_" "$env_file" | head -10
  else
    echo "File not found"
  fi
done

echo "=== Next.js Image Configuration ==="
grep -A 30 "images:" next.config.js

echo "=== DynamoDB Tables (Current Environment) ==="
aws dynamodb list-tables --region us-west-1 | grep -E "(Contact|Project|Request)" | head -5
```

### Procedure 2: Fresh Deployment Trigger

When environment variables are updated in AWS Amplify Console:

```bash
#!/bin/bash
# Trigger fresh deployment to pick up new environment variables

echo "1. Bump version to trigger fresh build"
npm version patch

echo "2. Deploy through all environments"
git add package.json
git commit -m "chore: trigger fresh deployment for environment variable updates"
git push origin main

git checkout staging && git merge main && git push origin staging
git checkout production && git merge staging && git push origin production

echo "3. Monitor deployment status"
echo "Staging: https://staging.d200k2wsaf8th3.amplifyapp.com"
echo "Production: https://realtechee.com"
```

### Procedure 3: Image Loading Diagnosis

```bash
#!/bin/bash
# Diagnose image loading issues

echo "=== Testing S3 Direct Access ==="
S3_BUCKET=$(aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name production --query 'branch.environmentVariables.S3_BUCKET' --output text)
echo "Production S3 Bucket: $S3_BUCKET"

# Test direct S3 access
curl -I "https://$S3_BUCKET.s3.us-west-1.amazonaws.com/assets/properties/test-property/images/gallery-001.jpg"

echo "=== Next.js Remote Patterns Check ==="
grep -A 20 "remotePatterns" next.config.js | grep "$S3_BUCKET" && echo "✅ Found" || echo "❌ Missing"

echo "=== Browser Console Verification ==="
echo "Check browser console for:"
echo "🧩 Environment Config (client)"
echo "storage.publicBaseUrl should match S3_BUCKET"
```

## Performance Optimization

### Environment Variable Caching Strategy

**Browser Level**:
- Environment config cached in sessionStorage
- 24-hour TTL for configuration objects
- Automatic refresh on version change

**CDN Level**:
- Next.js build artifacts cached at edge
- Environment-specific bundles
- Automatic cache invalidation on deployment

**Application Level**:
```javascript
// Client-side environment config caching
const getEnvironmentConfig = () => {
  const cached = sessionStorage.getItem('environmentConfig');
  const version = process.env.NEXT_PUBLIC_VERSION;
  
  if (cached) {
    const { data, version: cachedVersion } = JSON.parse(cached);
    if (cachedVersion === version) return data;
  }
  
  // Fetch fresh config and cache
  const config = buildEnvironmentConfig();
  sessionStorage.setItem('environmentConfig', JSON.stringify({
    data: config,
    version,
    timestamp: Date.now()
  }));
  
  return config;
};
```

## Monitoring & Alerting

### Key Metrics to Monitor

**Environment Variable Health**:
- Build success rate by environment
- Variable resolution failures
- Environment mismatch incidents

**Performance Metrics**:
- Build time with/without validation
- Environment config load time
- Image optimization success rate

### Alert Thresholds

```yaml
# CloudWatch Alarms Configuration
EnvironmentVariableAlerts:
  BuildFailureRate:
    threshold: "> 5% failures in 10 minutes"
    action: "SNS notification to ops team"
  
  EnvironmentMismatch:
    threshold: "Backend suffix != expected value"
    action: "Immediate notification + auto-rollback"
  
  ImageLoadingFailures:
    threshold: "> 10% 400 errors on /_next/image"
    action: "Check S3 bucket configuration"
```

## Related Documentation

- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)** - Main deployment procedures
- **[Environment Variables Documentation](../00-overview/environment-variables.md)** - Variable specifications
- **[Production Monitoring Setup](./production-monitoring.md)** - Monitoring configuration
- **[Operational Procedures](./operational-procedures.md)** - General maintenance procedures

## Emergency Contacts & Escalation

### Incident Response Priority Matrix

| Issue Type | Severity | Response Time | Escalation Path |
|------------|----------|---------------|-----------------|
| Production environment mismatch | Critical | < 5 minutes | Immediate rollback → CEO notification |
| Staging build failures | High | < 15 minutes | Development team → DevOps lead |
| Image loading issues | Medium | < 30 minutes | Frontend team → Infrastructure team |
| Development env issues | Low | < 2 hours | Development team self-service |

### Rollback Decision Tree

```
Environment Variable Issue Detected
                ↓
        Affects Production? → Yes → Immediate rollback to last known good deployment
                ↓ No
        Affects User Experience? → Yes → Deploy hotfix within 1 hour
                ↓ No
        Document issue → Schedule fix for next deployment window
```

---

**Last Updated**: August 14, 2025  
**Version**: 4.2.2  
**Status**: Production Ready - Comprehensive Environment Variable Troubleshooting ✅
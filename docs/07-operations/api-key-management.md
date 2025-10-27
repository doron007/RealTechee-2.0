# AWS AppSync API Key Management Guide

## Overview

Complete guide for managing AWS AppSync API keys across RealTechee environments using CloudFormation-managed keys with 365-day expiration and automated monitoring.

**Key Points:**
- API keys expire every **365 days** (configured via CloudFormation)
- CloudFormation automatically creates and manages keys
- Automated daily monitoring sends alerts 30 days before expiration
- Manual renewal process only needed once per year

---

## Table of Contents

1. [Architecture](#architecture)
2. [Automated Monitoring System](#automated-monitoring-system)
3. [API Key Renewal Process](#api-key-renewal-process)
4. [Troubleshooting](#troubleshooting)
5. [Reference Information](#reference-information)

---

## Architecture

### CloudFormation-Managed Keys

**Configuration File:** `amplify/data/resource.ts`

```typescript
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 365  // Full year expiration
    }
  }
});
```

**How It Works:**
1. CloudFormation automatically creates API keys based on `expiresInDays: 365` setting
2. When you deploy, CloudFormation generates a new key valid for 365 days
3. You sync the CloudFormation-generated key to Amplify environment variables
4. Frontend uses key from environment variables during build (baked into `amplify_outputs.json`)
5. No manual key creation needed - CloudFormation manages the lifecycle

**Critical Understanding:**
- **Backend Layer**: CloudFormation creates API keys in AppSync
- **Frontend Layer**: Amplify environment variables configure which key to use
- **Both layers must be synced** for the system to work correctly

### Environment Architecture

- **Production**: CloudFormation-managed, 365-day keys
- **Staging**: CloudFormation-managed, 365-day keys
- **Local Dev**: Uses sandbox environment configuration

---

## Automated Monitoring System

### Components

**1. Lambda Function**
- **Name**: `realtechee-api-key-monitor`
- **Runtime**: Node.js 20.x
- **Region**: us-west-1
- **Schedule**: Daily at midnight UTC (5:00 PM PST / 4:00 PM PDT)
- **Function ARN**: `arn:aws:lambda:us-west-1:403266990862:function:realtechee-api-key-monitor`
- **Code Location**: `lambda/api-key-monitor/index.js`

**2. EventBridge Rule**
- **Name**: `realtechee-daily-api-key-check`
- **Schedule**: `cron(0 0 * * ? *)` (Daily at 00:00 UTC)
- **Target**: Lambda function above

**3. SNS Topic**
- **Name**: `realtechee-api-key-expiration-alerts`
- **Topic ARN**: `arn:aws:sns:us-west-1:403266990862:realtechee-api-key-expiration-alerts`
- **Subscriptions**: it@realtechee.com, info@realtechee.com

**4. IAM Role**
- **Name**: `realtechee-api-key-monitor-role`
- **Permissions**: Read AppSync APIs, List API keys, Publish SNS, CloudWatch Logs

### Alert Thresholds

- **🚨 CRITICAL**: 7 days or less until expiration (or already expired)
- **⚠️ WARNING**: 8-30 days until expiration
- **✅ OK**: More than 30 days until expiration (no alert sent)

### Email Notifications

Automated emails include:
1. **Subject**: Severity indicator (🚨 URGENT or ⚠️ WARNING)
2. **Alert Details**: Which API, days until expiration, exact expiration date
3. **Renewal Instructions**: Complete step-by-step CLI commands
4. **Verification Steps**: How to test and deploy the new key

**Email Subscription Setup:**

You must confirm email subscriptions to receive alerts:

1. Check inbox at `it@realtechee.com` and `info@realtechee.com`
2. Look for AWS SNS subscription confirmation emails
3. Click "Confirm subscription" link in each email

**Check subscription status:**
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-west-1:403266990862:realtechee-api-key-expiration-alerts \
  --region us-west-1
```

**Add more recipients:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-west-1:403266990862:realtechee-api-key-expiration-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-west-1
```

### Manual Testing

**Test monitoring function:**
```bash
aws lambda invoke \
  --function-name realtechee-api-key-monitor \
  --region us-west-1 \
  /tmp/test-output.json

cat /tmp/test-output.json
```

**Check function logs:**
```bash
aws logs tail /aws/lambda/realtechee-api-key-monitor \
  --region us-west-1 \
  --since 5m \
  --follow
```

**Send test email:**
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-west-1:403266990862:realtechee-api-key-expiration-alerts \
  --subject "Test Alert" \
  --message "This is a test of the API key monitoring system" \
  --region us-west-1
```

### Monitoring Maintenance

**Update Lambda function code:**
```bash
cd lambda/api-key-monitor
zip -r function.zip index.js package.json
aws lambda update-function-code \
  --function-name realtechee-api-key-monitor \
  --zip-file fileb://function.zip \
  --region us-west-1
```

**Disable alerts temporarily:**
```bash
aws events disable-rule \
  --name realtechee-daily-api-key-check \
  --region us-west-1
```

**Re-enable alerts:**
```bash
aws events enable-rule \
  --name realtechee-daily-api-key-check \
  --region us-west-1
```

**Cost estimate:**
- Lambda: ~$0.00/month (free tier)
- EventBridge: $0.00 (free tier)
- SNS: ~$0.00/month (free tier)
- CloudWatch Logs: ~$0.01/month
- **Total: ~$0.01/month**

---

## API Key Renewal Process

### When to Renew

You'll receive automated alerts 30 days before expiration. With 365-day keys, renewal is only needed **once per year**.

### Monitored APIs

**Production API:**
- API ID: `yk6ecaswg5aehjn3ev76xzpbfe`
- Endpoint: `https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql`
- Website: www.realtechee.com

**Development/Staging API:**
- API ID: `fvn7t5hbobaxjklhrqzdl4ac34`
- Endpoint: `https://yq2katnwbbeqjecywrptfgecwa.appsync-api.us-west-1.amazonaws.com/graphql`
- Websites: staging.realtechee.com + local development

### Renewal Steps

#### Step 1: List CloudFormation-Managed Keys

```bash
# Production
aws appsync list-api-keys --api-id yk6ecaswg5aehjn3ev76xzpbfe --region us-west-1

# Staging
aws appsync list-api-keys --api-id fvn7t5hbobaxjklhrqzdl4ac34 --region us-west-1
```

Identify the key with CloudFormation-generated description (typically starts with "Amplify" or has no description).

#### Step 2: Update Amplify Environment Variables

**CRITICAL:** You must pass ALL existing environment variables, not just API_KEY. The command REPLACES all variables.

**Production:**
```bash
# First, get current variables
aws amplify get-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --region us-west-1 \
  --query 'branch.environmentVariables'

# Update with ALL variables + new API_KEY + new expiration date
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --environment-variables '{"API_KEY":"<CLOUDFORMATION_KEY>","API_KEY_EXPIRATION":"<NEW_DATE>","BACKEND_SUFFIX":"...","GRAPHQL_URL":"...","IDENTITY_POOL_ID":"...","NODE_ENV":"production","S3_BUCKET":"...","USER_POOL_CLIENT_ID":"...","USER_POOL_ID":"..."}' \
  --region us-west-1
```

**Staging:**
```bash
# Get current variables
aws amplify get-app \
  --app-id d200k2wsaf8th3 \
  --region us-west-1 \
  --query 'app.environmentVariables'

# Update with ALL variables
aws amplify update-app \
  --app-id d200k2wsaf8th3 \
  --environment-variables '{"AMPLIFY_APP_ID":"...","API_KEY":"<CLOUDFORMATION_KEY>","API_KEY_EXPIRATION":"<NEW_DATE>","BACKEND_SUFFIX":"...","GA_MEASUREMENT_ID":"...","GRAPHQL_URL":"...","IDENTITY_POOL_ID":"...","NODE_ENV":"staging","NODE_OPTIONS":"...","S3_BUCKET":"...","SITE_URL":"...","USER_POOL_CLIENT_ID":"...","USER_POOL_ID":"..."}' \
  --region us-west-1
```

**Why this is critical:**
- Amplify Gen 2 apps use environment variables during build
- API key gets baked into `amplify_outputs.json` at build time
- Frontend code uses the hardcoded key from the build
- Without updating env vars, deployments will use the old key!

#### Step 3: Trigger Redeploy

```bash
# Production
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --job-type RELEASE \
  --region us-west-1

# Staging
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name staging \
  --job-type RELEASE \
  --region us-west-1
```

#### Step 4: Monitor Deployment

```bash
# Production (replace <JOB_ID> with job ID from step 3)
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --job-id <JOB_ID> \
  --region us-west-1

# Staging
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name staging \
  --job-id <JOB_ID> \
  --region us-west-1
```

Deployments typically take ~15 minutes.

#### Step 5: Verify Environments

**Production:** https://www.realtechee.com/projects
**Staging:** https://staging.realtechee.com/projects

Verification checklist:
- Open browser DevTools → Network tab
- Verify GraphQL requests return 200 OK
- Confirm projects are loading correctly
- Check for any authentication errors in console

#### Step 6: Delete Old API Keys

After verifying the new key works, delete old keys to prevent false alerts:

```bash
# List current keys
aws appsync list-api-keys --api-id <API_ID> --region us-west-1

# Delete old key (copy ID from above)
aws appsync delete-api-key \
  --api-id <API_ID> \
  --id <OLD_KEY_ID> \
  --region us-west-1
```

**Example for RealTechee:**
```bash
# Production
aws appsync list-api-keys --api-id yk6ecaswg5aehjn3ev76xzpbfe --region us-west-1
aws appsync delete-api-key --api-id yk6ecaswg5aehjn3ev76xzpbfe --id <OLD_KEY_ID> --region us-west-1

# Staging
aws appsync list-api-keys --api-id fvn7t5hbobaxjklhrqzdl4ac34 --region us-west-1
aws appsync delete-api-key --api-id fvn7t5hbobaxjklhrqzdl4ac34 --id <OLD_KEY_ID> --region us-west-1
```

**Why this matters:**
- AWS keeps old keys active even after creating new ones
- Automated monitoring will alert about old expired keys
- Deleting old keys keeps the system clean and alerts accurate

---

## Troubleshooting

### Diagnostics

**Check API key expiration:**
```bash
# List all GraphQL APIs
aws appsync list-graphql-apis --region us-west-1

# Check specific API's keys
aws appsync list-api-keys --api-id <API_ID> --region us-west-1
```

**Test GraphQL endpoint:**
```bash
curl -X POST <GRAPHQL_URL> \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"query":"query { listProjects(limit: 3) { items { id title } } }"}'
```

### Common Issues

**Problem:** Production website shows 401 Unauthorized errors

**Symptoms:**
- Browser DevTools Network tab shows GraphQL requests returning 401
- Error: `UnauthorizedException: You are not authorized to make this call`
- Projects page shows loading state but no data

**Root Cause:**
- AppSync API key has expired
- Frontend using old key (environment variable not updated)

**Solution:**
Follow the renewal process above, ensuring environment variables are updated in Step 2.

**Problem:** Not receiving monitoring emails

**Solutions:**
1. Check SNS subscription status (see command in monitoring section)
2. Confirm email subscriptions via confirmation links
3. Check spam/junk folders
4. Verify SNS topic has correct email addresses

**Problem:** Lambda function errors

**Check recent errors:**
```bash
aws logs tail /aws/lambda/realtechee-api-key-monitor \
  --region us-west-1 \
  --since 1d \
  --filter-pattern "ERROR"
```

### Technical Explanation: Why No Code Changes Are Needed

**Key Concept:** The `amplify_outputs.json` file is generated during build, not committed to git.

**Build Process:**
1. Amplify reads environment variables (including `API_KEY`)
2. Amplify backend CLI processes `amplify/` directory
3. Generates `amplify_outputs.json` with current env var values
4. Frontend build includes this generated file
5. Client-side code uses the API key from `amplify_outputs.json`

**Why This Architecture Works:**
- ✅ Dynamic Configuration: Each build gets fresh config from env vars
- ✅ No Secrets in Git: API keys never committed to repository
- ✅ Zero-Downtime Updates: Just update env vars and redeploy
- ✅ Environment Isolation: Production and staging use different keys automatically

**Flow:**
```
Environment Variables → Build Process → amplify_outputs.json → Frontend Code
```

This means:
- Updating env vars + redeploying = New API key in production
- No code changes required
- No git commits required
- No PR review process required

---

## Reference Information

### Production Details

- **Amplify App ID**: `d200k2wsaf8th3`
- **Region**: `us-west-1`
- **Production Branch**: `production`
- **Staging Branch**: `staging`

### Last Renewal

**Date:** October 26, 2025

**Method:** CloudFormation-managed API key rotation + 365-day expiration configuration

**Production API:**
- API ID: `yk6ecaswg5aehjn3ev76xzpbfe`
- CloudFormation Key: `da2-7fasxrqt5bgf3jcbo6baezztg4`
- Expires: October 26, 2026 at 09:00 PM PDT (365 days)
- Logical ID: `amplifyDataGraphQLAPIDefaultApiKey1C8ED374`
- Environment Variable Updated: ✅
- Deployment Jobs: #73 (Step 1), #74 (Step 2), #75 (env vars), #76 (365-day config)
- Old Manual Key Deleted: `da2-b42sgbd5unfmtj62yje7zxskae`

**Development/Staging API:**
- API ID: `fvn7t5hbobaxjklhrqzdl4ac34`
- CloudFormation Key: `da2-7ybmtgo33zhupfrxqb46nevnzm`
- Expires: October 26, 2026 at 01:00 PM PDT (365 days)
- Environment Variable Updated: ✅
- Deployment Job: #58 (365-day config)

### CloudFormation State Drift Fix (October 26, 2025)

**Problem:** CloudFormation tracked deleted API key `da2-wwiaod7ylfb7fi3xejucyfbf4y`, causing all deployments to fail.

**Solution:** AWS-documented two-step logical ID override process:

**Step 1 (Job #73):** Override logical ID in `amplify/backend.ts`
```typescript
backend.data.resources.cfnResources.cfnApiKey?.overrideLogicalId(
  `recoverApiKey${new Date().getTime()}`
);
```
- Forces CloudFormation to CREATE new resource (not UPDATE deleted one)
- Result: New key created with timestamped logical ID

**Step 2 (Job #74):** Remove override and redeploy
- CloudFormation creates ANOTHER new key with default logical ID
- Returns to normal CloudFormation management
- Result: Production now uses CloudFormation-managed key

**Lesson Learned:**
When API keys are manually deleted, CloudFormation state drift occurs. The AWS-documented solution is the logical ID override technique, NOT manual key creation. Future renewals use the `expiresInDays` setting in `amplify/data/resource.ts` to let CloudFormation manage rotation automatically.

### Historical Context: Deprecated Script

**File:** `update_api_key.sh` (REMOVED October 26, 2025)

**Why removed:**
The script created manual API keys using `aws appsync create-api-key`, which bypassed CloudFormation's automatic key management. This caused state drift where CloudFormation managed one key but the system used another, leading to deployment failures.

**What to use instead:**
The CloudFormation-managed renewal process documented above. Since keys now last 365 days, manual renewal is only needed once per year following a simple 4-step process.

### Related Files

- `amplify/data/resource.ts` - Contains `expiresInDays: 365` setting
- `amplify/backend.ts` - CloudFormation infrastructure configuration
- `lambda/api-key-monitor/index.js` - Automated monitoring Lambda function
- `services/business/enhancedProjectsService.ts` - GraphQL client initialization

---

**Last Updated:** October 26, 2025
**Next Renewal:** October 2026 (automated alerts will notify 30 days prior)

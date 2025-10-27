# AWS AppSync API Key Renewal Guide

## Problem
Production website stops loading projects with 401 Unauthorized error due to expired AppSync API key.

## Symptoms
- Browser DevTools Network tab shows GraphQL requests returning 401
- Error: `UnauthorizedException: You are not authorized to make this call`
- Projects page shows loading state but no data

## Root Cause
AppSync API keys expire by default after 7 days (max 365 days).

**CRITICAL UNDERSTANDING:**
- There are TWO layers: **Backend API keys** (AppSync) and **Frontend configuration** (Amplify env vars)
- Backend keys authenticate GraphQL requests
- Frontend gets the API key from Amplify environment variables during build
- You must update BOTH: Create new AppSync key AND update Amplify environment variable
- Forgetting to update env vars means frontend uses old deleted key → 401 errors

## Diagnostic Commands

### 1. Check API Key Expiration
```bash
# List all GraphQL APIs
aws appsync list-graphql-apis --region us-west-1

# Check specific API's keys
aws appsync list-api-keys --api-id <API_ID> --region us-west-1
```

### 2. Test GraphQL Endpoint
```bash
curl -X POST <GRAPHQL_URL> \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"query":"query { listProjects(limit: 3) { items { id title } } }"}'
```

## Fix Procedure

### Quick Fix (Recommended): Use Automated Script

**Easiest method** - Run the automated renewal script from the project root:

```bash
./update_api_key.sh
```

This script automatically:
1. Creates new API keys for both environments (365-day expiration)
2. Tests the new keys
3. Updates Amplify environment variables (preserving all existing vars)
4. Triggers production and staging deployments
5. Provides commands to delete old keys after verification

**Why this works:**
- Amplify Gen 2 generates `amplify_outputs.json` during each build
- Environment variables are read at build time and baked into the outputs file
- No code changes needed - just update env vars and redeploy
- The build process automatically picks up the new API key

Continue to manual steps below if you need to understand the process or customize it.

---

### Manual Step-by-Step Procedure

### Step 1: Create New API Key (365-day expiration)
```bash
aws appsync create-api-key \
  --api-id <API_ID> \
  --description "Production API Key - $(date +%Y-%m-%d)" \
  --expires $(date -u -v+365d +%s) \
  --region us-west-1
```

### Step 2: Test New Key
```bash
curl -X POST <GRAPHQL_URL> \
  -H "x-api-key: <NEW_API_KEY>" \
  -d '{"query":"query { listProjects(limit: 1) { items { id } } }"}'
```

### Step 3: Update Amplify Environment Variable (CRITICAL!)
**This is the most important step!** The frontend uses the API key from Amplify environment variables, not directly from AppSync.

**IMPORTANT:** You must pass ALL existing environment variables, not just API_KEY. The command REPLACES all variables.

```bash
# First, get current production variables
aws amplify get-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --region us-west-1 \
  --query 'branch.environmentVariables'

# Update production with ALL variables + new API_KEY + new expiration
# Example (update the JSON with actual values):
aws amplify update-branch \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --environment-variables '{"API_KEY":"<NEW_API_KEY>","API_KEY_EXPIRATION":"October 26, 2026 at 12:00 PM PDT","BACKEND_SUFFIX":"...","GRAPHQL_URL":"...","IDENTITY_POOL_ID":"...","NODE_ENV":"production","S3_BUCKET":"...","USER_POOL_CLIENT_ID":"...","USER_POOL_ID":"..."}' \
  --region us-west-1

# Get current All branches (staging) variables
aws amplify get-app \
  --app-id d200k2wsaf8th3 \
  --region us-west-1 \
  --query 'app.environmentVariables'

# Update All branches with ALL variables + new API_KEY + new expiration
aws amplify update-app \
  --app-id d200k2wsaf8th3 \
  --environment-variables '{"AMPLIFY_APP_ID":"...","API_KEY":"<NEW_API_KEY>","API_KEY_EXPIRATION":"October 26, 2026 at 12:00 PM PDT","BACKEND_SUFFIX":"...","GA_MEASUREMENT_ID":"...","GRAPHQL_URL":"...","IDENTITY_POOL_ID":"...","NODE_ENV":"staging","NODE_OPTIONS":"...","S3_BUCKET":"...","SITE_URL":"...","USER_POOL_CLIENT_ID":"...","USER_POOL_ID":"..."}' \
  --region us-west-1
```

**Why this is critical:**
- Amplify Gen 2 apps use environment variables during build
- The API key gets baked into `amplify_outputs.json` at build time
- Frontend code uses the hardcoded key from the build
- Without updating env vars, deployments will use the old deleted key!

### Step 4: Trigger Production Redeploy
```bash
aws amplify start-job \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --job-type RELEASE \
  --region us-west-1
```

### Step 5: Monitor Deployment (~15 minutes)
```bash
aws amplify get-job \
  --app-id d200k2wsaf8th3 \
  --branch-name production \
  --job-id <JOB_ID> \
  --region us-west-1
```

### Step 6: Verify Production
- Open https://www.realtechee.com/projects
- Check browser DevTools → Network tab
- Verify GraphQL requests return 200 OK
- Confirm projects are loading

### Step 7: Delete Old API Keys (IMPORTANT)
After verifying the new key works, delete the old expired keys to prevent false alerts:

```bash
# List current keys to identify old ones
aws appsync list-api-keys --api-id <API_ID> --region us-west-1

# Delete old key (copy the ID from above)
aws appsync delete-api-key \
  --api-id <API_ID> \
  --id <OLD_KEY_ID> \
  --region us-west-1
```

**Example for RealTechee:**
```bash
# Production API
aws appsync list-api-keys --api-id yk6ecaswg5aehjn3ev76xzpbfe --region us-west-1
aws appsync delete-api-key --api-id yk6ecaswg5aehjn3ev76xzpbfe --id <OLD_KEY_ID> --region us-west-1

# Development/Staging API
aws appsync list-api-keys --api-id fvn7t5hbobaxjklhrqzdl4ac34 --region us-west-1
aws appsync delete-api-key --api-id fvn7t5hbobaxjklhrqzdl4ac34 --id <OLD_KEY_ID> --region us-west-1
```

**Why this matters:**
- AWS keeps old keys active even after creating new ones
- Automated monitoring will alert about old expired keys
- Deleting old keys keeps the system clean and alerts accurate

## Technical Explanation: Why No Code Changes Are Needed

### How Amplify Gen 2 Handles API Keys

**Key Concept:** The `amplify_outputs.json` file is **generated during build**, not committed to git.

**Build Process:**
1. Amplify reads environment variables (including `API_KEY`)
2. Amplify backend CLI processes `amplify/` directory
3. Generates `amplify_outputs.json` with current env var values
4. Frontend build includes this generated file
5. Client-side code uses the API key from `amplify_outputs.json`

**Why This Architecture Works:**
- ✅ **Dynamic Configuration**: Each build gets fresh config from env vars
- ✅ **No Secrets in Git**: API keys never committed to repository
- ✅ **Zero-Downtime Updates**: Just update env vars and redeploy
- ✅ **Environment Isolation**: Production and staging use different keys automatically

**Critical Understanding:**
```
Environment Variables → Build Process → amplify_outputs.json → Frontend Code
```

This means:
- Updating env vars + redeploying = New API key in production
- No code changes required
- No git commits required
- No PR review process required

**Verification:**
```bash
# The file is never in git:
git ls-files | grep amplify_outputs.json  # Returns nothing

# It's generated fresh each build by reading:
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name production --query 'branch.environmentVariables.API_KEY'
```

## Prevention
- Set API key expiration to 365 days (maximum)
- Use automated monitoring (already set up - see `docs/api-key-monitoring-setup.md`)
- Use `update_api_key.sh` script for renewals (no manual steps needed)

## Related Files
- **`update_api_key.sh`** - Automated renewal script (recommended method)
- **`docs/update-api-key-script.md`** - Script usage guide and troubleshooting
- **`docs/api-key-monitoring-setup.md`** - Monitoring system documentation
- `amplify/data/resource.ts` - Schema with `allow.publicApiKey()` authorization
- `amplify_outputs.json` - Generated during build (not in git)
- `services/business/enhancedProjectsService.ts` - GraphQL client initialization
- `lambda/api-key-monitor/index.js` - Automated monitoring Lambda function

## RealTechee Production Details
- App ID: `d200k2wsaf8th3`
- Region: `us-west-1`
- Production Branch: `production`
- API Endpoint: `https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql`

## Last Renewal
- Date: October 26, 2025
- **Method**: CloudFormation-managed API key rotation (AWS-documented two-step process)
- **Production API**:
  - API ID: `yk6ecaswg5aehjn3ev76xzpbfe`
  - CloudFormation Key: `da2-7fasxrqt5bgf3jcbo6baezztg4`
  - Expires: November 25, 2025 at 04:00 PM PST (30 days)
  - Logical ID: `amplifyDataGraphQLAPIDefaultApiKey1C8ED374`
  - Environment Variable Updated: ✅
  - Deployment Jobs: #73 (Step 1), #74 (Step 2), #75 (env vars)
  - Old Manual Key Deleted: `da2-b42sgbd5unfmtj62yje7zxskae`
- **Development/Staging API**:
  - API ID: `fvn7t5hbobaxjklhrqzdl4ac34`
  - Manual Key: `da2-7ybmtgo33zhupfrxqb46nevnzm`
  - Expires: October 26, 2026
  - Environment Variable Updated: ✅
  - Note: Staging still using manual key (no CloudFormation management)

## CloudFormation State Drift Fix (October 26, 2025)

**Problem**: CloudFormation tracked deleted API key `da2-wwiaod7ylfb7fi3xejucyfbf4y`, causing all deployments to fail.

**Solution**: AWS-documented two-step logical ID override process:

1. **Step 1 (Job #73)**: Override logical ID in `amplify/backend.ts`
   ```typescript
   backend.data.resources.cfnResources.cfnApiKey?.overrideLogicalId(
     `recoverApiKey${new Date().getTime()}`
   );
   ```
   - Forces CloudFormation to CREATE new resource (not UPDATE deleted one)
   - Result: New key created with timestamped logical ID

2. **Step 2 (Job #74)**: Remove override and redeploy
   - CloudFormation creates ANOTHER new key with default logical ID
   - Returns to normal CloudFormation management
   - Result: Production now uses CloudFormation-managed key

**Lesson Learned:**
When API keys are manually deleted, CloudFormation state drift occurs. The AWS-documented solution is the logical ID override technique, NOT manual key creation. Future renewals should use the `expiresInDays` setting in `amplify/data/resource.ts` to let CloudFormation manage rotation automatically.

# Deployment Architecture - Preventing Merge Conflicts

## Problem Solved

**Previous Issue**: Deployment scripts committed environment-specific configurations to git branches, causing permanent branch divergence and inevitable merge conflicts on subsequent deployments.

**Root Cause**: 
- `deploy-staging.sh` committed staging config to `prod` branch → `prod` ahead of `main`
- `deploy-production.sh` committed production config to `prod-v2` branch → `prod-v2` ahead of `prod`
- Each deployment made target branches diverge from source branches
- Future deployments failed with merge conflicts in `amplify_outputs.json`

## Solution: Temporary Commit Pattern

**Core Principle**: Never permanently commit environment-specific configurations to git branches.

### New Architecture Flow

**Staging Deployment (`deploy-staging.sh`):**
1. ✅ `main` → `prod` (clean merge - branches synchronized)
2. ✅ Switch to staging config locally
3. ✅ **Temporary commit** staging config to `prod`
4. ✅ Push `prod` to trigger Amplify deployment
5. ✅ **Immediately revert** temporary commit locally
6. ✅ `prod` branch stays synchronized with `main`

**Production Deployment (`deploy-production.sh`):**
1. ✅ Generate auto-generated files via `ampx sandbox`
2. ✅ **Temporary commit** auto-generated files to staging branch
3. ✅ Push staging branch, then **immediately revert**
4. ✅ `prod` → `prod-v2` (clean merge - branches synchronized)
5. ✅ Push `prod-v2` to trigger production deployment
6. ✅ All branches remain synchronized

### Key Benefits

1. **Zero Merge Conflicts**: Branches never permanently diverge
2. **Clean Git History**: No environment-specific commits in git
3. **Correct Deployments**: Amplify receives correct configurations
4. **Rollback Safe**: Git history remains clean for rollbacks
5. **Repeatable**: Deployments can be run multiple times without conflicts

## Technical Implementation

### Temporary Commit Pattern
```bash
# Apply environment config
./scripts/switch-environment.sh staging

# Create temporary commit for deployment
git add amplify_outputs.json
git commit -m "TEMP: staging config for deployment - will be reverted"

# Deploy (triggers Amplify build with correct config)
git push origin prod

# IMMEDIATELY revert to prevent divergence
git reset --hard HEAD~1
```

### Branch Synchronization Verification
```bash
# Before deployment
git rev-parse main
git rev-parse prod
# → Should be identical

# After deployment  
git rev-parse main
git rev-parse prod
# → Should still be identical
```

## Deployment Workflow

### Staging Deployment
```bash
./scripts/deploy-staging.sh [--dry-run]
```
- ✅ Merges `main` → `prod` cleanly
- ✅ Deploys with staging configuration 
- ✅ Maintains branch synchronization

### Production Deployment
```bash
./scripts/deploy-production.sh
```
- ✅ Updates auto-generated files temporarily
- ✅ Merges `prod` → `prod-v2` cleanly
- ✅ Deploys with production configuration
- ✅ Maintains branch synchronization

## Migration Notes

### What Changed
- **deploy-staging.sh**: Replaced permanent config commit with temporary commit+revert
- **deploy-production.sh**: Replaced permanent file commits with temporary commit+revert
- **Branch relationships**: All branches remain synchronized after deployments

### What Stayed The Same
- Environment configuration files (`config/amplify_outputs.*.json`)
- Switch-environment.sh functionality
- Amplify deployment triggers
- Cleanup and restoration logic

## Troubleshooting

### If Merge Conflicts Still Occur
1. **Check branch synchronization**: `git rev-parse main prod prod-v2`
2. **Reset diverged branch**: `git reset --hard <source-branch>`
3. **Force push if needed**: `git push --force-with-lease origin <branch>`

### If Deployment Has Wrong Config
1. **Check local config**: Environment switches correctly applied
2. **Verify Amplify build**: Check Amplify console for deployment status
3. **Re-run deployment**: Scripts are now idempotent and safe to re-run

## Best Practices

1. **Always run dry-run first**: `./scripts/deploy-staging.sh --dry-run`
2. **Verify branch sync**: Check that source and target branches match after deployment
3. **Monitor Amplify console**: Ensure deployments complete successfully
4. **Test environment**: Verify correct configuration is live after deployment

---

*Updated: July 31, 2025 - Merge conflict prevention architecture implemented*
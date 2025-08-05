# AWS Amplify Gen 2 Multi-Environment Deployment

## 🎯 Official AWS Pattern Implementation

This document describes the **official AWS Amplify Gen 2 pattern** for multi-environment deployment that eliminates merge conflicts and config management issues.

## ✅ Problem Solved

**Previous Issue**: Deployment scripts were committing environment-specific `amplify_outputs.json` files to git branches, causing:
- ❌ Permanent branch divergence and merge conflicts  
- ❌ Git history pollution with config changes
- ❌ Risk of deploying wrong environment configurations
- ❌ Complex config switching and rollback procedures

**New Solution**: AWS Amplify Gen 2 **official pattern** where:
- ✅ Zero config files committed to git
- ✅ Build-time config generation using `amplify.yml`
- ✅ Branch-specific configurations via `npx ampx generate outputs`
- ✅ No merge conflicts or branch divergence
- ✅ Official AWS Amplify recommended approach

## 🏗️ Architecture Overview

### Environment Structure
```
Development  → main branch     → d3atadjk90y9q5 (shared backend)
Staging      → prod branch     → d3atadjk90y9q5 (shared backend)  
Production   → prod-v2 branch  → d200k2wsaf8th3 (isolated backend)
```

### Configuration Generation Flow
```
AWS Amplify Build Process:
1. Code checkout from git branch
2. Backend phase: Run amplify.yml backend commands
3. Generate amplify_outputs.json via npx ampx generate outputs
4. Frontend phase: Build with generated config
5. Deploy to AWS infrastructure
```

## 📋 Implementation Details

### 1. amplify.yml Configuration

The `amplify.yml` file defines branch-specific config generation:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        # Generate amplify_outputs.json based on branch/environment
        - echo "🔧 Generating environment-specific amplify_outputs.json"
        - |
          if [ "$AWS_BRANCH" = "main" ]; then
            echo "📍 Development environment (main branch)"
            npx ampx generate outputs --app-id d3atadjk90y9q5 --branch main
          elif [ "$AWS_BRANCH" = "prod" ]; then
            echo "📍 Staging environment (prod branch - shares dev backend)"
            npx ampx generate outputs --app-id d3atadjk90y9q5 --branch main
          elif [ "$AWS_BRANCH" = "prod-v2" ]; then
            echo "📍 Production environment (prod-v2 branch - isolated backend)"
            npx ampx generate outputs --app-id d200k2wsaf8th3 --branch prod-v2
          else
            echo "⚠️  Unknown branch: $AWS_BRANCH, using development config"
            npx ampx generate outputs --app-id d3atadjk90y9q5 --branch main
          fi
        - echo "✅ Environment-specific amplify_outputs.json generated"
```

### 2. Git Configuration

`amplify_outputs.json` is ignored in `.gitignore`:

```gitignore
# AWS Amplify Gen 2: configs generated during build, never commit
amplify_outputs.json
amplify_outputs*.json
```

### 3. Clean Deployment Scripts

#### Staging Deployment (`/deploy-staging`)
- **Script**: `scripts/deploy-staging-clean.sh`
- **Flow**: `main` → `prod` branch
- **Config**: Auto-generated during AWS build
- **Backend**: Shared development infrastructure
- **Zero commits**: No config files modified in git

#### Production Deployment (`/deploy-production`)  
- **Script**: `scripts/deploy-production-clean.sh`
- **Flow**: `prod` → `prod-v2` branch
- **Config**: Auto-generated during AWS build
- **Backend**: Isolated production infrastructure
- **Zero commits**: No config files modified in git

## 🚀 Deployment Commands

### Staging Deployment
```bash
# Claude Code slash command
/deploy-staging

# Direct script execution
./scripts/deploy-staging-clean.sh
```

**Process**:
1. Pre-flight checks (clean git, TypeScript validation)
2. Create release candidate version (e.g., 3.1.5-rc.1)
3. Merge `main` → `prod` branch
4. Push to remote (triggers AWS Amplify build)
5. AWS Amplify generates config via `amplify.yml`
6. Deployment completes with correct staging configuration

### Production Deployment
```bash
# Claude Code slash command  
/deploy-production

# Direct script execution
./scripts/deploy-production-clean.sh
```

**Process**:
1. Comprehensive validation (TypeScript, build test)
2. Promote release candidate to stable (3.1.5-rc.1 → 3.1.5)
3. Production deployment confirmation
4. Merge source → `prod-v2` branch
5. Push to remote (triggers AWS Amplify build)
6. AWS Amplify generates isolated production config
7. Deployment completes with production infrastructure

## ✅ Benefits Achieved

### 1. Zero Merge Conflicts
- **Before**: Config commits caused permanent branch divergence
- **After**: No config commits, branches stay synchronized

### 2. Official AWS Pattern
- **Before**: Custom config switching scripts
- **After**: Standard `npx ampx generate outputs` commands

### 3. Environment Safety
- **Before**: Risk of wrong config deployment
- **After**: Branch-specific auto-generation prevents config errors

### 4. Simplified Management
- **Before**: Complex config file switching and backup/restore
- **After**: Single `amplify.yml` manages all environments

### 5. Git Cleanliness
- **Before**: Git history polluted with config changes
- **After**: Clean git history with only application code

## 🔍 Validation & Testing

### Local Development Testing
```bash
# Test current amplify_outputs.json (should not exist in git)
ls -la amplify_outputs*.json

# Expected: Only backup files, no committed configs
# amplify_outputs.backup.json (temporary, ignored)
```

### Deployment Testing
```bash
# 1. Test staging deployment
/deploy-staging

# 2. Monitor AWS Amplify console for config generation
# 3. Verify staging environment loads correctly
# 4. Test production deployment
/deploy-production

# 5. Verify production isolation and config correctness
```

### Environment Verification
```bash
# Verify amplify_outputs.json is ignored
git status
# Should show: nothing to commit, working tree clean

# Verify no config files in git history
git log --oneline --grep="amplify_outputs"
# Should show: no config-related commits
```

## 📚 Migration Notes

### From Legacy Pattern
If upgrading from the old config-committing pattern:

1. **Remove committed configs**:
   ```bash
   git rm amplify_outputs.json
   git commit -m "Remove committed config - using build-time generation"
   ```

2. **Update `.gitignore`**:
   ```bash
   echo "amplify_outputs.json" >> .gitignore
   echo "amplify_outputs*.json" >> .gitignore
   ```

3. **Use new deployment commands**:
   - Old: `./scripts/deploy-staging.sh` 
   - New: `/deploy-staging` or `./scripts/deploy-staging-clean.sh`

### Branch Cleanup
```bash
# Clean up any diverged branches (if needed)
git checkout main
git branch -D prod prod-v2  # Delete old branches
# New deployments will recreate clean branches
```

## 🛡️ Security & Best Practices

### 1. Environment Isolation
- **Development/Staging**: Shared backend for cost efficiency
- **Production**: Completely isolated infrastructure
- **Config Generation**: Environment-specific during build

### 2. Access Control
- **Development**: Full access for rapid iteration
- **Production**: Protected with confirmation prompts
- **AWS Console**: Monitor all deployments via Amplify console

### 3. Backup Strategy
- **Data Backups**: Automatic before production deployments
- **Config Backups**: No longer needed (build-time generation)
- **Rollback**: Git tags enable instant version rollback

## 📖 References

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Multi-Environment Setup](https://docs.amplify.aws/gen2/deploy-and-host/branch-deployments/)
- [Build Configuration](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)

---

**Implementation Status**: ✅ Complete  
**Pattern Type**: Official AWS Amplify Gen 2  
**Benefits**: Zero merge conflicts, automatic config generation, environment isolation  
**Next Steps**: Test deployment flow and monitor production stability
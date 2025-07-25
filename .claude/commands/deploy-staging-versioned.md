# Deploy to Staging with Versioning

Deploy current changes to staging environment with proper release candidate versioning following SDLC best practices.

## Process:
1. **Version Management**: Create release candidate (e.g., 3.1.2-rc.1) with git tag
2. **Pre-flight Checks**: Verify git status, run type-check, ensure clean working directory  
3. **Environment Validation**: Confirm current environment is development
4. **Branch Operations**: Merge main → prod branch with version tag
5. **Push to Remote**: Trigger automatic Amplify deployment with versioned release
6. **Deployment Verification**: Confirm staging shows correct RC version

## Versioning Strategy:
- **Dev**: `3.1.2-dev.1` (development iterations)
- **Staging**: `3.1.2-rc.1` (release candidates for testing)
- **Production**: `3.1.2` (stable releases only)

## Usage:
Type `/deploy-staging-versioned` in Claude Code to execute this workflow.

---

**Target Environment**: Staging (prod.d3atadjk90y9q5.amplifyapp.com)  
**Versioning**: Automatic RC tagging with git tags  
**Traceability**: Full version correlation between dev/staging/prod  
**Hotfix Support**: Can deploy hotfix versions when needed
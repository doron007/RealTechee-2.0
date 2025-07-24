# Deploy to Staging Environment

Deploy current changes to staging environment by merging main → prod branch, which automatically triggers deployment to `https://prod.d3atadjk90y9q5.amplifyapp.com/`.

## Process:
1. **Pre-flight Checks**: Verify git status, run type-check, ensure clean working directory
2. **Environment Validation**: Confirm current environment is development
3. **Branch Operations**: Merge main → prod branch with fast-forward
4. **Push to Remote**: Trigger automatic Amplify deployment
5. **Deployment Verification**: Confirm staging deployment initiated

## Safety Features:
- No destructive operations (shared dev/staging backend)
- Fast deployment for agile development workflow
- Automatic rollback capability via git reset

## Usage:
Type `/deploy-staging` in Claude Code to execute this deployment workflow.

---

**Target Environment**: Staging (prod.d3atadjk90y9q5.amplifyapp.com)  
**Backend**: Shared with development (RealTechee-2.0 app)  
**Git Flow**: main → prod branch  
**Deployment**: Automatic via Amplify branch connection
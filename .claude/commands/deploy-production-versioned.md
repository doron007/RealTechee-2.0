# Deploy to Production with Versioning

Deploy staging-tested release candidate to production as a stable release following SDLC best practices.

## Process:
1. **RC Validation**: Verify current version is a release candidate (x.x.x-rc.x)
2. **Version Promotion**: Convert RC to stable release (3.1.2-rc.1 → 3.1.2)
3. **Pre-flight Checks**: Verify git status, run type-check, ensure clean working directory
4. **Environment Switch**: Switch to production configuration
5. **Branch Operations**: Merge main → prod-v2 branch with stable version tag
6. **Push to Remote**: Trigger production deployment with stable release
7. **Production Verification**: Confirm production shows correct stable version
8. **Merge Back**: Merge changes back to main branch for consistency

## Versioning Requirements:
- **Must deploy from**: Release candidate (e.g., `3.1.2-rc.1`)
- **Produces**: Stable release (e.g., `3.1.2`)
- **Git Tags**: Creates `v3.1.2` tag for traceability
- **Rollback**: Tagged versions enable quick rollback if needed

## Hotfix Support:
For production issues, use hotfix workflow:
1. `./scripts/version-manager.sh hotfix 3.1.3`
2. Make fixes on hotfix branch
3. Test via `/deploy-staging-versioned`
4. Deploy via `/deploy-production-versioned`

## Usage:
Type `/deploy-production-versioned` in Claude Code to execute this workflow.

---

**Target Environment**: Production (d200k2wsaf8th3.amplifyapp.com)  
**Versioning**: RC → Stable conversion with git tags  
**Safety**: Isolated backend + comprehensive validation  
**Traceability**: Full audit trail with tagged releases
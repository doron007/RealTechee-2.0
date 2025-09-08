# Amplify Deployment Master Guide

**Purpose**: Single source of truth for all AWS Amplify Gen 2 deployment procedures and troubleshooting.

## 🎯 **Quick Reference**

### **Essential Commands**
```bash
# Development
npm run dev:primed          # Local development with Turbopack
npm run type-check          # TypeScript validation (required)
npm run build              # Production build test
npx ampx sandbox           # Deploy backend changes

# Production Deployment
./scripts/backup-data.sh   # MANDATORY before schema changes
git checkout production && git merge staging && git push origin production

# Emergency
./scripts/execute-rollback.sh --version LAST_KNOWN_GOOD
```

### **Environment Status**
- **Production**: `d200k2wsaf8th3.amplifyapp.com` - 1,449+ records
- **Development**: Local sandbox - safe for experimentation
- **Schema**: 43 data models with auto-scaling DynamoDB

## 🏗️ **Architecture Overview**

### **Single-App Multi-Branch Strategy**
```
AWS Amplify App (d200k2wsaf8th3)
├── production branch → d200k2wsaf8th3.amplifyapp.com
├── staging branch → staging-d200k2wsaf8th3.amplifyapp.com  
└── main branch → development (local sandbox)
```

### **Environment Isolation**
- **Complete Separation**: Zero shared resources between environments
- **Data Protection**: Production data completely isolated
- **Schema Synchronization**: Consistent schema across all environments
- **Secret Management**: Environment-specific configuration in Amplify Console

## 🚀 **Deployment Workflows**

### **Standard Development Flow**
```bash
# 1. Feature Development (main branch)
git checkout main
npm run dev:primed
# Develop and test locally

# 2. Stage for Testing
git checkout staging
git merge main
git push origin staging
# Triggers automatic staging deployment

# 3. Production Deployment (after QA)
./scripts/backup-data.sh    # Required safety step
git checkout production
git merge staging
git push origin production
# Triggers automatic production deployment
```

### **Emergency Hotfix Flow**
```bash
# 1. Create hotfix from production
git checkout production
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
# Edit files, test locally

# 3. Deploy immediately
git checkout production
git merge hotfix/critical-fix
git push origin production

# 4. Sync back to other branches
git checkout staging && git merge production
git checkout main && git merge staging
```

## 🔧 **Backend Configuration**

### **Amplify Gen 2 Structure**
```
amplify/
├── backend.ts              # Main backend configuration
├── auth/resource.ts        # Cognito configuration  
├── data/resource.ts        # GraphQL schema (43 models)
├── storage/resource.ts     # S3 configuration
└── functions/              # Lambda functions
```

### **Schema Deployment Process**
```bash
# 1. ALWAYS backup first
./scripts/backup-data.sh

# 2. Test schema changes locally
npx ampx sandbox
# Test all affected functionality

# 3. Deploy to staging
git checkout staging
git push origin staging
# Verify staging works correctly

# 4. Deploy to production
git checkout production  
git push origin production
# Monitor deployment in Amplify Console
```

### **Data Migration Safety**
```typescript
// When adding new fields (safe)
type Request @model {
  id: ID!
  status: String!
  newField: String    // Safe - additive only
}

// When removing fields (DANGEROUS)
// 1. Mark as deprecated first
// 2. Deploy deprecation  
// 3. Update code to not use field
// 4. Remove field in separate deployment
```

## 🔐 **Security & Protection**

### **Branch Protection Rules**
- **Production Branch**: Requires pull request + review
- **Staging Branch**: Requires successful CI checks
- **Deploy Protection**: Manual approval for production
- **Rollback Ready**: Automated rollback triggers

### **Secret Management**
```bash
# Production secrets (Amplify Console only)
TWILIO_ACCOUNT_SID=<production-value>
SENDGRID_API_KEY=<production-value>
FROM_EMAIL=info@realtechee.com

# Development secrets (.env.local)
TWILIO_ACCOUNT_SID=<test-value>
FROM_EMAIL=dev@realtechee.com
```

### **Access Control**
- **Admin Access**: AWS Console access for emergencies only
- **Developer Access**: Amplify CLI for backend deployment
- **Monitoring Access**: CloudWatch dashboards for all team members
- **Audit Trail**: All deployments logged and tracked

## 📊 **Monitoring & Health Checks**

### **Deployment Monitoring**
```bash
# Check deployment status
aws amplify list-apps --region us-west-1

# View recent deployments  
aws amplify list-jobs --app-id d200k2wsaf8th3 --branch-name production

# Check build logs
aws amplify get-job --app-id d200k2wsaf8th3 --branch-name production --job-id <job-id>
```

### **Application Health Verification**
- [ ] Application loads successfully
- [ ] Authentication system functional
- [ ] Form submissions working
- [ ] Admin dashboard accessible
- [ ] Notification system operational
- [ ] Database queries responding correctly

### **Performance Metrics**
- **Build Time**: ~19 seconds (Turbopack optimized)
- **Bundle Size**: <500KB target (77% reduction achieved)
- **API Response**: <200ms target
- **Error Rate**: <1% production target

## 🚨 **Troubleshooting**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Clear caches
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check TypeScript errors
npm run type-check

# Verify Amplify configuration
npx ampx sandbox info
```

#### **Schema Deployment Failures**
```bash
# Check for breaking changes
git diff HEAD~1 amplify/data/resource.ts

# Verify field types and relationships
# Common issues:
# - Changed field types (breaking)
# - Removed required fields (breaking)  
# - Invalid @auth directives
```

#### **Environment Variable Issues**
```bash
# Verify variables in Amplify Console
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name production

# Test API connectivity
curl -X POST https://your-graphql-endpoint/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"query":"query { __schema { types { name } } }"}'
```

#### **Data Migration Issues**
```bash
# Check table status
aws dynamodb describe-table --table-name Request-<suffix>-NONE

# Verify record counts match expectations
node scripts/validate-data-integrity.js

# If data loss detected, restore from backup
./scripts/restore-backup.sh --date YYYY-MM-DD
```

### **Performance Issues**
```bash
# Bundle analysis
npm run build && npm run analyze

# Database performance
# Check DynamoDB metrics in CloudWatch
# Look for throttling or high latency

# API performance  
# Check AppSync metrics for query performance
# Optimize queries if needed
```

## 🔄 **Emergency Procedures**

### **Immediate Rollback**
```bash
# For critical production issues
./scripts/execute-rollback.sh --version LAST_KNOWN_GOOD

# Or manual rollback
git checkout production
git revert <problematic-commit>
git push origin production
```

### **Data Recovery**
```bash
# If data corruption detected
./scripts/restore-backup.sh --date YYYY-MM-DD

# Verify data integrity after restore
node scripts/validate-data-integrity.js --full-check
```

### **Service Outage Response**
1. **Check AWS Service Health**: https://status.aws.amazon.com/
2. **Verify Application Status**: Use health check endpoints
3. **Review Recent Deployments**: Check if recent changes caused issues
4. **Implement Rollback**: If needed, rollback to last known good state
5. **Communicate Status**: Update stakeholders on resolution progress

## ✅ **Pre-Deployment Checklist**

### **Before Every Production Deployment**
- [ ] Data backup completed (`./scripts/backup-data.sh`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Production build successful (`npm run build`)
- [ ] All tests passing (`CI=true npx playwright test`)
- [ ] Staging environment validated
- [ ] Performance metrics within targets
- [ ] Security review completed (if schema changes)

### **After Production Deployment**
- [ ] Application health check passed
- [ ] Critical user flows tested
- [ ] Performance metrics monitored
- [ ] Error rates checked
- [ ] Stakeholder notification sent

## 📋 **Best Practices**

1. **Always Backup First**: Never deploy schema changes without backup
2. **Test in Staging**: Validate all changes in staging environment
3. **Monitor Actively**: Watch metrics during and after deployment
4. **Deploy Small Changes**: Prefer frequent small deployments over large ones
5. **Document Changes**: Keep deployment notes for troubleshooting
6. **Have Rollback Ready**: Always know how to quickly undo changes
7. **Communicate Clearly**: Keep team informed of deployment status

---

**This guide replaces all previous deployment documentation and serves as the single source of truth for AWS Amplify Gen 2 deployment procedures.**

*Last Updated: September 8, 2025*
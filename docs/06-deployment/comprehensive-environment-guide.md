# Comprehensive Environment Configuration Guide

**Consolidated from 5 separate environment documents - September 2025**

## 🎯 **Overview**

RealTechee 2.0 operates on AWS Amplify Gen 2 with complete environment isolation between development and production. This guide covers all environment-related configuration, variables, and deployment procedures.

## 🏗️ **Environment Architecture**

### **Production Environment (100% Operational)**
- **Application ID**: `d200k2wsaf8th3`
- **URL**: `https://d200k2wsaf8th3.amplifyapp.com`
- **Backend**: `amplify-realtecheeclone-production-sandbox-*` (dynamic suffix)
- **Region**: `us-west-1` (N. California)
- **Status**: 1,449 production records, complete isolation from development
- **API Endpoint**: `374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com`

### **Development Environment**
- **Type**: Local sandbox using `npx ampx sandbox`
- **Backend**: Dynamic suffix pattern (`*-fvn7t5hbobaxjklhrqzdl4ac34-*`)
- **API Endpoint**: `ik6nvyekjvhvhimgtomqcxvkty.appsync-api.us-west-1.amazonaws.com`
- **Usage**: Local development and testing
- **Data**: Separate from production, safe for experimentation

## 🔧 **Environment Variables Configuration**

### **Production Environment Variables (Amplify Console)**

#### **Core Application Variables**
```env
# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_AMPLIFY_REGION=us-west-1

# Analytics & Tracking
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# API Configuration
NEXT_PUBLIC_API_REGION=us-west-1
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_LOGGING=true
NEXT_PUBLIC_ENABLE_MONITORING=true

# Security
AMPLIFY_BACKEND_ENVIRONMENT=production
AMPLIFY_GRAPHQL_ENDPOINT_SECRET=<managed-by-amplify>
```

#### **Notification System Variables**
```env
# Email Configuration (AWS SES)
AWS_SES_REGION=us-west-1
FROM_EMAIL=info@realtechee.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=<production-sid>
TWILIO_AUTH_TOKEN=<production-token>
TWILIO_PHONE_NUMBER=<production-number>

# Notification Settings
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_DELAY_SECONDS=300
```

#### **Database Configuration**
```env
# DynamoDB Configuration (Auto-managed by Amplify)
DYNAMO_DB_REGION=us-west-1
TABLE_NAME_PREFIX=<dynamic-backend-suffix>

# Performance Settings
DYNAMODB_READ_CAPACITY=5-4000
DYNAMODB_WRITE_CAPACITY=5-4000
DYNAMODB_TTL_ENABLED=true
```

### **Development Environment Variables (.env.local)**

```env
# Local Development
NODE_ENV=development
NEXT_PUBLIC_AMPLIFY_REGION=us-west-1

# Local API (from sandbox)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://ik6nvyekjvhvhimgtomqcxvkty.appsync-api.us-west-1.amazonaws.com/graphql

# Development Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-DEV-XXXXXXXXXX

# Development Notifications (Test Mode)
TWILIO_ACCOUNT_SID=<test-account-sid>
TWILIO_AUTH_TOKEN=<test-auth-token>
FROM_EMAIL=dev@realtechee.com

# Debug Settings
NEXT_PUBLIC_ENABLE_LOGGING=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

## 🚀 **Deployment Procedures**

### **Development to Staging Workflow**
```bash
# 1. Ensure all changes are committed
git add .
git commit -m "feat: description of changes"

# 2. Switch to staging and merge
git checkout staging
git merge main
git push origin staging

# 3. Deploy backend changes if needed
npx ampx sandbox

# 4. Verify staging deployment
# Check Amplify console for build status
```

### **Staging to Production Workflow**
```bash
# 1. Verify staging is stable and tested
# Run comprehensive tests first
CI=true npx playwright test

# 2. Create production deployment
git checkout production
git merge staging
git push origin production

# 3. Monitor deployment
# Check AWS Amplify Console for build progress
# Verify production health checks

# 4. Post-deployment verification
# Test critical user flows
# Verify notification system
# Check admin dashboard functionality
```

### **Emergency Rollback Procedure**
```bash
# 1. Identify last known good commit
git log --oneline -10

# 2. Create rollback commit
git checkout production
git revert <problematic-commit-hash>
git push origin production

# 3. Force re-deploy if needed
# Use Amplify Console to trigger manual deployment

# 4. Verify rollback success
# Test critical functionality
# Monitor system health
```

## 🗄️ **Database Environment Configuration**

### **Production Database Schema**
- **Tables**: 43 data models with complex relationships
- **Naming Pattern**: `TableName-<dynamic-backend-suffix>-NONE`
- **Records**: 1,449+ production records
- **Backup**: Point-in-time recovery (35 days)
- **Scaling**: Auto-scaling enabled (5-4000 capacity units)

### **Development Database Schema**
- **Tables**: Same schema as production (mirrored)
- **Naming Pattern**: `TableName-fvn7t5hbobaxjklhrqzdl4ac34-NONE`
- **Records**: Test data only, safe to modify/delete
- **Purpose**: Development and testing without affecting production

### **Schema Migration Process**
```bash
# 1. ALWAYS backup production first
./scripts/backup-data.sh

# 2. Test schema changes in development
npx ampx sandbox
# Make changes to amplify/data/resource.ts
# Test locally

# 3. Deploy to production
git checkout production
npx ampx sandbox
# Amplify will handle schema migration
```

## 🔐 **Security Configuration**

### **Authentication Settings**
- **Provider**: AWS Cognito User Pools
- **User Groups**: 8 role types (Admin, Agent, PM, etc.)
- **MFA**: Ready for deployment (disabled in dev)
- **Password Policy**: Enforced in production

### **API Security**
- **Authorization**: Role-based access control (RBAC)
- **API Keys**: Public API key for public forms
- **GraphQL**: Authenticated access for admin functions
- **Rate Limiting**: AWS AppSync built-in protection

### **Data Security**
- **Encryption at Rest**: AES-256 with AWS KMS
- **Encryption in Transit**: TLS 1.3
- **Backup Encryption**: Enabled for all backups
- **Access Logging**: CloudTrail integration

## 📊 **Monitoring & Observability**

### **CloudWatch Integration**
```env
# Production Monitoring
CLOUDWATCH_REGION=us-west-1
CLOUDWATCH_LOG_GROUP=amplify-realtecheeclone-production
CLOUDWATCH_METRIC_NAMESPACE=RealTechee/Production

# Alert Configuration
SNS_TOPIC_ARN=arn:aws:sns:us-west-1:account:RealTechee-Production-Alerts
ALERT_EMAIL=info@realtechee.com
```

### **Performance Metrics**
- **API Response Time**: <200ms target
- **Build Time**: ~19 seconds with Turbopack
- **Bundle Size**: 77% reduction achieved
- **Error Rate**: <1% target

### **Health Check Endpoints**
- **Application**: `/api/health`
- **Database**: Automatic health checks via Amplify
- **Authentication**: Cognito service health
- **Notifications**: Template and delivery system status

## 🛠️ **Development Tools Configuration**

### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
```

### **Build Configuration**
```javascript
// next.config.js
module.exports = {
  experimental: {
    turbo: true  // 60-80% faster builds
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['d200k2wsaf8th3.amplifyapp.com']
  }
}
```

### **Testing Configuration**
```javascript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.NODE_ENV === 'production' 
      ? 'https://d200k2wsaf8th3.amplifyapp.com'
      : 'http://localhost:3000',
    reuseExistingServer: true
  }
});
```

## 🔄 **Environment Synchronization**

### **Configuration Sync Process**
1. **Local Development**: Use `.env.local` for local overrides
2. **Environment Parity**: Keep dev/prod configurations similar
3. **Secret Management**: Use Amplify Console for production secrets
4. **Version Control**: Never commit secrets to git

### **Environment Variable Validation**
```typescript
// utils/validateEnvironment.ts
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_AMPLIFY_REGION',
    'NEXT_PUBLIC_GRAPHQL_ENDPOINT'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

## 📈 **Performance Optimization**

### **Build Optimization**
- **Turbopack**: Enabled for faster builds
- **Bundle Analysis**: Regular bundle size monitoring
- **Tree Shaking**: Optimized imports and exports
- **Code Splitting**: Lazy loading for admin components

### **Runtime Performance**
- **API Caching**: TanStack Query with 5-minute stale time
- **Image Optimization**: Next.js automatic optimization
- **Database Queries**: Optimized with pagination and filtering
- **CDN**: CloudFront distribution for static assets

## 🚨 **Troubleshooting**

### **Common Environment Issues**

#### **Build Failures**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Amplify types
npx ampx sandbox
```

#### **API Connection Issues**
```bash
# Verify environment variables
npx ampx sandbox info

# Check GraphQL endpoint
curl -X POST https://your-endpoint/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __schema { types { name } } }"}'
```

#### **Authentication Issues**
```bash
# Clear Cognito cache
localStorage.clear()  // In browser console

# Verify user pool configuration
# Check AWS Cognito Console for user pool settings
```

### **Environment-Specific Commands**

#### **Development Commands**
```bash
npm run dev:primed          # Start development server
npm run type-check          # TypeScript validation
npm run build              # Test production build
npx ampx sandbox           # Deploy backend changes
```

#### **Production Commands**
```bash
./scripts/backup-data.sh   # Backup before changes
git push origin production # Deploy to production
# Monitor in AWS Amplify Console
```

## 📋 **Environment Checklist**

### **Before Production Deployment**
- [ ] All environment variables configured in Amplify Console
- [ ] Database backup completed
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Production build successful (`npm run build`)
- [ ] Comprehensive tests passing (`CI=true npx playwright test`)
- [ ] Security review completed
- [ ] Performance metrics verified

### **Post-Deployment Verification**
- [ ] Application accessible at production URL
- [ ] Form submissions working correctly
- [ ] Admin dashboard functional
- [ ] Notification system operational
- [ ] Database queries responding correctly
- [ ] Authentication system working
- [ ] Analytics tracking active

## 🎯 **Best Practices**

1. **Environment Isolation**: Maintain strict separation between dev and production
2. **Configuration Management**: Use Amplify Console for production secrets
3. **Monitoring**: Implement comprehensive health checks and alerting
4. **Backup Strategy**: Regular automated backups with point-in-time recovery
5. **Performance**: Monitor and optimize for <200ms API responses
6. **Security**: Regular security audits and access reviews
7. **Documentation**: Keep environment documentation current with changes

---

**Status**: Production environments operational and optimized  
**Last Updated**: September 8, 2025  
**Next Review**: Quarterly (December 2025)

This consolidated guide replaces the previous 5 separate environment documents and serves as the single source of truth for all environment-related configuration and procedures.
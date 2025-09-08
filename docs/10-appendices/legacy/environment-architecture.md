# Environment Architecture & Infrastructure Separation

## Overview

RealTechee 2.0 implements enterprise-grade environment separation with complete infrastructure isolation between development and production environments. This architecture ensures production stability, data protection, and follows AWS best practices for multi-environment deployment strategies.

## Environment Isolation Strategy

### Complete Infrastructure Separation
The platform maintains zero shared resources between environments to eliminate contamination risks and ensure production data integrity.

**Production Environment:**
- **Application**: `RealTechee-Gen2` (`d200k2wsaf8th3`)
- **URL**: `https://d200k2wsaf8th3.amplifyapp.com`
- **Backend**: `amplify-realtecheeclone-production-sandbox-70796fa803`
- **Region**: `us-west-1` (N. California)

**Development Environment:**
- **Application**: `RealTechee` (Original sandbox)
- **Backend**: `amplify-realtecheeclone-main-sandbox-8d5b2b35c8`
- **Region**: `us-west-1` (N. California)

## Database Architecture & Table Mapping

### Production Database Schema
All production tables follow the naming pattern: `TableName-<dynamic-backend-suffix>-NONE` (previous static example `aqnqdrctpzfwfjwyxxsmu6peoq` prior to dynamic refactor)

**Core Business Entities:**
```
Production Tables (26+ total):
├── BackOfficeRequestStatuses-<dynamic-backend-suffix>-NONE (5 records)
├── Contacts-<dynamic-backend-suffix>-NONE (273 records)
├── Properties-<dynamic-backend-suffix>-NONE (234 records)
├── Requests-<dynamic-backend-suffix>-NONE (863 records)
├── Projects-<dynamic-backend-suffix>-NONE (64 records)
├── Quotes-<dynamic-backend-suffix>-NONE (15 records)
└── Supporting Tables:
  ├── NotificationQueue-<dynamic-backend-suffix>-NONE
  ├── NotificationTemplate-<dynamic-backend-suffix>-NONE  
  ├── ProjectComments-<dynamic-backend-suffix>-NONE
  └── ProjectMilestones-<dynamic-backend-suffix>-NONE
```

### Development Database Schema
All development tables follow the naming pattern: `TableName-<dynamic-backend-suffix>-NONE` (previous static example `fvn7t5hbobaxjklhrqzdl4ac34`)

**Environment Isolation Benefits:**
- ✅ **Zero Data Contamination**: Development cannot affect production data
- ✅ **Independent Scaling**: Separate capacity management for each environment
- ✅ **Secure Testing**: Test data isolation with `leadSource: 'E2E_TEST'` markers
- ✅ **Audit Compliance**: Complete separation for regulatory requirements

## AWS Services Integration

### Production Infrastructure Stack
```
AWS Services (us-west-1):
├── AWS Amplify Gen 2
│   ├── Hosting: Static site deployment with CDN
│   ├── Build Pipeline: Automated CI/CD integration
│   └── Environment Variables: Production-optimized settings
├── AWS AppSync (GraphQL API)
│   ├── Endpoint: 374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com
│   ├── Real-time Subscriptions: WebSocket connections
│   ├── Caching: Query result optimization
│   └── Authorization: Cognito integration
├── Amazon DynamoDB
│   ├── Tables: 26+ business entities with GSIs
│   ├── Auto-scaling: Demand-based capacity management
│   ├── Point-in-time Recovery: 35-day backup retention
│   └── Encryption: AES-256 at rest with KMS
├── AWS Lambda Functions
│   ├── notification-processor: Multi-channel messaging
│   ├── user-admin: Cognito user management
│   ├── status-processor: Scheduled status transitions
│   └── secure-config: Configuration management
├── Amazon Cognito
│   ├── User Pool: Authentication with 8 role groups
│   ├── Identity Pool: Authorization and access control
│   ├── MFA Ready: Multi-factor authentication capability
│   └── Custom Attributes: Role-based user properties
└── Storage & CDN
    ├── Amazon S3: File storage with lifecycle policies
    ├── CloudFront: Global content delivery network
    ├── Image Optimization: WebP/AVIF format support
    └── Security Headers: XSS, CSRF, CSP protection
```

## Environment Configuration Management

### Production Environment Variables
```bash
# Application Configuration
NODE_ENV=production
ENVIRONMENT=production
LOG_LEVEL=INFO

# AWS Configuration  
AWS_REGION=us-west-1
AMPLIFY_ENV=production

# Security Configuration
ENABLE_DEBUG=false
ENABLE_DETAILED_LOGGING=false
CORS_ORIGINS=https://d200k2wsaf8th3.amplifyapp.com

# Feature Flags
MFA_ENABLED=ready
ADVANCED_MONITORING=true
```

### Development Environment Variables
```bash
# Application Configuration
NODE_ENV=development
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# AWS Configuration
AWS_REGION=us-west-1
AMPLIFY_ENV=main

# Security Configuration (Development Only)
ENABLE_DEBUG=true
ENABLE_DETAILED_LOGGING=true
CORS_ORIGINS=http://localhost:3000

# Feature Flags
MFA_ENABLED=false
ADVANCED_MONITORING=false
```

## Data Migration & Synchronization

### Complete Production Migration Status
**Migration Completed: July 22, 2025**
**Total Records Migrated: 1,449**

| Entity | Production Count | Migration Status | Data Integrity |
|--------|------------------|------------------|----------------|
| Contacts | 273 | ✅ Complete | ✅ Verified |
| Properties | 234 | ✅ Complete | ✅ Verified |
| Requests | 863 | ✅ Complete | ✅ Verified |
| Projects | 64 | ✅ Complete | ✅ Verified |
| Quotes | 15 | ✅ Complete | ✅ Verified |
| BackOfficeRequestStatuses | 5 | ✅ Complete | ✅ Verified |
| Support Tables | ~50 | ✅ Complete | ✅ Verified |

### Data Protection Protocols
```bash
# Pre-Migration Safety Measures
1. Complete data backup: ./scripts/backup-data.sh
2. Schema validation: ./scripts/validate-schema.sh
3. Test migration: ./scripts/test-migration.sh --dry-run
4. Production deployment: ./scripts/deploy-with-protection.sh

# Post-Migration Validation
1. Data integrity check: ./scripts/check-data.mjs --validate-integrity
2. Application health: ./scripts/health-check.sh --comprehensive
3. User acceptance testing: npm run test:seamless:truly
```

## Security Architecture

### Multi-Layer Security Implementation
```
Security Layers:
├── Network Security
│   ├── VPC Isolation (AWS Managed)
│   ├── Security Groups (Restrictive rules)
│   ├── NACLs (Network access control lists)
│   └── WAF Integration (Ready for deployment)
├── Application Security  
│   ├── Authentication (AWS Cognito)
│   ├── Authorization (Role-based + attribute-based)
│   ├── Input Validation (Client and server-side)
│   ├── CSRF Protection (Implementation ready)
│   └── XSS Prevention (Content Security Policy)
├── Data Security
│   ├── Encryption at Rest (AES-256 with KMS)
│   ├── Encryption in Transit (TLS 1.3)
│   ├── Database Encryption (DynamoDB native)
│   └── Backup Encryption (S3 server-side)
└── Infrastructure Security
    ├── IAM Least Privilege (Role-based access)
    ├── Resource-Based Policies (Service restrictions)
    ├── CloudTrail Auditing (API call logging)
    └── Vulnerability Scanning (Automated security assessment)
```

### Authentication & Authorization Matrix
| Role | System Access | Data Access | Admin Functions |
|------|---------------|-------------|-----------------|
| SuperAdmin | Full platform | All data | Complete control |
| Admin | Platform management | Business data | User management |
| Accounting | Financial interfaces | Financial data | Reporting only |
| SRM | Client management | Client projects | Assignment control |
| Agent | Project interfaces | Assigned projects | Status updates |
| Homeowner | Personal portal | Own projects | View only |
| Provider | Service interfaces | Assigned work | Progress updates |
| Guest | Public pages | None | None |

## Performance & Scalability Architecture

### Auto-Scaling Configuration
```javascript
// DynamoDB Auto-Scaling Settings
const autoScalingConfig = {
  readCapacity: {
    min: 5,
    max: 4000,
    targetUtilization: 70
  },
  writeCapacity: {
    min: 5, 
    max: 4000,
    targetUtilization: 70
  },
  scaleOutCooldown: 60,
  scaleInCooldown: 300
};

// Lambda Concurrency Settings
const lambdaConfig = {
  reservedConcurrency: 50,
  provisioned: false, // Cost optimization
  deadLetterQueue: true,
  errorHandling: 'exponential-backoff'
};
```

### Performance Optimization Results
- **Bundle Size Reduction**: 77% (1,041KB → 239KB)
- **Image Optimization**: OptimizedImage component with lazy loading
- **GraphQL Enhancement**: 60-80% query performance improvement
- **Code Splitting**: Dynamic imports for admin functionality
- **CDN Integration**: Global edge locations with smart caching

## Monitoring & Observability

### CloudWatch Integration
```yaml
Production Monitoring:
  Dashboards:
    - Application Performance Metrics
    - Database Performance & Capacity
    - Lambda Function Health
    - User Experience Analytics
    
  Alarms:
    Critical (P0):
      - Error rate > 5% (2 consecutive periods)
      - Response time > 5s (3 consecutive periods)
      - Database connectivity failure
    Warning (P1):
      - Response time > 3s (3 consecutive periods)  
      - DynamoDB latency > 100ms average
      
  Notifications:
    SNS Topic: RealTechee-Production-Alerts
    Endpoint: info@realtechee.com
    Escalation: Automatic incident creation
```

## Environment Switching Procedures

### Development to Production Workflow
```bash
# 1. Development Phase
npx ampx sandbox                    # Deploy to development
npm run test:seamless:truly        # Comprehensive testing
./scripts/validate-environment.sh  # Environment validation

# 2. Pre-Production Phase  
./scripts/backup-data.sh           # Mandatory backup
npm run build                      # Production build test
./scripts/validate-production.sh  # Production readiness check

# 3. Production Deployment
./scripts/deploy-with-protection.sh --environment prod
./scripts/health-check.sh --post-deployment
./scripts/monitor-deployment.sh --duration 60min
```

### Emergency Environment Isolation
```bash
# Emergency: Isolate environments if contamination suspected
./scripts/emergency-isolation.sh --validate-separation
./scripts/validate-data-integrity.sh --cross-environment-check
./scripts/restore-environment.sh --from-backup --if-needed
```

## Disaster Recovery & Business Continuity

### Backup Strategy
```
Backup Schedule:
├── Real-time: Point-in-time recovery (DynamoDB)
├── Daily: Automated full backup (All services)
├── Weekly: Cross-region backup replication
└── Monthly: Long-term archival (S3 Glacier)

Recovery Objectives:
├── RTO (Recovery Time): 15 minutes (P0), 1 hour (P1)
├── RPO (Recovery Point): 5 minutes (Database), 1 hour (Files)  
├── Cross-Region: us-west-2 backup region
└── Validation: Monthly disaster recovery tests
```

### Environment Recovery Procedures
```bash
# Complete Environment Restoration
./scripts/disaster-recovery.sh --environment prod --restore-point latest
./scripts/validate-restoration.sh --comprehensive-check
./scripts/resume-operations.sh --post-recovery-validation
```

## Compliance & Audit Requirements

### Data Governance
- **GDPR Compliance**: User data export/deletion capabilities (ready for implementation)
- **SOC 2**: Security controls documentation and audit trails
- **Data Retention**: Automated lifecycle policies for different data types
- **Audit Logging**: Complete API call and data access logging via CloudTrail

### Environment Compliance
- **Production Data Protection**: No development access to production data
- **Change Management**: All production changes require approval workflow
- **Access Control**: Role-based access with principle of least privilege
- **Security Monitoring**: Real-time threat detection and response

## Architecture Decision Records

### ADR-001: Complete Environment Separation
**Decision**: Implement complete infrastructure isolation between dev/prod
**Rationale**: Eliminate contamination risk, improve security, meet compliance requirements
**Status**: Implemented ✅
**Impact**: Zero shared resources, enhanced security posture

### ADR-002: AWS Amplify Gen 2 for Infrastructure  
**Decision**: Use Amplify Gen 2 for infrastructure as code
**Rationale**: Simplified deployment, integrated monitoring, cost optimization
**Status**: Implemented ✅ 
**Impact**: Reduced operational overhead, consistent deployments

### ADR-003: DynamoDB Single-Table vs Multi-Table Design
**Decision**: Multi-table design with clear entity boundaries
**Rationale**: Better data modeling, easier migrations, domain clarity
**Status**: Implemented ✅
**Impact**: 26+ tables with optimized access patterns

---

## Related Documentation

- **[System Overview](system-overview.md)** - Complete system architecture
- **[Technology Stack](technology-stack.md)** - Detailed technology decisions
- **[Deployment Procedures](../06-deployment/)** - Deployment workflows and automation
- **[Operations Guide](../07-operations/)** - Production operations and monitoring

**Last Updated**: July 22, 2025  
**Version**: 3.0.0  
**Status**: Production Ready with Complete Environment Isolation ✅
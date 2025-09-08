# System Overview & Navigation Hub

**Purpose**: Single source of truth for system overview and documentation navigation.

## 🎯 **System Summary**

RealTechee 2.0 is a production-ready real estate platform built on AWS Amplify Gen 2, serving 1,449+ active records with complete development/production isolation.

### **Current Status (September 2025)**
- **Production**: `https://d200k2wsaf8th3.amplifyapp.com` - Fully operational
- **Database**: 43 data models with auto-scaling DynamoDB
- **Architecture**: Serverless with enterprise monitoring
- **Testing**: 584+ comprehensive E2E tests with CI/CD
- **Scale**: Optimized for 100-1000 visitors/month with 10x growth capacity

## 🗂️ **Documentation Navigation**

### **📋 [Requirements](../01-requirements/)**
Business requirements, user stories, and specifications

### **🏗️ [Design](../02-design/)**
- **[UI/UX Development Guidelines](../02-design/ui-ux-development-guidelines.md)** - Future-focused design patterns
- **[Architectural Decisions](../02-design/architectural-decisions.md)** - Technical decision documentation

### **🏢 [Business Domains](../03-domains/)**
11 core business domains with complete service separation:

1. **[Authentication](../03-domains/01-authentication/)** - AWS Cognito with 8 role types
2. **[CRM](../03-domains/02-crm/)** - Customer relationship management  
3. **[Project Management](../03-domains/03-project-management/)** - Project lifecycle tracking
4. **[Communication](../03-domains/07-communication/)** - Multi-channel notification system
5. **[Administration](../03-domains/09-administration/)** - Back office operations
6. **[Analytics](../03-domains/10-analytics/)** - Business intelligence

*Plus 5 additional domains in development*

### **💻 [Implementation](../04-implementation/)**
- **[Project Structure](../04-implementation/project-structure.md)** - Current codebase organization
- **[Current Status](../04-implementation/current-implementation-status.md)** - Implementation progress

### **🧪 [Testing](../05-testing/)**
- **[Testing Master Guide](../05-testing/testing-master-guide.md)** - Comprehensive testing framework
- **[Complete Test Inventory](../05-testing/COMPLETE_TEST_INVENTORY.md)** - Test catalog reference
- **[Admin Testing](../05-testing/admin-testing-comprehensive.md)** - Admin-specific patterns

### **🚀 [Deployment](../06-deployment/)**
- **[Amplify Deployment Master Guide](../06-deployment/amplify-deployment-master-guide.md)** - Single source deployment guide
- **[Comprehensive Environment Guide](../06-deployment/comprehensive-environment-guide.md)** - Complete environment configuration
- **[Production Readiness Checklist](../06-deployment/production-readiness-checklist.md)** - Go/No-Go validation

### **⚙️ [Operations](../07-operations/)**
- **[Notification Monitoring Setup](../07-operations/notification-monitoring-setup.md)** - Live monitoring
- **[Production Monitoring](../07-operations/production-monitoring.md)** - System health monitoring
- **[Operational Procedures](../07-operations/operational-procedures.md)** - Maintenance procedures

### **📈 [Marketing](../08-marketing/)**
- **[SEO Setup](../08-marketing/SEO_SETUP.md)** - SEO optimization guide
- **[Social Media Assets](../08-marketing/SEO_SOCIAL_MEDIA_ASSETS_NEEDED.md)** - Content requirements

### **🔄 [Migration](../09-migration/)**
- **[Data Migration Procedures](../09-migration/data-migration-procedures.md)** - Migration workflows
- **[AWS Configuration Guide](../09-migration/aws-configuration-guide.md)** - Infrastructure migration

### **📚 [Appendices](../10-appendices/)**
- **[Legacy Documentation](../10-appendices/legacy/)** - Archived historical content
- **[Production Certification](../10-appendices/production-certification-summary.md)** - Certification records

## ⚡ **Quick Start Workflows**

### **For Developers**
```bash
# 1. Read system overview
cat docs/00-overview/system-overview.md

# 2. Review current project structure  
cat docs/04-implementation/project-structure.md

# 3. Set up development environment
npm run dev:primed

# 4. Review testing patterns
cat docs/05-testing/testing-master-guide.md
```

### **For DevOps/Operations**
```bash
# 1. Review deployment procedures
cat docs/06-deployment/amplify-deployment-master-guide.md

# 2. Understand environment configuration
cat docs/06-deployment/comprehensive-environment-guide.md

# 3. Set up monitoring
cat docs/07-operations/production-monitoring.md

# 4. Production readiness validation
cat docs/06-deployment/production-readiness-checklist.md
```

### **For Business Stakeholders**
1. **[Executive Summary](executive-summary.md)** - Business overview
2. **[Technology Stack](technology-stack.md)** - Technology decisions
3. **[System Overview](system-overview.md)** - Architecture details

## 🏗️ **Technical Architecture**

### **Service Layer Organization**
```
services/
├── core/               # Base services (3)
├── business/           # Domain logic (13) 
├── admin/              # Admin services (5)
├── notifications/      # Notification services (8)
├── analytics/          # Analytics services (3)
├── interfaces/         # Type definitions
└── integrations/       # External services (future)
```

### **Component Architecture**
```
components/
├── admin/              # 15 admin subdirectories
├── common/             # Reusable UI components
├── typography/         # H1-H6, P1-P3 system
├── forms/              # Form components
└── [11 feature dirs]   # Feature-specific components
```

### **Database Schema**
- **43 Data Models**: Complete business entity coverage
- **Production**: 1,449+ records with complete isolation
- **Scaling**: Auto-scaling DynamoDB (5-4000 capacity units)
- **Backup**: Point-in-time recovery with 35-day retention

## 🚨 **Critical Information**

### **Essential Commands**
```bash
# Development
npm run dev:primed          # Start development (recommended)
npm run type-check          # TypeScript validation (required)
npm run build              # Production build validation

# Testing  
CI=true npx playwright test # Run all tests

# Deployment
npx ampx sandbox           # Deploy backend changes
./scripts/backup-data.sh   # MANDATORY before schema changes
```

### **Production Safety**
- **ALWAYS** backup before schema changes: `./scripts/backup-data.sh`
- **NEVER** modify production data without explicit approval
- **ALWAYS** test in development/staging first
- **VERIFY** all links and references before deployment

### **Environment Information**
- **Development**: Local sandbox (`npx ampx sandbox`)
- **Production**: `d200k2wsaf8th3.amplifyapp.com`
- **Database Suffix**: Dynamic backend naming
- **Complete Isolation**: No shared resources between environments

## 📊 **Current Metrics**
- **Uptime**: 99.9%+ production availability
- **Performance**: <200ms API response times
- **Testing**: 584+ comprehensive E2E tests
- **Bundle Size**: Optimized to <500KB
- **Security**: Zero critical vulnerabilities
- **Scale**: 10,000+ concurrent user capacity

---

**This document serves as the single navigation hub and system overview, replacing multiple overlapping navigation documents.**

*Last Updated: September 8, 2025*  
*Status: Production Operational*
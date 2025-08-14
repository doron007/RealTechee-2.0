# Documentation Index - RealTechee 2.0

## Overview

Comprehensive documentation index for RealTechee 2.0 enterprise-grade real estate technology platform. This documentation follows a structured approach with clear separation of concerns across development, deployment, operations, and architecture.

## Project Root Documentation

### Core Architecture & Planning
- **[AMPLIFY_ENV_PLAN.md](../../AMPLIFY_ENV_PLAN.md)** - Three-environment architecture planning and implementation status
- **[CLAUDE.md](../../CLAUDE.md)** - AI agent instructions and project overview
- **[README.md](../../README.md)** - Project overview and quick start guide

## Documentation Structure (docs/)

### 00 - Overview & Architecture
- **[Documentation Index](./documentation-index.md)** - This comprehensive index
- **[Environment Configuration Detailed](./environment-configuration-detailed.md)** - Complete three-environment architecture guide
- **[System Overview](./system-overview.md)** - High-level system architecture

### 01 - Requirements & Specifications  
- **User Stories** - Business requirements and feature specifications
- **Implementation Plans** - Technical requirement documentation

### 02 - Design & Patterns
- **Component Patterns** - UI/UX design system documentation
- **Architecture Decision Records** - Technical decision documentation

### 03 - Domain Documentation
- **Business Logic** - Domain-specific documentation (CRM, project management, etc.)

### 04 - Implementation Guides
- **[Node.js Production Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)** - Complete dependency management strategy for AWS Amplify builds

### 05 - Testing Framework
- **Testing Strategies** - Framework documentation and coverage reports

### 06 - Deployment & DevOps
- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)** - Comprehensive deployment procedures for three-environment architecture
- **[Enhanced Deployment Automation](../06-deployment/enhanced-deployment-automation.md)** - Advanced deployment procedures

### 07 - Operations & Monitoring
- **[Environment Variable Troubleshooting](../07-operations/environment-variable-troubleshooting.md)** - Complete troubleshooting procedures for environment issues
- **[Production Monitoring](../07-operations/production-monitoring.md)** - CloudWatch dashboards and alerting

### 08 - Security & Compliance
- **Security Procedures** - Compliance and audit documentation (as needed)

### 09 - Migration & Upgrades
- **Data Migration** - Migration procedures and compatibility guides

### 10 - Appendices & References
- **[Session Infrastructure Optimization](../10-appendices/session-amplify-infrastructure-optimization.md)** - Complete session summary of AWS Amplify build infrastructure improvements

## Key Documentation Highlights

### Environment Architecture
RealTechee 2.0 implements a sophisticated **three-environment architecture**:

1. **Local Development**: `ampx sandbox` with local backend stack
2. **Staging**: AWS Amplify branch with server-built backend  
3. **Production**: AWS Amplify branch with isolated production backend

**Reference Documents**:
- Primary: **[AMPLIFY_ENV_PLAN.md](../../AMPLIFY_ENV_PLAN.md)**
- Detailed: **[Environment Configuration Detailed](./environment-configuration-detailed.md)**
- Implementation: **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)**

### AWS Amplify Infrastructure
Complete AWS Amplify Gen 2 single-app multi-branch deployment with:
- **App ID**: `d200k2wsaf8th3`
- **Backend Isolation**: Each environment has distinct backend stack
- **Environment Variable Precedence**: Sophisticated inheritance chain
- **Build Optimization**: NODE_ENV=production dependency resolution

**Reference Documents**:
- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)**
- **[Node.js Production Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)**
- **[Session Infrastructure Optimization](../10-appendices/session-amplify-infrastructure-optimization.md)**

### Environment Variable Management
Comprehensive environment variable precedence chain:
1. AWS Amplify Environment Variables (Default)
2. AWS Amplify Branch-Specific Overrides
3. Repository .env.* files
4. Local .env.*.local files
5. Backend built with resolved variables

**Reference Documents**:
- **[Environment Configuration Detailed](./environment-configuration-detailed.md)**
- **[Environment Variable Troubleshooting](../07-operations/environment-variable-troubleshooting.md)**

### Production Build Management  
Enterprise-grade dependency management for AWS Amplify builds:
- **NODE_ENV=production Compatibility**: Complete dependency classification
- **Local Testing Strategy**: Replicate AWS environment locally
- **Build Optimization**: Systematic dependency resolution
- **Emergency Procedures**: Rollback and monitoring strategies

**Reference Documents**:
- **[Node.js Production Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)**
- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)**

## Documentation Standards

### File Organization
- **Structured Numbering**: 00-10 folder organization for logical grouping
- **Clear Naming**: Descriptive file names with consistent patterns  
- **Cross-References**: Comprehensive linking between related documents
- **Version Control**: All documentation versioned with code

### Content Standards
- **Enterprise-Grade**: Professional documentation with practical examples
- **Actionable Content**: Step-by-step procedures and working code examples
- **Troubleshooting**: Comprehensive error resolution and debugging guides
- **Performance Focus**: Metrics, monitoring, and optimization procedures

### Maintenance
- **Regular Updates**: Documentation updated with each significant change
- **Validation**: All procedures tested and verified
- **Consistency**: Unified formatting and style across all documents
- **Accessibility**: Clear structure and comprehensive cross-referencing

## Quick Navigation

### For Developers
1. **Getting Started**: [CLAUDE.md](../../CLAUDE.md) → [AWS Amplify Gen 2 Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)
2. **Environment Setup**: [Environment Configuration](./environment-configuration-detailed.md)
3. **Build Issues**: [Node.js Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)
4. **Troubleshooting**: [Environment Variable Troubleshooting](../07-operations/environment-variable-troubleshooting.md)

### For DevOps
1. **Architecture Overview**: [AMPLIFY_ENV_PLAN.md](../../AMPLIFY_ENV_PLAN.md)
2. **Deployment Procedures**: [AWS Amplify Gen 2 Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)
3. **Monitoring Setup**: [Production Monitoring](../07-operations/production-monitoring.md)
4. **Infrastructure History**: [Session Infrastructure Optimization](../10-appendices/session-amplify-infrastructure-optimization.md)

### For Operations
1. **Environment Issues**: [Environment Variable Troubleshooting](../07-operations/environment-variable-troubleshooting.md)
2. **Production Monitoring**: [Production Monitoring](../07-operations/production-monitoring.md)
3. **Build Failures**: [Node.js Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)
4. **Emergency Procedures**: [AWS Amplify Gen 2 Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)

---

**Last Updated**: August 14, 2025  
**Version**: 4.2.2  
**Status**: Complete Documentation Index ✅  
**Next Review**: With next major infrastructure change
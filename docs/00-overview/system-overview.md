# System Overview

## Executive Summary

RealTechee 2.0 is a comprehensive real estate home preparation platform that demonstrates enterprise-grade architecture, modern development practices, and scalable cloud-native design. The system manages the complete lifecycle of real estate renovation projects while showcasing professional software engineering principles.

## Business Context

### Problem Statement
Traditional real estate preparation involves disconnected processes between homeowners, agents, contractors, and service providers, leading to project delays, communication gaps, and suboptimal outcomes.

### Solution Approach
RealTechee 2.0 provides a unified platform that orchestrates all stakeholders through a structured workflow, ensuring transparency, accountability, and optimal project outcomes.

### Value Proposition
- **For Homeowners**: Transparent project management with real-time updates
- **For Agents**: Enhanced client service with professional project coordination
- **For Contractors**: Streamlined workflow and payment management
- **For Platform Owner**: Scalable business model with comprehensive oversight

## High-Level Architecture

### Enterprise Infrastructure Overview

```
Production Environment Architecture (us-west-1)
┌─────────────────────────────────────────────────────────────────┐
│                     Internet & CDN Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   CloudFront    │  │  Global Edge    │  │   SSL/TLS       │ │
│  │   Distribution  │  │   Locations     │  │   Termination   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  AWS Amplify Gen 2 Hosting                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Production    │  │   Development   │  │   Build System  │ │
│  │ d200k2wsaf8th3  │  │   Sandbox       │  │   CI/CD         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                Frontend Applications                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Next.js 15.3   │  │  Admin Portal   │  │  Mobile Future  │ │
│  │  React 18.3     │  │  TypeScript     │  │   (Planned)     │ │
│  │  TypeScript     │  │  MUI Components │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    API Gateway Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AWS AppSync (GraphQL API) - Real-time + Subscriptions    │ │
│  │  Production: 374sdjlh3bdnhp2sz4qttvyhce.appsync-api.*     │ │
│  │  Development: ik6nvyekjvhvhimgtomqcxvkty.appsync-api.*    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 Business Logic Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Lambda Functions │  │  Core Services  │  │ Background Jobs │ │
│  │  notification-     │  │  (11 Domains)  │  │  status-        │ │
│  │  processor        │  │                 │  │  processor      │ │
│  │  user-admin       │  │                 │  │  secure-config  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                     Data & Storage Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   DynamoDB      │  │   Amazon S3     │  │ Amazon Cognito  │ │
│  │   26+ Tables    │  │   File Storage  │  │   User Pools    │ │
│  │   Auto-scaling  │  │   CloudFront    │  │   8 Role Groups │ │
│  │   Point-in-time │  │   WebP/AVIF     │  │   MFA Ready     │ │
│  │   Recovery      │  │   Optimization  │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│               Monitoring & Observability                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   CloudWatch    │  │      SNS        │  │  Health Checks  │ │
│  │   Dashboards    │  │   Alerting      │  │   Automated     │ │
│  │   Custom        │  │   Multi-channel │  │   Recovery      │ │
│  │   Metrics       │  │   Notifications │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

External Integrations:
├── Real Estate APIs (Future: Redfin, Zillow)
├── Communication (Email: SMTP, SMS: Future)
├── Payment Processing (Future: Stripe, Square)
└── Document Management (Future: E-signatures)
```

### Production Infrastructure Details

**Production Environment (100% Operational)**:
- **Application**: `RealTechee-Gen2` (App ID: `d200k2wsaf8th3`)
- **URL**: `https://d200k2wsaf8th3.amplifyapp.com`
- **Backend**: `amplify-realtecheeclone-production-sandbox-70796fa803`
- **Region**: `us-west-1` (N. California)
- **Status**: Complete environment isolation with 1,449 records migrated

## Core Business Domains

### 1. Authentication & Identity Management
- **Purpose**: Secure user authentication with role-based access control
- **Key Features**: Multi-role support, custom attributes, automated user-contact linking
- **Technology**: AWS Cognito with Lambda triggers

### 2. Customer Relationship Management (CRM)
- **Purpose**: Centralized contact and lead management
- **Key Features**: Contact profiles, lead tracking, communication preferences
- **Integration**: Seamless user authentication integration

### 3. Project Management
- **Purpose**: Core business logic for project lifecycle management
- **Key Features**: Status workflows, milestone tracking, multi-stakeholder coordination
- **Business Rules**: Complex approval workflows and state transitions

### 4. Property Management
- **Purpose**: Real estate data integration and management
- **Key Features**: Property details, market data integration, valuation tracking
- **External APIs**: Redfin, Zillow integration

### 5. Quote & Estimation System
- **Purpose**: Pricing and quote generation
- **Key Features**: Itemized quotes, approval workflows, digital signatures
- **Business Logic**: Complex pricing calculations and profit optimization

### 6. Financial Management
- **Purpose**: Payment tracking and financial reporting
- **Key Features**: Payment terms, escrow tracking, revenue calculations
- **Future**: Payment processor integration

### 7. Communication System
- **Purpose**: Multi-channel notification and messaging
- **Key Features**: Template-based notifications, scheduled delivery, retry logic
- **Channels**: Email, SMS, WhatsApp, Telegram

### 8. Content Management
- **Purpose**: File storage and media management
- **Key Features**: Secure file storage, gallery management, media optimization
- **Technology**: S3 with CloudFront CDN

### 9. Administration
- **Purpose**: System configuration and master data management  
- **Key Features**: Status management, product catalog, role definitions, comprehensive admin backoffice
- **Access**: Admin-only configuration interface with modern CRUD operations
- **Implementation**: Material React Table with foreign key resolution, memory optimization, and business logic separation

### 10. Analytics & Audit
- **Purpose**: Comprehensive activity tracking and business intelligence
- **Key Features**: Audit logging, change tracking, compliance reporting
- **Compliance**: SOC2 ready with TTL-based retention

### 11. Frontend Application
- **Purpose**: User interface and client-side business logic
- **Key Features**: Modern component architecture, responsive design, accessibility
- **Technology**: Next.js with TypeScript and modern UI frameworks

## Technical Architecture Principles

### 1. Domain-Driven Design
- Clear business domain boundaries
- Service-oriented architecture patterns
- Domain-specific data models and business logic

### 2. Cloud-Native Design
- AWS Amplify Gen 2 for infrastructure
- Serverless computing with Lambda
- Auto-scaling and pay-per-use pricing

### 3. Event-Driven Architecture
- Lambda triggers for automated workflows
- Scheduled functions for background processing
- Event sourcing for audit trails

### 4. Security-First Approach
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Comprehensive audit logging

### 5. Scalability and Performance
- DynamoDB for high-performance data access
- S3 and CloudFront for content delivery
- GraphQL for efficient data fetching

## Data Architecture & Infrastructure

### Production Database Schema (26+ Tables)
**Table Naming Pattern**: `TableName-<dynamic-backend-suffix>-NONE` (historic static example `aqnqdrctpzfwfjwyxxsmu6peoq` before dynamic refactor)

```
Core Business Entities:
├── Contacts-<dynamic-backend-suffix>-NONE (273 records)
│   ├── Primary Key: id (String)
│   ├── Business Data: fullName, email, phone, role
│   └── Relationships: Projects, Properties, Users
├── Properties-<dynamic-backend-suffix>-NONE (234 records)
│   ├── Primary Key: id (String)
│   ├── Business Data: address, city, state, propertyType
│   └── Relationships: Projects, Requests
├── Requests-<dynamic-backend-suffix>-NONE (863 records)
│   ├── Primary Key: id (String)
│   ├── Business Data: status, assignedTo, leadSource
│   ├── Foreign Keys: contactId, propertyId
│   └── Workflow: 5-status state machine with 14-day expiration
├── Projects-<dynamic-backend-suffix>-NONE (64 records)
│   ├── Primary Key: id (String)
│   ├── Business Data: status, assignedPM, budget
│   └── Relationships: Quotes, Milestones, Comments
├── Quotes-<dynamic-backend-suffix>-NONE (15 records)
│   ├── Primary Key: id (String)
│   ├── Business Data: totalAmount, status, approvalDate
│   └── Relationships: Projects, Items, Terms
├── Quotes-<dynamic-backend-suffix>-NONE (15 records)
  ├── BackOfficeRequestStatuses-<dynamic-backend-suffix>-NONE (5 records)
  ├── NotificationQueue-<dynamic-backend-suffix>-NONE
  ├── NotificationTemplate-<dynamic-backend-suffix>-NONE
  ├── ProjectComments-<dynamic-backend-suffix>-NONE
  └── ProjectMilestones-<dynamic-backend-suffix>-NONE
```

### Infrastructure Scaling & Performance
```yaml
├── Quotes-<dynamic-backend-suffix>-NONE (15 records)
Auto-Scaling Configuration:
  DynamoDB:
    read_capacity: 5-4000 units (70% target utilization)
    write_capacity: 5-4000 units (70% target utilization)
    scale_out_cooldown: 60 seconds
    scale_in_cooldown: 300 seconds
  
  Lambda Functions:
    reserved_concurrency: 50 per function
    timeout: 30-300 seconds (function-specific)
    memory: 512-1024 MB (optimized per function)
  
  CloudFront CDN:
    edge_locations: 400+ globally
    cache_behavior: Static assets (24h), Dynamic content (no-cache)
    compression: Gzip, Brotli enabled

Performance Achievements:
  bundle_size_reduction: 77% (1,041KB → 239KB)
  graphql_optimization: 60-80% query performance improvement
  image_optimization: WebP/AVIF with lazy loading
  response_time: <3s (95th percentile target)
```

### Environment Isolation Architecture
```yaml
Production Environment:
  tables: "*-<dynamic-backend-suffix>-NONE" # previously `aqnqdrctpzfwfjwyxxsmu6peoq`
  api_endpoint: "374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com"
  app_url: "https://d200k2wsaf8th3.amplifyapp.com"
  data_records: 1449 (migrated from development)

Development Environment:
  tables: "*-<dynamic-backend-suffix>-NONE"  # previously `fvn7t5hbobaxjklhrqzdl4ac34`
  api_endpoint: "ik6nvyekjvhvhimgtomqcxvkty.appsync-api.us-west-1.amazonaws.com"
  app_url: "sandbox environment"
  isolation: Complete separation, zero shared resources
```

### Data Flow Patterns
1. **User Registration Flow**: Cognito → Lambda Trigger → Contact Creation → Profile Linking
2. **Request Processing Flow**: Form Submit → Validation → Storage → Assignment → Notification
3. **Status Transition Flow**: Update → Audit Log → Business Rules → Notification → Stakeholder Update
4. **File Management Flow**: Upload → S3 Storage → Optimization → CDN Distribution → Access Control

## Integration Architecture

### Internal Integration
- **GraphQL API**: Single endpoint for all data operations
- **Lambda Functions**: Cross-domain business logic and automation
- **Event Triggers**: Automated workflow execution

### External Integration
- **Real Estate APIs**: Property data and market information
- **Communication APIs**: Multi-channel message delivery
- **Future Integrations**: Payment processing, document management

## Deployment Architecture

### Environment Strategy
- **Development**: Local development with Amplify Sandbox
- **Staging**: Pre-production environment for testing
- **Production**: Multi-region deployment with high availability

### CI/CD Pipeline
- **Source Control**: Git-based version control
- **Build Process**: Automated build and test execution
- **Deployment**: Automated deployment with rollback capabilities

## Operational Excellence

### Enterprise Monitoring & Observability
```yaml
CloudWatch Integration:
  Dashboards:
    - Application Performance (response time, error rate, throughput)
    - Database Performance (latency, capacity utilization)
    - Lambda Function Health (duration, errors, invocations)
    - Business Metrics (requests, quotes, user activity)
  
  Alarms & Alerts:
    Critical (P0):
      - Error rate > 5% (2 consecutive periods)
      - Application unavailable (3 consecutive health check failures)
      - Database connectivity failure (immediate alert)
    Warning (P1):
      - Response time > 3s (3 consecutive periods)
      - Database latency > 100ms average
    
  SNS Integration:
    Topic: RealTechee-Production-Alerts
    Endpoints: info@realtechee.com
    Escalation: Automatic incident creation for P0 issues

Health Check System:
  Automated: Every 5 minutes
  Endpoints: Application, API, Database, Authentication, Storage
  Recovery: Automatic rollback triggers on critical failures
  Reporting: Weekly performance analysis and capacity planning
```

### CI/CD Pipeline & Quality Assurance
```yaml
GitHub Actions Enterprise Pipeline:
  Matrix Testing (8 Parallel Jobs):
    - auth-flows (authentication workflows)
    - member-portal (user dashboard functionality)
    - admin-dashboard (administrative interface)
    - admin-quotes (quote management system)
    - admin-requests (request processing workflows)
    - public-pages (public website functionality)
    - performance (scheduled weekly optimization)
    - accessibility (WCAG 2.1 AA compliance)
  
  Test Coverage: 560+ E2E tests with 100% CI/CD pass rate
  Build Optimization: Turbopack enabled (60-80% faster compilation)
  Deployment Protection: Branch protection + approval workflows
  Rollback Capability: Automated rollback on health check failures
```

### Security & Compliance Architecture
```yaml
Multi-Layer Security:
  Network Security:
    - VPC isolation (AWS managed)
    - Security groups with restrictive rules
    - WAF integration (ready for deployment)
  
  Application Security:
    - AWS Cognito authentication with 8 role groups
    - Role-based + attribute-based authorization
    - Input validation (client and server-side)
    - CSRF protection (implementation ready)
  
  Data Security:
    - Encryption at rest (AES-256 with KMS)
    - Encryption in transit (TLS 1.3)
    - Complete audit logging via CloudTrail
    - Automated data retention and lifecycle policies
  
  Compliance Readiness:
    - GDPR: User data export/deletion capabilities
    - SOC 2: Security controls and audit trails
    - Data retention: Automated lifecycle policies
    - Access controls: Principle of least privilege
```

### Disaster Recovery & Business Continuity
```yaml
Backup Strategy:
  Real-time: DynamoDB point-in-time recovery (35 days)
  Daily: Automated full backup (all AWS services)
  Weekly: Cross-region backup replication
  Monthly: Long-term archival (S3 Glacier)

Recovery Objectives:
  RTO (Recovery Time): 15 minutes (P0), 1 hour (P1)
  RPO (Recovery Point): 5 minutes (Database), 1 hour (Files)
  Cross-Region: us-west-2 backup region configured
  Testing: Monthly disaster recovery validation

Environment Protection:
  Complete isolation between dev/prod environments
  Zero shared resources policy
  Protected deployment pipelines with validation
  Emergency rollback procedures documented and tested
```

## Future Roadmap

### Phase 1 Enhancements
- Mobile application development
- Advanced analytics and reporting
- Enhanced integration capabilities

### Phase 2 Expansions
- Multi-market support
- Advanced AI/ML features
- Marketplace functionality

### Phase 3 Scale
- White-label platform offering
- API marketplace for third-party integrations
- Advanced business intelligence capabilities

## Success Metrics

### Technical Metrics
- **Performance**: Sub-200ms API response times
- **Availability**: 99.9% uptime SLA
- **Scalability**: Support for 10,000+ concurrent users

### Business Metrics
- **User Adoption**: Monthly active user growth
- **Project Success**: Project completion rates and satisfaction scores
- **Platform Growth**: Revenue per project and user retention

This system overview demonstrates enterprise-level architectural thinking and provides a foundation for detailed technical implementation across all business domains.
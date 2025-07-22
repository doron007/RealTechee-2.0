# Authentication & Identity Management Domain

## Overview

The Authentication domain provides comprehensive identity and access management for the RealTechee 2.0 platform. This domain handles user registration, authentication, authorization, and role-based access control across all platform features.

## Domain Responsibilities

### Core Functions
- **User Registration & Login**: Secure user account creation and authentication
- **Role-Based Access Control**: Multi-tier user permissions and access management
- **Custom User Attributes**: Business-specific user profile enhancement
- **Automated User-Contact Linking**: Seamless integration with CRM domain
- **Session Management**: Secure session handling and token management
- **Password Management**: Secure password policies and reset functionality

### Business Rules
- New users are automatically assigned to appropriate groups based on registration context
- Contact records are automatically linked to user accounts during registration
- User attributes are synchronized with business entities (contacts, projects)
- Role changes require administrative approval and audit logging

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Authentication Domain                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Cognito       │  │ Post-Confirm    │  │ User Admin  │  │
│  │   User Pool     │  │    Lambda       │  │   Lambda    │  │
│  │                 │  │                 │  │             │  │
│  │ - User Storage  │  │ - Auto Linking  │  │ - Role Mgmt │  │
│  │ - Groups        │  │ - Contact Sync  │  │ - User Ops  │  │
│  │ - Attributes    │  │ - Audit Trail   │  │ - Group Ops │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│           │                     │                   │       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                Integration Layer                        │  │
│  │  - GraphQL Auth Directives                             │  │
│  │  - Frontend Auth Context                               │  │
│  │  - API Authorization                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## User Roles and Permissions

### Role Hierarchy
1. **super_admin** - Full system access, all administrative functions
2. **admin** - Platform administration, user management, system configuration
3. **accounting** - Financial data access, payment management, reporting
4. **srm** - Senior relationship management, client oversight, project coordination
5. **agent** - Real estate agent functions, client projects, limited administrative access
6. **homeowner** - Property owner access, project viewing, communication
7. **provider** - Service provider access, project participation, resource management
8. **guest** - Limited public access, form submissions, general information

### Permission Matrix
| Function | super_admin | admin | accounting | srm | agent | homeowner | provider | guest |
|----------|-------------|-------|------------|-----|-------|-----------|----------|-------|
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Project Management | ✅ | ✅ | 📖 | ✅ | ✅ | 📖 | 📖 | ❌ |
| Financial Data | ✅ | ✅ | ✅ | ✅ | 📖 | 📖 | ❌ | ❌ |
| Contact Management | ✅ | ✅ | 📖 | ✅ | ✅ | 📖 | ❌ | ❌ |
| System Configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Public Content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Full Access, 📖 Read Only, ❌ No Access

## Custom User Attributes

### Business Integration Attributes
- **contactId**: Links user account to CRM contact record
- **membershipTier**: Defines user's service level (basic, premium, enterprise)
- **role**: Primary business function within the platform
- **onboardingComplete**: Tracks user onboarding completion status
- **lastProjectId**: References user's most recent project for quick access
- **preferredNotificationMethod**: User's preferred communication channel

### Profile Enhancement Attributes
- **businessLicense**: Professional license numbers for agents and providers
- **certifications**: Professional certifications and qualifications
- **serviceAreas**: Geographic areas of operation
- **specializations**: Areas of expertise or focus
- **companyAffiliation**: Business entity associations

## Key Integrations

### Internal Domain Dependencies
- **CRM Domain**: Automatic contact linking and profile synchronization
- **Project Management**: Role-based project access and participation
- **Communication**: User preference integration for notifications
- **Analytics**: User activity tracking and audit trails

### External Service Dependencies
- **AWS Cognito**: Core identity provider and authentication service
- **Frontend Context**: React context providers for authentication state
- **GraphQL API**: Authorization directives and access control

## Security Features

### Authentication Security
- **Multi-Factor Authentication (MFA)**: Optional MFA for enhanced security
- **Password Policies**: Strong password requirements and rotation policies
- **Account Lockout**: Brute force protection with progressive delays
- **Session Management**: Secure token handling with automatic expiration

### Authorization Security
- **Least Privilege**: Users granted minimum necessary permissions
- **Dynamic Authorization**: Real-time permission checking based on context
- **Audit Logging**: Complete tracking of authentication and authorization events
- **Cross-Domain Validation**: Consistent authorization across all business domains

## Data Models

### Primary Entities
- **User**: Core user identity and authentication data
- **UserGroup**: Role-based group memberships
- **UserAttributes**: Custom business attributes and profile data
- **AuthSession**: Active session tracking and management

### Relationships
- User ↔ Contact (CRM Domain): One-to-one bidirectional linking
- User ↔ Projects (Project Domain): Many-to-many through roles
- User ↔ NotificationPreferences (Communication Domain): One-to-many

## API Endpoints

### Authentication Operations
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `POST /auth/refresh` - Token refresh
- `POST /auth/forgot-password` - Password reset initiation
- `POST /auth/confirm-password` - Password reset completion

### User Management Operations
- `GET /users/profile` - Current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/permissions` - Current user permissions
- `POST /admin/users` - Create user (admin only)
- `PUT /admin/users/{id}` - Update user (admin only)
- `DELETE /admin/users/{id}` - Delete user (admin only)

## Monitoring and Metrics

### Key Performance Indicators
- **Authentication Success Rate**: Target > 99.5%
- **Average Login Time**: Target < 500ms
- **Session Duration**: Average user session length
- **MFA Adoption Rate**: Percentage of users with MFA enabled

### Security Metrics
- **Failed Login Attempts**: Monitoring for brute force attacks
- **Privilege Escalation Attempts**: Unauthorized access attempts
- **Suspicious Activity**: Unusual login patterns or locations
- **Audit Trail Completeness**: 100% event logging coverage

## Troubleshooting Guide

### Common Issues
- **Login Failures**: Password reset, account lockout, MFA issues
- **Permission Errors**: Role misassignment, attribute synchronization
- **Integration Issues**: Contact linking failures, attribute updates
- **Performance Issues**: Slow authentication, session timeouts

### Diagnostic Tools
- CloudWatch authentication metrics
- Cognito user pool logs
- Lambda function execution logs
- GraphQL authorization traces

This authentication domain provides the secure foundation for all platform operations while maintaining flexibility for future enhancements and integrations.
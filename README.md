# RealTechee Gen 2 Platform
**Version: 4.1.0** | **Status: Production Ready** | **Enterprise-Grade Platform**

A comprehensive real estate technology platform built with Next.js and AWS Amplify Gen 2, featuring complete CRM, project management, and notification systems.

## 🎯 **Current Status: 100% Production Ready**
- ✅ **Core Platform**: Complete admin system with 560+ E2E tests
- ✅ **Production Infrastructure**: Full dev/staging/prod environment isolation
- ✅ **Performance**: 77% bundle reduction + GraphQL optimization
- ✅ **Monitoring**: CloudWatch dashboards + SNS alerts operational
- ✅ **Security**: Role-based access control (8 user types) + branch protection

## 🚀 **Key Features**
- **Advanced Admin Dashboard**: Complete CRUD operations for all business entities
- **Multi-Channel Notifications**: Email (AWS SES) + SMS (Twilio) with template system
- **Project Management**: Full lifecycle tracking with milestones and payments
- **Role-Based Security**: 8-tier user role system (guest → super_admin)
- **Real-Time Updates**: GraphQL subscriptions and optimistic UI updates
- **Mobile-First Design**: Responsive interface with WCAG 2.1 AA compliance

## 📚 **Complete Documentation**

Comprehensive documentation is organized under `/docs/` with the following structure:

### **📋 Core Documentation Structure**
- **[00-overview/](docs/00-overview/)** - Executive summary, system overview, architecture
- **[01-requirements/](docs/01-requirements/)** - User stories, business requirements, planning
- **[02-design/](docs/02-design/)** - Architectural decisions, design patterns
- **[03-domains/](docs/03-domains/)** - Domain-specific implementations (auth, CRM, admin, etc.)
- **[04-implementation/](docs/04-implementation/)** - Technical implementation guides
- **[05-testing/](docs/05-testing/)** - Testing strategies, coverage reports, frameworks
- **[06-deployment/](docs/06-deployment/)** - AWS Amplify Gen 2 deployment guides
- **[07-operations/](docs/07-operations/)** - Production monitoring, logging, troubleshooting
- **[08-marketing/](docs/08-marketing/)** - SEO strategy, social media assets
- **[09-migration/](docs/09-migration/)** - Data migration guides and reports
- **[10-appendices/](docs/10-appendices/)** - Session summaries, legacy docs, references

### **🚀 Quick Start Guides**
- **Development Setup**: [docs/04-implementation/project-structure.md](docs/04-implementation/project-structure.md)
- **AWS Deployment**: [docs/06-deployment/aws-amplify-gen2-complete-guide.md](docs/06-deployment/aws-amplify-gen2-complete-guide.md)
- **Testing Framework**: [docs/05-testing/comprehensive-test-framework.md](docs/05-testing/comprehensive-test-framework.md)
- **Admin System**: [docs/03-domains/09-administration/README.md](docs/03-domains/09-administration/README.md)

### **🔧 Environment Configuration**
Dynamic environment configuration with no hardcoded IDs:
- See: [docs/06-deployment/ENVIRONMENT_CONFIG_DYNAMIC_PLAN.md](docs/06-deployment/ENVIRONMENT_CONFIG_DYNAMIC_PLAN.md)
- Table naming: `ModelName-<BACKEND_SUFFIX>-NONE`
- Commands: `npm run render:configs`, `npm run smoke:staging`, `npm run verify:env-contract`

## Technologies Used

- Next.js
- React
- CSS
- TypeScript
- Server-side API routes for media processing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ **Project Structure**

```
├── /components/          # React components (feature-based organization)
├── /app/                 # Next.js 13+ App Router pages and API routes  
├── /pages/               # Next.js pages and API routes
├── /public/              # Static assets and media files
├── /styles/              # Global CSS and styling files
├── /utils/               # Utility functions and helpers
├── /services/            # 🔧 Business logic organized by domain:
│   ├── /core/            #   - Base services and utilities
│   ├── /business/        #   - Domain-specific business logic
│   ├── /notifications/   #   - All notification-related services  
│   ├── /admin/           #   - Admin-specific services
│   ├── /analytics/       #   - Analytics and tracking services
│   └── /interfaces/      #   - Type definitions and contracts
├── /scripts/             # Development, testing, and deployment automation
├── /amplify/             # AWS Amplify Gen 2 backend configuration
├── /tests/               # Unit and integration tests
├── /e2e/                 # End-to-end Playwright test suites
├── /docs/                # 📚 Complete project documentation (see above)
└── /CLAUDE.md            # AI agent instructions and session context
```

### **🔧 Key Development Commands**
- `npm run dev:primed` - Development server with page priming (recommended)
- `npm run build && npm run type-check` - Production build validation
- `npm run test:e2e` - End-to-end testing (manual QA recommended)
- `npx ampx sandbox` - Deploy backend to AWS

## 🎯 **Production Deployment**

**Current Status**: 100% Production Ready with simplified Git-based workflow

### **AWS Amplify Gen 2 Single-App Multi-Branch Architecture**
```bash
# Development → Staging → Production Pipeline
git checkout staging && git merge main && git push origin staging     # Deploy to staging
git checkout production && git merge staging && git push origin production  # Deploy to production
```

**Live Environments**:
- **Staging**: `https://staging.d200k2wsaf8th3.amplifyapp.com`
- **Production**: `https://production.d200k2wsaf8th3.amplifyapp.com`

**Test Credentials**: `info@realtechee.com` / `Sababa123!`

### **📊 Enterprise Features**
- **Multi-Channel Notifications**: AWS SES + Twilio SMS with template system
- **Role-Based Security**: 8-tier access control (guest → super_admin)
- **Real-Time Dashboard**: Complete admin interface with 560+ E2E tests
- **Production Monitoring**: CloudWatch dashboards + SNS alerts
- **Data Protection**: Automated backup/restore with environment isolation

For complete deployment guide: [docs/06-deployment/](docs/06-deployment/)
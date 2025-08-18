# CLAUDE.md - AI Agent Guide for RealTechee 2.0

## 🎯 **PROJECT STATUS: Production-Ready Platform**

### **Current State (August 18, 2025)**
- **Platform**: Complete enterprise-grade system with real-time notification monitoring ✅
- **Production**: www.realtechee.com operational with isolated backend ✅  
- **Scale**: Optimized for 100-1000 visitors/month with room for 10x growth ✅
- **Infrastructure**: AWS Amplify Gen 2 with automated deployment pipeline ✅
- **Business Focus**: Ready for lead conversion optimization and growth features ✅

### **✅ CORE SYSTEMS OPERATIONAL**
- **User Management**: AWS Cognito with 8 role types, admin interface
- **Form Processing**: All 4 forms with signal-driven notification system
- **Admin Dashboard**: Complete request/project/contact management
- **Real-time Monitoring**: Live notification tracking with retry functionality
- **Testing**: Manual QA recommended (E2E automation unreliable)
- **Environment**: Dev/Staging/Production with automated deployments

---

## 🔧 **ESSENTIAL DEVELOPMENT COMMANDS**

### **Development**
- `npm run dev:primed` - ⭐ RECOMMENDED: Server + auto-prime (Turbopack enabled)
- `npm run type-check` - TypeScript validation (required for production)
- `npm run build` - Production build validation
- `npx ampx sandbox` - Deploy backend changes

### **Testing & QA**
- **Manual Testing**: `info@realtechee.com` / `Sababa123!`
- Focus on real user workflows and business impact
- Test forms, admin functions, and notification delivery

### **Deployment**
```bash
# Staging deployment
git checkout staging && git merge main && git push origin staging

# Production deployment  
git checkout production && git merge staging && git push origin production
```

### **Data Protection**
- `./scripts/backup-data.sh` - **MANDATORY** before any schema changes
- AWS will purge data without warning on schema recreation

---

## 📋 **ARCHITECTURE GUIDELINES**

### **Component Priority (COO: Component-Oriented Output)**
1. **Existing Components** - Always use what's already built
2. **Typography System** - H1-H6, P1-P3 with semantic hierarchy
3. **MUI/MUI-X** - Comprehensive UI library for admin interfaces
4. **Custom Components** - Only when existing options don't fit

### **Available Components**
```typescript
// Typography (semantic, responsive)
<H1>, <H2>, <H3>, <H4>, <H5>, <H6>
<P1>, <P2>, <P3>

// UI Components  
<Button>, <Card>, <StatusPill>, <Tooltip>
<FeatureCard>, <BenefitCard>, <TagLabel>

// Forms
<FormInput>, <FormTextarea>, <FormDropdown> 
<FormDateInput>, <FormFileUpload>

// Admin
<AdminCard>, <AdminDataGrid>, <VirtualizedDataGrid>
<BaseModal>, <ContactModal>, <PropertyModal>

// Layout
<Layout>, <Section>, <Header>, <Footer>
<ContentWrapper>, <GridContainer>
```

### **Code Standards**
- **TypeScript Strict**: Zero errors required for production
- **No Comments**: Unless explicitly requested by user
- **Existing Components First**: Never create new without approval  
- **Props-Only Styling**: No external CSS dependencies
- **Business Value Focus**: Every change should impact lead generation or efficiency

---

## 🗄️ **DATABASE ARCHITECTURE**

### **Environment Setup**
- **Development**: `*-fvn7t5hbobaxjklhrqzdl4ac34-*` (shared main/staging)
- **Production**: `*-aqnqdrctpzfwfjwyxxsmu6peoq-*` (isolated)

### **Core Business Tables**
- `Requests` - Form submissions and lead management
- `Contacts` - Customer and agent contact records  
- `Projects` - Project management and tracking
- `Properties` - Property information
- `SignalEvents` - Real-time notification events
- `NotificationQueue` - Email/SMS delivery tracking

### **Data Access Patterns**
```typescript
// Standard pattern for business features
import { generateClient } from 'aws-amplify/api';
import { requestsAPI } from '../utils/amplifyAPI';

const client = generateClient({ authMode: 'apiKey' });

// Use GraphQL for complex queries
const result = await client.graphql({
  query: LIST_REQUESTS_WITH_RELATIONS,
  variables: { limit: 100 }
});

// Use API utilities for simple operations
const updateResult = await requestsAPI.update(requestId, updates);
```

---

## 🎯 **SESSION WORKFLOW**

### **Business-Focused Development Protocol**
1. **Read TASKS.md** - Focus on business priorities and user value
2. **Review Current Priority** - Lead conversion, process automation, or UX
3. **Implement with Impact** - Measure business metrics and user experience
4. **Test Real Scenarios** - Use actual user workflows, not just technical testing
5. **Deploy to Staging** - Validate business value before production

### **Key Success Questions**
- Does this improve lead conversion rates?
- Does this reduce manual admin work?  
- Does this improve user experience?
- Does this help the business scale?
- Is this measurable and trackable?

### **Implementation Rules**
- **Business Value First** - Every feature should impact revenue or efficiency
- **Use Existing Components** - Don't reinvent what's already built
- **Test with Real Users** - Focus on actual homeowner/agent workflows  
- **Measure Impact** - Track conversion rates, processing times, user satisfaction
- **Scale Appropriately** - Build for 10x growth, not 1000x growth

---

## 📊 **NOTIFICATION SYSTEM GUIDE**

### **Current State: 100% Complete**
All forms emit signals → Lambda processes → Email/SMS delivered
- Real-time admin monitoring at `/admin/notification-monitor`
- Automatic retry for failed deliveries
- Professional email templates with file support
- SMS notifications via Twilio

### **For New Forms/Notifications**
```typescript
// Signal emission pattern
import { signalEmitter } from '@/services/signalEmitter';

await signalEmitter.emitFormSubmission('new_form_type', {
  customerName: formData.name,
  customerEmail: formData.email,
  // ... other form data
  dashboardUrl: `${window.location.origin}/admin/path/${recordId}`
});
```

**Template Management**: Use `/admin/notifications` for template editing

---

## 🚨 **CRITICAL GUIDELINES**

### **Production Safety**
- **Always backup** before schema changes
- **Test business workflows** in staging first
- **Focus on user value** over technical perfectionism
- **Measure real impact** with business metrics

### **Business Focus**
- **Lead conversion** is the #1 priority
- **Process automation** saves time and reduces errors
- **User experience** impacts conversion rates
- **Content/SEO** drives organic traffic growth

### **Scale Appropriately**
- Build for current scale (100-1000 visitors/month)
- Design for 10x growth potential  
- Don't over-engineer for enterprise scale
- Focus on high-impact, low-effort improvements

---

## 💡 **DEVELOPMENT PHILOSOPHY**

**Business Impact > Technical Perfection**
Every hour of development should contribute to:
1. More leads from the website
2. Higher conversion rates
3. Reduced manual work
4. Better user experience
5. Scalable business processes

**User-Centric Design**
- Think like a homeowner looking for renovation services
- Consider agent workflows and efficiency
- Optimize admin tasks for daily use
- Make complex processes simple and intuitive

**Measurable Results**
- Track form submission rates
- Monitor lead quality scores  
- Measure admin task completion times
- Analyze user behavior and conversion funnels
- A/B test important changes

---

*System Status: **PRODUCTION READY** - Focus on Business Growth*
*Last Updated: August 18, 2025*
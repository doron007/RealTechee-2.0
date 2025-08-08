# NOTIFICATION SYSTEM RESEARCH ANALYSIS

## **EXECUTIVE SUMMARY**

This document provides a comprehensive analysis of the current RealTechee notification system architecture and specifications for implementing secure, role-based notifications for Contact Us, Get Qualified, and Affiliate form submissions.

**Current Status**: ✅ Get Estimate notifications fully operational with 2 templates  
**Requirements**: Implement notifications for 3 additional forms (6 new templates needed)  
**Priority**: HIGH - Essential for complete lead management workflow  

---

## **1. CURRENT NOTIFICATION ARCHITECTURE**

### **1.1 System Overview**
```
Form Submission → NotificationService.queue() → NotificationQueue (DynamoDB)
                                            ↓
AWS EventBridge Scheduler → Lambda Processor → Template Processing
                                            ↓
SES Email Handler + Twilio SMS Handler → Delivery + Event Logging
```

### **1.2 Core Components**

| Component | Purpose | Status | Location |
|-----------|---------|---------|----------|
| **NotificationService** | Frontend service for queueing notifications | ✅ Production | `/utils/notificationService.ts` |
| **Lambda Processor** | Scheduled processor for notification queue | ✅ Production | `/amplify/functions/notification-processor/` |
| **Template Engine** | Handlebars template processing with helpers | ✅ Production | `src/services/templateProcessor.ts` |
| **SES Email Handler** | AWS SES email delivery with bounce handling | ✅ Production | `src/handlers/sesEmailHandler.ts` |
| **SMS Handler** | Twilio SMS with chunking and MMS support | ✅ Production | `src/handlers/smsHandler.ts` |
| **Event Logger** | Comprehensive delivery tracking and analytics | ✅ Production | `src/utils/eventLogger.ts` |

---

## **2. DATABASE SCHEMA ANALYSIS**

### **2.1 Core Tables**

**NotificationQueue** (Main Queue):
```typescript
{
  id: string (primary key)
  eventType: string           // 'get_estimate_request', 'contact_us', etc.
  payload: JSON               // Form data for template injection
  recipientIds: JSON          // Array of contact/user IDs
  channels: JSON              // ['EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM']
  templateId: string          // Links to NotificationTemplate
  status: enum                // 'PENDING', 'SENT', 'FAILED', 'RETRYING'
  scheduledAt?: datetime      // For delayed sending
  retryCount?: number         // Auto-retry mechanism
  errorMessage?: string       // Failure details
  sentAt?: datetime          // Delivery timestamp
}
```

**NotificationTemplate** (Template Storage):
```typescript
{
  id: string (primary key)     // e.g., 'contact-us-email-template-001'
  name: string                 // Human-readable name
  subject?: string             // Email subject (Handlebars template)
  contentHtml?: string         // Email HTML body
  contentText?: string         // SMS/plain text version
  channel: enum                // 'EMAIL', 'SMS', 'TELEGRAM', 'WHATSAPP'
  variables: JSON              // Required template variables
  isActive: boolean            // Template enable/disable
}
```

**NotificationEvents** (Delivery Tracking):
```typescript
{
  eventId: string
  notificationId: string       // Links to NotificationQueue
  eventType: enum              // 'EMAIL_SUCCESS', 'SMS_FAILED', etc.
  channel: enum                // Delivery channel
  recipient: string            // Email/phone number
  provider: enum               // 'SES', 'TWILIO', 'DEBUG'
  providerId?: string          // SES MessageId, Twilio SID
  errorCode?: string           // Provider-specific error codes
  timestamp: datetime
  processingTimeMs?: number
}
```

### **2.2 User Management Integration**

**Contacts Table** (Role-Based Recipients):
```typescript
{
  id: string
  email: string
  phone?: string
  roleType?: string            // 'AE', 'PM', 'Admin', 'Customer'
  emailNotifications: boolean  // Default: true
  smsNotifications: boolean    // Default: false
  canReceiveNotifications: boolean // Master toggle
  assignmentPriority: number   // 1=highest priority for assignments
  isActive: boolean           // Active for assignments
}
```

**BackOfficeAssignTo** (Current AE System):
```typescript
{
  name: string                 // AE name
  email: string                // AE email
  mobile?: string              // Phone number
  sendEmailNotifications: boolean
  sendSmsNotifications: boolean
  active: boolean              // Currently active
  order: number                // Assignment priority
}
```

---

## **3. CURRENT IMPLEMENTATION STATUS**

### **3.1 Get Estimate Form** ✅ COMPLETE
- **Integration**: Lines 506-517 in `/pages/contact/get-estimate.tsx`
- **Method**: `NotificationService.queueGetEstimateNotification()`
- **Templates**: 2 templates deployed
  - `get-estimate-template-001` (EMAIL)
  - `get-estimate-sms-template-001` (SMS)
- **Features**: 
  - Admin URL generation for request navigation
  - Customer preference filtering
  - Multi-channel delivery (Email + SMS)
  - Professional HTML email design
  - SMS optimization with chunking

### **3.2 Missing Forms** ❌ NOT IMPLEMENTED
1. **Contact Us** - General inquiries
2. **Get Qualified** - Agent qualification requests  
3. **Affiliate** - Service provider applications

---

## **4. TEMPLATE SYSTEM ANALYSIS**

### **4.1 Template Processing Engine**
- **Technology**: Handlebars with custom helpers
- **Helpers Available**:
  - `formatDate(date, format)` - Date formatting
  - `uppercase(str)` - String transformation
  - `eq(a, b)` - Conditional logic
  - `default(value, defaultValue)` - Fallback values
  - `join(array, separator)` - Array joining

### **4.2 Existing Get Estimate Templates**

**Email Template Features**:
- Professional responsive HTML design
- RealTechee branding and logo
- Structured customer/property/project sections
- Admin CTA button for request management
- Priority response time messaging
- JSON data embedding for processing

**SMS Template Features**:
- Concise 160-character optimization
- Essential information only
- Direct admin link for mobile access
- Priority response indicator

### **4.3 Template Variable System**
Templates use variable validation to ensure required data:
```javascript
variables: JSON.stringify([
  'customer.name', 'customer.email', 'customer.phone',
  'property.address', 'project.product', 
  'admin.requestUrl', 'admin.dashboardUrl'
])
```

---

## **5. SECURITY & DEVELOPMENT SAFETY**

### **5.1 Current Security Measures**

**Debug Mode Implementation**:
- Parameter Store: `/realtechee/notifications/debug_mode`
- When enabled:
  - All emails redirect to `debugEmail` (info@realtechee.com)
  - SMS redirected to `debugPhone` (+17135919400)
  - Debug envelope information added to content
  - Original recipient info preserved in message

**Recipient Resolution**:
```typescript
// Current production recipient logic
if (globalConfig.notifications.debugMode) {
  return [{
    id: 'debug',
    email: globalConfig.notifications.debugEmail,
    phone: globalConfig.notifications.debugPhone,
    name: 'Debug Recipient'
  }];
}

// Production fallback
recipients.push({
  id: 'ae-primary',
  email: 'info@realtechee.com',
  phone: '+17135919400',
  name: 'RealTechee AE Team'
});
```

### **5.2 AWS Parameter Store Configuration**
**Required Parameters**:
```
/realtechee/ses/from_email
/realtechee/twilio/account_sid
/realtechee/twilio/auth_token
/realtechee/twilio/from_phone
/realtechee/notifications/debug_mode        # 'true'/'false'
/realtechee/notifications/debug_email       # 'info@realtechee.com'
/realtechee/notifications/debug_phone       # '+17135919400'
```

### **5.3 Email Reputation Management**
- **Bounce Handling**: SES bounce notifications processed
- **Suppression List**: `EmailSuppressionList` table for compliance
- **Reputation Monitoring**: `SESReputationMetrics` for delivery health
- **Rate Limiting**: Built into SES and Twilio handlers

---

## **6. IMPLEMENTATION REQUIREMENTS**

### **6.1 Required New Templates** (6 Total)

| Form | Email Template ID | SMS Template ID |
|------|------------------|-----------------|
| Contact Us | `contact-us-email-template-001` | `contact-us-sms-template-001` |
| Get Qualified | `get-qualified-email-template-001` | `get-qualified-sms-template-001` |
| Affiliate | `affiliate-email-template-001` | `affiliate-sms-template-001` |

### **6.2 Form Integration Points**

**Contact Us** (`/pages/contact/contact-us.tsx`):
- Line 271: After successful ContactUs record creation
- Data available: General inquiry details, customer info, property address

**Get Qualified** (`/pages/contact/get-qualified.tsx`):
- Line 325: After successful agent qualification submission
- Data available: Agent credentials, license info, brokerage details

**Affiliate** (`/pages/contact/affiliate.tsx`):  
- Line 290: After successful Affiliates record creation
- Data available: Service provider info, company details, certifications

### **6.3 NotificationService Extensions Required**

**New Methods**:
```typescript
NotificationService.queueContactUsNotification(data)
NotificationService.queueGetQualifiedNotification(data) 
NotificationService.queueAffiliateNotification(data)
```

**Data Mapping**:
- Map form-specific data to generic notification payload structure
- Handle different record types (ContactUs, ContactUs, Affiliates)
- Generate appropriate admin URLs for each form type

---

## **7. RECIPIENT FILTERING & ROLE MANAGEMENT**

### **7.1 Current AE Assignment System**
**Active AEs** (from BackOfficeAssignTo):
```
Ram (ram@realtechee.com) - Order: 1, SMS: ✅, Email: ✅, Active: ❌
Meir (bd@realtechee.com) - Order: 2, SMS: ✅, Email: ✅, Active: ❌  
Doron (doron@realtechee.com) - Order: 3, SMS: ✅, Email: ✅, Active: ✅
Joey (joey@realtechee.com) - Order: 4, SMS: ❌, Email: ✅, Active: ❌
Demo (demo@realtechee.com) - Order: 9, SMS: ✅, Email: ✅, Active: ✅
```

**Current Production Setup**: All notifications go to `info@realtechee.com` as fallback

### **7.2 Development Safety Requirements**
1. **Restrict to info@realtechee.com only** during development
2. **Clear test data marking** with `leadSource: 'E2E_TEST'`
3. **Debug mode envelope** for testing notification content
4. **Isolated test sessions** with unique identifiers

---

## **8. TESTING & VALIDATION STRATEGY**

### **8.1 Template Validation**
- **Handlebars compilation** testing for syntax errors
- **Variable injection** testing with sample data
- **Responsive email** testing across email clients
- **SMS length optimization** and chunking validation

### **8.2 Delivery Testing**  
- **Debug mode validation** - emails redirect correctly
- **Multi-channel testing** - Email + SMS delivery
- **Error handling** - Invalid recipients, API failures
- **Event logging** - Complete delivery tracking

### **8.3 Playwright Integration**
**Test Scenarios**:
- Form submission triggers notification queue
- Debug mode restrictions enforced
- Template rendering with form data
- Admin URL generation accuracy

---

## **9. IMPLEMENTATION TIMELINE**

### **Phase 1: Template Creation** (Day 1)
- [ ] Create 6 new templates (3 forms × 2 channels)
- [ ] Deploy templates to production DynamoDB
- [ ] Validate template compilation and variables

### **Phase 2: Service Integration** (Day 2)
- [ ] Extend NotificationService with 3 new methods
- [ ] Integrate notification calls into form submission handlers
- [ ] Implement form-specific data mapping

### **Phase 3: Testing & Validation** (Day 3)
- [ ] Comprehensive template testing with real form data
- [ ] Debug mode validation and safety testing
- [ ] Playwright test integration
- [ ] Production deployment validation

---

## **10. SECURITY CHECKLIST**

### **Development Environment**
- [ ] ✅ Debug mode enables email/SMS redirection
- [ ] ✅ All notifications restricted to info@realtechee.com
- [ ] ✅ Test data clearly marked with leadSource flags
- [ ] ✅ Debug envelope information added to messages

### **Production Environment**  
- [ ] ✅ Proper recipient resolution from active AE list
- [ ] ✅ Email bounce/complaint handling operational
- [ ] ✅ Rate limiting and reputation monitoring active
- [ ] ✅ Audit trail for all notification events

### **Template Security**
- [ ] ✅ Input sanitization in template processor
- [ ] ✅ No sensitive data exposure in templates
- [ ] ✅ HTML email security (no external resources)
- [ ] ✅ SMS content length and format validation

---

## **CONCLUSION**

The RealTechee notification system is architecturally sound and production-ready for extension. The existing Get Estimate implementation provides a solid foundation for the 3 missing forms. Key implementation focus areas:

1. **Template Creation**: 6 new professional templates following existing design patterns
2. **Service Integration**: Extend NotificationService with form-specific methods  
3. **Safety Measures**: Maintain development environment restrictions
4. **Testing**: Comprehensive validation across all delivery channels

**Estimated Implementation**: 3 days for complete rollout with testing  
**Risk Level**: LOW - Building on proven, production-tested architecture  
**Business Impact**: HIGH - Completes lead management notification workflow

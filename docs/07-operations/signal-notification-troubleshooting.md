# Signal-Notification System Troubleshooting Guide

## 🚨 **CRITICAL DEBUGGING METHODOLOGY**

### **⚡ What Works: Step-by-Step Validation**

**Problem**: Complex signal-notification system took several days to troubleshoot
**Root Cause**: Making multiple changes simultaneously, then debugging compound failures

**Successful Solution**: Break into small, validated steps

#### **Working Pattern (PROVEN)**:
1. **Stop and validate after each small step** - Don't chain multiple changes
2. **Test each component in isolation** - Signal emission → Hook matching → Template processing
3. **Verify data at each layer** - Check database records before proceeding
4. **Use simple payloads first** - Add complexity only after basic flow works
5. **Ask for validation** - Claude should confirm each step works before continuing

#### **Anti-Pattern (AVOID)**:
- Making multiple changes simultaneously 
- Debugging complex failures with multiple unknowns
- Assuming components work without testing each step
- Using complex data before validating simple cases

---

## 🏗️ **DATA ACCESS LAYER CRITICAL PATTERNS**

### **❌ NEVER USE: Direct GraphQL in Business Logic**

**Problem**: Caused days of debugging, schema validation issues, optional field problems

```typescript
// DON'T DO THIS - Caused days of debugging
const client = generateClient<Schema>({ authMode: 'apiKey' });
const result = await client.graphql({ query: customQuery });
```

### **✅ ALWAYS USE: Service Layer Pattern (Like Projects)**

**Why This Works**: Proven pattern used successfully by Projects service

```typescript
// DO THIS - Follow proven patterns
import { projectsAPI } from '../utils/amplifyAPI';
import { requestsAPI } from '../utils/amplifyAPI';

// Standard CRUD operations
const result = await projectsAPI.update(projectId, updates);
const requests = await requestsAPI.list();
```

#### **Why Service Layer Works**:
1. **Schema Safety**: Uses generated types, catches breaking changes at compile time
2. **Consistent Error Handling**: Standardized across all models
3. **Optional Field Management**: Handles optional schema fields correctly
4. **Browser/Lambda Compatibility**: Works in both environments
5. **Type Safety**: Prevents runtime type errors

#### **🚨 Schema & Optional Fields Critical Issue**
**Problem**: Direct GraphQL ignores optional field validation
**Example**: `signalType` field missing caused Lambda failures for hours
**Solution**: Service layer enforces schema requirements and validates optional fields

**Correct Pattern**:
```typescript
// Service validates all required fields
interface SignalEventInput {
  signalType: string;        // REQUIRED - service validates
  payload?: string;          // OPTIONAL - service handles gracefully
  processed?: boolean;       // OPTIONAL - service provides defaults
}
```

---

## ⚙️ **EVENT BRIDGE AUTOMATION LESSONS**

### **❌ Current Issue: EventBridge Schedule Syntax**

**Problem**: Amplify Gen 2 schedule syntax unknown, causes deployment failures

```typescript
// BROKEN - Amplify Gen 2 syntax unknown
schedule: 'rate(2 minutes)', // Causes deployment failures
```

### **✅ Working Alternative: Manual Triggers**

**Current Working Pattern**:
```bash
# Proven working pattern for testing
aws lambda invoke \
  --function-name amplify-XXXXX-notificationprocessorlam-XXXXX \
  --region us-west-1 \
  /tmp/result.json
```

#### **Next Steps for EventBridge (STEP-BY-STEP)**:
1. **Research**: Find correct Amplify Gen 2 schedule syntax documentation
2. **Simple Test**: Test with 15-minute interval first (not 2 minutes)
3. **Validate**: Confirm scheduling works before changing interval
4. **Production**: Only then implement 2-minute production schedule
5. **CRITICAL**: Test each step separately, don't combine with other changes

---

## 🔧 **TEMPLATE PROCESSING CRITICAL FIXES**

### **❌ Database Escaping Issues**

**Problem**: Double-escaped JSON in DynamoDB broke Handlebars parsing

```
Parse error on line 1: ...Links uploadedMedia \"images\"}}}\nExpecting 'CLOSE_RAW_BLOCK', 'CLOSE', 'CLOSE_UNESCAPED', got 'INVALID'
```

**Root Cause**: Template content stored with excessive escaping in database
**Impact**: Complete template processing failures, hours of debugging

### **✅ Template Storage & Processing Solution**

#### **Correct Database Storage**:
```typescript
// Store clean HTML strings in database
const template = {
  content: "<!DOCTYPE html>...", // Direct string, no excessive escaping
  subject: "New Request — {{propertyAddress}}"
};
```

#### **✅ Helper Function Pattern**:
```typescript
// ALWAYS register ALL helpers before processing
Handlebars.registerHelper('getUrgencyColor', (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'high': return '#dc2626';
    case 'medium': return '#d97706'; 
    case 'low': return '#059669';
    default: return '#6b7280';
  }
});

Handlebars.registerHelper('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper('fileLinks', (jsonString: string) => {
  // Implementation for file thumbnail generation
});

// Critical: Use {{{fileLinks}}} for raw HTML output (triple braces)
// Use {{formatDate}} for escaped text (double braces)
```

### **File Links Helper Critical Fix**

**Problem**: Files showed as HTML entities instead of clickable thumbnails
**Root Cause**: HTML was being double-encoded instead of rendered as raw HTML

**Solution**:
```typescript
Handlebars.registerHelper('fileLinks', (jsonString: string, type: string = 'file') => {
  try {
    const files = JSON.parse(jsonString || '[]');
    if (!Array.isArray(files) || files.length === 0) return '';
    
    return files.map((url: string) => {
      const absoluteUrl = url.startsWith('http') ? url : `https://d200k2wsaf8th3.amplifyapp.com${url}`;
      const filename = url.split('/').pop() || url;
      
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return `<a class="thumb" href="${absoluteUrl}" target="_blank">
          <img src="${absoluteUrl}" alt="Uploaded Image" />
          <div class="thumb__cap">Photo</div>
        </a>`;
      }
      // Handle videos and documents...
    }).join('');
  } catch (error) {
    return '<p style="color: #ef4444;">Error loading files</p>';
  }
});
```

**Template Usage**:
```html
<!-- Use triple braces for raw HTML output -->
{{{fileLinks uploadedMedia}}}
{{{fileLinks uploadedVideos}}}
{{{fileLinks uplodedDocuments}}}
```

---

## 📊 **DEBUGGING WORKFLOW (PROVEN SUCCESSFUL)**

### **Step-by-Step Validation Process**

**Critical**: Stop and validate each step works before proceeding to next

#### **1. Signal Creation Validation**
```bash
# Verify signal appears in database with correct signalType
aws dynamodb get-item \
  --table-name SignalEvents-{suffix}-NONE \
  --key '{"id":{"S":"signal-id"}}' \
  --region us-west-1
```

**Check for**:
- `signalType` field present and correct (`form_get_estimate_submission`)
- `payload` contains expected data
- `processed: false` initially

#### **2. Hook Matching Validation**
```bash
# Confirm hooks exist and match signal type
aws dynamodb scan \
  --table-name SignalNotificationHooks-{suffix}-NONE \
  --filter-expression "signalType = :type" \
  --expression-attribute-values '{":type":{"S":"form_get_estimate_submission"}}' \
  --region us-west-1
```

**Check for**:
- Active hooks found (`enabled: true`)
- Correct `notificationTemplateId` references
- Proper channel configuration (`["EMAIL", "SMS"]`)

#### **3. Template Retrieval Validation**
```bash
# Test template exists and is valid HTML
aws dynamodb get-item \
  --table-name NotificationTemplate-{suffix}-NONE \
  --key '{"id":{"S":"get-estimate-template-001"}}' \
  --region us-west-1
```

**Check for**:
- Template exists with correct ID
- `content` field contains valid HTML
- No excessive escaping in template content
- All required helpers referenced in template are registered

#### **4. Helper Registration Validation**
```bash
# Deploy Lambda and check logs for helper registration
npx ampx sandbox
aws lambda invoke --function-name {lambda-function-name} /tmp/result.json
```

**Check Lambda logs for**:
- Helper registration messages
- No "Missing helper: {helperName}" errors
- Template compilation success

#### **5. Template Compilation Testing**
```bash
# Test Handlebars compilation with real data
# This should be done in Lambda function with real signal payload
```

**Check for**:
- Template compiles without errors
- All variables resolve correctly
- File links render as HTML (not escaped entities)
- Output is valid HTML

#### **6. Notification Creation Validation**
```bash
# Confirm notification records created
aws dynamodb scan \
  --table-name NotificationQueue-{suffix}-NONE \
  --region us-west-1 \
  --limit 5
```

**Check for**:
- Notification records created for each channel
- Correct `status: 'PENDING'`
- Proper recipient configuration
- Valid channel data (email/SMS content)

#### **7. Delivery Testing**
```bash
# Test actual email/SMS delivery
# Run Lambda processor to handle notification queue
aws lambda invoke \
  --function-name {lambda-function-name} \
  --region us-west-1 \
  /tmp/delivery-result.json
```

**Check for**:
- Actual email delivery to recipients
- SMS delivery to phone numbers
- No delivery errors in logs
- Notification status updated to `SENT`

---

## 🎯 **ARCHITECTURAL DECISIONS & RATIONALE**

### **Why Service Layer > Direct GraphQL**

**Evidence from Projects Service Success**:
1. **Type Safety**: Generated types catch schema changes at compile time
2. **Error Consistency**: Standardized error handling across entire app
3. **Optional Field Handling**: Service layer manages schema evolution gracefully
4. **Testing**: Easier to mock and test service methods in isolation
5. **Debugging**: Single place to add logging and monitoring for all operations

### **Why Step-by-Step Validation Works**

**Evidence from Signal System Implementation**:
1. **Isolates Issues**: Each step has single responsibility, easy to identify failures
2. **Faster Debugging**: Know exactly which component failed (signal vs hook vs template)
3. **Prevents Compound Errors**: Multiple issues don't mask each other 
4. **Builds Confidence**: Working foundation before adding complexity
5. **Documentation**: Each step creates debugging knowledge for future issues

### **Professional Template Architecture Benefits**

**Evidence from Template Implementation**:
- **Modern Design**: CSS variables for consistent theming across email clients
- **Mobile Responsive**: Grid layouts that collapse on small screens  
- **File Integration**: Thumbnail-based file display with type detection
- **Accessibility**: Proper contrast ratios and semantic HTML structure
- **Email Client Compatibility**: Inline CSS and table-based layouts

---

## ⚡ **EMERGENCY DEBUGGING CHECKLIST**

When signal-notification system fails, check in this order:

### **🔍 Quick Diagnosis (5 minutes)**
1. Check Lambda logs for immediate errors
2. Verify signal has `signalType` field (most common issue)
3. Confirm template exists in database
4. Check for "Missing helper" errors

### **🔧 Component Isolation (15 minutes)**
1. Test signal creation manually
2. Verify hook matching with database scan
3. Test template compilation in isolation
4. Check notification queue creation

### **🚨 Common Issues & Fixes**
| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing signalType | `undefined` in logs | Check signal creation code |
| Template not found | Template retrieval errors | Verify template ID matches |
| Helper missing | Handlebars compilation fails | Register all helpers |
| File links broken | HTML entities instead of links | Use triple braces `{{{fileLinks}}}` |
| EventBridge broken | No automatic processing | Use manual Lambda invoke |

### **📞 Escalation Path**
1. **First 30 minutes**: Follow checklist, test individual components
2. **If still failing**: Revert to last known working state
3. **Before making changes**: Create backup of current configuration
4. **Document solution**: Update this troubleshooting guide with new learnings

---

*Last Updated: August 17, 2025 - Post Professional Template Implementation*
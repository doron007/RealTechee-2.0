# Signal-Driven Notification Architecture

## Overview
Transform from hardcoded form notifications to a dynamic, configurable signal-driven system where developers emit signals and admins configure notification hooks without code changes.

## Architecture Components

### 1. Signal Store (`SignalEvents` table)
```typescript
interface SignalEvent {
  id: string;                    // UUID
  signalType: string;           // 'form_contact_us_submission'
  payload: Record<string, any>; // Form data
  emittedAt: string;            // ISO timestamp
  emittedBy: string;            // User/system identifier
  source: string;               // 'contact_form', 'api', etc.
  processed: boolean;           // Processing status
  createdAt: string;
  updatedAt: string;
}
```

### 2. Signal-Notification Mapping (`SignalNotificationHooks` table)
```typescript
interface SignalNotificationHook {
  id: string;                           // UUID
  signalType: string;                   // 'form_contact_us_submission'
  notificationTemplateId: string;       // Reference to NotificationTemplate
  enabled: boolean;                     // Admin can enable/disable
  priority: 'low' | 'medium' | 'high';  // Processing priority
  channels: ('EMAIL' | 'SMS' | 'PUSH')[]; // Enabled channels
  recipients: {
    emails: string[];                   // Direct email addresses
    roles: string[];                    // 'AE', 'PM', 'ADMIN'
    dynamic: string[];                  // Extract from payload: 'payload.customerEmail'
  };
  conditions?: {                        // Optional filtering
    field: string;                      // 'payload.urgency'
    operator: 'eq' | 'ne' | 'gt' | 'lt'; 
    value: any;                         // 'high'
  }[];
  createdAt: string;
  updatedAt: string;
}
```

### 3. Enhanced NotificationQueue (Multi-channel)
```typescript
interface NotificationQueueRecord {
  id: string;                           // UUID
  signalEventId?: string;               // Optional reference to original signal
  templateId: string;                   // NotificationTemplate reference
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  priority: 'low' | 'medium' | 'high';
  
  // Consolidated channels in single record
  channels: {
    email?: {
      enabled: boolean;
      recipients: string[];
      subject: string;
      content: string;
      status: 'PENDING' | 'SENT' | 'FAILED';
      sentAt?: string;
      messageId?: string;
    };
    sms?: {
      enabled: boolean;
      recipients: string[];
      content: string;
      status: 'PENDING' | 'SENT' | 'FAILED';
      sentAt?: string;
      messageId?: string;
    };
    push?: {
      enabled: boolean;
      recipients: string[];
      content: string;
      status: 'PENDING' | 'SENT' | 'FAILED';
      sentAt?: string;
    };
  };
  
  payload: Record<string, any>;         // Original signal data
  attempts: number;                     // Retry counter
  lastAttemptAt?: string;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Implementation Phases

### Phase 1: Signal Emission System
1. **Client API**: `SignalEmitter.emit('form_contact_us_submission', formData)`
2. **Signal Types**: 
   - `form_contact_us_submission`
   - `form_get_qualified_submission` 
   - `form_affiliate_submission`
   - `form_get_estimate_submission`
3. **Backend API**: Store signals in SignalEvents table

### Phase 2: Signal Processing Engine
1. **Signal Processor**: Background service that watches SignalEvents
2. **Hook Resolution**: Find active SignalNotificationHooks for each signal
3. **Notification Generation**: Create NotificationQueue records with pre-rendered content
4. **Multi-channel Support**: Single queue record with email + SMS channels

### Phase 3: Admin Configuration UI
1. **Signal Management**: View emitted signals and their frequency
2. **Hook Management**: Create/edit signal-to-notification mappings
3. **Template Assignment**: Assign templates to signals with channel selection
4. **Recipient Configuration**: Mix of emails, roles, and dynamic extraction

### Phase 4: Enhanced Lambda Processing
1. **Simplified Processing**: Lambda just sends pre-configured notifications
2. **Channel Routing**: Send via appropriate service (SES, Twilio, etc.)
3. **Status Tracking**: Update channel-specific status in queue record
4. **Retry Logic**: Channel-specific retry with exponential backoff

## Developer Experience

### Before (Current)
```typescript
// Contact form submission
const formNotifications = FormNotificationIntegration.getInstance();
await formNotifications.notifyContactUsSubmission(data, {
  priority: 'high',
  channels: 'both',
  testMode: false
});
```

### After (Signal-Driven)
```typescript
// Contact form submission
await SignalEmitter.emit('form_contact_us_submission', {
  customerName: formData.name,
  customerEmail: formData.email,
  subject: formData.subject,
  message: formData.message,
  urgency: formData.urgency || 'medium',
  source: 'contact_form'
});
```

## Admin Experience

### Configuration Dashboard
- **Signals**: View all signal types and emission frequency
- **Templates**: Manage email/SMS templates with live preview
- **Hooks**: Create signal → notification mappings
- **Recipients**: Role-based + email-based recipient management
- **Monitoring**: Notification delivery status and analytics

## Benefits

1. **🔌 Complete Decoupling**: Forms → Signals → Notifications → Delivery
2. **🎛️ Zero-Code Configuration**: Admin changes without deployments
3. **📈 Infinite Scalability**: New signals = new admin configurations
4. **🎯 Dynamic Recipients**: Roles + emails + payload extraction
5. **📱 Multi-Channel**: Email + SMS + Push (future) in single notification
6. **🔄 Reusable Templates**: One template, multiple signals
7. **⚡ Performance**: Pre-rendered content, optimized Lambda processing
8. **📊 Analytics**: Signal emission and delivery tracking

## Migration Strategy

1. **Parallel Implementation**: Build new system alongside existing
2. **Form-by-Form Migration**: Start with Contact Us form
3. **A/B Testing**: Compare delivery rates and performance
4. **Admin Training**: Configuration UI walkthrough
5. **Full Migration**: Switch all forms to signal emission
6. **Legacy Cleanup**: Remove FormNotificationIntegration service
# 📬 Notification System Integration Guide

## Overview

The RealTechee notification system provides multi-channel notifications (Email + SMS) with user preference management. This guide covers integration points for developers.

## 🏗️ Architecture

```
Form Submission → NotificationService → Queue → Lambda Processor → SendGrid/Twilio
                                     ↓
User Preferences ← Settings UI ← Contact Lookup
```

## 🔧 Quick Integration

### 1. Queue a Notification

```typescript
import { NotificationService } from '../utils/notificationService';

// In your form handler
await NotificationService.queueGetEstimateNotification({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+1234567890',
  propertyAddress: '123 Main St',
  productType: 'Kitchen Renovation',
  message: 'Customer notes here',
  submissionId: 'REQ-123',
  contactId: 'contact-uuid' // For preference filtering
});
```

### 2. Add Notification Preferences UI

```typescript
import { NotificationPreferences } from '../components/notifications/NotificationPreferences';

// In your settings page
<NotificationPreferences
  contactId={userContactId}
  onSave={(preferences) => console.log('Saved:', preferences)}
  className="my-custom-class"
/>
```

## 🛠️ Environment Setup

### Required Environment Variables

```bash
# SendGrid Email
SENDGRID_API_KEY=SG.your_key_here
FROM_EMAIL=notifications@yourdomain.com

# Twilio SMS  
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_FROM_PHONE=+1234567890

# Debug Mode (development only)
DEBUG_NOTIFICATIONS=true
DEBUG_EMAIL=admin@yourdomain.com
DEBUG_PHONE=+1234567890
```

### Local Development

1. Create `.env.local` with your credentials
2. Run `npx ampx sandbox` to deploy backend
3. Test with `npm run dev`

## 📋 Database Schema

### Contact Model Extensions

```graphql
type Contacts @model {
  id: ID!
  email: String
  phone: String
  emailNotifications: Boolean
  smsNotifications: Boolean
  # ... other fields
}
```

### Notification Tables

- **NotificationQueue**: Queued notifications with status tracking
- **NotificationTemplate**: Reusable templates with Handlebars variables

## 🎨 Templates

### Email Template Variables

```handlebars
{{customer.name}}
{{customer.email}}
{{customer.phone}}
{{customer.company}}
{{property.address}}
{{project.product}}
{{project.message}}
{{submission.id}}
{{submission.timestamp}}
{{admin.dashboardUrl}}
```

### SMS Template (< 160 chars)

```
🏠 RealTechee Estimate Request
Customer: {{customer.name}}
Product: {{project.product}}
Property: {{property.address}}
📧 {{customer.email}}
View: Dashboard
```

## 🔒 Security Considerations

- **Never commit API keys** - Use environment variables
- **Validate user input** - Templates have basic sanitization
- **Rate limiting** - Consider implementing for high-volume use
- **Phone number validation** - SMS requires valid phone format

## 🚀 Deployment

1. **Set Environment Variables** in AWS Systems Manager Parameter Store
2. **Deploy with Amplify**: `npx ampx pipeline-deploy --branch main`
3. **Seed Templates**: Run `npx tsx scripts/seedNotificationTemplate.ts`
4. **Test Integration**: Submit a form and verify delivery

## 🧪 Testing

### Manual Testing Checklist

- [ ] Form submission creates notification queue record
- [ ] Email delivered to admin/customer based on preferences  
- [ ] SMS delivered if user has phone + SMS enabled
- [ ] Settings UI loads and saves preferences correctly
- [ ] Error handling works (invalid email, missing template)

### Debug Tools

```bash
# Check notification queue in DynamoDB
aws dynamodb scan --table-name NotificationQueue-[env]

# View Lambda logs
aws logs tail /aws/lambda/notification-processor --follow

# Test notification service directly
npx tsx scripts/createSMSTemplate.ts
```

## 🔧 Troubleshooting

### Common Issues

**Notifications not sending:**
- Check EventBridge schedule is active (every 2 minutes)
- Verify environment variables in Lambda
- Check CloudWatch logs for errors

**SMS not delivering:**
- Verify phone number format (+1234567890)
- Check Twilio account balance/status
- Ensure SMS template < 160 characters

**Email not delivering:**
- Verify SendGrid API key is valid
- Check sender domain authentication
- Review SendGrid activity logs

**User preferences not working:**
- Ensure contactId is passed to queueGetEstimateNotification
- Verify contact lookup in settings page
- Check notification filtering logic

## 📚 API Reference

### NotificationService Methods

- `queueGetEstimateNotification(data)` - Queue estimate request notification
- `getUserSettings(contactId)` - Get user notification preferences  
- `filterChannelsBySettings(channels, settings)` - Filter channels by preferences

### Component Props

- `NotificationPreferences`: `contactId`, `onSave`, `className`

For complete implementation details, see `/amplify/functions/notification-processor/` and `/utils/notificationService.ts`.
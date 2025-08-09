# RealTechee Internal Staff Notification Templates

Professional email and SMS templates for internal staff notifications when forms are submitted through the RealTechee platform.

## 📋 Templates Overview

### Available Templates

| Template | Purpose | Email ✅ | SMS ✅ |
|----------|---------|----------|--------|
| **Contact Us** | General customer inquiries | ✅ | ✅ |
| **Get Qualified** | Agent qualification applications | ✅ | ✅ |
| **Affiliate** | Service provider partnership applications | ✅ | ✅ |

### Design Features

- 📧 **Responsive HTML emails** with mobile-first design
- 🎨 **RealTechee branding** with official colors and logo
- 📱 **SMS notifications** under 160 characters where possible
- 🏷️ **Priority indicators** for urgent communications
- ⚠️ **Test data badges** for E2E testing sessions
- 🔗 **Direct action links** to admin dashboard
- 📊 **Structured data presentation** for quick scanning

## 🚀 Quick Start

### Basic Usage

```typescript
import { notificationTemplates } from '@/templates/notifications';

// Example: Contact Us notification
const contactData = {
  formType: 'contact-us',
  submissionId: 'contact_12345',
  submittedAt: new Date().toISOString(),
  name: 'John Doe',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  subject: 'Project Inquiry',
  message: 'I need help with home renovation planning...',
  urgency: 'high',
  testData: false
};

// Generate email
const emailTemplate = notificationTemplates.contactUs.email(contactData);
console.log(emailTemplate.subject); // Email subject
console.log(emailTemplate.html);    // HTML content
console.log(emailTemplate.text);    // Plain text fallback

// Generate SMS  
const smsMessage = notificationTemplates.contactUs.sms(contactData);
console.log(smsMessage); // SMS content
```

## 📧 Email Templates

### Template Structure

All email templates follow a consistent structure:

1. **Header Section** - RealTechee logo and branding
2. **Test Data Badge** - Warning for test submissions (when applicable)
3. **Alert Section** - Form type indicator and priority level
4. **Summary Section** - Key information at a glance
5. **Details Section** - Complete form data organized by category
6. **Action Section** - Direct links for staff to take action
7. **Footer Section** - Professional signature and guidelines

### Responsive Design

- **Mobile-first** approach with flexible layouts
- **Maximum width** of 600px for email client compatibility
- **Scalable elements** that work on all devices
- **Table-based layout** for maximum compatibility

### Brand Colors Used

```css
Primary Colors:
- Black: #151515
- Dark Gray: #2A2B2E  
- Medium Gray: #6E6E73
- Very Light Gray: #E4E4E4
- Off White: #F9F4F3

Accent Colors:
- Red: #D11919 (High priority)
- Coral: #E9664A (CTA buttons)
- Yellow: #FFB900 (Medium priority)
- Teal: #3BE8B0 (Low priority, success)
- Blue: #17619C (Standard priority, links)
```

## 📱 SMS Templates

### Character Optimization

SMS templates are optimized for:
- **Standard length**: Under 160 characters when possible
- **Essential information**: Name, form type, key details
- **Action URL**: Direct link to admin dashboard
- **Test indicators**: Clear marking of test data

### SMS Format Pattern

```
[TEST] 🔴 RealTechee: New [form type] from [name] - [key info]. [Contact]: [details]. View: [admin URL]
```

## 🎯 Template Data Types

### Base Notification Data

```typescript
interface BaseNotificationData {
  formType: string;        // Form identifier
  submissionId: string;    // Unique submission ID
  submittedAt: string;     // ISO timestamp
  testData?: boolean;      // Mark test submissions
  leadSource?: string;     // Lead tracking
}
```

### Contact Form Specific

```typescript
interface ContactFormData extends BaseNotificationData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high';
  preferredContact?: 'email' | 'phone';
}
```

### Get Qualified Form Specific

```typescript
interface GetQualifiedFormData extends BaseNotificationData {
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  brokerage?: string;
  yearsExperience?: string;
  specialties?: string[];
  marketAreas?: string[];
  currentVolume?: string;
  goals?: string;
}
```

### Affiliate Form Specific

```typescript
interface AffiliateFormData extends BaseNotificationData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  businessLicense?: string;
  insurance?: boolean;
  bonded?: boolean;
  yearsInBusiness?: string;
  serviceAreas?: string[];
  certifications?: string[];
  portfolio?: string;
}
```

## 🛠️ Implementation Guide

### With AWS SES + Handlebars

```typescript
import AWS from 'aws-sdk';
import { notificationTemplates } from '@/templates/notifications';

const ses = new AWS.SES({ region: 'us-east-1' });

async function sendNotificationEmail(templateType: string, data: any, recipientEmail: string) {
  const template = notificationTemplates[templateType].email(data);
  
  const params = {
    Source: 'notifications@realtechee.com',
    Destination: { ToAddresses: [recipientEmail] },
    Message: {
      Subject: { Data: template.subject },
      Body: {
        Html: { Data: template.html },
        Text: { Data: template.text }
      }
    }
  };
  
  return await ses.sendEmail(params).promise();
}
```

### With AWS SNS (SMS)

```typescript
import AWS from 'aws-sdk';

const sns = new AWS.SNS({ region: 'us-east-1' });

async function sendNotificationSMS(templateType: string, data: any, phoneNumber: string) {
  const message = notificationTemplates[templateType].sms(data);
  
  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      }
    }
  };
  
  return await sns.publish(params).promise();
}
```

### With Next.js API Route

```typescript
// /pages/api/notifications/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { notificationTemplates } from '@/templates/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { templateType, data, recipients } = req.body;

  try {
    // Generate templates
    const emailTemplate = notificationTemplates[templateType].email(data);
    const smsMessage = notificationTemplates[templateType].sms(data);

    // Send notifications (implement your preferred service)
    const results = await Promise.all([
      sendEmail(emailTemplate, recipients.email),
      sendSMS(smsMessage, recipients.phone)
    ]);

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
}
```

## 🎨 Customization Guidelines

### Brand Consistency

- **Logo**: Always use `/assets/logos/web_realtechee_horizontal_no_border.png`
- **Colors**: Stick to the defined brand color palette
- **Typography**: Use Inter font family for consistency
- **Spacing**: Maintain consistent padding and margins

### Content Guidelines

- **Professional tone** appropriate for internal staff
- **Clear hierarchy** with proper headings and sections
- **Actionable information** with direct CTAs
- **Scannable format** for quick decision making
- **Complete context** including all relevant form data

### Testing Best Practices

- **Test data markers**: Always include test indicators
- **Multiple devices**: Test on mobile, tablet, desktop
- **Email clients**: Test with Gmail, Outlook, Apple Mail
- **Character limits**: Verify SMS length constraints
- **Link validation**: Ensure all admin URLs are functional

## 🔍 Template Examples

### High Priority Contact Inquiry

**Email Subject**: `New Contact Inquiry - HIGH PRIORITY - John Doe`

**SMS**: `🔴RealTechee: New contact inquiry from John Doe - "Urgent renovation needed". Email: john@example.com, Phone: (555) 123-4567. View: https://d200k2wsaf8th3.amplifyapp.com/admin/requests/contact_12345`

### Agent Qualification Application

**Email Subject**: `New Agent Qualification Application - Sarah Johnson`

**SMS**: `🏆 RealTechee: New agent qualification from Sarah Johnson (5 years exp). License: RE123456. Review: https://d200k2wsaf8th3.amplifyapp.com/admin/agents/qual_67890`

### Service Provider Partnership

**Email Subject**: `New Service Provider Application - Elite Home Services`

**SMS**: `🤝 RealTechee: New service provider "Elite Home Services" (Construction). Contact: Mike Smith. Status: Insured, Licensed. Review: https://d200k2wsaf8th3.amplifyapp.com/admin/affiliates/aff_54321`

## 📊 Performance Metrics

### Email Deliverability

- **Template size**: Optimized under 100KB
- **Image optimization**: Logo hosted on CDN
- **Spam score**: Designed to avoid spam filters
- **Mobile compatibility**: 100% responsive design

### SMS Delivery

- **Character efficiency**: Essential info prioritized
- **URL shortening**: Consider implementing for long admin URLs
- **Delivery tracking**: Implement read receipts where possible

## 🚨 Important Notes

### Security Considerations

- **No sensitive data**: Never include passwords or tokens
- **Secure links**: All admin URLs should be authenticated
- **Test data**: Always mark test submissions clearly
- **Data retention**: Follow GDPR guidelines for notification data

### Maintenance

- **Regular testing**: Verify templates monthly
- **Link validation**: Ensure admin URLs stay current
- **Brand updates**: Update templates when branding changes
- **Performance monitoring**: Track delivery and open rates

## 📞 Support

For template modifications or implementation support:
- **Technical Issues**: Development team
- **Brand Updates**: Marketing team  
- **Content Changes**: Customer success team

---

*Last Updated: August 6, 2025*
*Version: 1.0.0*
*RealTechee Internal Notification System*
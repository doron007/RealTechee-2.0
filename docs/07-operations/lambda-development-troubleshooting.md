# Lambda Development & Troubleshooting Guide

## 🎯 **Template Processing Issues**

### **Problem: Handlebars Parse Errors**
**Symptoms**:
```
Parse error on line 1: ...Links uploadedMedia \"images\"}}}
Expecting 'CLOSE_RAW_BLOCK', 'CLOSE', 'CLOSE_UNESCAPED', got 'INVALID'
```

**Root Causes**:
1. **Double-escaped quotes** in template storage
2. **Missing helper functions** not registered
3. **Wrong brace syntax** for raw HTML output

**Solutions**:
```typescript
// 1. Store templates with minimal escaping
const template = {
  content: "<!DOCTYPE html>...", // Direct string, no excessive escaping
  subject: "New Request — {{propertyAddress}}"
};

// 2. Register ALL helpers before template processing
Handlebars.registerHelper('getUrgencyColor', (urgency: string) => { /* implementation */ });
Handlebars.registerHelper('getUrgencyLabel', (urgency: string) => { /* implementation */ });
Handlebars.registerHelper('formatPhone', (phone: string) => { /* implementation */ });
Handlebars.registerHelper('fileLinks', (jsonString: string, type?: string) => { /* implementation */ });

// 3. Use correct brace syntax
{{{fileLinks uploadedMedia}}} // Triple braces for raw HTML
{{formatDate meetingDateTime}} // Double braces for escaped text
```

### **Problem: Missing File Thumbnails**
**Symptoms**: Files show as HTML entities instead of clickable thumbnails

**Solution**: File links helper implementation
```typescript
Handlebars.registerHelper('fileLinks', (jsonString: string, type: string = 'file') => {
  try {
    const files = JSON.parse(jsonString || '[]');
    if (!Array.isArray(files) || files.length === 0) return '';
    
    return files.map((url: string) => {
      const absoluteUrl = url.startsWith('http') ? url : `https://d200k2wsaf8th3.amplifyapp.com${url}`;
      const filename = url.split('/').pop() || url;
      const cleanFilename = filename.replace(/^\d+-/, '');
      
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return `<a class="thumb" href="${absoluteUrl}" target="_blank">
          <img src="${absoluteUrl}" alt="Uploaded Image" />
          <div class="thumb__cap">Photo</div>
        </a>`;
      } else if (/\.(mp4|mov|avi|wmv)$/i.test(filename)) {
        return `<a class="thumb" href="${absoluteUrl}" target="_blank">
          <img src="https://dummyimage.com/320x200/ffffff/e2e8f0.png&text=Video" alt="Uploaded Video" />
          <div class="thumb__cap">Video</div>
        </a>`;
      } else {
        return `<a class="thumb" href="${absoluteUrl}" target="_blank">
          <img src="https://dummyimage.com/320x200/ffffff/e2e8f0.png&text=Document" alt="Uploaded Document" />
          <div class="thumb__cap">Document</div>
        </a>`;
      }
    }).join('');
  } catch (error) {
    return '<p style="color: #ef4444;">Error loading files</p>';
  }
});
```

## 🔧 **Lambda Development Workflow**

### **1. Development Cycle**
```bash
# 1. Deploy changes
cd /Users/doron/Projects/RealTechee\ 2.0
npx ampx sandbox

# 2. Insert test signal (optional)
aws dynamodb put-item --table-name SignalEvents-{suffix}-NONE --item '{
  "id": {"S": "test-signal-123"},
  "signalType": {"S": "form_get_estimate_submission"},
  "payload": {"S": "{\"propertyAddress\":\"123 Test St\"}"},
  "processed": {"BOOL": false}
}' --region us-west-1

# 3. Trigger Lambda manually
aws lambda invoke \
  --function-name amplify-realtecheeclone-d-notificationprocessorlam-sLgeFvCfN0xX \
  --region us-west-1 \
  /tmp/lambda-result.json

# 4. Check logs
aws logs get-log-events \
  --log-group-name /aws/lambda/amplify-realtecheeclone-d-notificationprocessorlam-sLgeFvCfN0xX \
  --log-stream-name "LATEST_STREAM" \
  --region us-west-1

# 5. Verify notification creation
aws dynamodb scan \
  --table-name NotificationQueue-{suffix}-NONE \
  --region us-west-1 \
  --limit 5
```

### **2. Common Lambda Errors**

**Error**: `Missing helper: getUrgencyColor`
```typescript
// Fix: Register helper in templateProcessor.ts constructor
Handlebars.registerHelper('getUrgencyColor', (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'high': return '#dc2626';
    case 'medium': return '#d97706';
    case 'low': return '#059669';
    default: return '#6b7280';
  }
});
```

**Error**: `Invalid FilterExpression: attribute value :signalType`
```typescript
// Fix: Ensure signalType field exists in signal record
const signal = {
  id: 'signal-123',
  signalType: 'form_get_estimate_submission', // REQUIRED
  payload: JSON.stringify(data),
  processed: false
};
```

**Error**: Lambda timeout
```typescript
// Fix: Add timeout handling in Lambda
export const handler = async (event: any) => {
  try {
    // Set reasonable timeouts for database operations
    const result = await Promise.race([
      processSignals(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 55000) // 55s for 60s Lambda limit
      )
    ]);
    return result;
  } catch (error) {
    console.error('Lambda execution failed:', error);
    throw error;
  }
};
```

## 📧 **Email Template Best Practices**

### **1. Professional Design Pattern**
```css
/* Use CSS variables for consistent theming */
:root {
  --rt-navy: #0b3a5d;
  --rt-teal: #18b5a4;
  --rt-ink: #0f172a;
  --rt-slate: #475569;
  --rt-bg: #f5f7fb;
  --rt-card: #ffffff;
  --rt-border: #e2e8f0;
}

/* Mobile-first responsive design */
@media (max-width: 520px) {
  .kv { grid-template-columns: 1fr; gap: 4px; }
  .content { padding: 16px; }
}
```

### **2. Template Structure**
```html
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{{emailTitle}}</title>
    <style>/* Inline CSS here */</style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <!-- Header with branding -->
        <div class="header">
          <div class="brand">
            <span class="brand__logo"></span>
            <span class="brand__name">RealTechee — {{templateTitle}}</span>
          </div>
        </div>
        
        <!-- Content sections -->
        <div class="content">
          <div class="section">
            <div class="h3">Section Title</div>
            <!-- Section content -->
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          © 2025 RealTechee. All rights reserved.
        </div>
      </div>
    </div>
  </body>
</html>
```

## 🚨 **Production Considerations**

### **Error Handling**
```typescript
// Always wrap template processing in try-catch
try {
  const result = await templateProcessor.processTemplate(template, data);
  console.log('✅ Template processed successfully');
  return result;
} catch (error) {
  console.error('❌ Template processing failed:', error);
  // Continue processing other notifications
  return { 
    success: false, 
    error: error.message,
    fallback: 'Basic notification sent' 
  };
}
```

### **Performance**
- Limit template size to < 100KB
- Use efficient Handlebars helpers
- Batch database operations
- Set appropriate Lambda timeout (60s max)
- Monitor CloudWatch metrics

### **Security**
- Sanitize all user input in templates
- Validate file URLs before rendering
- Use parameterized database queries
- Never log sensitive data (emails, phone numbers)

---

*Last Updated: August 17, 2025 - Post Signal-Notification Implementation*
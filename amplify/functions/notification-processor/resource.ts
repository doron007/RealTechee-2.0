import { defineFunction } from '@aws-amplify/backend';

export const notificationProcessor = defineFunction({
  name: 'notification-processor',
  entry: './src/index.ts',
  environment: {
    // SendGrid Configuration - Set these in AWS Systems Manager Parameter Store or local .env
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
    FROM_EMAIL: process.env.FROM_EMAIL || 'notifications@realtechee.com',
    DEBUG_NOTIFICATIONS: process.env.DEBUG_NOTIFICATIONS || 'false', // Set to false in production
    DEBUG_EMAIL: process.env.DEBUG_EMAIL || 'info@realtechee.com',
    
    // Twilio SMS Configuration - Set these in AWS Systems Manager Parameter Store or local .env
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_FROM_PHONE: process.env.TWILIO_FROM_PHONE || '',
    DEBUG_PHONE: process.env.DEBUG_PHONE || ''
  },
  runtime: 20,
  timeoutSeconds: 900, // 15 minutes max for processing large batches
  memoryMB: 512,
  // schedule will be configured in backend.ts
});
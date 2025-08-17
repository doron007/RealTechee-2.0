import { defineFunction } from '@aws-amplify/backend';

export const notificationProcessor = defineFunction({
  name: 'notification-processor',
  entry: './src/index.ts',
  environment: {
    // Configuration will be loaded from AWS Systems Manager Parameter Store
    // These environment variables are left empty to force Parameter Store usage
    SENDGRID_API_KEY: '', // Will be loaded from Parameter Store
    FROM_EMAIL: 'notifications@realtechee.com',
    DEBUG_NOTIFICATIONS: process.env.DEBUG_NOTIFICATIONS || 'false',
    DEBUG_EMAIL: process.env.DEBUG_EMAIL || 'info@realtechee.com',
    
    // Twilio SMS Configuration will be loaded from Parameter Store
    TWILIO_ACCOUNT_SID: '', // Will be loaded from Parameter Store
    TWILIO_AUTH_TOKEN: '', // Will be loaded from Parameter Store
    TWILIO_FROM_PHONE: '', // Will be loaded from Parameter Store
    DEBUG_PHONE: process.env.DEBUG_PHONE || ''
  },
  runtime: 20,
  timeoutSeconds: 900, // 15 minutes max for processing large batches
  memoryMB: 512,
  // schedule: 'rate(2 minutes)', // TODO: Add EventBridge scheduling - manual trigger for testing
});
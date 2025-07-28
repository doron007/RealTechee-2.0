#!/usr/bin/env node

/**
 * Setup Notification Templates Script
 * Creates the required notification templates for the RealTechee notification system
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const amplifyConfig = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyConfig);
const client = generateClient();

const createNotificationTemplate = /* GraphQL */ `
  mutation CreateNotificationTemplate(
    $condition: ModelNotificationTemplateConditionInput
    $input: CreateNotificationTemplateInput!
  ) {
    createNotificationTemplate(condition: $condition, input: $input) {
      id
      name
      subject
      contentHtml
      contentText
      channel
      variables
      isActive
      owner
      createdAt
      updatedAt
      __typename
    }
  }
`;

async function createGetEstimateEmailTemplate() {
  console.log('📝 Creating Get Estimate Email Template...');
  
  const emailTemplate = {
    id: 'get-estimate-template-001',
    name: 'Get Estimate Request - Email',
    channel: 'EMAIL',
    subject: 'New Estimate Request - {{customer.name}} ({{property.address}})',
    contentHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Estimate Request Received</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1e40af;">Customer Information</h3>
          <p><strong>Name:</strong> {{customer.name}}</p>
          <p><strong>Email:</strong> {{customer.email}}</p>
          <p><strong>Phone:</strong> {{customer.phone}}</p>
          {{#if customer.company}}<p><strong>Company:</strong> {{customer.company}}</p>{{/if}}
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #0c4a6e;">Property Details</h3>
          <p><strong>Address:</strong> {{property.address}}</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #166534;">Project Information</h3>
          <p><strong>Service:</strong> {{project.product}}</p>
          {{#if project.relationToProperty}}<p><strong>Relation to Property:</strong> {{project.relationToProperty}}</p>{{/if}}
          {{#if project.needFinance}}<p><strong>Financing Needed:</strong> Yes</p>{{/if}}
          {{#if project.consultationType}}<p><strong>Consultation Type:</strong> {{project.consultationType}}</p>{{/if}}
          {{#if project.message}}<p><strong>Message:</strong> {{project.message}}</p>{{/if}}
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #92400e;">Submission Details</h3>
          <p><strong>Submission ID:</strong> {{submission.id}}</p>
          <p><strong>Submitted:</strong> {{submission.timestamp}}</p>
          <p><strong>Lead Source:</strong> {{submission.leadSource}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{admin.dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          This notification was sent automatically by RealTechee. Please respond to the customer within 24 hours.
        </p>
      </div>
    `,
    contentText: `
New Estimate Request Received

CUSTOMER INFORMATION:
Name: {{customer.name}}
Email: {{customer.email}}
Phone: {{customer.phone}}
{{#if customer.company}}Company: {{customer.company}}{{/if}}

PROPERTY DETAILS:
Address: {{property.address}}

PROJECT INFORMATION:
Service: {{project.product}}
{{#if project.relationToProperty}}Relation to Property: {{project.relationToProperty}}{{/if}}
{{#if project.needFinance}}Financing Needed: Yes{{/if}}
{{#if project.consultationType}}Consultation Type: {{project.consultationType}}{{/if}}
{{#if project.message}}Message: {{project.message}}{{/if}}

SUBMISSION DETAILS:
Submission ID: {{submission.id}}
Submitted: {{submission.timestamp}}
Lead Source: {{submission.leadSource}}

Admin Dashboard: {{admin.dashboardUrl}}

Please respond to the customer within 24 hours.
    `,
    isActive: true,
    variables: JSON.stringify([
      'customer.name', 'customer.email', 'customer.phone', 'customer.company',
      'property.address',
      'project.product', 'project.relationToProperty', 'project.needFinance', 'project.consultationType', 'project.message',
      'submission.id', 'submission.timestamp', 'submission.leadSource',
      'admin.dashboardUrl'
    ]),
    owner: 'system'
  };

  try {
    const result = await client.graphql({
      query: createNotificationTemplate,
      variables: {
        input: emailTemplate
      }
    });
    console.log('✅ Email template created:', result.data.createNotificationTemplate.id);
  } catch (error) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️ Email template already exists - skipping');
    } else {
      console.error('❌ Failed to create email template:', error);
      throw error;
    }
  }
}

async function createGetEstimateSmsTemplate() {
  console.log('📱 Creating Get Estimate SMS Template...');
  
  const smsTemplate = {
    id: 'get-estimate-sms-template-001',
    name: 'Get Estimate Request - SMS',
    channel: 'SMS',
    subject: 'New Estimate Request',
    contentText: `🏠 NEW ESTIMATE REQUEST

Customer: {{customer.name}}
Phone: {{customer.phone}}
Property: {{property.address}}
Service: {{project.product}}

{{#if project.message}}Message: {{project.message}}{{/if}}

Submission ID: {{submission.id}}
Time: {{submission.timestamp}}

Dashboard: {{admin.dashboardUrl}}

⏰ Respond within 24 hours`,
    isActive: true,
    variables: JSON.stringify([
      'customer.name', 'customer.phone',
      'property.address',
      'project.product', 'project.message',
      'submission.id', 'submission.timestamp',
      'admin.dashboardUrl'
    ]),
    owner: 'system'
  };

  try {
    const result = await client.graphql({
      query: createNotificationTemplate,
      variables: {
        input: smsTemplate
      }
    });
    console.log('✅ SMS template created:', result.data.createNotificationTemplate.id);
  } catch (error) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️ SMS template already exists - skipping');
    } else {
      console.error('❌ Failed to create SMS template:', error);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Setting up notification templates...');
  
  try {
    await createGetEstimateEmailTemplate();
    await createGetEstimateSmsTemplate();
    
    console.log('🎉 All notification templates created successfully!');
    console.log('');
    console.log('📋 Templates created:');
    console.log('   - get-estimate-template-001 (EMAIL)');
    console.log('   - get-estimate-sms-template-001 (SMS)');
    console.log('');
    console.log('✅ The notification system is now ready to process Get Estimate requests!');
    
  } catch (error) {
    console.error('❌ Failed to setup templates:', error);
    process.exit(1);
  }
}

main();
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
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Estimate Request - RealTechee</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header with Logo -->
          <div style="background-color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <img src="https://realtechee.com/assets/logos/web_realtechee_horizontal_no_border.png" 
                 alt="RealTechee" 
                 style="height: 40px; width: auto; margin-bottom: 16px;" />
            <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 600; line-height: 1.2;">
              New Estimate Request
            </h1>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 16px;">
              Priority Request from {{customer.name}}
            </p>
          </div>

          <!-- Content Area -->
          <div style="padding: 32px 24px;">
            
            <!-- Customer Information -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <h2 style="margin: 0 0 16px 0; color: #1e40af; font-size: 20px; font-weight: 600;">
                👤 Customer Information
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{customer.name}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">
                    <a href="mailto:{{customer.email}}" style="color: #3b82f6; text-decoration: none;">{{customer.email}}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937;">
                    <a href="tel:{{customer.phone}}" style="color: #3b82f6; text-decoration: none;">{{customer.phone}}</a>
                  </td>
                </tr>
                {{#if customer.company}}
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Company:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{customer.company}}</td>
                </tr>
                {{/if}}
              </table>
            </div>
            
            <!-- Property Details -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #0ea5e9;">
              <h2 style="margin: 0 0 16px 0; color: #0c4a6e; font-size: 20px; font-weight: 600;">
                🏠 Property Details
              </h2>
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
                <strong>Address:</strong> {{property.address}}
              </p>
            </div>
            
            <!-- Project Information -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
              <h2 style="margin: 0 0 16px 0; color: #166534; font-size: 20px; font-weight: 600;">
                🔧 Project Information
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600; width: 150px;">Service Requested:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 16px;">{{project.product}}</td>
                </tr>
                {{#if project.relationToProperty}}
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Property Relation:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{project.relationToProperty}}</td>
                </tr>
                {{/if}}
                {{#if project.consultationType}}
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Consultation Type:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{project.consultationType}}</td>
                </tr>
                {{/if}}
                {{#if project.needFinance}}
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Financing Needed:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: 600;">✓ Yes</td>
                </tr>
                {{/if}}
              </table>
              {{#if project.message}}
              <div style="margin-top: 16px; padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #d1fae5;">
                <p style="margin: 0; color: #374151; font-weight: 600;">Customer Message:</p>
                <p style="margin: 8px 0 0 0; color: #1f2937; font-style: italic; line-height: 1.5;">
                  "{{project.message}}"
                </p>
              </div>
              {{/if}}
            </div>
            
            <!-- Submission Details -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border-left: 4px solid #f59e0b;">
              <h2 style="margin: 0 0 16px 0; color: #92400e; font-size: 20px; font-weight: 600;">
                📋 Submission Details
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600; width: 120px;">Request ID:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 14px;">{{submission.id}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Submitted:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{submission.timestamp}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 600;">Lead Source:</td>
                  <td style="padding: 8px 0; color: #1f2937;">{{submission.leadSource}}</td>
                </tr>
              </table>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="{{admin.requestUrl}}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: 600; 
                        font-size: 16px;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                        transition: all 0.2s ease;">
                🚀 View Request Details
              </a>
            </div>
            
            <!-- Response Time Notice -->
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #dc2626; font-weight: 600; text-align: center;">
                ⏰ Priority Response Required: Please respond within 2 hours for optimal customer experience
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
              This notification was sent automatically by RealTechee's Lead Management System
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              © 2025 RealTechee. Professional Home Renovation Services.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `,
    contentText: `
===============================================
🏠 RealTechee - New Estimate Request
===============================================

PRIORITY REQUEST from {{customer.name}}

👤 CUSTOMER INFORMATION
Name: {{customer.name}}
Email: {{customer.email}}
Phone: {{customer.phone}}
{{#if customer.company}}Company: {{customer.company}}{{/if}}

🏠 PROPERTY DETAILS
Address: {{property.address}}

🔧 PROJECT INFORMATION
Service Requested: {{project.product}}
{{#if project.relationToProperty}}Property Relation: {{project.relationToProperty}}{{/if}}
{{#if project.consultationType}}Consultation Type: {{project.consultationType}}{{/if}}
{{#if project.needFinance}}Financing Needed: YES{{/if}}
{{#if project.message}}
Customer Message: "{{project.message}}"{{/if}}

📋 SUBMISSION DETAILS
Request ID: {{submission.id}}
Submitted: {{submission.timestamp}}
Lead Source: {{submission.leadSource}}

🚀 TAKE ACTION NOW
View Request: {{admin.requestUrl}}

⏰ PRIORITY RESPONSE REQUIRED
Please respond within 2 hours for optimal customer experience.

This notification was sent automatically by RealTechee's Lead Management System.
© 2025 RealTechee. Professional Home Renovation Services.
    `,
    isActive: true,
    variables: JSON.stringify([
      'customer.name', 'customer.email', 'customer.phone', 'customer.company',
      'property.address',
      'project.product', 'project.relationToProperty', 'project.needFinance', 'project.consultationType', 'project.message',
      'submission.id', 'submission.timestamp', 'submission.leadSource',
      'admin.requestUrl', 'admin.dashboardUrl'
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
    contentText: `🏠 RealTechee PRIORITY REQUEST

{{customer.name}} - {{customer.phone}}
{{property.address}}
Service: {{project.product}}

View: {{admin.requestUrl}}

⏰ Respond within 2hrs`,
    isActive: true,
    variables: JSON.stringify([
      'customer.name', 'customer.phone',
      'property.address',
      'project.product',
      'admin.requestUrl'
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
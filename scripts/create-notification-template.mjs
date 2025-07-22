#!/usr/bin/env node

/**
 * Script to create the missing notification template for Get Estimate form
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Configure AWS DynamoDB
const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = 'NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE';

const template = {
  id: 'get-estimate-template-001',
  name: 'Get Estimate Request',
  subject: '[RealTechee][Estimate] New request for estimate - {{address}}',
  contentHtml: `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #2c3e50;">New Get Estimate Request</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #34495e; margin-top: 0;">Property Details</h3>
        <p><strong>Address:</strong> {{address}}</p>
        <p><strong>Project Type:</strong> {{digital}}</p>
        <p><strong>Finance Needed:</strong> {{finance}}</p>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #27ae60; margin-top: 0;">Agent Information</h3>
        <p><strong>Name:</strong> {{agentName}}</p>
        <p><strong>Email:</strong> {{agentEmail}}</p>
        <p><strong>Phone:</strong> {{agentPhone}}</p>
        <p><strong>Relation:</strong> {{relation}}</p>
      </div>
      
      <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #3498db; margin-top: 0;">Project Details</h3>
        <p><strong>Requested Date:</strong> {{requestedDate}}</p>
        <p><strong>Requested Time:</strong> {{requestedTime}}</p>
        <p><strong>Notes:</strong> {{note}}</p>
      </div>
      
      <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #e74c3c; margin-top: 0;">Action Required</h3>
        <p>Please review this request and respond within 24 hours.</p>
        <p>
          <a href="{{admin.dashboardUrl}}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Start Working on This Request
          </a>
        </p>
      </div>
      
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from RealTechee. 
        Please do not reply to this email.
      </p>
    </body>
    </html>
  `,
  contentText: `
New Get Estimate Request

Property Details:
- Address: {{address}}
- Project Type: {{digital}}
- Finance Needed: {{finance}}

Agent Information:
- Name: {{agentName}}
- Email: {{agentEmail}}
- Phone: {{agentPhone}}
- Relation: {{relation}}

Project Details:
- Requested Date: {{requestedDate}}
- Requested Time: {{requestedTime}}
- Notes: {{note}}

Action Required:
Please review this request and respond within 24 hours.
Start working on this request: {{admin.dashboardUrl}}

---
This is an automated notification from RealTechee.
  `,
  channel: 'EMAIL',
  variables: [
    'address', 'digital', 'finance', 'agentName', 'agentEmail', 'agentPhone', 
    'relation', 'requestedDate', 'requestedTime', 'note', 'admin.dashboardUrl'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  owner: 'system'
};

async function createTemplate() {
  try {
    console.log('🚀 Creating notification template...');
    console.log('📊 Template ID:', template.id);
    console.log('📧 Channel:', template.channel);
    console.log('🗃️ Table:', TABLE_NAME);
    
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: template,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent overwriting
    });
    const result = await dynamodb.send(command);
    
    console.log('✅ Template created successfully!');
    console.log('📝 Template details:');
    console.log(`   - ID: ${template.id}`);
    console.log(`   - Name: ${template.name}`);
    console.log(`   - Subject: ${template.subject}`);
    console.log(`   - Variables: ${template.variables.length} variables`);
    
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log('⚠️  Template already exists, skipping creation');
    } else {
      console.error('❌ Error creating template:', error);
      process.exit(1);
    }
  }
}

// Also create SMS template
const smsTemplate = {
  id: 'get-estimate-sms-template-001',
  name: 'Get Estimate SMS',
  subject: 'New estimate request',
  contentText: `🏠 New estimate request for {{address}}

Agent: {{agentName}} ({{agentPhone}})
Type: {{digital}}
Date: {{requestedDate}} {{requestedTime}}

Start working: {{admin.dashboardUrl}}`,
  channel: 'SMS',
  variables: [
    'address', 'agentName', 'agentPhone', 'digital', 
    'requestedDate', 'requestedTime', 'admin.dashboardUrl'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  owner: 'system'
};

async function createSMSTemplate() {
  try {
    console.log('\n📱 Creating SMS template...');
    
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: smsTemplate,
      ConditionExpression: 'attribute_not_exists(id)'
    });
    const result = await dynamodb.send(command);
    
    console.log('✅ SMS template created successfully!');
    console.log(`   - ID: ${smsTemplate.id}`);
    console.log(`   - Channel: ${smsTemplate.channel}`);
    
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log('⚠️  SMS template already exists, skipping creation');
    } else {
      console.error('❌ Error creating SMS template:', error);
    }
  }
}

async function main() {
  await createTemplate();
  await createSMSTemplate();
  console.log('\n🎉 All templates created successfully!');
}

main().catch(console.error);
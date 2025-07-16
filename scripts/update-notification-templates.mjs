#!/usr/bin/env node

/**
 * Script to update existing notification templates with new admin links
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Configure AWS DynamoDB
const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = 'NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE';

// Updated email template content
const updatedEmailContent = `
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
`;

const updatedTextContent = `
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
`;

const updatedSMSContent = `🏠 New estimate request for {{address}}

Agent: {{agentName}} ({{agentPhone}})
Type: {{digital}}
Date: {{requestedDate}} {{requestedTime}}

Start working: {{admin.dashboardUrl}}`;

async function updateEmailTemplate() {
  try {
    console.log('📧 Updating email template...');
    
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: 'get-estimate-template-001' },
      UpdateExpression: 'SET contentHtml = :html, contentText = :text, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':html': updatedEmailContent.trim(),
        ':text': updatedTextContent.trim(),
        ':updatedAt': new Date().toISOString()
      }
    });
    
    await dynamodb.send(command);
    console.log('✅ Email template updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating email template:', error);
    throw error;
  }
}

async function updateSMSTemplate() {
  try {
    console.log('📱 Updating SMS template...');
    
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: 'get-estimate-sms-template-001' },
      UpdateExpression: 'SET contentText = :text, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':text': updatedSMSContent.trim(),
        ':updatedAt': new Date().toISOString()
      }
    });
    
    await dynamodb.send(command);
    console.log('✅ SMS template updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating SMS template:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Updating notification templates with new admin links...');
  console.log('🗃️ Table:', TABLE_NAME);
  
  await updateEmailTemplate();
  await updateSMSTemplate();
  
  console.log('\n🎉 All templates updated successfully!');
  console.log('📝 Templates now include specific request admin links');
  console.log('🎯 Account executives will be directed to /admin/requests/[id]');
}

main().catch(console.error);
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { notificationProcessor } from './functions/notification-processor/resource';
import { userAdmin } from './functions/user-admin/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  notificationProcessor,
  userAdmin
});

// Add scheduled trigger for notification processor
backend.addOutput({
  custom: {
    notificationProcessorArn: backend.notificationProcessor.resources.lambda.functionArn,
    userAdminArn: backend.userAdmin.resources.lambda.functionArn
  }
});

// Configure user admin function environment and permissions
backend.userAdmin.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Grant Cognito admin permissions to user admin function
backend.auth.resources.userPool.grant(
  backend.userAdmin.resources.lambda,
  'cognito-idp:ListUsers',
  'cognito-idp:AdminUpdateUserAttributes', 
  'cognito-idp:AdminAddUserToGroup',
  'cognito-idp:AdminRemoveUserFromGroup',
  'cognito-idp:AdminListGroupsForUser',
  'cognito-idp:AdminGetUser'
);

// PostConfirmation function permissions are handled through the auth trigger definition
// The Lambda function gets the necessary permissions automatically when defined as a trigger

// Set up CloudWatch Events rule to trigger every 5 minutes
backend.notificationProcessor.addEnvironment('NOTIFICATION_QUEUE_TABLE', backend.data.resources.tables['NotificationQueue'].tableName);
backend.notificationProcessor.addEnvironment('NOTIFICATION_TEMPLATE_TABLE', backend.data.resources.tables['NotificationTemplate'].tableName);
backend.notificationProcessor.addEnvironment('CONTACTS_TABLE', backend.data.resources.tables['Contacts'].tableName);

// Grant permissions to read/write DynamoDB tables
backend.data.resources.tables['NotificationQueue'].grantReadWriteData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['NotificationTemplate'].grantReadData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['Contacts'].grantReadData(backend.notificationProcessor.resources.lambda);

// TODO: Add EventBridge scheduling for notification processor
// For now, the notification processor can be invoked manually or via API
// Consider using AWS EventBridge directly in the AWS console or via separate CDK stack

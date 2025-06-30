import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { notificationProcessor } from './functions/notification-processor/resource';
import { userAdmin } from './functions/user-admin/resource';
import { postConfirmationHandler } from './functions/post-confirmation/resource';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Duration } from 'aws-cdk-lib';

export const backend = defineBackend({
  auth,
  data,
  storage,
  notificationProcessor,
  userAdmin,
  postConfirmationHandler
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

// Configure PostConfirmation function environment and permissions
backend.postConfirmationHandler.addEnvironment('CONTACTS_TABLE', backend.data.resources.tables['Contacts'].tableName);

// Grant permissions to PostConfirmation function
backend.data.resources.tables['Contacts'].grantReadWriteData(backend.postConfirmationHandler.resources.lambda);
backend.auth.resources.userPool.grant(
  backend.postConfirmationHandler.resources.lambda,
  'cognito-idp:AdminUpdateUserAttributes'
);

// Set up CloudWatch Events rule to trigger every 5 minutes
backend.notificationProcessor.addEnvironment('NOTIFICATION_QUEUE_TABLE', backend.data.resources.tables['NotificationQueue'].tableName);
backend.notificationProcessor.addEnvironment('NOTIFICATION_TEMPLATE_TABLE', backend.data.resources.tables['NotificationTemplate'].tableName);
backend.notificationProcessor.addEnvironment('CONTACTS_TABLE', backend.data.resources.tables['Contacts'].tableName);

// Grant permissions to read/write DynamoDB tables
backend.data.resources.tables['NotificationQueue'].grantReadWriteData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['NotificationTemplate'].grantReadData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['Contacts'].grantReadData(backend.notificationProcessor.resources.lambda);

// Create EventBridge rule to trigger notification processor every 2 minutes
const notificationSchedule = new Rule(backend.createStack('NotificationSchedule'), 'NotificationProcessorSchedule', {
  schedule: Schedule.rate(Duration.minutes(2)),
  description: 'Triggers notification processor every 2 minutes',
});

// Add Lambda as target for the EventBridge rule
notificationSchedule.addTarget(new LambdaFunction(backend.notificationProcessor.resources.lambda));

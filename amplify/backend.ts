import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { notificationProcessor } from './functions/notification-processor/resource';
import { userAdmin } from './functions/user-admin/resource';
import { statusProcessor } from './functions/status-processor/resource';
import { sesBounceHandler } from './functions/ses-bounce-handler/resource';
import { reputationMonitor } from './functions/reputation-monitor/resource';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export const backend = defineBackend({
  auth,
  data,
  storage,
  notificationProcessor,
  userAdmin,
  statusProcessor,
  sesBounceHandler,
  reputationMonitor
});

// Add scheduled trigger for notification processor
backend.addOutput({
  custom: {
    notificationProcessorArn: backend.notificationProcessor.resources.lambda.functionArn,
    userAdminArn: backend.userAdmin.resources.lambda.functionArn,
    statusProcessorArn: backend.statusProcessor.resources.lambda.functionArn,
    sesBounceHandlerArn: backend.sesBounceHandler.resources.lambda.functionArn,
    reputationMonitorArn: backend.reputationMonitor.resources.lambda.functionArn
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

// Configure notification processor environment with signal-driven architecture support
backend.notificationProcessor.addEnvironment('NOTIFICATION_QUEUE_TABLE', backend.data.resources.tables['NotificationQueue'].tableName);
backend.notificationProcessor.addEnvironment('NOTIFICATION_TEMPLATE_TABLE', backend.data.resources.tables['NotificationTemplate'].tableName);
backend.notificationProcessor.addEnvironment('NOTIFICATION_EVENTS_TABLE', backend.data.resources.tables['NotificationEvents'].tableName);
backend.notificationProcessor.addEnvironment('EMAIL_SUPPRESSION_LIST_TABLE', backend.data.resources.tables['EmailSuppressionList'].tableName);
backend.notificationProcessor.addEnvironment('CONTACTS_TABLE', backend.data.resources.tables['Contacts'].tableName);
// Signal-driven architecture tables
backend.notificationProcessor.addEnvironment('SIGNAL_EVENTS_TABLE', backend.data.resources.tables['SignalEvents'].tableName);
backend.notificationProcessor.addEnvironment('SIGNAL_HOOKS_TABLE', backend.data.resources.tables['SignalNotificationHooks'].tableName);

// Configure status processor function environment
backend.statusProcessor.addEnvironment('REQUESTS_TABLE', backend.data.resources.tables['Requests'].tableName);

// Configure SES bounce handler function environment
backend.sesBounceHandler.addEnvironment('EMAIL_SUPPRESSION_LIST_TABLE', backend.data.resources.tables['EmailSuppressionList'].tableName);
backend.sesBounceHandler.addEnvironment('NOTIFICATION_EVENTS_TABLE', backend.data.resources.tables['NotificationEvents'].tableName);
backend.sesBounceHandler.addEnvironment('SES_REPUTATION_METRICS_TABLE', backend.data.resources.tables['SESReputationMetrics'].tableName);

// Configure reputation monitor function environment
backend.reputationMonitor.addEnvironment('SES_REPUTATION_METRICS_TABLE', backend.data.resources.tables['SESReputationMetrics'].tableName);
backend.reputationMonitor.addEnvironment('NOTIFICATION_EVENTS_TABLE', backend.data.resources.tables['NotificationEvents'].tableName);

// Grant permissions to read/write DynamoDB tables
backend.data.resources.tables['NotificationQueue'].grantReadWriteData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['NotificationTemplate'].grantReadData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['NotificationEvents'].grantReadWriteData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['EmailSuppressionList'].grantReadData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['Contacts'].grantReadData(backend.notificationProcessor.resources.lambda);
// Grant permissions for signal-driven architecture tables
backend.data.resources.tables['SignalEvents'].grantReadWriteData(backend.notificationProcessor.resources.lambda);
backend.data.resources.tables['SignalNotificationHooks'].grantReadData(backend.notificationProcessor.resources.lambda);

// Grant status processor permissions to read/write Requests table
backend.data.resources.tables['Requests'].grantReadWriteData(backend.statusProcessor.resources.lambda);

// Grant SES bounce handler permissions to read/write suppression and metrics tables
backend.data.resources.tables['EmailSuppressionList'].grantReadWriteData(backend.sesBounceHandler.resources.lambda);
backend.data.resources.tables['NotificationEvents'].grantReadWriteData(backend.sesBounceHandler.resources.lambda);
backend.data.resources.tables['SESReputationMetrics'].grantReadWriteData(backend.sesBounceHandler.resources.lambda);

// Grant reputation monitor permissions to read/write metrics tables
backend.data.resources.tables['SESReputationMetrics'].grantReadWriteData(backend.reputationMonitor.resources.lambda);
backend.data.resources.tables['NotificationEvents'].grantReadData(backend.reputationMonitor.resources.lambda);

// Grant SSM Parameter Store permissions for secure configuration
backend.notificationProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ssm:GetParameters',
      'ssm:GetParameter',
      'ssm:GetParametersByPath'
    ],
    resources: [
      'arn:aws:ssm:*:*:parameter/realtechee/*'
    ]
  })
);

// Grant AWS SES permissions for email sending
backend.notificationProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ses:SendEmail',
      'ses:SendRawEmail',
      'ses:GetSendQuota',
      'ses:GetSendStatistics',
      'ses:GetIdentityVerificationAttributes'
    ],
    resources: ['*'] // SES permissions are typically granted to all resources
  })
);

// Grant AWS SES permissions for bounce handler suppression management
backend.sesBounceHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ses:PutSuppressedDestination',
      'ses:GetSuppressedDestination',
      'ses:DeleteSuppressedDestination',
      'ses:ListSuppressedDestinations',
      'ses:GetSendQuota',
      'ses:GetSendStatistics',
      'ses:GetReputationInfo'
    ],
    resources: ['*'] // SES permissions are typically granted to all resources
  })
);

// Grant AWS SES permissions for reputation monitoring
backend.reputationMonitor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ses:GetSendQuota',
      'ses:GetSendStatistics',
      'ses:GetReputationInfo',
      'ses:GetIdentityVerificationAttributes'
    ],
    resources: ['*'] // SES permissions are typically granted to all resources
  })
);

// EventBridge scheduling is now handled via Amplify Gen 2 in the function definition
// All environments (sandbox, staging, production) will have automated processing
// Schedule: every 2 minutes for consistent processing across environments

// API Key Rotation: Override logical ID to recover from deleted key
// Per AWS Amplify Gen 2 documentation for rotating expired/deleted API keys
// Step 1: Deploy with override to create new key
// Step 2: Remove override and deploy again to use default logical ID
backend.data.resources.cfnResources.cfnApiKey?.overrideLogicalId(
  `recoverApiKey${new Date().getTime()}`
);

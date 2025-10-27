const { AppSyncClient, ListGraphqlApisCommand, ListApiKeysCommand } = require('@aws-sdk/client-appsync');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const appsync = new AppSyncClient({ region: 'us-west-1' });
const sns = new SNSClient({ region: 'us-west-1' });

const PRODUCTION_API_ID = 'yk6ecaswg5aehjn3ev76xzpbfe';
const DEVELOPMENT_API_ID = 'fvn7t5hbobaxjklhrqzdl4ac34';
const SNS_TOPIC_ARN = 'arn:aws:sns:us-west-1:403266990862:realtechee-api-key-expiration-alerts';

const WARNING_DAYS = 30;
const CRITICAL_DAYS = 7;

exports.handler = async (event) => {
  console.log('Starting API Key expiration check...');

  const alerts = [];
  const apis = [
    { id: PRODUCTION_API_ID, name: 'Production', endpoint: 'https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql' },
    { id: DEVELOPMENT_API_ID, name: 'Development/Staging', endpoint: 'https://yq2katnwbbeqjecywrptfgecwa.appsync-api.us-west-1.amazonaws.com/graphql' }
  ];

  for (const api of apis) {
    try {
      const listKeysCommand = new ListApiKeysCommand({ apiId: api.id });
      const keysResponse = await appsync.send(listKeysCommand);

      const now = Date.now() / 1000;

      for (const key of keysResponse.apiKeys || []) {
        const expiresAt = key.expires;
        const daysUntilExpiration = Math.floor((expiresAt - now) / 86400);

        let severity = 'INFO';
        let emoji = '✅';

        if (daysUntilExpiration < 0) {
          severity = 'CRITICAL';
          emoji = '🚨';
        } else if (daysUntilExpiration <= CRITICAL_DAYS) {
          severity = 'CRITICAL';
          emoji = '🚨';
        } else if (daysUntilExpiration <= WARNING_DAYS) {
          severity = 'WARNING';
          emoji = '⚠️';
        }

        if (severity !== 'INFO') {
          alerts.push({
            api: api.name,
            apiId: api.id,
            endpoint: api.endpoint,
            keyId: key.id,
            daysUntilExpiration,
            expirationDate: new Date(expiresAt * 1000).toISOString(),
            severity,
            emoji
          });
        }
      }
    } catch (error) {
      console.error(`Error checking ${api.name} API keys:`, error);
      alerts.push({
        api: api.name,
        apiId: api.id,
        error: error.message,
        severity: 'ERROR',
        emoji: '❌'
      });
    }
  }

  if (alerts.length > 0) {
    await sendAlert(alerts);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'API key expiration check complete',
      alertsFound: alerts.length,
      alerts
    })
  };
};

async function sendAlert(alerts) {
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter(a => a.severity === 'WARNING');
  const errorAlerts = alerts.filter(a => a.severity === 'ERROR');

  let subject = '🚨 URGENT: RealTechee API Key Expiration Alert';
  if (criticalAlerts.length === 0 && warningAlerts.length > 0) {
    subject = '⚠️ RealTechee API Key Expiration Warning';
  }

  let message = `RealTechee AWS AppSync API Key Expiration Alert
================================================

`;

  if (criticalAlerts.length > 0) {
    message += `🚨 CRITICAL ALERTS (${criticalAlerts.length}):
`;
    for (const alert of criticalAlerts) {
      if (alert.error) {
        message += `
${alert.emoji} ${alert.api} API - ERROR
   Error: ${alert.error}

`;
      } else {
        const status = alert.daysUntilExpiration < 0 ? 'EXPIRED' : `EXPIRES IN ${alert.daysUntilExpiration} DAYS`;
        message += `
${alert.emoji} ${alert.api} API - ${status}
   API ID: ${alert.apiId}
   Key ID: ${alert.keyId}
   Expiration: ${alert.expirationDate}
   Endpoint: ${alert.endpoint}

`;
      }
    }
  }

  if (warningAlerts.length > 0) {
    message += `
⚠️ WARNINGS (${warningAlerts.length}):
`;
    for (const alert of warningAlerts) {
      message += `
${alert.emoji} ${alert.api} API - EXPIRES IN ${alert.daysUntilExpiration} DAYS
   API ID: ${alert.apiId}
   Key ID: ${alert.keyId}
   Expiration: ${alert.expirationDate}
   Endpoint: ${alert.endpoint}

`;
    }
  }

  message += `
📋 RENEWAL INSTRUCTIONS:
========================

CLOUDFORMATION-MANAGED RENEWAL PROCESS:
----------------------------------------
Since October 26, 2025, production uses CloudFormation-managed API keys with 365-day expiration.
This is the ONLY correct method that prevents state drift.

HOW IT WORKS:
- CloudFormation automatically creates API keys based on expiresInDays: 365 setting
- Keys are valid for a full year (365 days)
- When you deploy, CloudFormation generates a new key
- You then sync that key to Amplify environment variables
- No manual key creation needed!

RENEWAL PROCESS (4 Simple Steps):
==================================

Step 1: List CloudFormation-Managed Keys
-----------------------------------------
Production:
aws appsync list-api-keys --api-id ${PRODUCTION_API_ID} --region us-west-1

Development/Staging:
aws appsync list-api-keys --api-id ${DEVELOPMENT_API_ID} --region us-west-1

Identify the key with CloudFormation-generated description (starts with "Amplify")
Copy the key value: da2-xxxxxxxxxxxxxxxxxxxxxxxxxx

Step 2: Update Amplify Environment Variables (CRITICAL!)
---------------------------------------------------------
**MOST IMPORTANT STEP!** Update the environment variable that frontend uses.

IMPORTANT: You must pass ALL existing environment variables, not just API_KEY.
Use aws amplify get-branch to get current vars first, then update with new key.

Production:
aws amplify get-branch --app-id d200k2wsaf8th3 --branch-name production --region us-west-1 --query 'branch.environmentVariables'
aws amplify update-branch --app-id d200k2wsaf8th3 --branch-name production --environment-variables '{"API_KEY":"<CLOUDFORMATION_KEY>","API_KEY_EXPIRATION":"<NEW_DATE>",...}' --region us-west-1

Staging:
aws amplify get-app --app-id d200k2wsaf8th3 --region us-west-1 --query 'app.environmentVariables'
aws amplify update-app --app-id d200k2wsaf8th3 --environment-variables '{"API_KEY":"<CLOUDFORMATION_KEY>","API_KEY_EXPIRATION":"<NEW_DATE>",...}' --region us-west-1

WHY: Frontend uses API key from env vars during build. Without this,
deployments will continue using the old key!

Step 3: Trigger Redeploy
-------------------------
Production:
aws amplify start-job \\
  --app-id d200k2wsaf8th3 \\
  --branch-name production \\
  --job-type RELEASE \\
  --region us-west-1

Staging:
aws amplify start-job \\
  --app-id d200k2wsaf8th3 \\
  --branch-name staging \\
  --job-type RELEASE \\
  --region us-west-1

Step 4: Verify & Delete Old Keys
---------------------------------
After deployments complete (~15 minutes):
- Production: https://www.realtechee.com/projects
- Staging: https://staging.realtechee.com/projects
- Check browser DevTools → Network tab for 200 OK on GraphQL requests


Production:
aws appsync list-api-keys --api-id ${PRODUCTION_API_ID} --region us-west-1
aws appsync delete-api-key --api-id ${PRODUCTION_API_ID} --id <OLD_KEY_ID> --region us-west-1

Development/Staging:
aws appsync list-api-keys --api-id ${DEVELOPMENT_API_ID} --region us-west-1
aws appsync delete-api-key --api-id ${DEVELOPMENT_API_ID} --id <OLD_KEY_ID> --region us-west-1

📖 FULL DOCUMENTATION:
See docs/api-key-renewal-guide.md for detailed procedures

⏰ This is an automated alert from AWS Lambda
Monitored APIs: Production, Development/Staging
Check Frequency: Daily at midnight UTC
`;

  const publishCommand = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: subject,
    Message: message
  });

  await sns.send(publishCommand);
  console.log('Alert sent successfully');
}

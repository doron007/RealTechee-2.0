import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: 'us-west-1' });

export interface SecureConfig {
  sendgrid: {
    apiKey: string;
    fromEmail: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromPhone: string;
  };
  notifications: {
    debugMode: boolean;
    debugEmail: string;
    debugPhone: string;
  };
}

/**
 * Get secure configuration from AWS Systems Manager Parameter Store
 */
export async function getSecureConfig(): Promise<SecureConfig> {
  try {
    const parameterNames = [
      '/realtechee/sendgrid/api_key',
      '/realtechee/sendgrid/from_email',
      '/realtechee/twilio/account_sid',
      '/realtechee/twilio/auth_token',
      '/realtechee/twilio/from_phone',
      '/realtechee/notifications/debug_mode',
      '/realtechee/notifications/debug_email',
      '/realtechee/notifications/debug_phone'
    ];

    const command = new GetParametersCommand({
      Names: parameterNames,
      WithDecryption: true // Decrypt SecureString parameters
    });

    const result = await ssmClient.send(command);
    const parameters = result.Parameters || [];
    const getParam = (name: string): string => {
      const param = parameters.find((p: any) => p.Name === name);
      return param?.Value || '';
    };

    return {
      sendgrid: {
        apiKey: getParam('/realtechee/sendgrid/api_key'),
        fromEmail: getParam('/realtechee/sendgrid/from_email') || 'notifications@realtechee.com'
      },
      twilio: {
        accountSid: getParam('/realtechee/twilio/account_sid'),
        authToken: getParam('/realtechee/twilio/auth_token'),
        fromPhone: getParam('/realtechee/twilio/from_phone')
      },
      notifications: {
        debugMode: getParam('/realtechee/notifications/debug_mode') === 'true',
        debugEmail: getParam('/realtechee/notifications/debug_email') || 'info@realtechee.com',
        debugPhone: getParam('/realtechee/notifications/debug_phone') || '+17135919400'
      }
    };
  } catch (error) {
    console.error('Failed to get secure config:', error);
    throw new Error('Configuration not available');
  }
}

/**
 * Lambda handler for secure config access
 */
export const handler = async (event: any) => {
  try {
    const config = await getSecureConfig();
    
    // Return config without sensitive data for logging
    return {
      statusCode: 200,
      body: JSON.stringify({
        sendgrid: { fromEmail: config.sendgrid.fromEmail },
        twilio: { fromPhone: config.twilio.fromPhone },
        notifications: config.notifications
      })
    };
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      })
    };
  }
};
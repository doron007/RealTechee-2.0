import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

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

export class SecureConfigClient {
  private static instance: SecureConfigClient;
  private static config: SecureConfig | null = null;
  private static lastFetched: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private ssmClient: SSMClient;

  private constructor() {
    this.ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-west-1' });
  }

  static getInstance(): SecureConfigClient {
    if (!SecureConfigClient.instance) {
      SecureConfigClient.instance = new SecureConfigClient();
    }
    return SecureConfigClient.instance;
  }

  async getConfig(): Promise<SecureConfig> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (SecureConfigClient.config && (now - SecureConfigClient.lastFetched) < SecureConfigClient.CACHE_TTL) {
      return SecureConfigClient.config;
    }

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
        WithDecryption: true
      });

      const result = await this.ssmClient.send(command);
      const parameters = result.Parameters || [];

      const getParam = (name: string): string => {
        const param = parameters.find(p => p.Name === name);
        return param?.Value || '';
      };

      const config: SecureConfig = {
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

      // Cache the config
      SecureConfigClient.config = config;
      SecureConfigClient.lastFetched = now;

      console.log('✅ Secure configuration loaded from Parameter Store');
      return config;
    } catch (error) {
      console.error('❌ Failed to load secure configuration:', error);
      
      // Fallback to environment variables for backward compatibility
      console.warn('⚠️  Falling back to environment variables');
      const fallbackConfig: SecureConfig = {
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY || '',
          fromEmail: process.env.FROM_EMAIL || 'notifications@realtechee.com'
        },
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromPhone: process.env.TWILIO_FROM_PHONE || ''
        },
        notifications: {
          debugMode: process.env.DEBUG_NOTIFICATIONS === 'true',
          debugEmail: process.env.DEBUG_EMAIL || 'info@realtechee.com',
          debugPhone: process.env.DEBUG_PHONE || '+17135919400'
        }
      };

      return fallbackConfig;
    }
  }

  /**
   * Clear cached configuration (useful for testing)
   */
  static clearCache(): void {
    SecureConfigClient.config = null;
    SecureConfigClient.lastFetched = 0;
  }
}
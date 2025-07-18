import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

export interface AppConfig {
  notifications: {
    debugMode: boolean;
    debugEmail: string;
    debugPhone: string;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  general: {
    appName: string;
    defaultTimezone: string;
    supportEmail: string;
    supportPhone: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
  };
}

export class ConfigService {
  private static cache: Map<string, any> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get app configuration by category
   */
  static async getConfig(category: string): Promise<Record<string, any>> {
    const cacheKey = `config:${category}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() < expiry) {
        return this.cache.get(cacheKey);
      }
    }

    try {
      // TODO: Fix AppPreferences model type issue
      // const result = await client.models.AppPreferences.list({
      //   filter: {
      //     category: { eq: category }
      //   }
      // });

      const config: Record<string, any> = {};
      
      // Temporary fallback to default config
      if (category === 'notifications') {
        config.debugMode = false;
        config.debugEmail = 'debug@realtechee.com';
        config.debugPhone = '1234567890';
        config.emailEnabled = true;
        config.smsEnabled = true;
      } else if (category === 'general') {
        config.appName = 'RealTechee';
        config.defaultTimezone = 'America/Los_Angeles';
        config.supportEmail = 'support@realtechee.com';
        config.supportPhone = '1234567890';
      } else if (category === 'security') {
        config.sessionTimeout = 3600000;
        config.maxLoginAttempts = 5;
        config.passwordMinLength = 8;
      }
      
      // TODO: Restore database-based config after fixing types
      // if (result.data) {
      //   for (const item of result.data) {
      //     if (item.key && item.value) {
      //       let value: any = item.value;
      //       
      //       // Parse based on data type
      //       switch (item.dataType) {
      //         case 'boolean':
      //           value = item.value === 'true';
      //           break;
      //         case 'number':
      //           value = parseFloat(item.value);
      //           break;
      //         case 'json':
      //           try {
      //             value = JSON.parse(item.value);
      //           } catch (e) {
      //             console.warn(`Failed to parse JSON for ${item.key}:`, e);
      //           }
      //           break;
      //         default:
      //           value = item.value;
      //       }
      //       
      //       config[item.key] = value;
      //     }
      //   }
      // }

      // Cache the result
      this.cache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return config;
    } catch (error) {
      console.error(`Failed to get config for category ${category}:`, error);
      return {};
    }
  }

  /**
   * Get a specific configuration value
   */
  static async getConfigValue(category: string, key: string, defaultValue?: any): Promise<any> {
    const config = await this.getConfig(category);
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  /**
   * Get complete app configuration
   */
  static async getAppConfig(): Promise<AppConfig> {
    const [notifications, general, security] = await Promise.all([
      this.getConfig('notifications'),
      this.getConfig('general'),
      this.getConfig('security')
    ]);

    return {
      notifications: {
        debugMode: notifications.debug_mode || false,
        debugEmail: notifications.debug_email || 'info@realtechee.com',
        debugPhone: notifications.debug_phone || '+17135919400',
        emailEnabled: notifications.email_enabled || true,
        smsEnabled: notifications.sms_enabled || true
      },
      general: {
        appName: general.app_name || 'RealTechee',
        defaultTimezone: general.default_timezone || 'America/Los_Angeles',
        supportEmail: general.support_email || 'info@realtechee.com',
        supportPhone: general.support_phone || '+17135919400'
      },
      security: {
        sessionTimeout: security.session_timeout || 30,
        maxLoginAttempts: security.max_login_attempts || 5,
        passwordMinLength: security.password_min_length || 8
      }
    };
  }

  /**
   * Update configuration value (admin only)
   */
  static async updateConfig(
    category: string, 
    key: string, 
    value: any, 
    dataType: 'string' | 'number' | 'boolean' | 'json' = 'string'
  ): Promise<boolean> {
    try {
      const categoryKey = `${category}:${key}`;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      // TODO: Fix AppPreferences model type issue
      // // Try to update existing config
      // const existing = await client.models.AppPreferences.list({
      //   filter: {
      //     categoryKey: { eq: categoryKey }
      //   }
      // });

      // if (existing.data && existing.data.length > 0) {
      //   const existingItem = existing.data[0];
      //   await client.models.AppPreferences.update({
      //     id: existingItem.id,
      //     value: stringValue,
      //     dataType,
      //     updatedAt: new Date().toISOString(),
      //     updatedBy: 'system' // TODO: Get actual user
      //   });
      // } else {
      //   // Create new config
      //   await client.models.AppPreferences.create({
      //     category,
      //     key,
      //     value: stringValue,
      //     dataType,
      //     categoryKey,
      //     description: `Configuration for ${category}.${key}`,
      //     isSystemSetting: false,
      //     environment: 'all',
      //     createdAt: new Date().toISOString(),
      //     createdBy: 'system',
      //     owner: 'system'
      //   });
      // }

      // Clear cache
      this.cache.delete(`config:${category}`);
      this.cacheExpiry.delete(`config:${category}`);

      return true;
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  /**
   * Initialize default configuration
   */
  static async initializeDefaults(): Promise<void> {
    const defaults = [
      // Notifications
      { category: 'notifications', key: 'debug_mode', value: 'true', dataType: 'boolean' },
      { category: 'notifications', key: 'debug_email', value: 'info@realtechee.com', dataType: 'string' },
      { category: 'notifications', key: 'debug_phone', value: '+17135919400', dataType: 'string' },
      { category: 'notifications', key: 'email_enabled', value: 'true', dataType: 'boolean' },
      { category: 'notifications', key: 'sms_enabled', value: 'true', dataType: 'boolean' },
      
      // General
      { category: 'general', key: 'app_name', value: 'RealTechee', dataType: 'string' },
      { category: 'general', key: 'default_timezone', value: 'America/Los_Angeles', dataType: 'string' },
      { category: 'general', key: 'support_email', value: 'info@realtechee.com', dataType: 'string' },
      { category: 'general', key: 'support_phone', value: '+17135919400', dataType: 'string' },
      
      // Security
      { category: 'security', key: 'session_timeout', value: '30', dataType: 'number' },
      { category: 'security', key: 'max_login_attempts', value: '5', dataType: 'number' },
      { category: 'security', key: 'password_min_length', value: '8', dataType: 'number' }
    ];

    for (const config of defaults) {
      await this.updateConfig(
        config.category, 
        config.key, 
        config.value, 
        config.dataType as any
      );
    }
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}
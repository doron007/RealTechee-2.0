/**
 * Signal Processor Service
 * 
 * Background service that processes emitted signals and creates notifications
 * based on configured hooks in SignalNotificationHooks table.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import logger from '@/lib/logger';
import { signalEmitter, SignalType } from './signalEmitter';

export interface SignalNotificationHook {
  id: string;
  signalType: string;
  notificationTemplateId: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  channels: string[];
  recipientEmails?: string[];
  recipientRoles?: string[];
  recipientDynamic?: string[];
  conditions?: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
    value: any;
  }[];
}

export interface ProcessingResult {
  signalId: string;
  signalType: string;
  hooksProcessed: number;
  notificationsCreated: number;
  errors: string[];
}

class SignalProcessor {
  private static instance: SignalProcessor;
  private client = generateClient<Schema>({ authMode: 'apiKey' });

  private constructor() {}

  public static getInstance(): SignalProcessor {
    if (!SignalProcessor.instance) {
      SignalProcessor.instance = new SignalProcessor();
    }
    return SignalProcessor.instance;
  }

  /**
   * Process all pending signals
   */
  public async processPendingSignals(): Promise<ProcessingResult[]> {
    try {
      logger.info('🔄 Starting signal processing batch');

      // Get unprocessed signals using GraphQL directly
      const listSignalsQuery = `
        query ListSignalEvents($filter: ModelSignalEventsFilterInput) {
          listSignalEvents(filter: $filter) {
            items {
              id
              signalType
              payload
              emittedAt
              emittedBy
              source
              processed
            }
          }
        }
      `;

      const signalsResult = await this.client.graphql({
        query: listSignalsQuery,
        variables: {
          filter: { processed: { eq: false } }
        }
      });

      const pendingSignals = (signalsResult as any).data?.listSignalEvents?.items || [];
      
      if (pendingSignals.length === 0) {
        logger.info('✅ No pending signals to process');
        return [];
      }

      logger.info(`📬 Found ${pendingSignals.length} pending signals to process`);

      const results: ProcessingResult[] = [];

      // Process each signal
      for (const signal of pendingSignals) {
        try {
          const result = await this.processSignal(signal);
          results.push(result);

          // Mark signal as processed using GraphQL
          const updateSignalMutation = `
            mutation UpdateSignalEvents($input: UpdateSignalEventsInput!) {
              updateSignalEvents(input: $input) {
                id
                processed
              }
            }
          `;
          
          await this.client.graphql({
            query: updateSignalMutation,
            variables: {
              input: {
                id: signal.id,
                processed: true
              }
            }
          });

        } catch (error) {
          logger.error(`❌ Failed to process signal ${signal.id}`, {
            signalId: signal.id,
            signalType: signal.signalType,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      logger.info('✅ Signal processing batch completed', {
        totalSignals: pendingSignals.length,
        successfullyProcessed: results.length
      });

      return results;

    } catch (error) {
      logger.error('❌ Signal processing batch failed', { error: error instanceof Error ? error.message : 'Unknown error occurred' });
      return [];
    }
  }

  /**
   * Process a single signal
   */
  private async processSignal(signal: any): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      signalId: signal.id,
      signalType: signal.signalType,
      hooksProcessed: 0,
      notificationsCreated: 0,
      errors: []
    };

    try {
      logger.info(`🎯 Processing signal: ${signal.signalType}`, {
        signalId: signal.id,
        emittedAt: signal.emittedAt
      });

      // Get hooks for this signal type using GraphQL
      const listHooksQuery = `
        query ListSignalNotificationHooks($filter: ModelSignalNotificationHooksFilterInput) {
          listSignalNotificationHooks(filter: $filter) {
            items {
              id
              signalType
              notificationTemplateId
              enabled
              priority
              channels
              recipientEmails
              recipientRoles
              recipientDynamic
              conditions
            }
          }
        }
      `;

      const hooksResult = await this.client.graphql({
        query: listHooksQuery,
        variables: {
          filter: {
            signalType: { eq: signal.signalType },
            enabled: { eq: true }
          }
        }
      });

      const hooks = (hooksResult as any).data?.listSignalNotificationHooks?.items || [];
      
      if (hooks.length === 0) {
        logger.warn(`⚠️ No active hooks found for signal type: ${signal.signalType}`);
        return result;
      }

      logger.info(`🔗 Found ${hooks.length} active hooks for signal type: ${signal.signalType}`);

      // Process each hook
      for (const hook of hooks) {
        try {
          const shouldProcess = this.evaluateConditions(hook, signal);
          
          if (!shouldProcess) {
            logger.info(`⏭️ Skipping hook ${hook.id} due to condition mismatch`);
            continue;
          }

          await this.createNotificationFromHook(hook, signal);
          result.hooksProcessed++;
          result.notificationsCreated++;

        } catch (error) {
          logger.error(`❌ Failed to process hook ${hook.id}`, {
            hookId: hook.id,
            signalId: signal.id,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          result.errors.push(`Hook ${hook.id}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
      }

      logger.info(`✅ Signal processed successfully`, {
        signalId: signal.id,
        hooksProcessed: result.hooksProcessed,
        notificationsCreated: result.notificationsCreated
      });

      return result;

    } catch (error) {
      logger.error(`❌ Failed to process signal ${signal.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      return result;
    }
  }

  /**
   * Evaluate hook conditions against signal payload
   */
  private evaluateConditions(hook: any, signal: any): boolean {
    const conditions = hook.conditions ? JSON.parse(hook.conditions) : [];
    
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always process
    }

    const payload = JSON.parse(signal.payload);

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(payload, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get field value from payload using dot notation
   */
  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'eq': return fieldValue === expectedValue;
      case 'ne': return fieldValue !== expectedValue;
      case 'gt': return fieldValue > expectedValue;
      case 'lt': return fieldValue < expectedValue;
      case 'contains': 
        return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
      default: 
        logger.warn(`Unknown condition operator: ${operator}`);
        return true;
    }
  }

  /**
   * Create notification queue record from hook configuration
   */
  private async createNotificationFromHook(hook: any, signal: any): Promise<void> {
    logger.info(`📋 Creating notification from hook`, {
      hookId: hook.id,
      signalId: signal.id,
      templateId: hook.notificationTemplateId
    });

    // Get the template using GraphQL
    const getTemplateQuery = `
      query GetNotificationTemplate($id: ID!) {
        getNotificationTemplate(id: $id) {
          id
          name
          subject
          contentHtml
          contentText
          channel
        }
      }
    `;

    const templateResult = await this.client.graphql({
      query: getTemplateQuery,
      variables: { id: hook.notificationTemplateId }
    });

    if (!(templateResult as any).data?.getNotificationTemplate) {
      throw new Error(`Template ${hook.notificationTemplateId} not found`);
    }

    const template = (templateResult as any).data.getNotificationTemplate;
    const payload = JSON.parse(signal.payload);
    const channels = JSON.parse(hook.channels || '[]');

    // Resolve recipients
    const recipients = await this.resolveRecipients(hook, payload);
    
    if (recipients.length === 0) {
      logger.warn('No recipients resolved for notification');
      return;
    }

    // Create multi-channel notification record
    const channelsData = this.buildChannelsData(channels, template, payload, recipients);

    // Create notification queue record using GraphQL
    const createNotificationMutation = `
      mutation CreateNotificationQueue($input: CreateNotificationQueueInput!) {
        createNotificationQueue(input: $input) {
          id
          eventType
          signalEventId
          templateId
          status
          priority
        }
      }
    `;

    await this.client.graphql({
      query: createNotificationMutation,
      variables: {
        input: {
          eventType: `${signal.signalType}_notification`,
          signalEventId: signal.id,
          templateId: hook.notificationTemplateId,
          status: 'PENDING',
          priority: hook.priority?.toUpperCase() || 'MEDIUM',
          channels: JSON.stringify(channelsData),
          recipientIds: JSON.stringify(recipients.map(r => r.email || r.id)),
          payload: signal.payload,
          retryCount: 0
        }
      }
    });

    logger.info(`✅ Notification created successfully`, {
      hookId: hook.id,
      signalId: signal.id,
      recipients: recipients.length,
      channels: channels.length
    });
  }

  /**
   * Resolve recipients from hook configuration
   */
  private async resolveRecipients(hook: any, payload: any): Promise<any[]> {
    const recipients: any[] = [];

    // Static email recipients
    const staticEmails = hook.recipientEmails ? JSON.parse(hook.recipientEmails) : [];
    for (const email of staticEmails) {
      recipients.push({ email, type: 'static' });
    }

    // Role-based recipients
    const roles = hook.recipientRoles ? JSON.parse(hook.recipientRoles) : [];
    for (const role of roles) {
      const roleRecipients = await this.getRecipientsByRole(role);
      recipients.push(...roleRecipients);
    }

    // Dynamic recipients from payload
    const dynamicFields = hook.recipientDynamic ? JSON.parse(hook.recipientDynamic) : [];
    for (const field of dynamicFields) {
      const email = this.getFieldValue(payload, field);
      if (email && this.isValidEmail(email)) {
        recipients.push({ email, type: 'dynamic', field });
      }
    }

    return recipients;
  }

  /**
   * Get recipients by role (placeholder - implement role-based lookup)
   */
  private async getRecipientsByRole(role: string): Promise<any[]> {
    // TODO: Implement role-based recipient lookup from Contacts or Users table
    // For now, return default recipients based on role
    const defaultRoleRecipients = {
      'AE': [{ email: 'info@realtechee.com', role: 'AE' }],
      'PM': [{ email: 'info@realtechee.com', role: 'PM' }],
      'ADMIN': [{ email: 'info@realtechee.com', role: 'ADMIN' }]
    };

    return (defaultRoleRecipients as any)[role] || [];
  }

  /**
   * Build channels data for notification queue
   */
  private buildChannelsData(channels: string[], template: any, payload: any, recipients: any[]): any {
    const channelsData: any = {};

    for (const channelType of channels) {
      const recipientList = recipients.map(r => r.email);

      switch (channelType.toUpperCase()) {
        case 'EMAIL':
          channelsData.email = {
            enabled: true,
            recipients: recipientList,
            subject: this.renderTemplate(template.subject, payload),
            content: this.renderTemplate(template.contentHtml, payload),
            status: 'PENDING'
          };
          break;

        case 'SMS':
          channelsData.sms = {
            enabled: true,
            recipients: recipientList,
            content: this.renderTemplate(template.contentText, payload),
            status: 'PENDING'
          };
          break;
      }
    }

    return channelsData;
  }

  /**
   * Simple template rendering (placeholder for more sophisticated system)
   */
  private renderTemplate(template: string, payload: any): string {
    if (!template) return '';

    let rendered = template;

    // Simple variable replacement - replace with proper template engine
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (typeof value === 'string' || typeof value === 'number') {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
      }
    });

    return rendered;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const signalProcessor = SignalProcessor.getInstance();
export { SignalProcessor };
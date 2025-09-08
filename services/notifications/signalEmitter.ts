/**
 * Signal Emitter Service
 * 
 * Core service for emitting signals in the signal-driven notification architecture.
 * Developers use this to emit events that can trigger configurable notifications.
 */

import { generateClient } from 'aws-amplify/api';
import logger from '@/lib/logger';

// Type definitions for GraphQL responses
interface CreateSignalEventsResponse {
  createSignalEvents: {
    id: string;
    signalType: string;
    emittedAt: string;
  };
}

interface ListSignalEventsResponse {
  listSignalEvents: {
    items: Array<{
      id: string;
      signalType: string;
      emittedAt: string;
      payload: any;
    }>;
  };
}

interface GraphQLResponse<T> {
  data: T;
  errors?: any[];
}

// Create a dedicated GraphQL client for signal operations
const graphqlClient = generateClient({
  authMode: 'apiKey'
});

// Signal types for the four forms (updated to match notification hook conventions)
export type FormSignalType = 
  | 'CONTACT_US_FORM_SUBMITTED'
  | 'GET_QUALIFIED_FORM_SUBMITTED' 
  | 'AFFILIATE_FORM_SUBMITTED'
  | 'GET_ESTIMATE_FORM_SUBMITTED';

export type SystemSignalType =
  | 'status_change_request'
  | 'status_change_project'
  | 'status_change_quote'
  | 'user_registration'
  | 'admin_notification';

export type SignalType = FormSignalType | SystemSignalType;

export interface SignalPayload {
  // Common fields for all signals
  source: string;           // 'contact_form', 'admin_panel', 'api', etc.
  timestamp: string;        // ISO timestamp
  userId?: string;          // Authenticated user ID
  sessionId?: string;       // Session identifier
  
  // Dynamic payload data
  [key: string]: any;
}

export interface EmitSignalResult {
  success: boolean;
  signalId?: string;
  error?: string;
  timestamp: string;
}

class SignalEmitter {
  private static instance: SignalEmitter;

  private constructor() {}

  public static getInstance(): SignalEmitter {
    if (!SignalEmitter.instance) {
      SignalEmitter.instance = new SignalEmitter();
    }
    return SignalEmitter.instance;
  }

  /**
   * Emit a signal with payload data
   */
  public async emit(
    signalType: SignalType, 
    payload: SignalPayload,
    options: {
      emittedBy?: string;
      source?: string;
    } = {}
  ): Promise<EmitSignalResult> {
    const timestamp = new Date().toISOString();
    
    try {
      logger.info(`🎯 Emitting signal: ${signalType}`, {
        signalType,
        source: payload.source || options.source,
        emittedBy: options.emittedBy,
        timestamp
      });

      // Use GraphQL mutation directly
      const CREATE_SIGNAL_EVENT = `
        mutation CreateSignalEvents($input: CreateSignalEventsInput!) {
          createSignalEvents(input: $input) {
            id
            signalType
            payload
            emittedAt
            emittedBy
            source
            processed
            createdAt
            updatedAt
          }
        }
      `;
      
      const signalData = {
        signalType,
        payload: JSON.stringify(payload),
        emittedAt: timestamp,
        emittedBy: options.emittedBy || payload.userId || 'anonymous',
        source: payload.source || options.source || 'unknown',
        processed: false
      };

      const result = await graphqlClient.graphql({
        query: CREATE_SIGNAL_EVENT,
        variables: { input: signalData }
      });

      const typedResult = result as GraphQLResponse<CreateSignalEventsResponse>;
      if (typedResult.data && typedResult.data.createSignalEvents) {
        const createdSignal = typedResult.data.createSignalEvents;
        logger.info(`✅ Signal emitted successfully`, {
          signalId: createdSignal.id,
          signalType,
          timestamp
        });

        return {
          success: true,
          signalId: createdSignal.id,
          timestamp
        };
      } else {
        throw new Error('Failed to create signal event - no data returned');
      }

    } catch (error) {
      logger.error(`❌ Failed to emit signal: ${signalType}`, {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        signalType,
        timestamp
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp
      };
    }
  }

  /**
   * Emit form submission signal
   * Convenience method for form submissions (updated for unified notification system)
   */
  public async emitFormSubmission(
    formType: 'contact_us' | 'get_qualified' | 'affiliate' | 'get_estimate',
    formData: Record<string, any>,
    options: {
      urgency?: 'low' | 'medium' | 'high';
      testMode?: boolean;
      sessionId?: string;
    } = {}
  ): Promise<EmitSignalResult> {
    // Map form types to new signal type convention
    const signalTypeMap: Record<string, FormSignalType> = {
      'contact_us': 'CONTACT_US_FORM_SUBMITTED',
      'get_qualified': 'GET_QUALIFIED_FORM_SUBMITTED',
      'affiliate': 'AFFILIATE_FORM_SUBMITTED',
      'get_estimate': 'GET_ESTIMATE_FORM_SUBMITTED'
    };
    
    const signalType = signalTypeMap[formType];
    if (!signalType) {
      throw new Error(`Unknown form type: ${formType}`);
    }
    
    const payload: SignalPayload = {
      ...formData,
      source: `${formType}_form`,
      timestamp: new Date().toISOString(),
      urgency: options.urgency || 'medium',
      testMode: options.testMode || false,
      sessionId: options.sessionId || `session_${Date.now()}`
    };

    logger.info(`🎯 Emitting unified signal: ${signalType}`, {
      formType,
      urgency: options.urgency,
      testMode: options.testMode,
      customerEmail: formData.customerEmail || formData.email
    });

    return this.emit(signalType, payload, {
      source: `${formType}_form`,
      emittedBy: formData.customerEmail || formData.email || 'form_user'
    });
  }

  /**
   * Emit system status change signal
   */
  public async emitStatusChange(
    entityType: 'request' | 'project' | 'quote',
    entityId: string,
    oldStatus: string,
    newStatus: string,
    metadata: Record<string, any> = {}
  ): Promise<EmitSignalResult> {
    const signalType: SystemSignalType = `status_change_${entityType}` as SystemSignalType;
    
    const payload: SignalPayload = {
      entityType,
      entityId,
      oldStatus,
      newStatus,
      ...metadata,
      source: 'admin_panel',
      timestamp: new Date().toISOString()
    };

    return this.emit(signalType, payload, {
      source: 'status_management',
      emittedBy: metadata.updatedBy || 'system'
    });
  }

  /**
   * Get recent signals for debugging
   */
  public async getRecentSignals(
    limit: number = 10,
    signalType?: SignalType
  ): Promise<any[]> {
    try {
      const LIST_SIGNAL_EVENTS = `
        query ListSignalEvents($limit: Int, $filter: ModelSignalEventsFilterInput) {
          listSignalEvents(limit: $limit, filter: $filter) {
            items {
              id
              signalType
              payload
              emittedAt
              emittedBy
              source
              processed
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables: any = { limit };
      if (signalType) {
        variables.filter = { signalType: { eq: signalType } };
      }

      const result = await graphqlClient.graphql({
        query: LIST_SIGNAL_EVENTS,
        variables
      });
      
      const typedResult = result as GraphQLResponse<ListSignalEventsResponse>;
      return (typedResult.data?.listSignalEvents?.items || [])
        .sort((a: any, b: any) => new Date(b.emittedAt).getTime() - new Date(a.emittedAt).getTime())
        .slice(0, limit);
        
    } catch (error) {
      logger.error('Failed to fetch recent signals', { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      return [];
    }
  }
}

// Export singleton instance
export const signalEmitter = SignalEmitter.getInstance();
export { SignalEmitter };
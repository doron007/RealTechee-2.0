import { quotesAPI, requestsAPI } from '../../utils/amplifyAPI';
import { requestStatusService } from './requestStatusService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QuoteCreationService');

export interface QuoteCreationOptions {
  userId: string;
  automaticStatusUpdate?: boolean;
  additionalData?: {
    title?: string;
    description?: string;
    assignedTo?: string;
  };
}

export interface QuoteCreationResult {
  success: boolean;
  quoteId?: string;
  quote?: any;
  previousRequestStatus?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface RequestToQuoteMapping {
  // Request fields → Quote fields mapping
  requestId: string;
  title?: string;
  budget?: number;
  product?: string;
  assignedTo?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  propertyAddress?: string;
  description?: string;
}

/**
 * Service for creating quotes from requests with automatic data transfer
 * and status management integration
 */
export class QuoteCreationService {
  private static instance: QuoteCreationService;

  private constructor() {}

  public static getInstance(): QuoteCreationService {
    if (!QuoteCreationService.instance) {
      QuoteCreationService.instance = new QuoteCreationService();
    }
    return QuoteCreationService.instance;
  }

  /**
   * Create a quote from a request with automatic data transfer
   */
  public async createQuoteFromRequest(
    requestId: string,
    options: QuoteCreationOptions
  ): Promise<QuoteCreationResult> {
    try {
      logger.info('Creating quote from request', { requestId, userId: options.userId });

      // Step 1: Get request data
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found or inaccessible',
          }
        };
      }

      const request = requestResult.data;
      logger.debug('Request data retrieved', { requestId, status: request.status });

      // Step 2: Validate request status
      if (request.status !== 'Move to Quoting') {
        logger.warn('Request not ready for quoting', { 
          requestId, 
          currentStatus: request.status,
          expectedStatus: 'Move to Quoting'
        });
        
        // Allow quote creation but warn user
        // Don't fail - business might want quotes at any stage
      }

      // Step 3: Map request data to quote structure
      const quoteData = this.mapRequestToQuote(request, options);
      logger.debug('Quote data mapped', { quoteData });

      // Step 4: Generate quote number
      const quoteNumber = await this.generateQuoteNumber();

      // Step 5: Create quote
      const quote = {
        ...quoteData,
        quoteNumber,
        status: 'draft',
        statusOrder: 1,
        requestId: requestId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const quoteResult = await quotesAPI.create(quote);
      if (!quoteResult.success || !quoteResult.data) {
        throw new Error('Failed to create quote in database');
      }

      const createdQuote = quoteResult.data;
      logger.info('Quote created successfully', { 
        quoteId: createdQuote.id, 
        quoteNumber: createdQuote.quoteNumber 
      });

      // Step 6: Update request status if requested
      let previousRequestStatus = request.status;
      if (options.automaticStatusUpdate !== false) { // Default to true
        try {
          const statusResult = await requestStatusService.changeStatus(
            requestId,
            'Move to Quoting', // Ensure status is set to quoting
            {
              userId: options.userId,
              triggeredBy: 'user',
              reason: `Quote #${quoteNumber} created from request`,
            }
          );

          if (statusResult.success) {
            logger.info('Request status updated after quote creation', {
              requestId,
              newStatus: 'Move to Quoting',
              quoteId: createdQuote.id
            });
          }
        } catch (statusError) {
          logger.warn('Failed to update request status after quote creation', {
            error: statusError,
            requestId,
            quoteId: createdQuote.id
          });
          // Don't fail the entire operation for status update issues
        }
      }

      return {
        success: true,
        quoteId: createdQuote.id,
        quote: createdQuote,
        previousRequestStatus,
      };

    } catch (error) {
      logger.error('Quote creation failed', { error, requestId });
      
      return {
        success: false,
        error: {
          code: 'QUOTE_CREATION_FAILED',
          message: 'Failed to create quote from request',
          details: error
        }
      };
    }
  }

  /**
   * Map request data to quote structure
   */
  private mapRequestToQuote(request: any, options: QuoteCreationOptions): any {
    const baseQuote = {
      // Basic information
      title: options.additionalData?.title || 
             `Quote for ${request.propertyAddress || 'Property'} - ${request.product || 'Services'}`,
      
      // Financial data
      budget: request.budget ? parseFloat(request.budget) : null,
      product: request.product,
      
      // Assignment
      assignedTo: options.additionalData?.assignedTo || request.assignedTo,
      
      // Client information (from request or linked contacts)
      // Note: RequestDetail component loads contact data separately
      // We'll use request fields as fallback
      
      // Property and project details
      
      // Timestamps
      assignedDate: request.assignedDate,
      
      // Description combining request message and additional info
      // This will be stored in a description field if available
    };

    // Add additional data if provided
    if (options.additionalData) {
      Object.assign(baseQuote, options.additionalData);
    }

    logger.debug('Request mapped to quote base structure', { 
      requestId: request.id,
      mappedFields: Object.keys(baseQuote).length 
    });

    return baseQuote;
  }

  /**
   * Generate unique quote number
   */
  private async generateQuoteNumber(): Promise<number> {
    try {
      // Get the latest quote to determine next number
      const quotesResult = await quotesAPI.list();
      
      if (quotesResult.success && quotesResult.data) {
        const quotes = quotesResult.data;
        
        // Find the highest quote number
        const maxQuoteNumber = quotes.reduce((max: number, quote: any) => {
          const quoteNum = quote.quoteNumber || 0;
          return Math.max(max, quoteNum);
        }, 0);

        const nextNumber = maxQuoteNumber + 1;
        logger.debug('Generated quote number', { 
          maxExisting: maxQuoteNumber, 
          generated: nextNumber 
        });
        
        return nextNumber;
      }
      
      // Fallback to 1 if no quotes exist
      return 1;
    } catch (error) {
      logger.warn('Failed to generate sequential quote number, using timestamp-based', { error });
      
      // Fallback: use timestamp-based number
      return parseInt(Date.now().toString().slice(-6));
    }
  }

  /**
   * Get quote creation readiness check for a request
   */
  public async getQuoteCreationReadiness(requestId: string): Promise<{
    ready: boolean;
    reasons: string[];
    recommendations: string[];
  }> {
    try {
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          ready: false,
          reasons: ['Request not found'],
          recommendations: []
        };
      }

      const request = requestResult.data;
      const reasons: string[] = [];
      const recommendations: string[] = [];

      // Check status
      if (request.status !== 'Move to Quoting') {
        reasons.push(`Request status is '${request.status}', not 'Move to Quoting'`);
        recommendations.push('Update request status to Move to Quoting first');
      }

      // Check essential data
      if (!request.product) {
        reasons.push('Product not specified');
        recommendations.push('Add product information to the request');
      }

      // Check assignment
      if (!request.assignedTo) {
        reasons.push('Request not assigned to an Account Executive');
        recommendations.push('Assign request to an AE before creating quote');
      }

      const ready = reasons.length === 0;

      logger.debug('Quote creation readiness check', {
        requestId,
        ready,
        reasons,
        recommendations
      });

      return { ready, reasons, recommendations };
    } catch (error) {
      logger.error('Readiness check failed', { error, requestId });
      return {
        ready: false,
        reasons: ['System error during readiness check'],
        recommendations: ['Contact system administrator']
      };
    }
  }

  /**
   * Get existing quotes for a request
   */
  public async getRequestQuotes(requestId: string): Promise<any[]> {
    try {
      const quotesResult = await quotesAPI.list();
      if (quotesResult.success && quotesResult.data) {
        return quotesResult.data.filter((quote: any) => quote.requestId === requestId);
      }
      return [];
    } catch (error) {
      logger.error('Failed to get request quotes', { error, requestId });
      return [];
    }
  }
}

// Export singleton instance
export const quoteCreationService = QuoteCreationService.getInstance();
export default quoteCreationService;
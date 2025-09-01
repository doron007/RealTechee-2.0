/**
 * RequestService Usage Examples
 * 
 * This file demonstrates how to use the RequestService with various
 * business workflows and integrations.
 */

import { RequestService, createRequestService } from './RequestService';
import { createRequestRepository } from '../../../repositories/RequestRepository';
import { GraphQLClient } from '../../../repositories/base/GraphQLClient';

// ============================================================================
// Service Setup with Dependency Injection
// ============================================================================

/**
 * Example: Setting up RequestService with all dependencies
 */
export async function setupRequestService(): Promise<RequestService> {
  // 1. Create GraphQL client
  const graphqlClient = new GraphQLClient({
    defaultAuthMode: 'apiKey',
    enableLogging: true,
    loggerName: 'RequestService'
  });

  // 2. Create repository
  const requestRepository = createRequestRepository(graphqlClient);

  // 3. Mock service dependencies (would be real services in production)
  const notificationService = {
    sendNewRequestNotifications: async (requestId: string, options: any) => {
      console.log(`Sending notifications for request ${requestId}`, options);
      return { success: true };
    },
    sendAssignmentNotification: async (agentId: string, requestId: string, reason: string) => {
      console.log(`Notifying agent ${agentId} about assignment to ${requestId}: ${reason}`);
      return { success: true };
    },
    scheduleReminder: async (reminder: any) => {
      console.log('Scheduling reminder:', reminder);
      return { success: true };
    },
    sendMergeNotification: async (primaryId: string, mergedIds: string[], conflictCount: number) => {
      console.log(`Merge notification: ${primaryId} absorbed ${mergedIds.length} requests with ${conflictCount} conflicts`);
      return { success: true };
    }
  };

  const contactService = {
    validateContact: async (contactId: string) => ({ isValid: true, contact: { id: contactId, name: 'Test Contact' } })
  };

  const propertyService = {
    validateProperty: async (propertyId: string) => ({ isValid: true, property: { id: propertyId, address: 'Test Address' } })
  };

  const auditService = {
    logRequestCreated: async (requestId: string, metadata: any) => {
      console.log(`Audit: Request ${requestId} created`, metadata);
      return { success: true };
    }
  };

  // 4. Create service with dependencies
  return createRequestService({
    requestRepository,
    notificationService,
    contactService,
    propertyService,
    auditService
  });
}

// ============================================================================
// Business Workflow Examples
// ============================================================================

/**
 * Example 1: Complete new request processing workflow
 */
export async function processNewLeadWorkflow() {
  const requestService = await setupRequestService();

  // Incoming request data from form submission
  const newRequestData = {
    homeownerContactId: 'contact_123',
    addressId: 'property_456',
    product: 'Kitchen Renovation',
    message: 'Looking for a complete kitchen remodel. Budget around $50k. Need it done by summer.',
    budget: '$40,000 - $60,000',
    leadSource: 'website',
    relationToProperty: 'owner',
    priority: 'medium' as const,
    needFinance: false
  };

  console.log('🚀 Processing new request with full workflow...\n');

  const result = await requestService.processNewRequest(newRequestData, {
    autoScore: true,           // Calculate lead score
    autoAssign: true,          // Assign to best available agent
    autoScheduleFollowUp: true, // Schedule initial follow-up
    sendNotifications: true,   // Send notifications to stakeholders
    skipValidation: false      // Run full validation
  });

  if (result.success) {
    const request = result.data!;
    console.log(`✅ Request ${request.id} processed successfully`);
    console.log(`   Lead Score: ${request.readinessScore}/100`);
    console.log(`   Priority: ${request.priority}`);
    console.log(`   Assigned To: ${request.assignedTo}`);
    console.log(`   Follow-up Date: ${request.followUpDate}\n`);
  } else {
    console.error('❌ Failed to process request:', result.error);
  }

  return result;
}

/**
 * Example 2: Agent assignment with load balancing
 */
export async function intelligentAgentAssignment() {
  const requestService = await setupRequestService();
  const requestId = 'request_789';

  console.log('🎯 Performing intelligent agent assignment...\n');

  const result = await requestService.assignToAgent(requestId, {
    strategy: 'auto_balance',     // Use automatic load balancing
    considerSpecialty: true,      // Match agent skills to request type
    considerLocation: true,       // Consider geographic proximity
    considerWorkload: true        // Balance current workloads
  });

  if (result.success) {
    const assignment = result.data!;
    console.log(`✅ Agent assigned: ${assignment.agentName}`);
    console.log(`   Reason: ${assignment.assignmentReason}`);
    console.log(`   Confidence: ${(assignment.confidence * 100).toFixed(1)}%`);
    console.log(`   Workload: ${assignment.workloadBefore} → ${assignment.workloadAfter}\n`);
  } else {
    console.error('❌ Failed to assign agent:', result.error);
  }

  return result;
}

/**
 * Example 3: Lead scoring and prioritization
 */
export async function leadScoringExample() {
  const requestService = await setupRequestService();
  const requestId = 'request_456';

  console.log('📊 Calculating comprehensive lead score...\n');

  const result = await requestService.calculateLeadScore(requestId);

  if (result.success) {
    const score = result.data!;
    console.log(`✅ Lead Score Analysis for ${score.requestId}:`);
    console.log(`   Overall Score: ${score.overallScore}/100 (Grade: ${score.grade})`);
    console.log(`   Conversion Probability: ${(score.conversionProbability * 100).toFixed(1)}%`);
    console.log(`   Priority Level: ${score.priorityLevel.toUpperCase()}`);
    console.log(`   
   📈 Scoring Breakdown:
   - Data Completeness: ${score.factors.dataCompleteness}/100
   - Source Quality: ${score.factors.sourceQuality}/100  
   - Engagement Level: ${score.factors.engagementLevel}/100
   - Budget Alignment: ${score.factors.budgetAlignment}/100
   - Project Complexity: ${score.factors.projectComplexity}/100
   - Geographic Fit: ${score.factors.geographicFit}/100
   - Urgency Indicators: ${score.factors.urgencyIndicators}/100`);
    
    console.log(`\n💡 Recommendations:`);
    score.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log('');
  } else {
    console.error('❌ Failed to calculate lead score:', result.error);
  }

  return result;
}

/**
 * Example 4: Quote generation workflow
 */
export async function quoteGenerationWorkflow() {
  const requestService = await setupRequestService();
  const requestId = 'request_321';

  console.log('💰 Generating quote from request...\n');

  const result = await requestService.generateQuoteFromRequest(requestId, {
    basePrice: 45000,
    adjustmentFactors: {
      complexity: 1.2,    // 20% increase for complexity
      materials: 1.1,     // 10% increase for premium materials
      timeline: 0.95,     // 5% discount for flexible timeline
      location: 1.05      // 5% increase for location
    },
    includeAlternatives: true,
    validityPeriod: 30,   // 30 days
    notes: 'Premium kitchen renovation with custom cabinetry'
  });

  if (result.success) {
    const quote = result.data!;
    console.log(`✅ Quote generated: ${quote.id}`);
    console.log(`   Base Price: $${quote.basePrice.toLocaleString()}`);
    console.log(`   Final Price: $${quote.totalPrice.toLocaleString()}`);
    console.log(`   Valid for: ${quote.validityPeriod} days`);
    console.log(`   Status: ${quote.status}\n`);
  } else {
    console.error('❌ Failed to generate quote:', result.error);
  }

  return result;
}

/**
 * Example 5: Follow-up scheduling
 */
export async function scheduleFollowUpExample() {
  const requestService = await setupRequestService();
  const requestId = 'request_654';

  console.log('📅 Scheduling intelligent follow-up...\n');

  const result = await requestService.scheduleFollowUp(requestId, {
    followUpType: 'initial_contact',
    priority: 'high',
    assignedTo: 'agent_123',
    message: 'Initial consultation follow-up for kitchen renovation project',
    reminderDays: [1, 3, 7],     // Reminders 1, 3, and 7 days before
    autoReschedule: true         // Auto-reschedule if no response
  });

  if (result.success) {
    const followUp = result.data!;
    console.log(`✅ Follow-up scheduled for ${new Date(followUp.scheduledDate!).toLocaleDateString()}`);
    console.log(`   Type: ${followUp.followUpType}`);
    console.log(`   Priority: ${followUp.priority}`);
    console.log(`   Assigned to: ${followUp.assignedTo}`);
    console.log(`   Reminders: ${followUp.reminderDays.length} scheduled\n`);
  } else {
    console.error('❌ Failed to schedule follow-up:', result.error);
  }

  return result;
}

/**
 * Example 6: Status transition validation
 */
export async function statusTransitionExample() {
  const requestService = await setupRequestService();
  const requestId = 'request_987';

  console.log('🔄 Validating status transition...\n');

  const result = await requestService.validateStatusTransition(
    requestId, 
    'quote_ready',
    {
      userId: 'user_123',
      reason: 'All information gathered, ready to prepare quote'
    }
  );

  if (result.success) {
    const validation = result.data!;
    console.log(`✅ Status Transition Validation:`);
    console.log(`   Valid: ${validation.isValid ? 'YES' : 'NO'}`);
    
    if (validation.errors?.length) {
      console.log(`   ❌ Errors: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings?.length) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
    }
    
    if (validation.requiredFields?.length) {
      console.log(`   📋 Required Fields: ${validation.requiredFields.join(', ')}`);
    }
    console.log('');
  } else {
    console.error('❌ Failed to validate transition:', result.error);
  }

  return result;
}

/**
 * Example 7: Request merging for duplicates
 */
export async function requestMergeExample() {
  const requestService = await setupRequestService();
  
  console.log('🔗 Merging duplicate requests...\n');

  const result = await requestService.mergeRequests(
    'request_primary',
    ['request_dup1', 'request_dup2'],
    {
      conflictResolution: 'keep_primary',
      preserveHistory: true,
      notifyStakeholders: true
    }
  );

  if (result.success) {
    const merge = result.data!;
    console.log(`✅ Requests merged successfully:`);
    console.log(`   Primary: ${merge.primaryRequestId}`);
    console.log(`   Merged: ${merge.mergedRequestIds.join(', ')}`);
    console.log(`   Conflicts Resolved: ${merge.conflictResolutions.length}`);
    console.log(`   Notes Preserved: ${merge.mergedNotes.length}`);
    console.log(`   Assignments Preserved: ${merge.mergedAssignments.length}\n`);
  } else {
    console.error('❌ Failed to merge requests:', result.error);
  }

  return result;
}

/**
 * Example 8: Bulk archival operation
 */
export async function bulkArchivalExample() {
  const requestService = await setupRequestService();
  
  console.log('📦 Running bulk archival process...\n');

  const result = await requestService.archiveOldRequests({
    olderThanDays: 180,           // Archive requests older than 6 months
    statuses: ['completed', 'cancelled', 'expired'],
    excludeActiveQuotes: true,    // Don't archive if has active quotes
    batchSize: 25,               // Process 25 at a time
    dryRun: false                // Actually perform archival
  });

  if (result.success) {
    const archival = result.data!;
    console.log(`✅ Bulk archival completed:`);
    console.log(`   Archived: ${archival.archived} requests`);
    console.log(`   Skipped: ${archival.skipped} requests`);
    console.log(`   Errors: ${archival.errors.length}`);
    
    if (archival.errors.length > 0) {
      console.log(`   Error details: ${archival.errors.slice(0, 3).join('; ')}`);
    }
    console.log('');
  } else {
    console.error('❌ Failed bulk archival:', result.error);
  }

  return result;
}

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * Example: How UI components would use the service
 */
export class RequestUIIntegration {
  private requestService: RequestService;

  constructor(requestService: RequestService) {
    this.requestService = requestService;
  }

  /**
   * Form submission handler
   */
  async handleFormSubmission(formData: any) {
    try {
      // Business logic is in the service, UI just handles presentation
      const result = await this.requestService.processNewRequest(formData, {
        autoScore: true,
        autoAssign: true,
        autoScheduleFollowUp: true,
        sendNotifications: true
      });

      if (result.success) {
        return {
          success: true,
          message: 'Request submitted successfully! We\'ll be in touch soon.',
          requestId: result.data!.id,
          priority: result.data!.priority,
          assignedAgent: result.data!.assignedTo
        };
      } else {
        return {
          success: false,
          message: 'Failed to submit request. Please try again.',
          error: result.error?.message
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'An unexpected error occurred.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Agent assignment UI handler
   */
  async handleAgentAssignment(requestId: string, strategy: string = 'auto_balance') {
    const result = await this.requestService.assignToAgent(requestId, {
      strategy: strategy as any,
      considerSpecialty: true,
      considerLocation: true,
      considerWorkload: true
    });

    return {
      success: result.success,
      data: result.data,
      message: result.success 
        ? `Successfully assigned to ${result.data!.agentName} with ${(result.data!.confidence * 100).toFixed(1)}% confidence`
        : 'Failed to assign agent'
    };
  }

  /**
   * Status update UI handler
   */
  async handleStatusUpdate(requestId: string, newStatus: string, reason: string) {
    // First validate the transition
    const validation = await this.requestService.validateStatusTransition(requestId, newStatus, {
      reason,
      userId: 'current_user_id' // Would come from auth context
    });

    if (!validation.success || !validation.data!.isValid) {
      return {
        success: false,
        message: 'Invalid status transition',
        errors: validation.data?.errors || [],
        warnings: validation.data?.warnings || []
      };
    }

    // If valid, perform the update (would use repository directly or another service method)
    return {
      success: true,
      message: `Status updated to ${newStatus}`,
      warnings: validation.data!.warnings || []
    };
  }
}

// ============================================================================
// Demo Runner
// ============================================================================

/**
 * Run all examples in sequence
 */
export async function runAllExamples() {
  console.log('🏗️  RequestService Examples Demo\n');
  console.log('=====================================\n');

  try {
    await processNewLeadWorkflow();
    await intelligentAgentAssignment();
    await leadScoringExample();
    await quoteGenerationWorkflow();
    await scheduleFollowUpExample();
    await statusTransitionExample();
    await requestMergeExample();
    await bulkArchivalExample();

    console.log('🎉 All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Uncomment to run examples when file is executed directly
// runAllExamples();
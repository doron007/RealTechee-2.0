/**
 * RequestRepository Usage Examples
 * 
 * This file demonstrates how to use the RequestRepository to replace
 * direct GraphQL calls in components like RequestDetail.tsx
 */

import { RequestRepository, createRequestRepository } from '../RequestRepository';
import { GraphQLClient } from '../base/GraphQLClient';

// ============================================================================
// Setup Repository Instance
// ============================================================================

/**
 * Create a repository instance
 * This would typically be done in a service layer or dependency injection
 */
function setupRequestRepository(): RequestRepository {
  const client = new GraphQLClient({
    defaultAuthMode: 'apiKey',
    enableLogging: true,
    loggerName: 'RequestRepository'
  });
  
  return new RequestRepository(client);
}

// ============================================================================
// Basic CRUD Operations
// ============================================================================

/**
 * Example: Create a new request (replaces direct createRequest mutation)
 */
export async function createNewRequest(formData: {
  homeownerContactId: string;
  addressId?: string;
  message?: string;
  budget?: string;
  leadSource?: string;
}) {
  const repository = setupRequestRepository();
  
  const result = await repository.create({
    data: {
      homeownerContactId: formData.homeownerContactId,
      addressId: formData.addressId,
      message: formData.message,
      budget: formData.budget,
      leadSource: formData.leadSource || 'form_submission',
      status: 'new',
      priority: 'medium',
      source: 'form_submission',
      readinessScore: 0
    },
    audit: {
      userId: 'current-user-id',
      userEmail: 'admin@realtechee.com',
      source: 'admin_panel'
    }
  });
  
  if (result.success) {
    console.log('✅ Request created:', result.data?.id);
    return result.data;
  } else {
    console.error('❌ Failed to create request:', result.error?.message);
    throw result.error;
  }
}

/**
 * Example: Get request with all related data
 * This replaces complex GraphQL queries with multiple includes
 */
export async function getRequestForDetailView(requestId: string) {
  const repository = setupRequestRepository();
  
  // Get request with all related entities loaded
  const result = await repository.getWithRelations(requestId);
  
  if (result.success) {
    const request = result.data!;
    
    console.log('📋 Request loaded:', {
      id: request.id,
      status: request.status,
      homeowner: request.homeowner?.fullName,
      agent: request.agent?.fullName,
      property: request.address?.propertyFullAddress,
      notesCount: request.notes.length,
      assignmentsCount: request.assignments.length,
      statusHistoryCount: request.statusHistory.length
    });
    
    return request;
  } else {
    console.error('❌ Failed to load request:', result.error?.message);
    throw result.error;
  }
}

/**
 * Example: Update request with business logic validation
 */
export async function updateRequestStatus(
  requestId: string, 
  newStatus: string, 
  reason?: string
) {
  const repository = setupRequestRepository();
  
  const result = await repository.updateStatus(requestId, newStatus, {
    reason,
    userId: 'current-user-id',
    userName: 'Admin User',
    businessImpact: 'medium',
    notifyClient: true
  });
  
  if (result.success) {
    console.log('✅ Status updated successfully');
    console.log('⚠️ Warnings:', result.meta?.warnings);
    return result.data;
  } else {
    console.error('❌ Status update failed:', result.error?.message);
    throw result.error;
  }
}

// ============================================================================
// Business-Specific Queries
// ============================================================================

/**
 * Example: Get requests assigned to current user
 * This replaces custom GraphQL filters
 */
export async function getMyAssignedRequests(agentContactId: string) {
  const repository = setupRequestRepository();
  
  const result = await repository.findByAgent(agentContactId, {
    pagination: { limit: 50 },
    sort: { field: 'createdAt', direction: 'desc' }
  });
  
  if (result.success) {
    console.log(`📝 Found ${result.data!.length} assigned requests`);
    return result.data;
  } else {
    console.error('❌ Failed to load assigned requests:', result.error?.message);
    throw result.error;
  }
}

/**
 * Example: Get requests needing follow-up
 */
export async function getRequestsNeedingFollowUp() {
  const repository = setupRequestRepository();
  
  const result = await repository.findNeedingFollowUp({
    pagination: { limit: 25 },
    sort: { field: 'followUpDate', direction: 'asc' }
  });
  
  if (result.success) {
    console.log(`⏰ Found ${result.data!.length} requests needing follow-up`);
    return result.data;
  } else {
    console.error('❌ Failed to load follow-up requests:', result.error?.message);
    throw result.error;
  }
}

/**
 * Example: Advanced search with multiple filters
 */
export async function searchRequestsForDashboard() {
  const repository = setupRequestRepository();
  
  const result = await repository.searchRequests({
    status: ['new', 'assigned', 'in_progress'],
    priority: ['high', 'urgent'],
    dateRange: {
      field: 'createdAt',
      start: '2024-01-01',
      end: '2024-12-31'
    },
    hasAgent: true,
    isArchived: false,
    readinessScoreMin: 50
  }, {
    pagination: { limit: 100 },
    sort: { field: 'priority', direction: 'desc' }
  });
  
  if (result.success) {
    console.log(`🔍 Search found ${result.data!.items.length} requests`);
    console.log(`📄 Has more pages: ${result.data!.hasMore}`);
    return result.data;
  } else {
    console.error('❌ Search failed:', result.error?.message);
    throw result.error;
  }
}

// ============================================================================
// Case Management Operations
// ============================================================================

/**
 * Example: Assign request to team member
 */
export async function assignRequestToTeamMember(
  requestId: string,
  assignToContactId: string,
  assignToName: string
) {
  const repository = setupRequestRepository();
  
  const result = await repository.assignRequest(
    requestId,
    assignToContactId,
    assignToName,
    'AE', // Account Executive
    {
      assignedById: 'current-user-id',
      assignedByName: 'Admin User',
      assignmentType: 'primary',
      reason: 'Geographic territory match',
      priority: 'normal',
      estimatedHours: 8
    }
  );
  
  if (result.success) {
    console.log('✅ Request assigned successfully');
    return result.data;
  } else {
    console.error('❌ Assignment failed:', result.error?.message);
    throw result.error;
  }
}

/**
 * Example: Add note to request
 */
export async function addNoteToRequest(
  requestId: string,
  content: string,
  isClientCommunication: boolean = false
) {
  const repository = setupRequestRepository();
  
  const result = await repository.addNote(requestId, content, {
    type: isClientCommunication ? 'client_communication' : 'internal',
    category: 'status_update',
    isPrivate: !isClientCommunication,
    authorId: 'current-user-id',
    authorName: 'Admin User',
    authorRole: 'Admin',
    priority: 'normal',
    communicationMethod: isClientCommunication ? 'email' : undefined,
    followUpRequired: content.toLowerCase().includes('follow up')
  });
  
  if (result.success) {
    console.log('✅ Note added successfully');
    return result.data;
  } else {
    console.error('❌ Failed to add note:', result.error?.message);
    throw result.error;
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Example: Bulk update multiple requests
 */
export async function bulkUpdateRequestStatus(
  requestIds: string[],
  newStatus: string,
  reason: string
) {
  const repository = setupRequestRepository();
  
  const result = await repository.bulkUpdateStatus(requestIds, newStatus, {
    reason,
    userId: 'current-user-id',
    userName: 'Admin User'
  });
  
  if (result.success) {
    console.log(`✅ Bulk update completed:`);
    console.log(`   Success: ${result.data!.successful.length} requests`);
    console.log(`   Failed: ${result.data!.failed.length} requests`);
    
    if (result.data!.failed.length > 0) {
      console.log('❌ Failures:', result.data!.failed);
    }
    
    return result.data;
  } else {
    console.error('❌ Bulk update failed:', result.error?.message);
    throw result.error;
  }
}

// ============================================================================
// Error Handling Examples
// ============================================================================

/**
 * Example: Comprehensive error handling
 */
export async function updateRequestWithErrorHandling(
  requestId: string,
  updates: {
    status?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    budget?: string;
    officeNotes?: string;
  }
) {
  const repository = setupRequestRepository();
  
  try {
    const result = await repository.update({
      id: requestId,
      data: updates,
      audit: {
        userId: 'current-user-id',
        userEmail: 'admin@realtechee.com',
        source: 'admin_panel'
      }
    });
    
    if (result.success) {
      console.log('✅ Request updated successfully');
      return result.data;
    } else {
      // Handle different error types
      if (result.error?.code === 'VALIDATION_FAILED') {
        console.error('❌ Validation error:', result.error.details);
        // Show user-friendly validation messages
        throw new Error(`Validation failed: ${result.error.userMessage}`);
      } else if (result.error?.code === 'NOT_FOUND') {
        console.error('❌ Request not found:', requestId);
        throw new Error('Request not found');
      } else {
        console.error('❌ Unexpected error:', result.error?.message);
        throw result.error;
      }
    }
  } catch (error) {
    console.error('❌ Repository operation failed:', error);
    throw error;
  }
}

// ============================================================================
// Integration with React Components
// ============================================================================

/**
 * Example: Custom hook for React components
 * This would replace useEffect + GraphQL calls in RequestDetail.tsx
 */
export function useRequestWithRelations(requestId: string) {
  // This is a conceptual example - in real implementation you'd use
  // React hooks like useState, useEffect, and possibly React Query
  
  const loadRequest = async () => {
    try {
      const repository = setupRequestRepository();
      const result = await repository.getWithRelations(requestId);
      
      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Failed to load request:', error);
      throw error;
    }
  };
  
  return { loadRequest };
}

/**
 * Example: Service layer function for RequestDetail component
 */
export class RequestDetailService {
  private repository: RequestRepository;
  
  constructor(repository?: RequestRepository) {
    this.repository = repository || setupRequestRepository();
  }
  
  async loadRequestForDetailView(requestId: string) {
    return this.repository.getWithRelations(requestId);
  }
  
  async updateRequestStatus(requestId: string, newStatus: string, reason?: string) {
    return this.repository.updateStatus(requestId, newStatus, {
      reason,
      userId: 'current-user-id',
      userName: 'Admin User',
      businessImpact: 'medium'
    });
  }
  
  async assignRequest(requestId: string, assignToId: string, assignToName: string, assignToRole: string) {
    return this.repository.assignRequest(requestId, assignToId, assignToName, assignToRole, {
      assignedById: 'current-user-id',
      assignedByName: 'Admin User',
      assignmentType: 'primary'
    });
  }
  
  async addNote(requestId: string, content: string, type: 'internal' | 'client_communication' = 'internal') {
    return this.repository.addNote(requestId, content, {
      type,
      authorId: 'current-user-id',
      authorName: 'Admin User',
      authorRole: 'Admin',
      isPrivate: type === 'internal'
    });
  }
}

// ============================================================================
// Export for Use in Components
// ============================================================================

export {
  RequestRepository,
  createRequestRepository,
  setupRequestRepository
};
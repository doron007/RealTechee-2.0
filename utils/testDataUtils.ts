/**
 * Test Data Management Utilities
 * Provides functions for marking, identifying, and cleaning up test data
 * Uses existing schema fields only - NO SCHEMA CHANGES
 */

import { generateClient } from 'aws-amplify/api';
import { listRequests, listContacts, listProperties } from '../queries';
import { deleteRequests, deleteContacts, deleteProperties } from '../mutations';
import logger from '../lib/logger';

const client = generateClient();

// Test data identification patterns
export const TEST_MARKERS = {
  LEAD_SOURCE: 'E2E_TEST', // Uses existing leadSource field
  SESSION_PREFIX: 'TEST_SESSION:', // Used in additionalNotes field
  EMAIL_PATTERNS: ['test@', '@test.', 'playwright@', 'e2e@'],
  NAME_PATTERNS: ['test', 'playwright', 'automation', 'e2e'],
} as const;

/**
 * Check if a request record is test data
 */
export const isTestRequest = (request: any): boolean => {
  if (!request) return false;
  
  // Check leadSource field
  if (request.leadSource === TEST_MARKERS.LEAD_SOURCE) {
    return true;
  }
  
  // Check additionalNotes for test session ID
  if (request.additionalNotes?.includes(TEST_MARKERS.SESSION_PREFIX)) {
    return true;
  }
  
  return false;
};

/**
 * Check if a contact record is test data
 */
export const isTestContact = (contact: any): boolean => {
  if (!contact) return false;
  
  const email = contact.email?.toLowerCase() || '';
  const name = contact.fullName?.toLowerCase() || '';
  
  // Check email patterns
  if (TEST_MARKERS.EMAIL_PATTERNS.some(pattern => email.includes(pattern))) {
    return true;
  }
  
  // Check name patterns
  if (TEST_MARKERS.NAME_PATTERNS.some(pattern => name.includes(pattern))) {
    return true;
  }
  
  return false;
};

/**
 * Get all test requests
 */
export const getTestRequests = async (limit: number = 100) => {
  logger.info('Scanning for test requests...');
  
  try {
    // Get requests with E2E_TEST leadSource
    const testSourceResponse = await client.graphql({
      query: listRequests,
      variables: {
        filter: {
          leadSource: {
            eq: TEST_MARKERS.LEAD_SOURCE
          }
        },
        limit
      }
    });
    
    const testSourceRequests = testSourceResponse.data.listRequests.items;
    
    // Get all requests to check additionalNotes field (since we can't filter on text contains in DynamoDB)
    const allRequestsResponse = await client.graphql({
      query: listRequests,
      variables: {
        limit: 1000 // Get a large batch to scan
      }
    });
    
    const testSessionRequests = allRequestsResponse.data.listRequests.items.filter(request => 
      request.additionalNotes?.includes(TEST_MARKERS.SESSION_PREFIX)
    );
    
    // Combine and deduplicate
    const allTestRequests = [...testSourceRequests, ...testSessionRequests];
    const uniqueTestRequests = allTestRequests.filter((request, index, array) => 
      index === array.findIndex(r => r.id === request.id)
    );
    
    logger.info(`Found ${uniqueTestRequests.length} test requests`, {
      testSourceCount: testSourceRequests.length,
      testSessionCount: testSessionRequests.length,
      totalUnique: uniqueTestRequests.length
    });
    
    return uniqueTestRequests;
  } catch (error) {
    logger.error('Failed to get test requests', { error });
    throw error;
  }
};

/**
 * Get all test contacts
 */
export const getTestContacts = async (limit: number = 100) => {
  logger.info('Scanning for test contacts...');
  
  try {
    // Get all contacts and filter client-side (DynamoDB doesn't support complex text filtering)
    const response = await client.graphql({
      query: listContacts,
      variables: {
        limit: 1000 // Get a large batch to scan
      }
    });
    
    const testContacts = response.data.listContacts.items.filter(isTestContact);
    
    logger.info(`Found ${testContacts.length} test contacts out of ${response.data.listContacts.items.length} total`);
    
    return testContacts.slice(0, limit);
  } catch (error) {
    logger.error('Failed to get test contacts', { error });
    throw error;
  }
};

/**
 * Clean up test data - use with caution!
 * This function deletes test records permanently
 */
export const cleanupTestData = async (options: {
  dryRun?: boolean;
  maxAge?: number; // Max age in hours, default 24
} = {}) => {
  const { dryRun = true, maxAge = 24 } = options;
  const cutoffTime = new Date(Date.now() - (maxAge * 60 * 60 * 1000));
  
  logger.info('Starting test data cleanup', { dryRun, maxAge, cutoffTime });
  
  try {
    // Get test requests
    const testRequests = await getTestRequests();
    const oldTestRequests = testRequests.filter(request => {
      const createdAt = new Date(request.createdAt);
      return createdAt < cutoffTime;
    });
    
    // Get test contacts
    const testContacts = await getTestContacts();
    const oldTestContacts = testContacts.filter(contact => {
      const createdAt = new Date(contact.createdAt);
      return createdAt < cutoffTime;
    });
    
    const summary = {
      totalTestRequests: testRequests.length,
      oldTestRequests: oldTestRequests.length,
      totalTestContacts: testContacts.length,
      oldTestContacts: oldTestContacts.length,
    };
    
    logger.info('Test data cleanup summary', summary);
    
    if (dryRun) {
      logger.info('DRY RUN - No data will be deleted');
      return {
        ...summary,
        deleted: { requests: 0, contacts: 0 },
        dryRun: true
      };
    }
    
    // Delete old test requests
    let deletedRequests = 0;
    for (const request of oldTestRequests) {
      try {
        await client.graphql({
          query: deleteRequests,
          variables: { input: { id: request.id } }
        });
        deletedRequests++;
        logger.info(`Deleted test request: ${request.id}`);
      } catch (error) {
        logger.error(`Failed to delete test request ${request.id}`, { error });
      }
    }
    
    // Delete old test contacts
    let deletedContacts = 0;
    for (const contact of oldTestContacts) {
      try {
        await client.graphql({
          query: deleteContacts,
          variables: { input: { id: contact.id } }
        });
        deletedContacts++;
        logger.info(`Deleted test contact: ${contact.id}`);
      } catch (error) {
        logger.error(`Failed to delete test contact ${contact.id}`, { error });
      }
    }
    
    const result = {
      ...summary,
      deleted: { requests: deletedRequests, contacts: deletedContacts },
      dryRun: false
    };
    
    logger.info('Test data cleanup completed', result);
    return result;
    
  } catch (error) {
    logger.error('Test data cleanup failed', { error });
    throw error;
  }
};

/**
 * Filter out test data from production queries
 * Use this function to exclude test records from admin views
 */
export const createProductionFilter = (existingFilter: any = {}) => {
  return {
    ...existingFilter,
    and: [
      ...(existingFilter.and || []),
      {
        leadSource: {
          ne: TEST_MARKERS.LEAD_SOURCE
        }
      }
    ]
  };
};

/**
 * Get test session ID from a test request
 */
export const getTestSessionId = (request: any): string | null => {
  if (!request?.additionalNotes) return null;
  
  const sessionMatch = request.additionalNotes.match(/TEST_SESSION:\s*([^\s]+)/);
  return sessionMatch ? sessionMatch[1] : null;
};

export default {
  TEST_MARKERS,
  isTestRequest,
  isTestContact,
  getTestRequests,
  getTestContacts,
  cleanupTestData,
  createProductionFilter,
  getTestSessionId,
};
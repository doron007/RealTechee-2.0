/**
 * GraphQL Client Mock
 * 
 * Complete mock implementation for testing repositories without external dependencies
 */

import { IAmplifyGraphQLClient } from '../../../repositories/interfaces/IGraphQLClient';

export interface MockGraphQLResponse {
  data?: any;
  errors?: Array<{ message: string; locations?: any; path?: any }>;
}

export class GraphQLClientMock implements IAmplifyGraphQLClient {
  private queryResponses = new Map<string, MockGraphQLResponse>();
  private mutationResponses = new Map<string, MockGraphQLResponse>();
  private callLog: Array<{ type: 'query' | 'mutation'; operation: string; variables: any }> = [];

  // Configure mock responses
  mockQueryResponse(operationPattern: string, response: MockGraphQLResponse): void {
    this.queryResponses.set(operationPattern, response);
  }

  mockMutationResponse(operationPattern: string, response: MockGraphQLResponse): void {
    this.mutationResponses.set(operationPattern, response);
  }

  // Mock implementation
  async query(query: string, variables?: any): Promise<MockGraphQLResponse> {
    this.callLog.push({ type: 'query', operation: query, variables });

    // Find matching response by operation type
    for (const [pattern, response] of this.queryResponses.entries()) {
      if (query.includes(pattern)) {
        return this.cloneResponse(response);
      }
    }

    // Default successful response if no mock configured
    return {
      data: {},
      errors: []
    };
  }

  async mutate(mutation: string, variables?: any): Promise<MockGraphQLResponse> {
    this.callLog.push({ type: 'mutation', operation: mutation, variables });

    // Find matching response by operation type
    for (const [pattern, response] of this.mutationResponses.entries()) {
      if (mutation.includes(pattern)) {
        return this.cloneResponse(response);
      }
    }

    // Default successful response if no mock configured
    return {
      data: variables?.input || {},
      errors: []
    };
  }

  // Test utilities
  getCallLog() {
    return [...this.callLog];
  }

  getLastCall() {
    return this.callLog[this.callLog.length - 1];
  }

  getCallCount(): number {
    return this.callLog.length;
  }

  getQueryCallCount(): number {
    return this.callLog.filter(call => call.type === 'query').length;
  }

  getMutationCallCount(): number {
    return this.callLog.filter(call => call.type === 'mutation').length;
  }

  wasOperationCalled(operationPattern: string): boolean {
    return this.callLog.some(call => call.operation.includes(operationPattern));
  }

  getOperationCalls(operationPattern: string) {
    return this.callLog.filter(call => call.operation.includes(operationPattern));
  }

  reset(): void {
    this.queryResponses.clear();
    this.mutationResponses.clear();
    this.callLog = [];
  }

  // Helper to clone response to avoid mutations affecting subsequent calls
  private cloneResponse(response: MockGraphQLResponse): MockGraphQLResponse {
    return {
      data: response.data ? JSON.parse(JSON.stringify(response.data)) : response.data,
      errors: response.errors ? [...response.errors] : response.errors
    };
  }

  // Pre-configured mock responses for common patterns
  static createWithDefaults(): GraphQLClientMock {
    const mock = new GraphQLClientMock();

    // Default LIST responses
    mock.mockQueryResponse('list', {
      data: {
        listRequests: { items: [], nextToken: null },
        listContacts: { items: [], nextToken: null },
        listProjects: { items: [], nextToken: null },
        listProperties: { items: [], nextToken: null },
        listQuotes: { items: [], nextToken: null }
      }
    });

    // Default GET responses
    mock.mockQueryResponse('get', {
      data: null
    });

    return mock;
  }
}

// Factory function for easy mock creation
export const createMockGraphQLClient = (config?: {
  withDefaults?: boolean;
}): GraphQLClientMock => {
  if (config?.withDefaults) {
    return GraphQLClientMock.createWithDefaults();
  }
  return new GraphQLClientMock();
};
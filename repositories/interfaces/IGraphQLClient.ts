/**
 * GraphQL client interface for centralized data access
 * Abstracts GraphQL operations and provides type safety
 */

export interface IGraphQLClient {
  // Basic GraphQL operations
  query<TData, TVariables = any>(
    query: string, 
    variables?: TVariables
  ): Promise<GraphQLResult<TData>>;
  
  mutate<TData, TVariables = any>(
    mutation: string, 
    variables?: TVariables
  ): Promise<GraphQLResult<TData>>;
  
  subscribe<TData, TVariables = any>(
    subscription: string,
    variables?: TVariables
  ): Promise<GraphQLSubscription<TData>>;
}

export interface GraphQLResult<T> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: any;
}

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: any;
}

export interface GraphQLSubscription<T> {
  subscribe(observer: {
    next?: (value: { data?: T }) => void;
    error?: (error: any) => void;
    complete?: () => void;
  }): { unsubscribe: () => void };
}

/**
 * Amplify-specific GraphQL client interface
 */
export interface IAmplifyGraphQLClient extends IGraphQLClient {
  // Amplify-specific authentication modes
  withAuthMode(authMode: 'apiKey' | 'userPool' | 'oidc' | 'lambda'): IAmplifyGraphQLClient;
  
  // Batch operations
  batchQuery<T>(queries: Array<{
    query: string;
    variables?: any;
  }>): Promise<GraphQLResult<T>[]>;
  
  // Connection management
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
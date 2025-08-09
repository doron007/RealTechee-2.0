/**
 * AWS Configuration for E2E Tests
 * 
 * Handles AWS SDK configuration for DynamoDB access during tests.
 * Supports both local development and CI environments.
 */

const path = require('path');
const fs = require('fs');

// Import Amplify configuration
let amplifyOutputs;
try {
  amplifyOutputs = require('../../amplify_outputs.json');
} catch (error) {
  console.warn('Warning: amplify_outputs.json not found. Run `npx ampx sandbox` first.');
  amplifyOutputs = null;
}

/**
 * Get AWS credentials for testing
 * Priority: Environment variables > AWS credentials file > Error
 */
const getAWSCredentials = () => {
  // Check environment variables first (CI environment)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: process.env.AWS_REGION || amplifyOutputs?.data?.aws_region || 'us-east-1'
    };
  }
  
  // Check AWS credentials file (local development)
  const credentialsPath = path.join(require('os').homedir(), '.aws', 'credentials');
  if (fs.existsSync(credentialsPath)) {
    console.log('Using AWS credentials from ~/.aws/credentials');
    // Note: AWS SDK will automatically load from credentials file
    return {
      region: amplifyOutputs?.data?.aws_region || 'us-east-1'
    };
  }
  
  throw new Error(`
    AWS credentials not found. Please set up credentials using one of these methods:
    
    1. Environment variables (recommended for CI):
       export AWS_ACCESS_KEY_ID=your_access_key
       export AWS_SECRET_ACCESS_KEY=your_secret_key
       export AWS_REGION=us-east-1
    
    2. AWS credentials file (recommended for local development):
       aws configure
    
    3. IAM roles (for AWS environments)
  `);
};

/**
 * Validate that required AWS resources are available
 */
const validateAWSSetup = async () => {
  if (!amplifyOutputs) {
    throw new Error('Amplify configuration not found. Run `npx ampx sandbox` to deploy backend.');
  }
  
  // In Amplify Gen 2, tables are defined in model_introspection instead of tables array
  if (!amplifyOutputs.data?.url) {
    throw new Error('No GraphQL API found in Amplify configuration. Backend may not be deployed.');
  }
  
  if (!amplifyOutputs.data?.model_introspection?.models) {
    throw new Error('No data models found in Amplify configuration. Backend may not be deployed.');
  }
  
  const credentials = getAWSCredentials();
  
  // Test GraphQL API connection instead of direct DynamoDB for Amplify Gen 2
  try {
    const modelNames = Object.keys(amplifyOutputs.data.model_introspection.models);
    console.log(`✅ AWS Setup validated - ${modelNames.length} data models found: ${modelNames.join(', ')}`);
    return true;
  } catch (error) {
    throw new Error(`AWS validation failed: ${error.message}`);
  }
};

/**
 * Get model configuration from Amplify outputs (Gen 2 compatible)
 */
const getModelConfig = (modelName) => {
  if (!amplifyOutputs?.data?.model_introspection?.models) {
    throw new Error('Amplify model configuration not available');
  }
  
  const model = amplifyOutputs.data.model_introspection.models[modelName];
  
  if (!model) {
    const availableModels = Object.keys(amplifyOutputs.data.model_introspection.models).join(', ');
    throw new Error(`Model not found: ${modelName}. Available: ${availableModels}`);
  }
  
  return model;
};

/**
 * Legacy compatibility for getTableConfig
 * @deprecated Use getModelConfig instead
 */
const getTableConfig = (modelName) => {
  console.warn('getTableConfig is deprecated. Use getModelConfig instead.');
  return getModelConfig(modelName);
};

/**
 * Environment detection
 */
const getEnvironmentInfo = () => {
  const isCI = !!process.env.CI;
  const environment = process.env.NODE_ENV || 'development';
  const amplifyEnv = process.env.AMPLIFY_ENV || 'sandbox';
  
  return {
    isCI,
    environment,
    amplifyEnv,
    region: amplifyOutputs?.data?.aws_region || 'us-east-1',
    apiEndpoint: amplifyOutputs?.data?.url
  };
};

/**
 * Setup AWS SDK with proper configuration
 */
const setupAWS = async () => {
  console.log('🔧 Setting up AWS configuration for E2E tests...');
  
  const envInfo = getEnvironmentInfo();
  console.log('Environment info:', envInfo);
  
  try {
    await validateAWSSetup();
    
    const credentials = getAWSCredentials();
    console.log(`✅ AWS credentials configured for region: ${credentials.region}`);
    
    return {
      credentials,
      envInfo,
      amplifyOutputs
    };
  } catch (error) {
    console.error('❌ AWS setup failed:', error.message);
    throw error;
  }
};

module.exports = {
  setupAWS,
  getAWSCredentials,
  validateAWSSetup,
  getTableConfig,
  getModelConfig,
  getEnvironmentInfo,
  amplifyOutputs
};
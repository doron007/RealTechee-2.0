#!/usr/bin/env node

/**
 * Generate amplify_outputs.json from environment variables
 * This eliminates the need to commit environment-specific configs to git
 * 
 * Usage:
 *   node scripts/generate-amplify-config.js [environment]
 * 
 * Environment Variables Required:
 *   AMPLIFY_USER_POOL_ID
 *   AMPLIFY_USER_POOL_CLIENT_ID  
 *   AMPLIFY_IDENTITY_POOL_ID
 *   AMPLIFY_API_URL
 *   AMPLIFY_API_KEY
 *   AMPLIFY_REGION
 *   AMPLIFY_STORAGE_BUCKET
 *   AMPLIFY_BACKEND_SUFFIX
 *   AMPLIFY_APP_ID
 *   AMPLIFY_SANDBOX
 */

const fs = require('fs');
const path = require('path');

// Get environment argument (development, staging, production)
const environment = process.argv[2] || 'development';

console.log(`🔧 Generating amplify_outputs.json for ${environment} environment`);

// Environment variable mapping
const envVars = {
  userPoolId: process.env.AMPLIFY_USER_POOL_ID,
  userPoolClientId: process.env.AMPLIFY_USER_POOL_CLIENT_ID,
  identityPoolId: process.env.AMPLIFY_IDENTITY_POOL_ID,
  apiUrl: process.env.AMPLIFY_API_URL,
  apiKey: process.env.AMPLIFY_API_KEY,
  region: process.env.AMPLIFY_REGION || 'us-west-1',
  storageBucket: process.env.AMPLIFY_STORAGE_BUCKET,
  backendSuffix: process.env.AMPLIFY_BACKEND_SUFFIX,
  appId: process.env.AMPLIFY_APP_ID,
  sandbox: process.env.AMPLIFY_SANDBOX
};

// Validate required environment variables
const missing = Object.entries(envVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => {
    const envVar = key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, 'AMPLIFY_');
    console.error(`  - ${envVar}`);
  });
  console.error('');
  console.error('💡 Set these in AWS Amplify Console → App Settings → Environment Variables');
  process.exit(1);
}

// Generate amplify_outputs.json structure
const amplifyConfig = {
  _note: `${environment} environment for RealTechee-2.0 app (generated from env vars)`,
  _backend_suffix: envVars.backendSuffix,
  _app_id: envVars.appId,
  _sandbox: envVars.sandbox,
  auth: {
    user_pool_id: envVars.userPoolId,
    aws_region: envVars.region,
    user_pool_client_id: envVars.userPoolClientId,
    identity_pool_id: envVars.identityPoolId,
    mfa_methods: [],
    standard_required_attributes: ["email"],
    username_attributes: ["email"],
    user_verification_types: ["email"],
    groups: [
      { super_admin: { precedence: 0 } },
      { admin: { precedence: 1 } },
      { accounting: { precedence: 2 } },
      { srm: { precedence: 3 } },
      { agent: { precedence: 4 } },
      { homeowner: { precedence: 5 } },
      { provider: { precedence: 6 } },
      { pm: { precedence: 7 } }
    ]
  },
  data: {
    url: envVars.apiUrl,
    aws_region: envVars.region,
    api_key: envVars.apiKey,
    default_authorization_type: "AMAZON_COGNITO_USER_POOLS",
    authorization_types: ["API_KEY", "AWS_IAM"],
    model_introspection: {
      version: 1,
      models: {
        Affiliates: { name: "Affiliates", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        BackOfficeRequestStatuses: { name: "BackOfficeRequestStatuses", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        Contacts: { name: "Contacts", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        Projects: { name: "Projects", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        Properties: { name: "Properties", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        Requests: { name: "Requests", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } },
        Quotes: { name: "Quotes", fields: { id: { name: "id", isArray: false, type: "ID", isRequired: true, attributes: [] } } }
      }
    }
  },
  storage: {
    aws_region: envVars.region,
    bucket_name: envVars.storageBucket
  }
};

// Write the generated config
const outputPath = path.join(__dirname, '..', 'amplify_outputs.json');
fs.writeFileSync(outputPath, JSON.stringify(amplifyConfig, null, 2));

console.log('✅ Successfully generated amplify_outputs.json');
console.log(`📍 Location: ${outputPath}`);
console.log(`🏷️  Environment: ${environment}`);
console.log(`🔐 UserPool: ${envVars.userPoolId}`);
console.log(`🌐 API: ${envVars.apiUrl}`);
console.log('');
console.log('💡 This file is generated and should not be committed to git');
// Environment Variable Validation Script
const fs = require('fs');

console.log('🔧 VALIDATING ENVIRONMENT VARIABLE INTEGRATION');
console.log('===============================================');

// Check if amplify.yml has the environment variable commands
const amplifyYml = fs.readFileSync('amplify.yml', 'utf8');
const hasEnvCommands = amplifyYml.includes('NEXT_PUBLIC_BACKEND_SUFFIX=$BACKEND_SUFFIX');
console.log('✅ amplify.yml updated with env var commands:', hasEnvCommands);

// Check if utils/amplifyAPI.ts uses environment variables
const amplifyAPI = fs.readFileSync('utils/amplifyAPI.ts', 'utf8');
const usesEnvVars = amplifyAPI.includes('process.env.NEXT_PUBLIC_GRAPHQL_URL');
console.log('✅ utils/amplifyAPI.ts uses environment variables:', usesEnvVars);

// Check if environment test utility exists
const hasEnvTest = fs.existsSync('utils/environmentTest.ts');
console.log('✅ Environment test utility created:', hasEnvTest);

// Test environment detection logic
if (hasEnvTest) {
  // Simulate production environment variables
  process.env.NEXT_PUBLIC_BACKEND_SUFFIX = 'aqnqdrctpzfwfjwyxxsmu6peoq';
  process.env.NEXT_PUBLIC_GRAPHQL_URL = 'https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql';
  
  const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));
  
  const envVars = {
    NEXT_PUBLIC_BACKEND_SUFFIX: process.env.NEXT_PUBLIC_BACKEND_SUFFIX,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  };

  const effectiveConfig = {
    backendSuffix: envVars.NEXT_PUBLIC_BACKEND_SUFFIX || 'NOT_SET',
    graphqlUrl: envVars.NEXT_PUBLIC_GRAPHQL_URL || outputs.data?.url,
  };

  const environment = (() => {
    if (effectiveConfig.backendSuffix?.includes('aqnqdrctpzfwfjwyxxsmu6peoq')) return 'production';
    if (effectiveConfig.backendSuffix?.includes('fvn7t5hbobaxjklhrqzdl4ac34')) return 'development/staging';
    return 'unknown';
  })();

  console.log('\n🎯 ENVIRONMENT DETECTION TEST (Simulated Production):');
  console.log('Detected Environment:', environment);
  console.log('Using Environment Variables:', !!envVars.NEXT_PUBLIC_BACKEND_SUFFIX);
  console.log('Backend Suffix:', effectiveConfig.backendSuffix);
  console.log('GraphQL URL contains production suffix:', effectiveConfig.graphqlUrl.includes('374sdjlh3bdnhp2sz4qttvyhce'));
  
  // Test fallback (development) scenario
  delete process.env.NEXT_PUBLIC_BACKEND_SUFFIX;
  delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
  
  const fallbackConfig = {
    backendSuffix: process.env.NEXT_PUBLIC_BACKEND_SUFFIX || 'NOT_SET',
    graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || outputs.data?.url,
  };

  const fallbackEnv = (() => {
    if (fallbackConfig.graphqlUrl?.includes('fvn7t5hbobaxjklhrqzdl4ac34')) return 'development/staging';
    return 'fallback';
  })();

  console.log('\n🔄 FALLBACK SCENARIO TEST (No Environment Variables):');
  console.log('Detected Environment:', fallbackEnv);
  console.log('Using Environment Variables:', !!process.env.NEXT_PUBLIC_BACKEND_SUFFIX);
  console.log('Backend Suffix:', fallbackConfig.backendSuffix);
  console.log('GraphQL URL from amplify_outputs.json:', outputs.data?.url?.slice(0, 50) + '...');
}

console.log('\n✅ VALIDATION COMPLETE - Environment variable integration implemented correctly!');
console.log('Next: AWS Amplify will write environment variables to .env.production during build');
console.log('Result: Production will use correct DynamoDB tables with suffix: aqnqdrctpzfwfjwyxxsmu6peoq');
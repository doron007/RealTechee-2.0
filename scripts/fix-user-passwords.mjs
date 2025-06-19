#!/usr/bin/env node

/**
 * Fix User Passwords Script
 * 
 * Updates all migrated users from FORCE_CHANGE_PASSWORD to CONFIRMED status
 * by setting temporary passwords, enabling forgot password flow
 */

import { CognitoIdentityProviderClient, ListUsersCommand, AdminSetUserPasswordCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Amplify outputs to get User Pool ID
const amplifyOutputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'amplify_outputs.json'), 'utf8')
);

const USER_POOL_ID = amplifyOutputs.auth.user_pool_id;
const AWS_REGION = amplifyOutputs.auth.aws_region;
const TEMP_PASSWORD = 'TempPass123!';

if (!USER_POOL_ID) {
  console.error('❌ Error: Could not find User Pool ID in amplify_outputs.json');
  process.exit(1);
}

console.log(`🎯 Target User Pool: ${USER_POOL_ID}`);
console.log(`🌎 Region: ${AWS_REGION}`);
console.log(`🔐 Temporary Password: ${TEMP_PASSWORD}`);

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

/**
 * Get all users in the user pool
 */
async function getAllUsers() {
  const users = [];
  let paginationToken = undefined;
  
  do {
    const params = {
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      PaginationToken: paginationToken
    };
    
    try {
      const command = new ListUsersCommand(params);
      const result = await cognitoClient.send(command);
      
      if (result.Users) {
        users.push(...result.Users);
      }
      
      paginationToken = result.PaginationToken;
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
      throw error;
    }
  } while (paginationToken);
  
  return users;
}

/**
 * Fix a single user's password
 */
async function fixUserPassword(username, dryRun = false) {
  try {
    // Get current user status
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    
    const userResult = await cognitoClient.send(getUserCommand);
    const currentStatus = userResult.UserStatus;
    const email = userResult.UserAttributes?.find(attr => attr.Name === 'email')?.Value || username;
    
    console.log(`\\n[${username}] Email: ${email}`);
    console.log(`[${username}] Current Status: ${currentStatus}`);
    
    if (currentStatus === 'FORCE_CHANGE_PASSWORD') {
      if (dryRun) {
        console.log(`[${username}] 📝 DRY RUN - Would set permanent password`);
        return { success: true, action: 'would-fix', dryRun: true };
      }
      
      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: TEMP_PASSWORD,
        Permanent: true
      });
      
      await cognitoClient.send(setPasswordCommand);
      
      console.log(`[${username}] ✅ Password set to permanent`);
      return { success: true, action: 'fixed' };
      
    } else if (currentStatus === 'CONFIRMED') {
      console.log(`[${username}] ✅ Already CONFIRMED - no action needed`);
      return { success: true, action: 'already-fixed' };
      
    } else {
      console.log(`[${username}] ⚠️  Unexpected status: ${currentStatus}`);
      return { success: true, action: 'unexpected-status', status: currentStatus };
    }
    
  } catch (error) {
    console.error(`[${username}] ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to fix all users
 */
async function fixAllUsers(options = {}) {
  const { dryRun = false, limit = null } = options;
  
  console.log('\\n🚀 Starting User Password Fix...');
  console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  
  try {
    // Get all users
    console.log('\\n📋 Fetching all users...');
    const allUsers = await getAllUsers();
    console.log(`📊 Found ${allUsers.length} total users`);
    
    // Apply limit if specified
    const usersToProcess = limit ? allUsers.slice(0, limit) : allUsers;
    console.log(`🎯 Processing ${usersToProcess.length} users`);
    
    // Stats tracking
    const stats = {
      total: usersToProcess.length,
      fixed: 0,
      alreadyFixed: 0,
      unexpected: 0,
      errors: 0,
      errorDetails: []
    };
    
    // Process each user
    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      const username = user.Username;
      
      console.log(`\\n[${i + 1}/${usersToProcess.length}] Processing: ${username}`);
      
      const result = await fixUserPassword(username, dryRun);
      
      if (result.success) {
        switch (result.action) {
          case 'fixed':
          case 'would-fix':
            stats.fixed++;
            break;
          case 'already-fixed':
            stats.alreadyFixed++;
            break;
          case 'unexpected-status':
            stats.unexpected++;
            break;
        }
      } else {
        stats.errors++;
        stats.errorDetails.push({
          username,
          error: result.error
        });
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Print summary
    console.log('\\n📊 Fix Summary:');
    console.log(`  🔧 Fixed (or would fix): ${stats.fixed}`);
    console.log(`  ✅ Already Fixed: ${stats.alreadyFixed}`);
    console.log(`  ⚠️  Unexpected Status: ${stats.unexpected}`);
    console.log(`  ❌ Errors: ${stats.errors}`);
    console.log(`  📈 Success Rate: ${(((stats.fixed + stats.alreadyFixed) / stats.total) * 100).toFixed(1)}%`);
    
    if (stats.errorDetails.length > 0) {
      console.log('\\n❌ Error Details:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.username}: ${error.error}`);
      });
    }
    
    if (!dryRun && stats.fixed > 0) {
      console.log('\\n🎉 Password Fix Complete!');
      console.log('\\n🎯 Next Steps:');
      console.log(`  1. ✅ ${stats.fixed} users can now use forgot password`);
      console.log(`  2. 🔐 They can also login with: ${TEMP_PASSWORD}`);
      console.log('  3. 📧 Forgot password emails should now work');
      console.log('  4. 🔄 Users will be prompted to change password on first login');
    }
    
    return stats;
    
  } catch (error) {
    console.error('\\n💥 Failed to fix users:', error);
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1]);
    i++; // Skip next argument
  } else if (arg === '--help') {
    console.log(`
🔧 User Password Fix Script

Usage: node fix-user-passwords.mjs [options]

Options:
  --dry-run     Show what would be fixed without making changes
  --limit N     Only process first N users (useful for testing)
  --help        Show this help message

Examples:
  # Test with first 3 users
  node fix-user-passwords.mjs --dry-run --limit 3
  
  # Fix all users
  node fix-user-passwords.mjs
  
  # Fix first 10 users only
  node fix-user-passwords.mjs --limit 10

What this script does:
  📊 Finds all users in FORCE_CHANGE_PASSWORD status
  🔧 Sets them to permanent password: ${TEMP_PASSWORD}
  ✅ Changes status to CONFIRMED
  📧 Enables forgot password email flow
`);
    process.exit(0);
  }
}

// Run the fix
fixAllUsers(options)
  .then(stats => {
    console.log('\\n🎉 Script completed!');
    process.exit(stats.errors > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\\n💥 Script failed:', error);
    process.exit(1);
  });
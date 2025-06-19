#!/usr/bin/env node

/**
 * RealTechee User Migration Script
 * 
 * Migrates existing users from Auth.csv to AWS Cognito User Pool
 * - Silent import (no email notifications)
 * - Temporary passwords (users will reset manually)
 * - Maps contactId and sets default membership tier
 * - Handles users with/without Contact records
 */

import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
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

if (!USER_POOL_ID) {
  console.error('❌ Error: Could not find User Pool ID in amplify_outputs.json');
  process.exit(1);
}

console.log(`🎯 Target User Pool: ${USER_POOL_ID}`);
console.log(`🌎 Region: ${AWS_REGION}`);

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

/**
 * Generate a secure temporary password
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure it meets Cognito requirements: uppercase, lowercase, number, symbol
  password += 'A'; // uppercase
  password += 'a'; // lowercase  
  password += '1'; // number
  password += '!'; // symbol
  
  // Add 8 more random characters (total 12)
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Parse backup JSON files and cross-reference
 */
function parseUserData() {
  const backupPath = path.join(__dirname, '..', 'backups', 'amplify_backup_20250616_174924.json');
  
  // Parse backup JSON
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  const backupData = JSON.parse(backupContent);
  
  // Extract Auth table data
  const authTableName = 'Auth-ukgxireroncqrdrirvf222rkai-NONE';
  const contactsTableName = 'Contacts-ukgxireroncqrdrirvf222rkai-NONE';
  
  const authTable = backupData.table_data[authTableName];
  const contactsTable = backupData.table_data[contactsTableName];
  
  if (!authTable) {
    throw new Error(`Auth table not found in backup: ${authTableName}`);
  }
  
  if (!contactsTable) {
    throw new Error(`Contacts table not found in backup: ${contactsTableName}`);
  }
  
  console.log(`📊 Backup data loaded: ${authTable.record_count} Auth records, ${contactsTable.record_count} Contact records`);
  
  // Process Auth records
  const authUsers = [];
  authTable.items.forEach(authRecord => {
    if (authRecord.email && authRecord.email.includes('@')) {
      authUsers.push({
        email: authRecord.email.trim(),
        contactId: authRecord.owner.trim(),
        originalId: authRecord.id.trim(),
        createdDate: authRecord.createdDate ? authRecord.createdDate.trim() : '',
        hasPassword: Boolean(authRecord.token), // token contains bcrypt hash
        hasHashFlag: Boolean(authRecord.hash) // hash is a boolean flag
      });
    }
  });
  
  // Create email lookup from Contacts table
  const contactEmails = new Set();
  const contactsById = new Map();
  
  contactsTable.items.forEach(contactRecord => {
    if (contactRecord.email && contactRecord.email.includes('@')) {
      const email = contactRecord.email.trim();
      contactEmails.add(email);
      contactsById.set(contactRecord.id, contactRecord);
    }
  });
  
  // Categorize auth users based on whether they have Contact records
  const usersWithContacts = [];
  const usersWithoutContacts = [];
  
  authUsers.forEach(user => {
    if (contactEmails.has(user.email)) {
      usersWithContacts.push({
        ...user,
        hasContactRecord: true
      });
    } else {
      usersWithoutContacts.push({
        ...user,
        hasContactRecord: false
      });
    }
  });
  
  return {
    total: authUsers.length,
    withContacts: usersWithContacts,
    withoutContacts: usersWithoutContacts,
    contactsById,
    backupInfo: {
      authRecords: authTable.record_count,
      contactRecords: contactsTable.record_count,
      backupDate: backupData.backup_metadata.created_at
    }
  };
}

/**
 * Create user in Cognito
 */
async function createCognitoUser(user, tempPassword, dryRun = false) {
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: user.email,
    UserAttributes: [
      {
        Name: 'email',
        Value: user.email
      },
      {
        Name: 'email_verified',
        Value: 'true' // Mark as verified to avoid verification emails
      },
      {
        Name: 'custom:contactId',
        Value: user.contactId
      },
      {
        Name: 'custom:membershipTier',
        Value: 'basic' // Default tier
      }
    ],
    TemporaryPassword: tempPassword,
    MessageAction: 'SUPPRESS', // 🔑 This prevents email notifications!
    DesiredDeliveryMediums: [] // No delivery methods = no emails
  };
  
  if (dryRun) {
    console.log(`  📝 DRY RUN - Would create user: ${user.email}`);
    return { success: true, dryRun: true };
  }
  
  try {
    const command = new AdminCreateUserCommand(params);
    const result = await cognitoClient.send(command);
    
    return {
      success: true,
      userId: result.User.Username,
      status: result.User.UserStatus
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.name
    };
  }
}

/**
 * Main migration function
 */
async function migrateUsers(options = {}) {
  const { 
    dryRun = false, 
    limit = null, 
    skip = 0,
    onlyWithContacts = false,
    onlyWithoutContacts = false
  } = options;
  
  console.log('\\n🚀 Starting User Migration...');
  console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  
  // Parse and categorize users
  const userData = parseUserData();
  
  console.log('\\n📊 Data Source:');
  console.log(`  📁 Backup file: amplify_backup_20250616_174924.json`);
  console.log(`  📅 Backup date: ${userData.backupInfo.backupDate}`);
  console.log(`  🗃️  Auth records in backup: ${userData.backupInfo.authRecords}`);
  console.log(`  📇 Contact records in backup: ${userData.backupInfo.contactRecords}`);
  
  console.log('\\n📊 User Analysis:');
  console.log(`  📁 Valid Auth users: ${userData.total}`);
  console.log(`  ✅ With Contact records: ${userData.withContacts.length}`);
  console.log(`  ⚠️  Without Contact records: ${userData.withoutContacts.length}`);
  
  // Determine which users to process
  let usersToProcess = [];
  
  if (onlyWithContacts) {
    usersToProcess = userData.withContacts;
    console.log(`\\n🎯 Processing ONLY users with Contact records (${usersToProcess.length})`);
  } else if (onlyWithoutContacts) {
    usersToProcess = userData.withoutContacts;
    console.log(`\\n🎯 Processing ONLY users without Contact records (${usersToProcess.length})`);
  } else {
    usersToProcess = [...userData.withContacts, ...userData.withoutContacts];
    console.log(`\\n🎯 Processing ALL Auth users (${usersToProcess.length})`);
  }
  
  // Apply filters
  const filteredUsers = usersToProcess.slice(skip, limit ? skip + limit : undefined);
  console.log(`📋 Final batch: ${filteredUsers.length} users (skip: ${skip}, limit: ${limit || 'none'})`);
  
  // Migration stats
  const stats = {
    total: filteredUsers.length,
    success: 0,
    failed: 0,
    withContacts: 0,
    withoutContacts: 0,
    errors: []
  };
  
  // Process each user
  for (let i = 0; i < filteredUsers.length; i++) {
    const user = filteredUsers[i];
    const tempPassword = generateTempPassword();
    
    console.log(`\\n[${i + 1}/${filteredUsers.length}] Processing: ${user.email}`);
    console.log(`  📧 Email: ${user.email}`);
    console.log(`  👤 Contact ID: ${user.contactId}`);
    console.log(`  📇 Has Contact Record: ${user.hasContactRecord ? 'Yes' : 'No'}`);
    console.log(`  🔐 Has Password Hash: ${user.hasPassword ? 'Yes' : 'No'}`);
    
    const result = await createCognitoUser(user, tempPassword, dryRun);
    
    if (result.success) {
      stats.success++;
      if (user.hasContactRecord) {
        stats.withContacts++;
      } else {
        stats.withoutContacts++;
      }
      
      if (result.dryRun) {
        console.log(`  ✅ DRY RUN - User would be created successfully`);
      } else {
        console.log(`  ✅ User created successfully`);
        console.log(`  🆔 Cognito User ID: ${result.userId}`);
        console.log(`  📊 Status: ${result.status}`);
      }
    } else {
      stats.failed++;
      stats.errors.push({
        email: user.email,
        error: result.error,
        code: result.code,
        hasContactRecord: user.hasContactRecord
      });
      console.log(`  ❌ Failed to create user: ${result.error}`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Print final stats
  console.log('\\n📊 Migration Summary:');
  console.log(`  ✅ Total Successful: ${stats.success}`);
  console.log(`    📇 With Contact records: ${stats.withContacts}`);
  console.log(`    ⚠️  Without Contact records: ${stats.withoutContacts}`);
  console.log(`  ❌ Failed: ${stats.failed}`);
  console.log(`  📈 Success Rate: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
  
  if (stats.errors.length > 0) {
    console.log('\\n❌ Errors:');
    stats.errors.forEach((error, index) => {
      const contactStatus = error.hasContactRecord ? '📇' : '⚠️';
      console.log(`  ${index + 1}. ${contactStatus} ${error.email}: ${error.error} (${error.code})`);
    });
  }
  
  if (!dryRun && stats.success > 0) {
    console.log('\\n🎯 Next Steps:');
    console.log('  1. ✅ Users imported with temporary passwords (no emails sent)');
    console.log('  2. 🔄 Users will fail on first login attempt');
    console.log('  3. 👆 Users click "Forgot Password" to reset');
    console.log('  4. 📧 They receive password reset email');
    console.log('  5. 🔐 They set their new password');
    
    if (stats.withoutContacts > 0) {
      console.log('\\n⚠️  Follow-up Actions Needed:');
      console.log(`  📇 ${stats.withoutContacts} users imported without Contact records`);
      console.log('  💡 Consider creating Contact records for these users later');
      console.log('  🔍 Check logs above for specific emails');
    }
  }
  
  return stats;
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
  } else if (arg === '--skip' && args[i + 1]) {
    options.skip = parseInt(args[i + 1]);
    i++; // Skip next argument
  } else if (arg === '--only-with-contacts') {
    options.onlyWithContacts = true;
  } else if (arg === '--only-without-contacts') {
    options.onlyWithoutContacts = true;
  } else if (arg === '--help') {
    console.log(`
🚀 RealTechee User Migration Script

Usage: node migrate-users-to-cognito.mjs [options]

Options:
  --dry-run                Show what would be imported without creating users
  --limit N                Only process first N users (useful for testing)
  --skip N                 Skip first N users (useful for batch processing)
  --only-with-contacts     Only migrate users who have Contact records (28)
  --only-without-contacts  Only migrate users who lack Contact records (30)
  --help                   Show this help message

Examples:
  # Test with first 3 users
  node migrate-users-to-cognito.mjs --dry-run --limit 3
  
  # Migrate only users with Contact records
  node migrate-users-to-cognito.mjs --only-with-contacts
  
  # Migrate users without Contact records
  node migrate-users-to-cognito.mjs --only-without-contacts
  
  # Full migration (all 58 users)
  node migrate-users-to-cognito.mjs

Data Analysis:
  📊 28 users have both Auth and Contact records
  📊 30 users have Auth but no Contact records  
  📊 58 total users will be migrated to Cognito
`);
    process.exit(0);
  }
}

// Run migration
migrateUsers(options)
  .then(stats => {
    console.log('\\n🎉 Migration completed!');
    process.exit(stats.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\\n💥 Migration failed:', error);
    process.exit(1);
  });
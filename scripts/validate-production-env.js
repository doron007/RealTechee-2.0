#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all production environment variables and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Production Environment Validation');
console.log('=====================================\n');

// Load production environment
const prodEnvPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(prodEnvPath)) {
    console.error('❌ .env.production file not found!');
    process.exit(1);
}

const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
const envVars = {};

// Parse environment variables
prodEnv.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

console.log('📋 Environment Configuration Summary');
console.log('-----------------------------------');

// Critical Configuration Checks
const checks = [
    {
        category: '🌍 Environment Setup',
        vars: [
            { key: 'NODE_ENV', expected: 'production', critical: true },
            { key: 'NEXT_PUBLIC_ENVIRONMENT', expected: 'production', critical: true },
            { key: 'AMPLIFY_ENVIRONMENT', expected: 'production', critical: true }
        ]
    },
    {
        category: '🔗 Backend Configuration',
        vars: [
            { key: 'NEXT_PUBLIC_BACKEND_ENVIRONMENT', expected: 'production', critical: true },
            { key: 'NEXT_PUBLIC_BACKEND_SUFFIX', pattern: /^aqnqdrctpzfwfjwyxxsmu6peoq$/, critical: true }
        ]
    },
    {
        category: '🗄️ S3 Storage Configuration',
        vars: [
            { 
                key: 'NEXT_PUBLIC_S3_PUBLIC_BASE_URL', 
                pattern: /^https:\/\/amplify-realtecheeclone-p-.*\.s3\.us-west-1\.amazonaws\.com$/, 
                critical: true,
                shouldNotContain: '/public'
            }
        ]
    },
    {
        category: '📧 SendGrid Configuration',
        vars: [
            { key: 'SENDGRID_API_KEY', pattern: /^SG\./, critical: true },
            { key: 'FROM_EMAIL', expected: 'notifications@realtechee.com', critical: true },
            { key: 'REPLY_TO_EMAIL', expected: 'support@realtechee.com', critical: true }
        ]
    },
    {
        category: '📱 Twilio Configuration',
        vars: [
            { key: 'TWILIO_ACCOUNT_SID', pattern: /^AC/, critical: true },
            { key: 'TWILIO_AUTH_TOKEN', pattern: /.+/, critical: true },
            { key: 'TWILIO_FROM_PHONE', pattern: /^\+\d+/, critical: true }
        ]
    },
    {
        category: '🔒 Security Configuration',
        vars: [
            { key: 'NEXT_PUBLIC_STRICT_MODE', expected: 'true', critical: true },
            { key: 'NEXT_PUBLIC_CSRF_PROTECTION', expected: 'enforce', critical: true },
            { key: 'NEXT_PUBLIC_RATE_LIMITING', expected: 'true', critical: true }
        ]
    },
    {
        category: '🎛️ Feature Flags',
        vars: [
            { key: 'NEXT_PUBLIC_ENABLE_DEVTOOLS', expected: 'false', critical: true },
            { key: 'NEXT_PUBLIC_SHOW_DEBUG_INFO', expected: 'false', critical: true },
            { key: 'NEXT_PUBLIC_MOCK_EXTERNAL_APIS', expected: 'false', critical: true }
        ]
    }
];

let allPassed = true;
let criticalIssues = [];

checks.forEach(({ category, vars }) => {
    console.log(`\n${category}`);
    console.log('-'.repeat(category.length));
    
    vars.forEach(({ key, expected, pattern, critical, shouldNotContain }) => {
        const value = envVars[key];
        let status = '✅';
        let message = '';
        
        if (!value) {
            status = critical ? '❌' : '⚠️';
            message = 'NOT SET';
            if (critical) {
                criticalIssues.push(`${key} is not set`);
                allPassed = false;
            }
        } else if (expected && value !== expected) {
            status = critical ? '❌' : '⚠️';
            message = `Expected: ${expected}, Got: ${value}`;
            if (critical) {
                criticalIssues.push(`${key} has wrong value`);
                allPassed = false;
            }
        } else if (pattern && !pattern.test(value)) {
            status = critical ? '❌' : '⚠️';
            message = `Pattern mismatch: ${value}`;
            if (critical) {
                criticalIssues.push(`${key} doesn't match expected pattern`);
                allPassed = false;
            }
        } else if (shouldNotContain && value.includes(shouldNotContain)) {
            status = '❌';
            message = `Contains forbidden "${shouldNotContain}": ${value}`;
            criticalIssues.push(`${key} contains forbidden "${shouldNotContain}"`);
            allPassed = false;
        } else {
            message = critical ? '✅ Valid' : '✅ Set';
        }
        
        console.log(`  ${status} ${key}: ${message}`);
    });
});

console.log('\n🎯 Validation Summary');
console.log('====================');

if (allPassed) {
    console.log('✅ All production configuration checks passed!');
    console.log('\n🚀 Ready to test locally with:');
    console.log('   ./scripts/test-production-local.sh');
} else {
    console.log(`❌ ${criticalIssues.length} critical issues found:`);
    criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    console.log('\n🔧 Fix these issues before proceeding with production testing');
}

console.log('\n🔍 Next Steps:');
console.log('1. Run: ./scripts/test-production-local.sh');
console.log('2. Test image URLs (should NOT contain /public/)');
console.log('3. Verify backend connectivity (production tables)');
console.log('4. Test notifications (SendGrid/Twilio)');
console.log('5. Validate all features work in production mode');

process.exit(allPassed ? 0 : 1);
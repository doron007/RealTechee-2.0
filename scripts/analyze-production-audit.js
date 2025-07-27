#!/usr/bin/env node

/**
 * Production Audit Analysis Script
 * Analyzes AWS configuration differences between staging and production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Production Audit Analysis');
console.log('============================\n');

// Find the most recent audit directory
const docsDir = path.join(__dirname, '..', 'docs', '07-operations');
const auditDirs = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('production-audit-'))
    .map(dirent => dirent.name)
    .sort()
    .reverse();

if (auditDirs.length === 0) {
    console.error('❌ No audit directories found. Run: npm run audit:prod:aws first');
    process.exit(1);
}

const latestAuditDir = path.join(docsDir, auditDirs[0]);
console.log(`📁 Analyzing audit data from: ${auditDirs[0]}\n`);

// Helper functions
const readJSONFile = (filename) => {
    const filepath = path.join(latestAuditDir, filename);
    if (!fs.existsSync(filepath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
        console.warn(`⚠️  Could not parse ${filename}: ${error.message}`);
        return null;
    }
};

const extractEnvVars = (branchConfig) => {
    if (!branchConfig || !branchConfig.branch || !branchConfig.branch.environmentVariables) {
        return {};
    }
    return branchConfig.branch.environmentVariables;
};

// Analysis functions
const analyzeEnvironmentVariables = () => {
    console.log('🌍 Environment Variables Analysis');
    console.log('----------------------------------');
    
    const prodBranch = readJSONFile('prod-branch-config.json');
    const stagingBranch = readJSONFile('staging-branch-config.json');
    
    const prodEnvVars = extractEnvVars(prodBranch);
    const stagingEnvVars = extractEnvVars(stagingBranch);
    
    // Critical environment variables to check
    const criticalVars = [
        'NEXT_PUBLIC_S3_PUBLIC_BASE_URL',
        'NEXT_PUBLIC_BACKEND_SUFFIX',
        'NEXT_PUBLIC_ENVIRONMENT',
        'NODE_ENV'
    ];
    
    console.log('📋 Critical Environment Variables Comparison:');
    console.log('');
    
    let issuesFound = false;
    
    criticalVars.forEach(varName => {
        const prodValue = prodEnvVars[varName] || 'NOT_SET';
        const stagingValue = stagingEnvVars[varName] || 'NOT_SET';
        
        console.log(`🔍 ${varName}:`);
        console.log(`  Production:  ${prodValue}`);
        console.log(`  Staging:     ${stagingValue}`);
        
        if (varName === 'NEXT_PUBLIC_S3_PUBLIC_BASE_URL') {
            if (prodValue.includes('/public')) {
                console.log(`  ❌ ISSUE FOUND: Production S3 URL contains /public!`);
                issuesFound = true;
            } else if (prodValue !== 'NOT_SET') {
                console.log(`  ✅ Production S3 URL looks correct (no /public)`);
            }
        }
        
        if (prodValue !== stagingValue && varName !== 'NEXT_PUBLIC_BACKEND_SUFFIX') {
            console.log(`  ⚠️  Values differ between environments`);
        }
        
        console.log('');
    });
    
    return { prodEnvVars, stagingEnvVars, issuesFound };
};

const analyzeLambdaFunctions = () => {
    console.log('⚡ Lambda Functions Analysis');
    console.log('----------------------------');
    
    const prodLambdas = readJSONFile('prod-lambda-functions.json') || [];
    const stagingLambdas = readJSONFile('staging-lambda-functions.json') || [];
    
    console.log(`📊 Function Count:`);
    console.log(`  Production: ${prodLambdas.length} functions`);
    console.log(`  Staging:    ${stagingLambdas.length} functions`);
    console.log('');
    
    // Key Lambda functions to check
    const keyFunctions = ['notification-processor', 'user-admin', 'status-processor'];
    
    keyFunctions.forEach(funcType => {
        const prodFunc = prodLambdas.find(f => f.FunctionName.includes(funcType));
        const stagingFunc = stagingLambdas.find(f => f.FunctionName.includes(funcType));
        
        console.log(`🔍 ${funcType}:`);
        console.log(`  Production: ${prodFunc ? `✅ ${prodFunc.FunctionName}` : '❌ Not found'}`);
        console.log(`  Staging:    ${stagingFunc ? `✅ ${stagingFunc.FunctionName}` : '❌ Not found'}`);
        console.log('');
    });
};

const analyzeS3Configuration = () => {
    console.log('🗄️ S3 Storage Configuration Analysis');
    console.log('-------------------------------------');
    
    const prodCors = readJSONFile('prod-s3-cors.json');
    const stagingCors = readJSONFile('staging-s3-cors.json');
    
    console.log('📋 CORS Configuration:');
    console.log(`  Production CORS: ${prodCors ? '✅ Configured' : '❌ Not found'}`);
    console.log(`  Staging CORS:    ${stagingCors ? '✅ Configured' : '❌ Not found'}`);
    console.log('');
    
    // Check for path configuration differences
    if (prodCors && stagingCors) {
        const prodRules = prodCors.CORSRules || [];
        const stagingRules = stagingCors.CORSRules || [];
        
        console.log('🔍 CORS Rules Comparison:');
        console.log(`  Production: ${prodRules.length} rules`);
        console.log(`  Staging:    ${stagingRules.length} rules`);
        
        // Look for differences in allowed origins or headers
        prodRules.forEach((rule, index) => {
            const stagingRule = stagingRules[index];
            if (stagingRule) {
                const originsDiffer = JSON.stringify(rule.AllowedOrigins) !== JSON.stringify(stagingRule.AllowedOrigins);
                if (originsDiffer) {
                    console.log(`  ⚠️  Rule ${index + 1}: Different allowed origins`);
                }
            }
        });
    }
};

const analyzeBuildConfiguration = () => {
    console.log('🏗️ Build Configuration Analysis');
    console.log('--------------------------------');
    
    const prodBuilds = readJSONFile('prod-recent-builds.json');
    const stagingBuilds = readJSONFile('staging-recent-builds.json');
    
    if (prodBuilds && prodBuilds.jobSummaries) {
        const latestProdBuild = prodBuilds.jobSummaries[0];
        console.log('📊 Latest Production Build:');
        console.log(`  Status: ${latestProdBuild.status}`);
        console.log(`  Start Time: ${latestProdBuild.startTime}`);
        console.log(`  Commit: ${latestProdBuild.commitId?.substring(0, 8) || 'N/A'}`);
        console.log('');
    }
    
    if (stagingBuilds && stagingBuilds.jobSummaries) {
        const latestStagingBuild = stagingBuilds.jobSummaries[0];
        console.log('📊 Latest Staging Build:');
        console.log(`  Status: ${latestStagingBuild.status}`);
        console.log(`  Start Time: ${latestStagingBuild.startTime}`);
        console.log(`  Commit: ${latestStagingBuild.commitId?.substring(0, 8) || 'N/A'}`);
        console.log('');
    }
};

const generateRecommendations = (envAnalysis) => {
    console.log('🎯 Recommendations & Next Steps');
    console.log('================================');
    
    if (envAnalysis.issuesFound) {
        console.log('❌ CRITICAL ISSUES FOUND:');
        console.log('');
        console.log('1. **Production Environment Variable Issue**');
        console.log('   - Production S3 URL contains /public/ prefix');
        console.log('   - This is likely injected during Amplify build process');
        console.log('');
        console.log('🔧 IMMEDIATE FIXES TO TRY:');
        console.log('');
        console.log('1. **Update Production Environment Variables**:');
        console.log('   ```bash');
        console.log('   aws amplify update-branch \\');
        console.log('     --app-id d200k2wsaf8th3 \\');
        console.log('     --branch-name prod-v2 \\');
        console.log('     --environment-variables NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com');
        console.log('   ```');
        console.log('');
        console.log('2. **Clear Build Cache & Redeploy**:');
        console.log('   ```bash');
        console.log('   # Force clean rebuild');
        console.log('   aws amplify start-job \\');
        console.log('     --app-id d200k2wsaf8th3 \\');
        console.log('     --branch-name prod-v2 \\');
        console.log('     --job-type RELEASE');
        console.log('   ```');
        console.log('');
        console.log('3. **Invalidate CloudFront Cache**:');
        console.log('   ```bash');
        console.log('   # Get distribution ID and invalidate');
        console.log('   aws cloudfront create-invalidation \\');
        console.log('     --distribution-id [DISTRIBUTION_ID] \\');
        console.log('     --paths "/*"');
        console.log('   ```');
    } else {
        console.log('✅ No obvious environment variable issues found');
        console.log('');
        console.log('🔍 DEEPER INVESTIGATION NEEDED:');
        console.log('');
        console.log('1. **Check Build Logs**:');
        console.log('   - Review production build logs for environment injection');
        console.log('   - Compare with staging build process');
        console.log('');
        console.log('2. **Runtime Environment Check**:');
        console.log('   - Add temporary logging to production app');
        console.log('   - Log actual environment variables at runtime');
        console.log('');
        console.log('3. **CloudFront Origin Investigation**:');
        console.log('   - Check if CloudFront is modifying requests');
        console.log('   - Verify origin path configuration');
    }
    
    console.log('');
    console.log('📋 DOCUMENTATION UPDATES NEEDED:');
    console.log('');
    console.log('1. Update docs/07-operations/production-environment-troubleshooting.md');
    console.log('2. Document environment variable validation process');
    console.log('3. Create runbook for S3 URL configuration issues');
    console.log('4. Add monitoring for environment variable consistency');
};

// Run analysis
const main = () => {
    try {
        const envAnalysis = analyzeEnvironmentVariables();
        analyzeLambdaFunctions();
        analyzeS3Configuration(); 
        analyzeBuildConfiguration();
        generateRecommendations(envAnalysis);
        
        console.log('\n✅ Analysis complete!');
        console.log(`📁 Full audit data available in: ${latestAuditDir}`);
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
};

main();
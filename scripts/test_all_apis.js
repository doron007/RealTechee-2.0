#!/usr/bin/env node

// Quick test script to validate all 26 APIs are working
// Run with: node scripts/test_all_apis.js

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const apiTests = [
  'Affiliates', 'Auth', 'BackOfficeAssignTo', 'BackOfficeBookingStatuses',
  'BackOfficeBrokerage', 'BackOfficeNotifications', 'BackOfficeProducts',
  'BackOfficeProjectStatuses', 'BackOfficeQuoteStatuses', 'BackOfficeRequestStatuses',
  'BackOfficeRoleTypes', 'ContactUs', 'Contacts', 'Legal', 'MemberSignature',
  'PendingAppoitments', 'ProjectComments', 'ProjectMilestones', 'ProjectPaymentTerms',
  'ProjectPermissions', 'Projects', 'Properties', 'QuoteItems', 'Quotes',
  'Requests', 'eSignatureDocuments'
];

async function testAllAPIs() {
  console.log('🚀 Testing all 26 APIs...\n');
  
  const results = [];
  let totalRecords = 0;
  
  for (const modelName of apiTests) {
    try {
      const result = await client.models[modelName].list();
      const count = result.data?.length || 0;
      totalRecords += count;
      
      results.push({
        model: modelName,
        success: true,
        count: count,
        status: '✅'
      });
      
      console.log(`${modelName.padEnd(25)} ✅ ${count} records`);
    } catch (error) {
      results.push({
        model: modelName,
        success: false,
        count: 0,
        status: '❌',
        error: error.message
      });
      
      console.log(`${modelName.padEnd(25)} ❌ Error: ${error.message}`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUMMARY:`);
  console.log(`✅ Successful APIs: ${successCount}/${apiTests.length}`);
  console.log(`❌ Failed APIs: ${failureCount}`);
  console.log(`📝 Total Records: ${totalRecords}`);
  console.log(`🎯 Success Rate: ${(successCount/apiTests.length*100).toFixed(1)}%`);
  
  if (failureCount > 0) {
    console.log('\n❌ Failed APIs:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.model}: ${r.error}`);
    });
  }
  
  console.log('\n🎉 API Test Complete!');
  
  return {
    success: failureCount === 0,
    totalApis: apiTests.length,
    successCount,
    failureCount,
    totalRecords,
    results
  };
}

// Test relational queries
async function testRelationalQueries() {
  console.log('\n🔗 Testing Relational Queries...\n');
  
  try {
    // Get a sample project
    const projects = await client.models.Projects.list();
    if (!projects.data?.length) {
      console.log('⚠️  No projects found to test relations');
      return;
    }
    
    const projectId = projects.data[0].id;
    console.log(`Using project ID: ${projectId}`);
    
    // Test related tables
    const relatedTests = [
      { name: 'ProjectComments', foreignKey: 'projectId' },
      { name: 'ProjectMilestones', foreignKey: 'projectId' },
      { name: 'ProjectPaymentTerms', foreignKey: 'projectId' },
      { name: 'ProjectPermissions', foreignKey: 'projectId' }
    ];
    
    for (const test of relatedTests) {
      try {
        // Try different foreign key formats
        const formats = [
          { [test.foreignKey]: { eq: projectId } },
          { [test.foreignKey.charAt(0).toUpperCase() + test.foreignKey.slice(1)]: { eq: projectId } }
        ];
        
        let found = false;
        for (const filter of formats) {
          try {
            const result = await client.models[test.name].list({ filter });
            if (result.data?.length > 0) {
              console.log(`${test.name.padEnd(20)} ✅ ${result.data.length} related records`);
              found = true;
              break;
            }
          } catch (e) {
            // Try next format
          }
        }
        
        if (!found) {
          // List all to see if any exist
          const allResult = await client.models[test.name].list();
          console.log(`${test.name.padEnd(20)} ⚠️  ${allResult.data?.length || 0} total records (no relation found)`);
        }
      } catch (error) {
        console.log(`${test.name.padEnd(20)} ❌ Error: ${error.message}`);
      }
    }
    
    // Test Quote -> QuoteItems relation
    const quotes = await client.models.Quotes.list();
    if (quotes.data?.length) {
      const quoteId = quotes.data[0].id;
      console.log(`\nTesting Quote -> QuoteItems relation with quote ID: ${quoteId}`);
      
      try {
        const quoteItems = await client.models.QuoteItems.list({
          filter: { quoteId: { eq: quoteId } }
        });
        console.log(`QuoteItems relation   ✅ ${quoteItems.data?.length || 0} items for quote`);
      } catch (error) {
        const allItems = await client.models.QuoteItems.list();
        console.log(`QuoteItems relation   ⚠️  ${allItems.data?.length || 0} total items (no relation found)`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Relational test error: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    const apiResults = await testAllAPIs();
    await testRelationalQueries();
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    fs.writeFileSync(
      `api_test_results_${timestamp}.json`,
      JSON.stringify(apiResults, null, 2)
    );
    
    console.log(`\n💾 Results saved to: api_test_results_${timestamp}.json`);
    
    process.exit(apiResults.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

main();

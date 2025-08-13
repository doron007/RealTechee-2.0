#!/usr/bin/env node
/**
 * Remote invoke of the deployed status-processor Lambda (sandbox) to force a log entry
 * confirming dynamic table suffix usage, enabling Phase 3.4 verification.
 *
 * Uses aws-sdk v2 already present in dependencies.
 * Requires AWS credentials (env vars or profile) with lambda:InvokeFunction.
 *
 * Usage:
 *   node scripts/invoke-status-processor-remote.js
 *   AWS_PROFILE=sandbox node scripts/invoke-status-processor-remote.js
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

function loadOutputs() {
  const file = path.join(process.cwd(), 'amplify_outputs.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const outputs = loadOutputs();
  const region = outputs?.data?.aws_region || process.env.AWS_REGION || 'us-west-1';
  const arn = outputs?.custom?.statusProcessorArn;
  if (!arn) {
    console.error('❌ statusProcessorArn not found in amplify_outputs.json');
    process.exit(1);
  }
  const fnNameMatch = arn.match(/:function:([^:]+)$/);
  const functionName = fnNameMatch?.[1];
  if (!functionName) {
    console.error('❌ Could not extract function name from ARN');
    process.exit(1);
  }
  AWS.config.update({ region });
  const lambda = new AWS.Lambda();

  const payload = {
    version: '0',
    id: 'manual-invoke-' + Date.now(),
    'detail-type': 'Scheduled Event',
    source: 'manual.trigger',
    time: new Date().toISOString(),
    resources: [],
    detail: {}
  };

  console.log(`🚀 Invoking Lambda ${functionName} in ${region} ...`);
  try {
    const resp = await lambda.invoke({ FunctionName: functionName, InvocationType: 'RequestResponse', Payload: JSON.stringify(payload) }).promise();
    console.log('✅ Invoke status:', resp.StatusCode);
    if (resp.FunctionError) {
      console.error('FunctionError:', resp.FunctionError);
    }
    if (resp.Payload) {
      try { console.log('Response payload:', resp.Payload.toString()); } catch (_) {}
    }
    console.log('ℹ️  Re-run: npm run verify:status-processor in ~5-15s to see new logs.');
  } catch (err) {
    if (err.code === 'AccessDeniedException') {
      console.error('❌ Access denied invoking Lambda. Check AWS credentials/profile.');
    } else {
      console.error('❌ Invoke failed:', err);
    }
    process.exit(1);
  }
}

main();

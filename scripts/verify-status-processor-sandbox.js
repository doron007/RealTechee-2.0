#!/usr/bin/env node
/**
 * Verify status-processor Lambda deployed in sandbox is using dynamic table suffix.
 * Steps:
 *  1. Reads amplify_outputs.json to obtain statusProcessorArn & region.
 *  2. Derives log group name: /aws/lambda/<functionName>
 *  3. Fetches recent log events (filter optional) from CloudWatch Logs.
 *  4. Prints any lines containing 'Requests-' and suffix pattern '-NONE' to confirm table naming.
 *
 * Usage examples:
 *   node scripts/verify-status-processor-sandbox.js
 *   node scripts/verify-status-processor-sandbox.js --since-minutes 180 --grep DRY_RUN
 *
 * Requires AWS credentials with logs:FilterLogEvents permission.
 */

/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { sinceMinutes: 120, grep: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--since-minutes' && args[i+1]) { out.sinceMinutes = parseInt(args[++i], 10); }
    else if (a === '--grep' && args[i+1]) { out.grep = args[++i]; }
  }
  return out;
}

function loadOutputs() {
  const file = path.join(process.cwd(), 'amplify_outputs.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const { sinceMinutes, grep } = parseArgs();
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
    console.error('❌ Could not parse function name from ARN:', arn);
    process.exit(1);
  }
  const logGroupName = `/aws/lambda/${functionName}`;
  const startTime = Date.now() - sinceMinutes * 60 * 1000;

  console.log(`🔍 Fetching recent logs for ${functionName} (last ${sinceMinutes}m) in ${region}`);
  const client = new CloudWatchLogsClient({ region });
  try {
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime,
      limit: 200,
    });
    const resp = await client.send(command);
    const events = resp.events || [];
    if (!events.length) {
      console.log('ℹ️  No log events found in window. Try increasing --since-minutes.');
      return;
    }
    const pattern = /Requests-[A-Za-z0-9_]+-NONE/;
    let matches = 0;
    for (const e of events) {
      const msg = e.message?.trim();
      if (!msg) continue;
      if (grep && !msg.includes(grep)) continue;
      if (pattern.test(msg)) {
        matches++;
        console.log(`✅ Table reference: ${msg}`);
      } else if (grep) {
        console.log(msg);
      }
    }
    if (matches === 0) {
      console.warn('⚠️  No table name lines matched pattern. If invocation hasn\'t run yet, trigger the function or wait for schedule.');
    } else {
      console.log(`🎯 Found ${matches} table reference line(s) indicating dynamic suffix in use.`);
    }
  } catch (err) {
    const name = err?.name || 'Error';
    if (name.includes('AccessDenied') || name.includes('Unrecognized') || name.includes('Credentials')) {
      console.error('❌ AWS credentials not authorized or missing for CloudWatch Logs. Configure AWS_PROFILE or environment credentials.');
    } else {
      console.error('❌ Error fetching logs:', err);
    }
    process.exit(1);
  }
}

main();

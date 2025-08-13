#!/usr/bin/env node
/**
 * Production Status Processor Verification
 * Allows explicit function name when ARN not present in amplify_outputs.json.
 */
const fs = require('node:fs');
const path = require('node:path');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

function parseArgs(){
  const args = process.argv.slice(2);
  const out = { sinceMinutes: 180, grep: null };
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(a === '--since-minutes' && args[i+1]) out.sinceMinutes = parseInt(args[++i],10);
    else if(a === '--grep' && args[i+1]) out.grep = args[++i];
  }
  return out;
}
function loadOutputs(){
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'amplify_outputs.json'),'utf8')); } catch { return {}; }
}
async function main(){
  const { sinceMinutes, grep } = parseArgs();
  const outputs = loadOutputs();
  const region = outputs?.data?.aws_region || process.env.AWS_REGION || 'us-west-1';
  const prodArn = outputs?.custom?.statusProcessorProdArn;
  const fnEnv = process.env.FUNCTION_NAME;
  let functionName;
  if(fnEnv) functionName = fnEnv; else if(prodArn) functionName = prodArn.match(/:function:([^:]+)$/)?.[1];
  if(!functionName){
    console.error('❌ FUNCTION_NAME env var or statusProcessorProdArn required.');
    process.exit(1);
  }
  const logGroupName = `/aws/lambda/${functionName}`;
  const startTime = Date.now() - sinceMinutes*60*1000;
  console.log(`🔍 Fetching production logs for ${functionName} (last ${sinceMinutes}m) in ${region}`);
  const client = new CloudWatchLogsClient({ region });
  try {
    const resp = await client.send(new FilterLogEventsCommand({ logGroupName, startTime, limit: 250 }));
    const events = resp.events || [];
    if(!events.length){
      console.log('ℹ️  No log events in window. Increase --since-minutes or ensure function executed.');
      return;
    }
    const pattern = /Requests-[A-Za-z0-9_]+-NONE/;
    let matches=0;
    for(const e of events){
      const msg = (e.message||'').trim();
      if(!msg) continue;
      if(grep && !msg.includes(grep)) continue;
      if(pattern.test(msg)){
        matches++; console.log(`✅ Table reference: ${msg}`);
      } else if(grep){ console.log(msg); }
    }
    if(matches===0) console.warn('⚠️  No dynamic table lines matched. Confirm function ran or adjust time window.');
    else console.log(`🎯 Found ${matches} dynamic table reference line(s).`);
  } catch(err){
    console.error('❌ Error fetching production logs', err);
    process.exit(1);
  }
}
main();

#!/usr/bin/env node
/**
 * Staging Backend Smoke Test
 *
 * Verifies dynamic environment configuration is working for a (staging) deployment.
 * Non-destructive: lists tables and optionally probes GraphQL endpoint.
 *
 * Requirements (env vars):
 *   AWS_REGION
 *   NEXT_PUBLIC_BACKEND_SUFFIX (or TABLE_SUFFIX)
 * Optional:
 *   NEXT_PUBLIC_GRAPHQL_URL (AppSync endpoint)
 *   AWS credentials (standard resolution chain)
 *
 * Exit codes:
 *   0 success
 *   1 configuration error
 *   2 AWS/API failure
 *   3 Validation failure
 */
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const https = require('https');

const REGION = process.env.AWS_REGION;
const SUFFIX = process.env.NEXT_PUBLIC_BACKEND_SUFFIX || process.env.TABLE_SUFFIX;
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL;
const SKIP_GRAPHQL = process.env.SKIP_GRAPHQL === '1' || process.argv.includes('--skip-graphql');

function fail(code, msg, extra){
  console.error(`✖ ${msg}`);
  if(extra) console.error(extra);
  process.exit(code);
}
function ok(msg){ console.log(`✔ ${msg}`); }

if(!REGION) fail(1, 'AWS_REGION not set');
if(!SUFFIX) fail(1, 'NEXT_PUBLIC_BACKEND_SUFFIX (or TABLE_SUFFIX) not set');

console.log('Staging Smoke Test Starting');
console.log({ REGION, SUFFIX, GRAPHQL_URL: GRAPHQL_URL ? '[present]' : undefined, SKIP_GRAPHQL });

(async () => {
  const client = new DynamoDBClient({ region: REGION });
  let tables = [];
  try {
    let ExclusiveStartTableName = undefined;
    do {
      const resp = await client.send(new ListTablesCommand({ ExclusiveStartTableName }));
      tables.push(...resp.TableNames);
      ExclusiveStartTableName = resp.LastEvaluatedTableName;
    } while(ExclusiveStartTableName);
  } catch (e) {
    fail(2, 'Failed to list DynamoDB tables', e);
  }
  const modelCandidates = ['Requests','Contacts','Projects'];
  const found = modelCandidates.filter(m => tables.includes(`${m}-${SUFFIX}-NONE`));
  if(found.length < 2) {
    fail(3, `Expected at least 2 core tables with suffix ${SUFFIX}, found ${found.length}`, { found, tablesSample: tables.slice(0,20) });
  }
  ok(`DynamoDB core tables present (${found.join(', ')})`);

  if(GRAPHQL_URL && !SKIP_GRAPHQL){
    await new Promise((resolve) => {
      const body = JSON.stringify({ query: '{ __typename }' });
      const req = https.request(GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }}, res => {
        let data='';
        res.on('data', c => data+=c);
        res.on('end', () => {
          try { JSON.parse(data); } catch(_) {}
          if(res.statusCode && res.statusCode < 600) {
            ok(`GraphQL endpoint reachable (status ${res.statusCode})`);
            resolve();
          } else {
            fail(3, `GraphQL endpoint unexpected status ${res.statusCode}`);
          }
        });
      });
      req.on('error', err => fail(2, 'GraphQL probe failed', err));
      req.write(body); req.end();
    });
  } else {
    ok('Skipped GraphQL probe');
  }

  ok('Staging smoke test passed');
  process.exit(0);
})().catch(e => fail(2, 'Unhandled error', e));

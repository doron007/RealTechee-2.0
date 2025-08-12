#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const mappings = [
  { template: 'config/cloudwatch-monitoring.template.json', output: 'config/cloudwatch-monitoring.json' },
  { template: 'config/environment-protection.template.json', output: 'config/environment-protection.json' }
];

function render(content, vars) {
  return content.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key) => vars[key] ?? `__MISSING_${key}__`);
}

function main() {
  const vars = {
    BACKEND_SUFFIX: process.env.NEXT_PUBLIC_BACKEND_SUFFIX || process.env.TABLE_SUFFIX || '',
    AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID || 'd200k2wsaf8th3',
    PROD_BRANCH: process.env.PROD_BRANCH || 'prod-v2',
    LAMBDA_NOTIFICATION: process.env.LAMBDA_NOTIFICATION || 'amplify-realtecheeclone-production-sandbox-70796fa803-notificationProcessor',
    LAMBDA_USER_ADMIN: process.env.LAMBDA_USER_ADMIN || 'amplify-realtecheeclone-production-sandbox-70796fa803-userAdmin',
    LAMBDA_STATUS: process.env.LAMBDA_STATUS || 'amplify-realtecheeclone-production-sandbox-70796fa803-statusProcessor',
    AWS_REGION: process.env.AWS_REGION || 'us-west-1',
  ACCOUNT_ID: process.env.AWS_ACCOUNT_ID || '403266990862',
  BACKEND_SUFFIX_DEV: process.env.BACKEND_SUFFIX_DEV || process.env.NEXT_PUBLIC_BACKEND_SUFFIX || 'DEV_SUFFIX_PLACEHOLDER',
  BACKEND_SUFFIX_PROD: process.env.BACKEND_SUFFIX_PROD || 'PROD_SUFFIX_PLACEHOLDER',
  GRAPHQL_ENDPOINT_PROD: process.env.GRAPHQL_ENDPOINT_PROD || 'https://example.appsync-api.us-west-1.amazonaws.com/graphql'
  };

  mappings.forEach(({ template, output }) => {
    const tPath = path.join(process.cwd(), template);
    const oPath = path.join(process.cwd(), output);
    if (!fs.existsSync(tPath)) {
      console.warn('Template missing:', template);
      return;
    }
    const raw = fs.readFileSync(tPath, 'utf8');
    const rendered = render(raw, vars);
    fs.writeFileSync(oPath, rendered);
    console.log('Rendered', output);
    const missing = [...rendered.matchAll(/__MISSING_([A-Z0-9_]+)__/g)].map(m => m[1]);
    if (missing.length) {
      console.warn('Missing variables for', output, ':', missing.join(', '));
    }
  });
}

main();

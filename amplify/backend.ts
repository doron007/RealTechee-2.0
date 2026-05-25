import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

// Minimal restore deployment — data layer only.
// Lambdas (notification-processor, user-admin, status-processor, ses-bounce-handler, reputation-monitor)
// are temporarily stripped because their resource.ts files trip the CDK ESM assembler. They are unneeded
// for the data-restore goal and their scheduled crons are the cost driver we explicitly want OFF.
// To re-enable later: revert this file from git and add "type": "module" to each function's package.json.
export const backend = defineBackend({
  auth,
  data,
  storage
});

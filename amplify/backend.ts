import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';

export const backend = defineBackend({
  data
});

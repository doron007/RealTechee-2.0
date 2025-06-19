import { defineAuth } from '@aws-amplify/backend'

export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    'custom:contactId': {
      dataType: 'String',
      mutable: true
    },
    'custom:membershipTier': {
      dataType: 'String',
      mutable: true
    }
  },
  groups: ['public', 'basic', 'member', 'agent', 'admin']
})
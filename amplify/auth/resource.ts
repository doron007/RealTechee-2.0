import { defineAuth } from '@aws-amplify/backend'
import { postConfirmationHandler } from '../functions/post-confirmation/resource'

export const auth = defineAuth({
  loginWith: {
    email: true
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    phoneNumber: {
      required: false,
      mutable: true
    },
    givenName: {
      required: false,
      mutable: true
    },
    familyName: {
      required: false,
      mutable: true
    },
    'custom:role': {
      dataType: 'String',
      mutable: true
    },
    'custom:contactId': {
      dataType: 'String',
      mutable: true
    },
    'custom:membershipTier': {
      dataType: 'String',
      mutable: true
    },
    'custom:emailNotifications': {
      dataType: 'String',
      mutable: true
    },
    'custom:smsNotifications': {
      dataType: 'String',
      mutable: true
    },
    'custom:companyId': {
      dataType: 'String',
      mutable: true
    }
  },
  groups: ['super_admin', 'admin', 'accounting', 'srm', 'agent', 'homeowner', 'provider', 'guest'],
  triggers: {
    postConfirmation: postConfirmationHandler
  }
})
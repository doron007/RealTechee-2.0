import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'RealTecheeUserUploads',
  access: (allow) => ({
    'public/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read', 'write']) // Allow guests to upload files
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ]
  })
});

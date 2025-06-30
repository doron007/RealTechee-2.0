import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda';
import { ContactLinkingService } from './services/contactLinkingService';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

/**
 * PostConfirmation trigger handler
 * Automatically links new users to existing contacts or creates new contacts
 */
export const handler: PostConfirmationTriggerHandler = async (event: PostConfirmationTriggerEvent) => {
  console.log('🚀 PostConfirmation trigger started', {
    userPoolId: event.userPoolId,
    userName: event.userName,
    triggerSource: event.triggerSource,
    debug: DEBUG_MODE
  });

  try {
    // Only process PostConfirmation_ConfirmSignUp events
    if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
      console.log(`⏭️ Skipping trigger source: ${event.triggerSource}`);
      return event;
    }

    // Extract user information
    const email = event.request.userAttributes.email;
    const givenName = event.request.userAttributes.given_name;
    const familyName = event.request.userAttributes.family_name;
    const userId = event.userName;
    const userPoolId = event.userPoolId;

    if (!email) {
      console.warn('⚠️ No email found in user attributes, skipping contact linking');
      return event;
    }

    // Skip linking for super admin (already configured)
    if (email.toLowerCase() === 'info@realtechee.com') {
      console.log('⏭️ Skipping contact linking for super admin');
      return event;
    }

    console.log(`👤 Processing user: ${email} (${givenName} ${familyName})`);

    // Initialize contact linking service
    const linkingService = new ContactLinkingService();

    // Perform the linking
    const result = await linkingService.linkUserToContact(
      userPoolId,
      userId,
      email,
      givenName,
      familyName
    );

    if (result.success) {
      console.log(`✅ User-contact linking completed successfully`);
      console.log(`📊 Summary:`, {
        contactId: result.contactId,
        isNewContact: result.isNewContact,
        assignedRole: result.assignedRole,
        explanation: result.explanation
      });
    } else {
      console.error(`❌ User-contact linking failed:`, result.error);
      // Don't throw error - allow user signup to continue even if linking fails
    }

  } catch (error) {
    console.error('💥 Critical error in PostConfirmation trigger:', error);
    // Don't throw error - allow user signup to continue
    // The user can be manually linked later via admin panel
  }

  // Always return the event to continue the authentication flow
  return event;
};
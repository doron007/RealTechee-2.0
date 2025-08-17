import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { GeneralInquiryForm, InquirySuccessMessage, FormErrorMessage } from '../../components/forms';
import { useFormSubmission } from '../../hooks';
import logger from '../../lib/logger';
import { createProperties, createContacts, createContactUs, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';
import { signalEmitter } from '../../services/signalEmitter';
import { client } from '../../utils/amplifyAPI';

const ContactUs: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.INQUIRY];
  
  // Use reusable form submission hook with persistent error messages
  const { 
    status, 
    isSubmitting, 
    errorDetails,
    handleSubmission, 
    reset 
  } = useFormSubmission({
    formName: 'General Inquiry',
    scrollToTopOnSuccess: true,
    errorResetDelay: 0 // Keep errors persistent until user takes action
  });
  
  // Use centralized Amplify client with environment-aware configuration

  // Helper function to normalize addresses for comparison
  const normalizeAddress = (streetAddress: string, city: string, state: string, zip: string) => {
    const normalized = `${streetAddress}, ${city}, ${state} ${zip}`
      .toLowerCase()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[.,]/g, '') // Remove commas and periods
      .trim();
    return normalized;
  };

  // Enhanced user-aware audit logging for General Inquiry
  const logPropertyAudit = (recordId: string, data: any, action: 'create' | 'update' = 'create') => 
    auditWithUser[action === 'create' ? 'logCreate' : 'logUpdate'](
      'Properties', recordId, data, 'general_inquiry_form', 'property_from_inquiry'
    );
  
  const logContactAudit = (recordId: string, newData: any, oldData?: any) => 
    auditWithUser[oldData ? 'logUpdate' : 'logCreate'](
      'Contacts', recordId, oldData || newData, newData, 'general_inquiry_form', 'contact_from_inquiry'
    );
  
  const logInquiryAudit = (recordId: string, data: any) => 
    auditWithUser.logFormSubmission('ContactUs', recordId, data, 'general_inquiry');

  // Enhanced submission handler with step-by-step processing and deduplication
  const handleFormSubmit = async (formData: any) => {
    await handleSubmission(async () => {
      logger.info('=== GENERAL INQUIRY SUBMISSION STARTED ===', {
        timestamp: new Date().toISOString(),
        formData: {
          contactInfo: formData.contactInfo,
          address: formData.address,
          product: formData.product,
          subject: formData.subject,
          messageLength: formData.message?.length || 0
        }
      });

      // Step 1: Validate form data completeness and get user context
      logger.info('Step 1: Validating form data completeness and capturing user context');
      if (!formData.contactInfo?.fullName || !formData.contactInfo?.email || 
          !formData.address?.streetAddress || !formData.product || !formData.subject || !formData.message) {
        throw new Error('Required fields are missing');
      }
      
      // Get current user for record ownership
      const recordOwner = await getRecordOwner();
      logger.info('Step 1: ✅ Form validation passed', { recordOwner });

      // Step 2: Find or Create Property record
      logger.info('Step 2: Finding or creating Property record');
      
      const fullAddress = `${formData.address.streetAddress}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip}`;
      const normalizedSearchAddress = normalizeAddress(
        formData.address.streetAddress,
        formData.address.city,
        formData.address.state,
        formData.address.zip
      );
      
      // Search for existing property
      logger.info('Step 2a: Searching for existing property');
      const existingPropertiesResponse = await client.graphql({
        query: listProperties,
        variables: {
          limit: 100 // Get a reasonable batch to search through
        }
      });
      
      // Find matching property (case/space insensitive)
      const existingProperty = existingPropertiesResponse.data.listProperties.items.find(prop => {
        const existingNormalized = normalizeAddress(
          prop.houseAddress || '',
          prop.city || '',
          prop.state || '',
          prop.zip || ''
        );
        return existingNormalized === normalizedSearchAddress;
      });
      
      let propertyData;
      if (existingProperty) {
        logger.info('Step 2b: ✅ Using existing property', { 
          propertyId: existingProperty.id,
          address: existingProperty.propertyFullAddress 
        });
        propertyData = existingProperty;
      } else {
        logger.info('Step 2b: Creating new property');
        const propertyInput = {
          propertyFullAddress: fullAddress,
          houseAddress: formData.address.streetAddress,
          city: formData.address.city,
          state: formData.address.state,
          zip: formData.address.zip,
              // createdAt/updatedAt are automatically managed by Amplify
          owner: recordOwner
        };
        
        const propertyResponse = await client.graphql({
          query: createProperties,
          variables: { input: propertyInput }
        });
        
        propertyData = propertyResponse.data.createProperties;
        const { __typename: _, ...cleanPropertyData } = propertyData;
        
        // Audit log for property creation with user context
        await logPropertyAudit(propertyData.id, cleanPropertyData);
        
        logger.info('Step 2b: ✅ New property created', { propertyData: cleanPropertyData });
      }

      // Step 3: Handle Contact Creation/Update
      logger.info('Step 3: Processing contact information');
      
      const contactEmail = formData.contactInfo.email;
      
      // Search for existing contact by email
      const existingContactResponse = await client.graphql({
        query: listContacts,
        variables: {
          filter: {
            email: {
              eq: contactEmail
            }
          }
        }
      });

      const contactData = {
        fullName: formData.contactInfo.fullName,
        firstName: formData.contactInfo.fullName.split(' ')[0],
        lastName: formData.contactInfo.fullName.split(' ').slice(1).join(' ') || '',
        email: formData.contactInfo.email,
        phone: formData.contactInfo.phone,
              // updatedAt is automatically managed by Amplify
        owner: recordOwner
      };

      const existingContact = existingContactResponse.data.listContacts.items[0];
      let finalContactData;

      if (existingContact) {
        logger.info('Step 3a: Updating existing contact', { 
          contactId: existingContact.id,
          email: existingContact.email
        });
        
        const { __typename, createdAt, updatedAt, ...cleanExistingData } = existingContact;
        
        const contactResponse = await client.graphql({
          query: updateContacts,
          variables: { 
            input: {
              id: existingContact.id,
              ...contactData
            }
          }
        });
        
        finalContactData = contactResponse.data.updateContacts;
        
        await logContactAudit(existingContact.id, contactData, cleanExistingData);
      } else {
        logger.info('Step 3a: Creating new contact');
        
        const contactResponse = await client.graphql({
          query: createContacts,
          variables: { 
            input: {
              ...contactData
              // createdAt is automatically managed by Amplify
            }
          }
        });
        
        finalContactData = contactResponse.data.createContacts;
        
        await logContactAudit(finalContactData.id, contactData);
      }

      logger.info('Step 3b: ✅ Contact processed', { 
        contactId: finalContactData.id,
        email: contactEmail
      });

      // Step 4: Create ContactUs record
      logger.info('Step 4: Creating ContactUs record');
      
      const contactUsInput = {
        // ContactUs table fields (existing schema confirmed)
        product: formData.product,
        subject: formData.subject,
        message: formData.message,
        submissionTime: new Date().toISOString(),
        
        // Foreign keys
        contactId: finalContactData.id,
        addressId: propertyData.id,
        
        // System fields with proper user attribution
              // createdAt/updatedAt are automatically managed by Amplify
        owner: recordOwner
      };
      
      const contactUsResponse = await client.graphql({
        query: createContactUs,
        variables: { input: contactUsInput }
      });
      
      const contactUsData = contactUsResponse.data.createContactUs;
      // Remove __typename from logged data for cleaner output
      const { __typename: _c, ...cleanContactUsData } = contactUsData;
      
      // Audit log for ContactUs creation with user context
      await logInquiryAudit(contactUsData.id, cleanContactUsData);
      
      logger.info('Step 4a: ✅ ContactUs record created', { contactUsData: cleanContactUsData });

      // Step 5: Emit signal for notification system (NEW signal-driven architecture)
      logger.info('Step 5: Emitting form submission signal (signal-driven architecture)');
      
      try {
        // Emit signal using new signal-driven architecture
        const signalResult = await signalEmitter.emitFormSubmission('contact_us', {
          // Customer information
          customerName: formData.contactInfo.fullName,
          customerEmail: formData.contactInfo.email,
          customerPhone: formData.contactInfo.phone,
          
          // Form-specific data
          subject: formData.subject,
          message: formData.message,
          product: formData.product,
          address: formData.address,
          
          // Metadata
          submissionId: contactUsData.id,
          submittedAt: contactUsData.submissionTime || new Date().toISOString(),
          preferredContact: formData.contactInfo.phone ? 'phone' : 'email',
          leadSource: 'contact_us_form'
        }, {
          urgency: 'high', // Contact Us forms are high priority
          testMode: false
        });
        
        if (signalResult.success) {
          logger.info('Step 5a: ✅ Signal emitted successfully', {
            signalId: signalResult.signalId,
            timestamp: signalResult.timestamp
          });
        } else {
          logger.warn('Step 5a: ⚠️ Signal emission failed', {
            error: signalResult.error
          });
        }
      } catch (signalError) {
        // Don't fail the form submission if signal emission fails
        logger.error('Step 5a: ❌ Signal emission error', {
          error: signalError
        });
      }

      // Step 6: Success
      logger.info('=== GENERAL INQUIRY SUBMISSION COMPLETED SUCCESSFULLY ===', {
        timestamp: new Date().toISOString(),
        summary: {
          propertyId: propertyData.id,
          contactId: finalContactData.id,
          contactUsId: contactUsData.id,
          product: formData.product,
          subject: formData.subject
        }
      });
      
      // Return the result for the handleSubmission wrapper
      return {
        propertyId: propertyData.id,
        contactId: finalContactData.id,
        contactUsId: contactUsData.id
      };
    });
  };


  // Enhanced form component with better error handling
  const formComponent = (() => {
    if (status === 'success') return <InquirySuccessMessage onReset={reset} />;
    
    if (status === 'error') {
      return (
        <FormErrorMessage 
          error={errorDetails}
          onRetry={reset}
          onContactSupport={() => {
            // Custom contact support action for Contact Us form
            window.open('mailto:info@realtechee.com?subject=Contact Form Issue&body=I encountered an issue submitting the contact form. Please assist.', '_blank');
          }}
        />
      );
    }
    
    return (
      <GeneralInquiryForm 
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    );
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Contact Us - RealTechee</title>
        <meta name="description" content="Have questions or need information? Contact us and our team will get back to you promptly." />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.INQUIRY} />
        <ContactContentSection 
          processSteps={content.processSteps}
          formTitle={content.formTitle}
          form={formComponent}
        />
        <ContactMapSection />
      </main>
    </div>
  );
};

export default ContactUs;
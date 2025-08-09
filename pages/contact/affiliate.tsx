import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { AffiliateInquiryForm, InquirySuccessMessage, FormErrorMessage } from '../../components/forms';
import { useFormSubmission } from '../../hooks';
import logger from '../../lib/logger';
import { generateClient } from 'aws-amplify/api';
import { createProperties, createContacts, createAffiliates, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';
import { notifyAffiliate, AffiliateSubmissionData } from '../../services/formNotificationIntegration';

const Affiliate: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.AFFILIATE];
  
  // Use reusable form submission hook with persistent error messages
  const { 
    status, 
    isSubmitting, 
    errorDetails,
    handleSubmission, 
    reset 
  } = useFormSubmission({
    formName: 'Affiliate Inquiry',
    scrollToTopOnSuccess: true,
    errorResetDelay: 0 // Keep errors persistent until user takes action
  });
  
  // Initialize Amplify GraphQL client with API key for public access
  const client = generateClient({
    authMode: 'apiKey'
  });

  // Helper function to normalize addresses for comparison
  const normalizeAddress = (streetAddress: string, city: string, state: string, zip: string) => {
    const normalized = `${streetAddress}, ${city}, ${state} ${zip}`
      .toLowerCase()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[.,]/g, '') // Remove commas and periods
      .trim();
    return normalized;
  };

  // Enhanced user-aware audit logging for Affiliate Inquiry
  const logPropertyAudit = (recordId: string, data: any, action: 'create' | 'update' = 'create') => 
    auditWithUser[action === 'create' ? 'logCreate' : 'logUpdate'](
      'Properties', recordId, data, 'affiliate_inquiry_form', 'property_from_affiliate'
    );
  
  const logContactAudit = (recordId: string, newData: any, oldData?: any) => 
    auditWithUser[oldData ? 'logUpdate' : 'logCreate'](
      'Contacts', recordId, oldData || newData, newData, 'affiliate_inquiry_form', 'contact_from_affiliate'
    );
  
  const logAffiliateAudit = (recordId: string, data: any) => 
    auditWithUser.logFormSubmission('Affiliates', recordId, data, 'affiliate_inquiry');

  // Enhanced submission handler with step-by-step processing and deduplication
  const handleFormSubmit = async (formData: any) => {
    await handleSubmission(async () => {
      logger.info('=== AFFILIATE INQUIRY SUBMISSION STARTED ===', {
        timestamp: new Date().toISOString(),
        formData: {
          contactInfo: formData.contactInfo,
          address: formData.address,
          companyName: formData.companyName,
          serviceType: formData.serviceType,
          isGeneralContractor: formData.serviceType === 'General Contractor',
          hasGCInfo: formData.serviceType === 'General Contractor' ? !!formData.generalContractorInfo?.workersCompensation : true
        }
      });

      // Step 1: Validate form data completeness and get user context
      logger.info('Step 1: Validating form data completeness and capturing user context');
      if (!formData.contactInfo?.fullName || !formData.contactInfo?.email || 
          !formData.address?.streetAddress || !formData.companyName || !formData.serviceType) {
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

      // Step 4: Create Affiliates record
      logger.info('Step 4: Creating Affiliates record');
      
      // Create descriptive title for better identification
      const affiliateTitle = `${formData.serviceType}: ${formData.companyName}`;
      
      // Map form data to Affiliates table schema
      const affiliateInput = {
        // Basic Information
        name: formData.contactInfo.fullName,
        email: formData.contactInfo.email,
        phone: formData.contactInfo.phone,
        company: formData.companyName,
        serviceType: formData.serviceType,
        title: affiliateTitle,
        
        // Foreign keys
        contactId: finalContactData.id,
        addressId: propertyData.id,
        
        // General Contractor specific fields (if applicable)
        ...(formData.serviceType === 'General Contractor' && formData.generalContractorInfo ? {
          workersCompensationInsurance: formData.generalContractorInfo.workersCompensation ? 'Yes' : 'No',
          license: formData.generalContractorInfo.license || '',
          environmentalFactor: formData.generalContractorInfo.environmentalFactor ? 'Yes' : 'No',
          oshaCompliance: formData.generalContractorInfo.oshaCompliance ? 'Yes' : 'No',
          signedNda: formData.generalContractorInfo.signedNDA ? 'Yes' : 'No',
          safetyPlan: formData.generalContractorInfo.safetyPlan ? 'Yes' : 'No',
          numEmployees: parseInt(formData.generalContractorInfo.numberOfEmployees) || 0
        } : {}),
        
        // System fields with proper user attribution
        date: new Date().toISOString(),
              // createdAt/updatedAt are automatically managed by Amplify
        owner: recordOwner
      };
      
      const affiliateResponse = await client.graphql({
        query: createAffiliates,
        variables: { input: affiliateInput }
      });
      
      const affiliateData = affiliateResponse.data.createAffiliates;
      // Remove __typename from logged data for cleaner output
      const { __typename: _a, ...cleanAffiliateData } = affiliateData;
      
      // Audit log for Affiliates creation with user context
      await logAffiliateAudit(affiliateData.id, cleanAffiliateData);
      
      logger.info('Step 4a: ✅ Affiliates record created', { affiliateData: cleanAffiliateData });

      // Step 5: Send internal partnerships team notification
      logger.info('Step 5: Sending partnerships team notification for affiliate inquiry');
      
      try {
        const notificationData: AffiliateSubmissionData = {
          formType: 'affiliate',
          submissionId: affiliateData.id,
          submittedAt: affiliateData.date || new Date().toISOString(),
          companyName: formData.companyName,
          contactName: formData.contactInfo.fullName,
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          serviceType: formData.serviceType,
          // Address information
          address: {
            streetAddress: formData.address.streetAddress,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip
          },
          // Map General Contractor specific fields or provide defaults
          businessLicense: formData.generalContractorInfo?.license || '',
          insurance: formData.generalContractorInfo?.workersCompensation || false,
          workersCompensation: formData.generalContractorInfo?.workersCompensation || false,
          environmentalFactor: formData.generalContractorInfo?.environmentalFactor || false,
          oshaCompliance: formData.generalContractorInfo?.oshaCompliance || false,
          signedNDA: formData.generalContractorInfo?.signedNDA || false,
          safetyPlan: formData.generalContractorInfo?.safetyPlan || false,
          numberOfEmployees: formData.generalContractorInfo?.numberOfEmployees || '',
          bonded: false, // Not collected in current form
          yearsInBusiness: 'Not provided', // Not collected in current form
          serviceAreas: [], // Not collected in current form
          certifications: [], // Not collected in current form
          portfolio: 'Not provided', // Not collected in current form
          testData: false,
          leadSource: 'affiliate_form'
        };
        
        const notificationResult = await notifyAffiliate(notificationData, {
          priority: 'low',    // Affiliate forms are low priority
          channels: 'email',  // Email only for partnerships team
          testMode: false
        });
        
        if (notificationResult.success) {
          logger.info('Step 5a: ✅ Partnerships team notification sent', {
            recipientsNotified: notificationResult.recipientsNotified,
            environment: notificationResult.environment,
            debugMode: notificationResult.debugMode
          });
        } else {
          logger.warn('Step 5a: ⚠️ Partnerships team notification failed', {
            errors: notificationResult.errors
          });
        }
      } catch (notificationError) {
        // Don't fail the form submission if notification fails
        logger.error('Step 5a: ❌ Partnerships team notification error', {
          error: notificationError
        });
      }

      // Step 6: Success
      logger.info('=== AFFILIATE INQUIRY SUBMISSION COMPLETED SUCCESSFULLY ===', {
        timestamp: new Date().toISOString(),
        summary: {
          propertyId: propertyData.id,
          contactId: finalContactData.id,
          affiliateId: affiliateData.id,
          companyName: formData.companyName,
          serviceType: formData.serviceType,
          title: affiliateTitle
        }
      });
      
      // Return the result for the handleSubmission wrapper
      return {
        propertyId: propertyData.id,
        contactId: finalContactData.id,
        affiliateId: affiliateData.id
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
            // Custom contact support action for Affiliate form
            window.open('mailto:partnerships@realtechee.com?subject=Affiliate Form Issue&body=I encountered an issue submitting the affiliate inquiry form. Please assist.', '_blank');
          }}
        />
      );
    }
    
    return (
      <AffiliateInquiryForm 
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    );
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Affiliate Inquiry - Contact Us</title>
        <meta name="description" content="Interested in becoming a RealTechee affiliate? Join our network of trusted service providers and contractors." />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.AFFILIATE} />
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

export default Affiliate;
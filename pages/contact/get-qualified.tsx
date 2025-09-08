import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { GetQualifiedForm, InquirySuccessMessage, FormErrorMessage } from '../../components/forms';
import { useFormSubmission } from '../../hooks';
import Button from '../../components/common/buttons/Button';
import H2 from '../../components/typography/H2';
import H3 from '../../components/typography/H3';
import P1 from '../../components/typography/P1';
import logger from '../../lib/logger';
import SEOHead from '../../components/seo/SEOHead';
import { createProperties, createContacts, createContactUs, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';
import { signalEmitter } from '../../services/notifications/signalEmitter';
import { client } from '../../utils/amplifyAPI';

const GetQualified: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.QUALIFIED];
  
  // Use reusable form submission hook with persistent error messages
  const { 
    status, 
    isSubmitting, 
    errorDetails,
    handleSubmission, 
    reset 
  } = useFormSubmission({
    formName: 'Get Qualified',
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

  // Enhanced user-aware audit logging for Get Qualified
  const logPropertyAudit = (recordId: string, data: any, action: 'create' | 'update' = 'create') => 
    auditWithUser[action === 'create' ? 'logCreate' : 'logUpdate'](
      'Properties', recordId, data, 'get_qualified_form', 'property_from_qualification'
    );
  
  const logContactAudit = (recordId: string, newData: any, oldData?: any) => 
    auditWithUser[oldData ? 'logUpdate' : 'logCreate'](
      'Contacts', recordId, oldData || newData, newData, 'get_qualified_form', 'contact_from_qualification'
    );
  
  const logQualificationAudit = (recordId: string, data: any) => 
    auditWithUser.logFormSubmission('ContactUs', recordId, data, 'agent_qualification');

  // Enhanced submission handler with step-by-step processing and deduplication
  const handleFormSubmit = async (formData: any) => {
    await handleSubmission(async () => {
      logger.info('=== GET QUALIFIED SUBMISSION STARTED ===', {
        timestamp: new Date().toISOString(),
        formData: {
          contactInfo: formData.contactInfo,
          address: formData.address,
          licenseNumber: formData.licenseNumber,
          brokerage: formData.brokerage,
          experienceYears: formData.experienceYears,
          specialtiesCount: formData.specialties?.length || 0,
          messageLength: formData.qualificationMessage?.length || 0
        }
      });

      // Step 1: Validate form data completeness and get user context
      logger.info('Step 1: Validating form data completeness and capturing user context');
      if (!formData.contactInfo?.fullName || !formData.contactInfo?.email || 
          !formData.address?.streetAddress || !formData.licenseNumber || 
          !formData.brokerage || !formData.qualificationMessage) {
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

      // Step 4: Create ContactUs record with agent qualification data
      logger.info('Step 4: Creating ContactUs record with agent qualification data');
      
      // Create descriptive subject line for better email notifications
      const agentName = formData.contactInfo.fullName;
      const brokerageName = formData.brokerage === 'other' ? formData.customBrokerage : formData.brokerage;
      const descriptiveSubject = `Agent Qualification: ${agentName} - ${brokerageName}`;
      
      // Create HTML-formatted message for email-friendly display
      const htmlMessage = `
<h3>Agent Qualification Request</h3>
<hr>
<p><strong>Agent:</strong> ${agentName}</p>
<p><strong>Email:</strong> ${formData.contactInfo.email}</p>
<p><strong>Phone:</strong> ${formData.contactInfo.phone}</p>
<p><strong>License Number:</strong> ${formData.licenseNumber}</p>
<p><strong>Brokerage:</strong> ${brokerageName}</p>
<p><strong>Experience Level:</strong> ${formData.experienceYears}</p>
<p><strong>Recent Transactions (12 months):</strong> ${formData.recentTransactions}</p>
<hr>
<p><strong>Primary Markets:</strong></p>
<p>${formData.primaryMarkets}</p>
<hr>
<p><strong>Specialties:</strong></p>
<ul>
${formData.specialties.map((specialty: string) => `<li>${specialty}</li>`).join('')}
</ul>
<hr>
<p><strong>Agent Message:</strong></p>
<p>${formData.qualificationMessage}</p>
<hr>
<p><strong>Property Address:</strong> ${formData.address.streetAddress}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip}</p>
<p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>

<!-- JSON Data for Processing -->
<script type="application/json">
${JSON.stringify({
  type: 'agent_qualification',
  licenseNumber: formData.licenseNumber,
  brokerage: formData.brokerage,
  customBrokerage: formData.customBrokerage,
  experienceYears: formData.experienceYears,
  primaryMarkets: formData.primaryMarkets,
  specialties: formData.specialties,
  recentTransactions: formData.recentTransactions,
  qualificationMessage: formData.qualificationMessage,
  contactInfo: formData.contactInfo,
  address: formData.address
}, null, 2)}
</script>
      `.trim();
      
      const contactUsInput = {
        // Use ContactUs table with extended data for agent qualification
        product: 'Agent Qualification',
        subject: descriptiveSubject,
        message: htmlMessage,
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
      await logQualificationAudit(contactUsData.id, cleanContactUsData);
      
      logger.info('Step 4a: ✅ ContactUs record created', { contactUsData: cleanContactUsData });

      // Step 5: Emit signal for get qualified notification processing
      logger.info('Step 5: Emitting signal for get qualified submission');
      
      try {
        const signalResult = await signalEmitter.emitFormSubmission('get_qualified', {
          agentName: formData.contactInfo.fullName,
          agentEmail: formData.contactInfo.email,
          agentPhone: formData.contactInfo.phone,
          brokerage: brokerageName,
          licenseNumber: formData.licenseNumber,
          yearsExperience: formData.experienceYears,
          primaryMarkets: formData.primaryMarkets,
          specialties: formData.specialties,
          recentTransactionVolume: formData.recentTransactions,
          whyDoYouWantToWorkWithRealTechee: formData.qualificationMessage,
          submissionId: contactUsData.id,
          submissionTimestamp: new Date().toISOString(),
          dashboardUrl: `${window.location.origin}/admin/get-qualified/${contactUsData.id}`
        }, { 
          urgency: 'medium', 
          testMode: process.env.NODE_ENV === 'development' 
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
          error: signalError instanceof Error ? signalError.message : String(signalError)
        });
      }

      // Step 6: Success
      logger.info('=== GET QUALIFIED SUBMISSION COMPLETED SUCCESSFULLY ===', {
        timestamp: new Date().toISOString(),
        summary: {
          propertyId: propertyData.id,
          contactId: finalContactData.id,
          contactUsId: contactUsData.id,
          agentName: agentName,
          licenseNumber: formData.licenseNumber,
          brokerage: brokerageName,
          experienceYears: formData.experienceYears,
          subject: descriptiveSubject
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

  // Mobile-optimized success message component
  const SuccessMessage = () => {
    // Auto-scroll to top on success for mobile visibility
    useEffect(() => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
        
        const successElement = document.getElementById('qualified-success-message');
        if (successElement) {
          successElement.focus({ preventScroll: true });
        }
      }, 200);
    }, []);
    
    return (
      <div id="qualified-success-message" tabIndex={-1} className="w-full max-w-[692px] mx-auto flex flex-col gap-6 sm:gap-8 text-center px-4 sm:px-6 md:px-0 outline-none">
        <div className="flex flex-col items-center gap-6">
          {/* Success Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" className="sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-3 sm:space-y-4">
            <H2 className="text-[#22C55E] text-xl sm:text-2xl md:text-3xl">Agent Qualification Submitted!</H2>
            <P1 className="max-w-lg mx-auto text-sm sm:text-base">
              Thank you for your agent qualification application. Our team will review your submission and get back to you within 48 hours.
            </P1>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
            <H3 className="text-green-800 mb-3">What happens next?</H3>
            <div className="space-y-2 text-left">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">1.</span>
                <span className="text-green-700 text-sm">We'll review your qualifications and experience</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">2.</span>
                <span className="text-green-700 text-sm">Our agent success team will contact you</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">3.</span>
                <span className="text-green-700 text-sm">We'll schedule an interview and onboarding</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button 
              variant="secondary" 
              onClick={() => reset()}
              size="lg"
            >
              Submit Another Application
            </Button>
            <Button 
              variant="primary" 
              href="/"
              size="lg"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile-optimized error message component
  const ErrorMessage = () => {
    const handleContactSupport = () => {
      window.open('mailto:agents@realtechee.com?subject=Get Qualified Form Issue&body=I encountered an issue submitting the get qualified form. Please assist.', '_blank');
    };
    
    const getErrorInfo = (error: any) => {
      if (!error) return {
        type: 'general',
        message: 'Something went wrong with your qualification application. Please try again or contact us for assistance.'
      };
      
      if (error.message?.includes('Authentication') || error.message?.includes('auth')) {
        return {
          type: 'auth',
          message: 'Authentication is required to submit the form. Please check your login status.'
        };
      }
      
      return {
        type: 'general',
        message: 'Something went wrong with your qualification application. Please try again or contact us for assistance.'
      };
    };
    
    const errorInfo = getErrorInfo(errorDetails);
    
    return (
      <div className="w-full max-w-[692px] mx-auto flex flex-col gap-6 px-4 sm:px-6 md:px-0">
        <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
          {/* Error Icon and Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg width="28" height="28" className="sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <H3 className="text-red-800 mb-2 text-lg sm:text-xl">
              {errorInfo.type === 'auth' ? 'Authentication Required' : 'Application Failed to Submit'}
            </H3>
            <P1 className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">
              {errorInfo.message}
            </P1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="primary" 
              onClick={() => reset()}
              size="lg"
            >
              Try Again
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleContactSupport}
              size="lg"
            >
              Contact Agent Support
            </Button>
          </div>
          
          {/* Support Information */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-red-200 text-center">
            <P1 className="text-red-600 text-xs sm:text-sm mb-2">Need immediate assistance?</P1>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <a href="tel:+15551234567" className="text-red-700 hover:text-red-800 font-medium">
                📞 Call (555) 123-4567
              </a>
              <span className="hidden sm:inline text-red-400">•</span>
              <a href="mailto:agents@realtechee.com" className="text-red-700 hover:text-red-800 font-medium">
                ✉️ agents@realtechee.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced form component with mobile loading overlay
  const formComponent = (() => {
    if (status === 'success') return <SuccessMessage />;
    if (status === 'error') return <ErrorMessage />;
    
    return (
      <div className="relative">
        <GetQualifiedForm 
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
        />
        
        {/* Mobile-optimized loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <H3 className="text-gray-800 mb-2">Submitting your application...</H3>
              <P1 className="text-gray-600 text-sm">This may take a few seconds</P1>
            </div>
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        pageKey="get-qualified"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://realtechee.com/contact/get-qualified#webpage',
          name: 'Property Qualification Services - RealTechee',
          description: 'Get qualified for property investments with RealTechee. Professional assessment and training for real estate agents and investors.',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://realtechee.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Contact',
                item: 'https://realtechee.com/contact'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Get Qualified',
                item: 'https://realtechee.com/contact/get-qualified'
              }
            ]
          },
          mainEntity: {
            '@type': 'EducationalOrganization',
            name: 'RealTechee Training Programs',
            description: 'Professional real estate training and qualification programs',
            offers: {
              '@type': 'Course',
              name: 'Real Estate Agent Training',
              description: 'Learn how RealTechee can help you win more listings and sell faster',
              provider: {
                '@type': 'Organization',
                name: 'RealTechee'
              }
            }
          }
        }}
      />

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.QUALIFIED} />
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

export default GetQualified;
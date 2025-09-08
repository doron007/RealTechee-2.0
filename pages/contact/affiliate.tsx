import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { AffiliateInquiryForm, InquirySuccessMessage, FormErrorMessage } from '../../components/forms';
import { useFormSubmission } from '../../hooks';
import Button from '../../components/common/buttons/Button';
import H2 from '../../components/typography/H2';
import H3 from '../../components/typography/H3';
import P1 from '../../components/typography/P1';
import logger from '../../lib/logger';
import SEOHead from '../../components/seo/SEOHead';
import { createProperties, createContacts, createAffiliates, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';
import { signalEmitter } from '../../services/notifications/signalEmitter';
import { client } from '../../utils/amplifyAPI';

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

      // Step 5: Emit signal for affiliate notification processing
      logger.info('Step 5: Emitting signal for affiliate submission');
      
      try {
        const signalResult = await signalEmitter.emitFormSubmission('affiliate', {
          // Company Information
          companyName: formData.companyName,
          serviceType: formData.serviceType,
          
          // Contact Information
          contactName: formData.contactInfo.fullName,
          contactEmail: formData.contactInfo.email,
          contactPhone: formData.contactInfo.phone,
          
          // Address Information
          address: {
            streetAddress: formData.address.streetAddress,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.zip
          },
          
          // General Contractor Specific Fields (if applicable)
          ...(formData.serviceType === 'General Contractor' && formData.generalContractorInfo ? {
            workersCompensationInsurance: formData.generalContractorInfo.workersCompensation,
            contractorLicense: formData.generalContractorInfo.license,
            environmentalFactorCompliance: formData.generalContractorInfo.environmentalFactor,
            oshaCompliance: formData.generalContractorInfo.oshaCompliance,
            signedNDA: formData.generalContractorInfo.signedNDA,
            safetyPlanInPlace: formData.generalContractorInfo.safetyPlan,
            numberOfEmployees: formData.generalContractorInfo.numberOfEmployees
          } : {}),
          
          // System Information
          submissionId: affiliateData.id,
          submissionTimestamp: new Date().toISOString(),
          dashboardUrl: `${window.location.origin}/admin/affiliates/${affiliateData.id}`,
          serviceDescription: `${formData.serviceType} services from ${formData.companyName}`
        }, { 
          urgency: 'low', 
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

  // Mobile-optimized success message component
  const SuccessMessage = () => {
    // Auto-scroll to top on success for mobile visibility
    useEffect(() => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
        
        const successElement = document.getElementById('affiliate-success-message');
        if (successElement) {
          successElement.focus({ preventScroll: true });
        }
      }, 200);
    }, []);
    
    return (
      <div id="affiliate-success-message" tabIndex={-1} className="w-full max-w-[692px] mx-auto flex flex-col gap-6 sm:gap-8 text-center px-4 sm:px-6 md:px-0 outline-none">
        <div className="flex flex-col items-center gap-6">
          {/* Success Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" className="sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-3 sm:space-y-4">
            <H2 className="text-[#22C55E] text-xl sm:text-2xl md:text-3xl">Partnership Inquiry Submitted!</H2>
            <P1 className="max-w-lg mx-auto text-sm sm:text-base">
              Thank you for your interest in partnering with RealTechee. Our partnerships team will review your inquiry and get back to you within 48 hours.
            </P1>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
            <H3 className="text-green-800 mb-3">What happens next?</H3>
            <div className="space-y-2 text-left">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">1.</span>
                <span className="text-green-700 text-sm">We'll review your partnership proposal</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">2.</span>
                <span className="text-green-700 text-sm">Our partnerships team will contact you</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">3.</span>
                <span className="text-green-700 text-sm">We'll schedule a partnership discussion</span>
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
              Submit Another Inquiry
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
      window.open('mailto:partnerships@realtechee.com?subject=Affiliate Form Issue&body=I encountered an issue submitting the affiliate inquiry form. Please assist.', '_blank');
    };
    
    const getErrorInfo = (error: any) => {
      if (!error) return {
        type: 'general',
        message: 'Something went wrong with your partnership inquiry. Please try again or contact us for assistance.'
      };
      
      if (error.message?.includes('Authentication') || error.message?.includes('auth')) {
        return {
          type: 'auth',
          message: 'Authentication is required to submit the form. Please check your login status.'
        };
      }
      
      return {
        type: 'general',
        message: 'Something went wrong with your partnership inquiry. Please try again or contact us for assistance.'
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
              {errorInfo.type === 'auth' ? 'Authentication Required' : 'Partnership Inquiry Failed'}
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
              Contact Partnerships
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
              <a href="mailto:partnerships@realtechee.com" className="text-red-700 hover:text-red-800 font-medium">
                ✉️ partnerships@realtechee.com
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
        <AffiliateInquiryForm 
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
        />
        
        {/* Mobile-optimized loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <H3 className="text-gray-800 mb-2">Submitting your inquiry...</H3>
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
        pageKey="affiliate"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://realtechee.com/contact/affiliate#webpage',
          name: 'RealTechee Affiliate Program - Partnership Opportunities',
          description: 'Join the RealTechee affiliate program. Partner with us to offer property valuation and real estate technology services.',
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
                name: 'Affiliate Program',
                item: 'https://realtechee.com/contact/affiliate'
              }
            ]
          },
          mainEntity: {
            '@type': 'PartnershipProgram',
            name: 'RealTechee Affiliate Program',
            description: 'Partnership opportunities for service providers and contractors in the real estate technology space',
            provider: {
              '@type': 'Organization',
              name: 'RealTechee'
            }
          }
        }}
      />

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
import type { NextPage } from 'next';
import { useState } from 'react';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { GetEstimateForm } from '../../components/forms/GetEstimateForm';
import Button from '../../components/common/buttons/Button';
import H2 from '../../components/typography/H2';
import H3 from '../../components/typography/H3';
import P1 from '../../components/typography/P1';
import logger from '../../lib/logger';
import SEOHead from '../../components/seo/SEOHead';
import { createProperties, createContacts, createRequests, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';
import { signalEmitter } from '../../services/signalEmitter';
import { assignmentService } from '../../services/assignmentService';
import { client } from '../../utils/amplifyAPI';

const GetEstimate: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.ESTIMATE];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionData, setSubmissionData] = useState<{requestId?: string; submittedAt?: string}>({});
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  
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

  // Enhanced user-aware audit logging
  const logPropertyAudit = (recordId: string, data: any, action: 'create' | 'update' = 'create') => 
    auditWithUser[action === 'create' ? 'logCreate' : 'logUpdate'](
      'Properties', recordId, data, 'get_estimate_form', 'property_from_estimate'
    );
  
  const logContactAudit = (recordId: string, newData: any, oldData?: any) => 
    auditWithUser[oldData ? 'logUpdate' : 'logCreate'](
      'Contacts', recordId, oldData || newData, newData, 'get_estimate_form', 'contact_from_estimate'
    );
  
  const logRequestAudit = (recordId: string, data: any) => 
    auditWithUser.logFormSubmission('Requests', recordId, data, 'get_estimate');

  // Enhanced submission handler with step-by-step processing and deduplication
  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      logger.info('=== FORM SUBMISSION STARTED ===', {
        timestamp: new Date().toISOString(),
        formData: {
          relationToProperty: formData.relationToProperty,
          propertyAddress: formData.propertyAddress,
          homeownerInfo: formData.homeownerInfo,
          agentInfo: formData.agentInfo,
          needFinance: formData.needFinance,
          rtDigitalSelection: formData.rtDigitalSelection,
          requestedVisitDateTime: formData.requestedVisitDateTime,
          uploadedFilesCount: formData.uploadedMedia?.length || 0,
          notes: formData.notes
        }
      });

      // Step 1: Validate form data completeness and get user context
      logger.info('Step 1: Validating form data completeness and capturing user context');
      if (!formData.relationToProperty || !formData.propertyAddress?.streetAddress || 
          !formData.agentInfo?.fullName || !formData.agentInfo?.email || !formData.agentInfo?.phone) {
        throw new Error('Required fields are missing (agent info now required)');
      }
      
      // Get current user for record ownership
      const recordOwner = await getRecordOwner();
      logger.info('Step 1: ✅ Form validation passed (agent-first logic)', { recordOwner });

      // Step 2: Process uploaded files (already in S3)
      logger.info('Step 2: Processing uploaded files', {
        filesCount: formData.uploadedMedia?.length || 0,
        files: formData.uploadedMedia?.map((f: any) => ({
          name: f.name,
          category: f.category,
          size: f.size,
          url: f.url
        })) || []
      });
      
      // Organize files by category for database storage
      const mediaFiles = formData.uploadedMedia?.filter((f: any) => f.category === 'images') || [];
      const videoFiles = formData.uploadedMedia?.filter((f: any) => f.category === 'videos') || [];
      const docFiles = formData.uploadedMedia?.filter((f: any) => f.category === 'docs') || [];
      
      logger.info('Step 2: ✅ Files organized by category', {
        imageCount: mediaFiles.length,
        videoCount: videoFiles.length,
        docCount: docFiles.length
      });

      // Step 3: Find or Create Property record
      logger.info('Step 3: Finding or creating Property record');
      
      const fullAddress = `${formData.propertyAddress.streetAddress}, ${formData.propertyAddress.city}, ${formData.propertyAddress.state} ${formData.propertyAddress.zip}`;
      const normalizedSearchAddress = normalizeAddress(
        formData.propertyAddress.streetAddress,
        formData.propertyAddress.city,
        formData.propertyAddress.state,
        formData.propertyAddress.zip
      );
      
      // Search for existing property
      logger.info('Step 3a: Searching for existing property');
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
        logger.info('Step 3b: ✅ Using existing property', { 
          propertyId: existingProperty.id,
          address: existingProperty.propertyFullAddress 
        });
        propertyData = existingProperty;
      } else {
        logger.info('Step 3b: Creating new property');
        const propertyInput = {
          propertyFullAddress: fullAddress,
          houseAddress: formData.propertyAddress.streetAddress,
          city: formData.propertyAddress.city,
          state: formData.propertyAddress.state,
          zip: formData.propertyAddress.zip,
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
        
        logger.info('Step 3b: ✅ New property created', { propertyData: cleanPropertyData });
      }

      // Step 4: Handle Contact Creation Logic
      logger.info('Step 4: Processing contact information with agent-first logic');
      
      // Agent info is now always required, homeowner info is optional
      const hasAgentInfo = formData.agentInfo && formData.agentInfo.email; // Always should be true now
      const hasHomeownerInfo = formData.homeownerInfo?.email;
      const emailsMatch = hasAgentInfo && hasHomeownerInfo && 
        formData.agentInfo.email.toLowerCase().trim() === formData.homeownerInfo.email.toLowerCase().trim();

      logger.info('Step 4a: Contact analysis', {
        hasAgentInfo: !!hasAgentInfo,
        hasHomeownerInfo: !!hasHomeownerInfo,
        emailsMatch: !!emailsMatch,
        agentEmail: hasAgentInfo ? formData.agentInfo.email : 'N/A',
        homeownerEmail: hasHomeownerInfo ? formData.homeownerInfo.email : 'N/A'
      });
      
      let homeownerData = null;
      let agentData = null;
      let primaryContactId = null;

      if (emailsMatch) {
        // Case 1: Agent and homeowner emails match - create only agent contact
        logger.info('Step 4b: Emails match - creating single contact as agent');
        
        const contactEmail = formData.agentInfo.email.toLowerCase().trim();
        
        // Search for existing contact by email (case-insensitive, trimmed)
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

        const agentContactData = {
          fullName: formData.agentInfo.fullName,
          firstName: formData.agentInfo.fullName.split(' ')[0],
          lastName: formData.agentInfo.fullName.split(' ').slice(1).join(' ') || '',
          email: formData.agentInfo.email.toLowerCase().trim(),
          phone: formData.agentInfo.phone,
          brokerage: formData.agentInfo.brokerage,
              // updatedAt is automatically managed by Amplify
          owner: recordOwner
        };

        const existingContact = existingContactResponse.data.listContacts.items[0];

        if (existingContact) {
          logger.info('Step 4c: Updating existing contact (agent priority)', { 
            contactId: existingContact.id,
            email: existingContact.email
          });
          
          const { __typename, createdAt, updatedAt, ...cleanExistingData } = existingContact;
          
          const contactResponse = await client.graphql({
            query: updateContacts,
            variables: { 
              input: {
                id: existingContact.id,
                ...agentContactData
              }
            }
          });
          
          agentData = contactResponse.data.updateContacts;
          primaryContactId = agentData.id;
          
          await logContactAudit(existingContact.id, agentContactData, cleanExistingData);
        } else {
          logger.info('Step 4c: Creating new contact (agent priority)');
          
          const contactResponse = await client.graphql({
            query: createContacts,
            variables: { 
              input: {
                ...agentContactData
              // createdAt is automatically managed by Amplify
              }
            }
          });
          
          agentData = contactResponse.data.createContacts;
          primaryContactId = agentData.id;
          
          await logContactAudit(agentData.id, agentContactData);
        }

        logger.info('Step 4d: ✅ Single contact created/updated for matching emails', { 
          contactId: primaryContactId,
          email: contactEmail
        });

      } else {
        // Case 2: Different emails or missing homeowner info - create separate contacts
        
        // Handle Agent Contact (if applicable)
        if (hasAgentInfo) {
          logger.info('Step 4b: Processing agent contact');
          
          const existingAgentResponse = await client.graphql({
            query: listContacts,
            variables: {
              filter: {
                email: {
                  eq: formData.agentInfo.email.toLowerCase().trim()
                }
              }
            }
          });

          const agentContactData = {
            fullName: formData.agentInfo.fullName,
            firstName: formData.agentInfo.fullName.split(' ')[0],
            lastName: formData.agentInfo.fullName.split(' ').slice(1).join(' ') || '',
            email: formData.agentInfo.email.toLowerCase().trim(),
            phone: formData.agentInfo.phone,
            brokerage: formData.agentInfo.brokerage,
              // updatedAt is automatically managed by Amplify
            owner: recordOwner
          };

          const existingAgent = existingAgentResponse.data.listContacts.items[0];

          if (existingAgent) {
            const { __typename, createdAt, updatedAt, ...cleanExistingData } = existingAgent;
            
            const agentResponse = await client.graphql({
              query: updateContacts,
              variables: { 
                input: {
                  id: existingAgent.id,
                  ...agentContactData
                }
              }
            });
            
            agentData = agentResponse.data.updateContacts;
            
            await logContactAudit(existingAgent.id, agentContactData, cleanExistingData);
          } else {
            const agentResponse = await client.graphql({
              query: createContacts,
              variables: { 
                input: {
                  ...agentContactData
              // createdAt is automatically managed by Amplify
                }
              }
            });
            
            agentData = agentResponse.data.createContacts;
            
            await logContactAudit(agentData.id, agentContactData);
          }

          logger.info('Step 4c: ✅ Agent contact processed', { 
            contactId: agentData.id,
            email: formData.agentInfo.email
          });
        }

        // Handle Homeowner Contact (if provided and different email)
        if (hasHomeownerInfo && !emailsMatch) {
          logger.info('Step 4d: Processing homeowner contact');
          
          const existingHomeownerResponse = await client.graphql({
            query: listContacts,
            variables: {
              filter: {
                email: {
                  eq: formData.homeownerInfo.email.toLowerCase().trim()
                }
              }
            }
          });

          const homeownerContactData = {
            fullName: formData.homeownerInfo.fullName,
            firstName: formData.homeownerInfo.fullName.split(' ')[0],
            lastName: formData.homeownerInfo.fullName.split(' ').slice(1).join(' ') || '',
            email: formData.homeownerInfo.email.toLowerCase().trim(),
            phone: formData.homeownerInfo.phone,
              // updatedAt is automatically managed by Amplify
            owner: recordOwner
          };

          const existingHomeowner = existingHomeownerResponse.data.listContacts.items[0];

          if (existingHomeowner) {
            const { __typename, createdAt, updatedAt, ...cleanExistingData } = existingHomeowner;
            
            const homeownerResponse = await client.graphql({
              query: updateContacts,
              variables: { 
                input: {
                  id: existingHomeowner.id,
                  ...homeownerContactData
                }
              }
            });
            
            homeownerData = homeownerResponse.data.updateContacts;
            
            await logContactAudit(existingHomeowner.id, homeownerContactData, cleanExistingData);
          } else {
            const homeownerResponse = await client.graphql({
              query: createContacts,
              variables: { 
                input: {
                  ...homeownerContactData
              // createdAt is automatically managed by Amplify
                }
              }
            });
            
            homeownerData = homeownerResponse.data.createContacts;
            
            await logContactAudit(homeownerData.id, homeownerContactData);
          }

          logger.info('Step 4e: ✅ Homeowner contact processed', { 
            contactId: homeownerData.id,
            email: formData.homeownerInfo.email
          });
        }
      }

      // Step 5: Create Request record
      logger.info('Step 5: Creating Request record with updated contact logic');
      
      // Determine contact IDs based on the logic above
      const finalHomeownerContactId = emailsMatch ? null : (homeownerData?.id || null);
      const finalAgentContactId = agentData?.id || null;
      
      logger.info('Step 5a: Request contact mapping', {
        emailsMatch,
        finalHomeownerContactId,
        finalAgentContactId,
        strategy: emailsMatch ? 'agent-only' : 'separate-contacts'
      });
      
      // Detect test/automation context and mark accordingly
      const isTestSubmission = typeof window !== 'undefined' && (
        window.location.search.includes('test=true') ||
        window.navigator.userAgent.includes('HeadlessChrome') ||
        window.navigator.userAgent.includes('Playwright') ||
        formData.agentInfo?.email?.includes('test') ||
        formData.agentInfo?.fullName?.toLowerCase().includes('test')
      );
      
      const testSessionId = isTestSubmission ? `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;
      
      logger.info('Step 5a: Test detection result', {
        isTestSubmission,
        testSessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        searchParams: typeof window !== 'undefined' ? window.location.search : 'server'
      });
      
      const requestInput = {
        message: formData.notes || '',
        relationToProperty: formData.relationToProperty,
        needFinance: formData.needFinance,
        rtDigitalSelection: formData.rtDigitalSelection,
        requestedVisitDateTime: formData.requestedVisitDateTime || null,
        leadSource: isTestSubmission ? 'E2E_TEST' : 'Website', // Use existing leadSource field for test marking
        assignedTo: 'Unassigned',
        status: 'New',
        
        // Add test session ID to officeNotes if this is a test (using existing field)
        officeNotes: isTestSubmission ? `TEST_SESSION: ${testSessionId}` : '',
        
        // File URLs as JSON strings (matching schema)
        uploadedMedia: JSON.stringify(mediaFiles.map((f: any) => f.url)),
        uplodedDocuments: JSON.stringify(docFiles.map((f: any) => f.url)), // Note: typo in schema
        uploadedVideos: JSON.stringify(videoFiles.map((f: any) => f.url)),
        
        // Foreign keys - agent priority logic applied
        addressId: propertyData.id,
        homeownerContactId: finalHomeownerContactId, // null if emails match
        agentContactId: finalAgentContactId, // primary contact when emails match
        
        // System fields with proper user attribution
              // createdAt/updatedAt are automatically managed by Amplify
        owner: recordOwner
      };
      
      const requestResponse = await client.graphql({
        query: createRequests,
        variables: { input: requestInput }
      });
      
      const requestData = requestResponse.data.createRequests;
      // Remove __typename from logged data for cleaner output
      const { __typename: _r, ...cleanRequestData } = requestData;
      
      // Audit log for request creation with user context
      await logRequestAudit(requestData.id, cleanRequestData);
      
      logger.info('Step 5b: ✅ Request record created', { requestData: cleanRequestData });

      // Step 5c: Auto-assign AE to request
      try {
        logger.info('Step 5c: Attempting auto-assignment of AE');
        
        const assignmentResult = await assignmentService.assignDefaultAE(requestData.id);
        if (assignmentResult.success) {
          logger.info('Step 5c: ✅ AE auto-assigned successfully', {
            assignedTo: assignmentResult.assignedTo,
            reason: assignmentResult.reason
          });
        } else {
          logger.warn('Step 5c: ⚠️ AE auto-assignment failed (continuing)', {
            error: assignmentResult.error
          });
        }
      } catch (assignmentError) {
        // Don't fail the form submission if assignment fails
        logger.error('Step 5c: ⚠️ AE assignment error (continuing)', {
          error: assignmentError instanceof Error ? assignmentError.message : String(assignmentError)
        });
      }

      // Step 5d: Emit signal for notification processing
      try {
        logger.info('Step 5d: Emitting signal for get estimate submission');
        
        const signalResult = await signalEmitter.emitFormSubmission('get_estimate', {
          // Agent Information (primary contact)
          customerName: agentData?.fullName || formData.agentInfo.fullName,
          customerEmail: agentData?.email || formData.agentInfo.email,
          customerPhone: agentData?.phone || formData.agentInfo.phone,
          agentFullName: agentData?.fullName || formData.agentInfo.fullName,
          agentEmail: agentData?.email || formData.agentInfo.email,
          agentPhone: agentData?.phone || formData.agentInfo.phone,
          agentBrokerage: agentData?.brokerage || formData.agentInfo.brokerage,
          
          // Homeowner Information (optional)
          homeownerFullName: homeownerData?.fullName || formData.homeownerInfo?.fullName || '',
          homeownerEmail: homeownerData?.email || formData.homeownerInfo?.email || '',
          homeownerPhone: homeownerData?.phone || formData.homeownerInfo?.phone || '',
          
          // Property Information
          propertyAddress: `${formData.propertyAddress.streetAddress}, ${formData.propertyAddress.city}, ${formData.propertyAddress.state} ${formData.propertyAddress.zip}`,
          propertyStreetAddress: formData.propertyAddress.streetAddress,
          propertyCity: formData.propertyAddress.city,
          propertyState: formData.propertyAddress.state,
          propertyZip: formData.propertyAddress.zip,
          
          // Project Information
          relationToProperty: formData.relationToProperty,
          needFinance: formData.needFinance,
          projectType: formData.rtDigitalSelection || 'General Renovation',
          projectMessage: formData.notes || 'No additional notes provided',
          
          // Meeting Information
          meetingType: formData.rtDigitalSelection,
          meetingDateTime: formData.requestedVisitDateTime || '',
          requestedVisitDateTime: formData.requestedVisitDateTime || '',
          
          // File Upload Information (matching schema field names)
          uploadedMedia: JSON.stringify(mediaFiles.map((f: any) => f.url)),
          uplodedDocuments: JSON.stringify(docFiles.map((f: any) => f.url)), // Note: keeping typo to match schema
          uploadedVideos: JSON.stringify(videoFiles.map((f: any) => f.url)),
          
          // System Information
          submissionId: requestData.id,
          submissionTimestamp: new Date().toISOString(),
          dashboardUrl: `${window.location.origin}/admin/requests/${requestData.id}`
        }, { 
          urgency: 'high', // Changed to high for estimate requests
          testMode: isTestSubmission 
        });
        
        if (signalResult.success) {
          logger.info('Step 5d: ✅ Signal emitted successfully', {
            signalId: signalResult.signalId,
            timestamp: signalResult.timestamp
          });
        } else {
          logger.warn('Step 5d: ⚠️ Signal emission failed', {
            error: signalResult.error
          });
        }
      } catch (signalError) {
        // Don't fail the entire form submission if signal emission fails
        logger.error('Step 5d: ❌ Signal emission error', {
          error: signalError instanceof Error ? signalError.message : String(signalError)
        });
      }

      // Step 6: Success
      logger.info('=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===', {
        timestamp: new Date().toISOString(),
        strategy: emailsMatch ? 'single-contact-agent-priority' : 'separate-contacts',
        summary: {
          propertyId: propertyData.id,
          homeownerContactId: finalHomeownerContactId || 'null (emails matched)',
          agentContactId: finalAgentContactId || 'N/A',
          requestId: requestData.id,
          filesProcessed: formData.uploadedMedia?.length || 0,
          emailStrategy: emailsMatch ? 'merged_as_agent' : 'separate_emails'
        }
      });
      
      // Store submission data for success message
      setSubmissionData({
        requestId: requestData.id,
        submittedAt: new Date().toISOString()
      });
      
      setSubmitStatus('success');
      
      // Scroll to top to show success message
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error) || 'Unknown error');
      
      logger.error('=== FORM SUBMISSION FAILED ===', { 
        timestamp: new Date().toISOString(),
        error: errorObj.message,
        stack: errorObj.stack
      });
      
      setSubmitStatus('error');
      setErrorDetails(errorObj);
      
      // Don't auto-reset errors - keep them persistent for better UX
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message component that replaces the form
  const SuccessMessage = () => (
    <div className="w-[692px] flex flex-col gap-8 text-center">
      <div className="flex flex-col items-center gap-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <H2 className="text-[#22C55E]">Request Submitted Successfully!</H2>
          <P1 className="max-w-lg mx-auto">
            Thank you for your estimate request. Our team at RealTechee will review your submission and connect back with you within 24 hours to discuss your project and schedule the next steps.
          </P1>
          
          {/* Request Details */}
          {submissionData.requestId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Request ID:</span>
                  <span className="font-mono text-gray-800">{submissionData.requestId.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Submitted:</span>
                  <span className="text-gray-800">
                    {submissionData.submittedAt ? new Date(submissionData.submittedAt).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Response Time:</span>
                  <span className="text-green-600 font-medium">Within 24 hours</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 w-full max-w-md mx-auto">
          <H3 className="text-green-800 mb-3">What happens next?</H3>
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">1.</span>
              <span className="text-green-700 text-sm">We'll review your project details</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">2.</span>
              <span className="text-green-700 text-sm">Our team will contact you within 24 hours</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-600 font-bold">3.</span>
              <span className="text-green-700 text-sm">We'll schedule your consultation or walkthrough</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            variant="secondary" 
            onClick={() => {
              setSubmitStatus('idle');
              setSubmissionData({});
            }}
            size="lg"
          >
            Submit Another Request
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

  // Enhanced error message component with better UX
  const ErrorMessage = () => {
    const resetForm = () => {
      setSubmitStatus('idle');
      setErrorDetails(null);
    };
    
    const handleContactSupport = () => {
      window.open('mailto:support@realtechee.com?subject=Get Estimate Form Issue&body=I encountered an issue submitting the get estimate form. Please assist.', '_blank');
    };
    
    // Parse error for better messaging
    const getErrorInfo = (error: Error | null) => {
      if (!error) return { type: 'general', message: 'An unexpected error occurred. Please try again or contact support.' };
      
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('federated jwt') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        return {
          type: 'auth',
          message: 'Authentication required. Please log in to submit forms or contact us directly.'
        };
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
        return {
          type: 'network',
          message: 'Network connection issue. Please check your internet connection and try again.'
        };
      }
      
      if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
        return {
          type: 'validation',
          message: 'Please check your form fields and ensure all required information is provided correctly.'
        };
      }
      
      if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
        return {
          type: 'server',
          message: 'Our servers are experiencing issues. Please try again in a few minutes or contact us directly.'
        };
      }
      
      return {
        type: 'general',
        message: 'Something went wrong with your estimate request. Please try again or contact us for assistance.'
      };
    };
    
    const errorInfo = getErrorInfo(errorDetails);
    
    return (
      <div className="w-[692px] flex flex-col gap-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          {/* Error Icon and Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <H3 className="text-red-800 mb-2">
              {errorInfo.type === 'auth' ? 'Authentication Required' : 'Estimate Request Failed'}
            </H3>
            <P1 className="text-red-700 mb-4">
              {errorInfo.message}
            </P1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="primary" 
              onClick={resetForm}
              size="lg"
            >
              Try Again
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleContactSupport}
              size="lg"
            >
              Contact Support
            </Button>
          </div>
          
          {/* Support Information */}
          <div className="mt-6 pt-4 border-t border-red-200 text-center">
            <P1 className="text-red-600 text-sm mb-2">Need immediate assistance?</P1>
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
              <a href="tel:+15551234567" className="text-red-700 hover:text-red-800 font-medium">
                📞 Call (555) 123-4567
              </a>
              <span className="hidden sm:inline text-red-400">•</span>
              <a href="mailto:support@realtechee.com" className="text-red-700 hover:text-red-800 font-medium">
                ✉️ support@realtechee.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Form component with status handling
  const formComponent = (() => {
    if (submitStatus === 'success') return <SuccessMessage />;
    if (submitStatus === 'error') return <ErrorMessage />;
    
    return (
      <GetEstimateForm 
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    );
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        pageKey="get-estimate"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://realtechee.com/contact/get-estimate#webpage',
          name: 'Get Property Renovation Estimate - RealTechee',
          description: 'Request a free property renovation estimate from RealTechee experts. Get detailed cost analysis and consultation within 24 hours.',
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
                name: 'Get Estimate',
                item: 'https://realtechee.com/contact/get-estimate'
              }
            ]
          },
          mainEntity: {
            '@type': 'Service',
            name: 'Property Renovation Estimate',
            description: 'Professional property renovation cost estimation and planning service',
            serviceType: 'Real Estate Valuation',
            provider: {
              '@type': 'Organization',
              name: 'RealTechee'
            },
            offers: {
              '@type': 'Offer',
              description: 'Free property renovation estimate with detailed cost analysis',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              deliveryLeadTime: {
                '@type': 'QuantitativeValue',
                value: 1,
                unitCode: 'DAY'
              }
            },
            areaServed: {
              '@type': 'Country',
              name: 'United States'
            }
          }
        }}
      />

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.ESTIMATE} />
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

export default GetEstimate;
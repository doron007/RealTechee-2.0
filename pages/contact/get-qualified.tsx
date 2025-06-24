import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';
import { GetQualifiedForm, InquirySuccessMessage, FormErrorMessage } from '../../components/forms';
import { useFormSubmission } from '../../hooks';
import logger from '../../lib/logger';
import { generateClient } from 'aws-amplify/api';
import { createProperties, createContacts, createContactUs, updateContacts } from '../../mutations';
import { listProperties, listContacts } from '../../queries';
import { auditWithUser } from '../../lib/auditLogger';
import { getRecordOwner } from '../../lib/userContext';

const GetQualified: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.QUALIFIED];
  
  // Use reusable form submission hook
  const { 
    status, 
    isSubmitting, 
    handleSubmission, 
    reset 
  } = useFormSubmission({
    formName: 'Get Qualified',
    scrollToTopOnSuccess: true,
    errorResetDelay: 5000
  });
  
  // Initialize Amplify GraphQL client
  const client = generateClient();

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
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
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
        updatedDate: new Date().toISOString(),
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
              ...contactData,
              createdDate: new Date().toISOString()
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
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
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

      // Step 5: Success
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

  // Form component with status handling using reusable components
  const formComponent = (() => {
    if (status === 'success') return <InquirySuccessMessage onReset={reset} />;
    if (status === 'error') return <FormErrorMessage onRetry={reset} />;
    
    return (
      <GetQualifiedForm 
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    );
  })();

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Get Qualified - Contact Us</title>
        <meta name="description" content="Real Estate agents - schedule your training session to learn how RealTechee can help you win more listings and sell faster." />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

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
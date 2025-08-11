/**
 * Debug script to simulate exact form submission and catch errors
 */

const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/api');

// Use production config
const outputs = require('./amplify_outputs.json');

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: outputs.data.url,
      region: outputs.data.aws_region,
      defaultAuthMode: "apiKey",
      apiKey: outputs.data.api_key
    }
  }
});

const client = generateClient({ authMode: 'apiKey' });

// Import the mutations directly as they would be in the frontend
const createProperties = `mutation CreateProperties($input: CreatePropertiesInput!) {
  createProperties(input: $input) {
    id
    propertyFullAddress
    houseAddress
    city
    state
    zip
    owner
    createdAt
    updatedAt
  }
}`;

const createContacts = `mutation CreateContacts($input: CreateContactsInput!) {
  createContacts(input: $input) {
    id
    fullName
    firstName
    lastName
    email
    phone
    owner
    createdAt
    updatedAt
  }
}`;

const createContactUs = `mutation CreateContactUs($input: CreateContactUsInput!) {
  createContactUs(input: $input) {
    id
    submissionTime
    subject
    message
    product
    contactId
    addressId
    owner
    createdAt
    updatedAt
  }
}`;

const createNotificationQueue = `mutation CreateNotificationQueue($input: CreateNotificationQueueInput!) {
  createNotificationQueue(input: $input) {
    id
    eventType
    channels
    payload
    templateId
    recipientIds
    status
    retryCount
    owner
    createdAt
    updatedAt
  }
}`;

async function simulateFormSubmission() {
  const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🐛 Debugging form submission with session: ${sessionId}`);
    
    // Simulate the exact form data structure
    const formData = {
      contactInfo: {
        fullName: 'Debug User Test',
        email: 'debug@realtechee.com',
        phone: '(555) 123-4567'
      },
      address: {
        streetAddress: '123 Debug Street',
        city: 'Debug City',
        state: 'CA',
        zip: '90210'
      },
      product: 'Kitchen Renovation',
      subject: 'Debug Form Submission',
      message: `Debug message for session ${sessionId} to test form submission flow.`
    };
    
    console.log('\n📍 Step 1: Creating property...');
    const propertyResult = await client.graphql({
      query: createProperties,
      variables: {
        input: {
          propertyFullAddress: `${formData.address.streetAddress}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip}`,
          houseAddress: formData.address.streetAddress,
          city: formData.address.city,
          state: formData.address.state,
          zip: formData.address.zip,
          owner: 'debug-session'
        }
      }
    });
    console.log('✅ Property created:', propertyResult.data.createProperties.id);
    
    console.log('\n👤 Step 2: Creating contact...');
    const contactResult = await client.graphql({
      query: createContacts,
      variables: {
        input: {
          fullName: formData.contactInfo.fullName,
          firstName: formData.contactInfo.fullName.split(' ')[0],
          lastName: formData.contactInfo.fullName.split(' ').slice(1).join(' ') || '',
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          owner: 'debug-session'
        }
      }
    });
    console.log('✅ Contact created:', contactResult.data.createContacts.id);
    
    console.log('\n📧 Step 3: Creating ContactUs record...');
    const contactUsResult = await client.graphql({
      query: createContactUs,
      variables: {
        input: {
          submissionTime: new Date().toISOString(),
          subject: formData.subject,
          message: formData.message,
          product: formData.product,
          contactId: contactResult.data.createContacts.id,
          addressId: propertyResult.data.createProperties.id,
          owner: 'debug-session'
        }
      }
    });
    console.log('✅ ContactUs record created:', contactUsResult.data.createContactUs.id);
    
    console.log('\n🔔 Step 4: Creating notification (this step might fail in production)...');
    try {
      const notificationResult = await client.graphql({
        query: createNotificationQueue,
        variables: {
          input: {
            eventType: 'contact_us_submission',
            templateId: 'contact-us-email-template-001',
            recipientIds: JSON.stringify(['admin-team']),
            channels: JSON.stringify(['EMAIL']),
            payload: JSON.stringify({
              customerName: formData.contactInfo.fullName,
              customerEmail: formData.contactInfo.email,
              customerPhone: formData.contactInfo.phone,
              subject: formData.subject,
              message: formData.message,
              productInterest: formData.product,
              address: formData.address
            }),
            status: 'PENDING',
            retryCount: 0,
            owner: 'debug-session'
          }
        }
      });
      console.log('✅ Notification created:', notificationResult.data.createNotificationQueue.id);
    } catch (notificationError) {
      console.log('❌ Notification creation failed (this could be the issue):', notificationError.message);
      // This should NOT cause the form to fail - it should continue to success
    }
    
    console.log('\n🎉 Form submission completed successfully!');
    console.log('All database records created, form should show success message.');
    
    return {
      success: true,
      propertyId: propertyResult.data.createProperties.id,
      contactId: contactResult.data.createContacts.id,
      contactUsId: contactUsResult.data.createContactUs.id
    };
    
  } catch (error) {
    console.error('\n❌ Form submission failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // This would cause the frontend to show error instead of success
    return { success: false, error: error.message };
  }
}

simulateFormSubmission();
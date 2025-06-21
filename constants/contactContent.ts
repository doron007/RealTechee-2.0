import { ContactType } from '../components/contact';

interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
}

interface ContactPageContent {
  formTitle: string;
  formPlaceholder: string;
  processSteps: ProcessStep[];
}

export const CONTACT_CONTENT: Record<ContactType, ContactPageContent> = {
  [ContactType.MAIN]: {
    formTitle: 'Contact Form',
    formPlaceholder: 'Please select a specific inquiry type above',
    processSteps: []
  },
  
  [ContactType.ESTIMATE]: {
    formTitle: 'Get an Estimate',
    formPlaceholder: 'Will include: Property info, homeowner/agent details, meeting scheduling, file uploads',
    processSteps: [
      {
        stepNumber: 1,
        title: 'Submit Your Request',
        description: 'Start the process by completing this form. Feel free to include photos and videos to assist us in understanding your project better. If needed, a dedicated folder will be provided for easy upload of these files.'
      },
      {
        stepNumber: 2,
        title: 'Connect with an Account Executive',
        description: 'Our expert professionals will reach out to review project specifics with you. We\'ll schedule a complimentary, no-obligation walkthrough to better assess your needs.'
      },
      {
        stepNumber: 3,
        title: 'Walkthrough, Estimate, and Value Addition',
        description: 'During our walkthrough, we\'ll finalize the project scope, focusing on maximizing value based on our deep market insight and experience. Shortly after, you\'ll receive a detailed, free estimate to present to your clients, showcasing the added value we bring to the table.'
      }
    ]
  },
  
  [ContactType.INQUIRY]: {
    formTitle: 'Contact Us',
    formPlaceholder: 'Will include: Contact info, product selection, subject, message',
    processSteps: [
      {
        stepNumber: 1,
        title: 'Begin Your Inquiry',
        description: 'Use this form to initiate your inquiry. Whether you have questions, need advice, or require further information, we\'re here to help. Fill in your details and let us know what you\'re looking for.'
      },
      {
        stepNumber: 2,
        title: 'Personalized Assistance',
        description: 'One of our dedicated team members will reach out to you. We believe in personalized care, so you\'ll be speaking directly with someone who understands your needs. Expect a call or an email from us soon at the contact information you provide.'
      },
      {
        stepNumber: 3,
        title: 'Meet Your Needs',
        description: 'After understanding your specific inquiries or requirements, we\'ll provide tailored solutions, advice, or the information you need. Our goal is to ensure your satisfaction and provide the support necessary for your real estate decisions.'
      }
    ]
  },
  
  [ContactType.QUALIFIED]: {
    formTitle: 'Get Qualified',
    formPlaceholder: 'Will include: Agent contact info, brokerage, meeting scheduling',
    processSteps: [
      {
        stepNumber: 1,
        title: 'Schedule Your Training Now',
        description: 'Submit your Get Qualified form and we will contact you to schedule your training session at your desired time. Sessions can be in person or on Zoom.'
      },
      {
        stepNumber: 2,
        title: 'Training Session',
        description: 'Meet with one of our Business Development Experts for a 30 minute session. During this session we will train and share with you current and completed RealTechee projects that show exactly how we add value.'
      },
      {
        stepNumber: 3,
        title: 'Execute',
        description: 'Win more listings, sell faster and for a higher price, qualify more properties for your buyers, and get more value for your time and effort.'
      }
    ]
  },
  
  [ContactType.AFFILIATE]: {
    formTitle: 'Affiliate Inquiry',
    formPlaceholder: 'Will include: Contact info, company details, service type, contractor qualifications',
    processSteps: [
      {
        stepNumber: 1,
        title: 'Submit Your Interest',
        description: 'Interested in becoming a RealTechee affiliate? Complete this form with your personal and professional details. Share with us what makes you a great fit for our suppliers\' network and how you can contribute to a mutually beneficial partnership.'
      },
      {
        stepNumber: 2,
        title: 'Getting to Know You',
        description: 'Our affiliate team will review your submission to ensure a good fit within our network. We may contact you for additional information or verification of your credentials. You will hear from us within a reasonable time frame as we carefully consider each application.'
      },
      {
        stepNumber: 3,
        title: 'Welcome to the Team',
        description: 'Upon approval, we will provide you with all the necessary information and tools to get started as a RealTechee affiliate. This includes access to our affiliate portal, marketing materials, and a dedicated account manager to support your success in our network.'
      }
    ]
  }
};
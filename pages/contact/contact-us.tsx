import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';

const ContactUs: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.INQUIRY];

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Contact Us - RealTechee</title>
        <meta name="description" content="Have questions or need information? Contact us and our team will get back to you promptly." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.INQUIRY} />
        <ContactContentSection 
          processSteps={content.processSteps}
          formTitle={content.formTitle}
          formPlaceholder={content.formPlaceholder}
        />
        <ContactMapSection />
      </main>
    </div>
  );
};

export default ContactUs;
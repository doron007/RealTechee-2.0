import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';

const GetEstimate: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.ESTIMATE];

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Get an Estimate - Contact Us</title>
        <meta name="description" content="Request a free estimate for your real estate project. Our experts will provide a detailed quote and consultation." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <ContactHeroSection contactType={ContactType.ESTIMATE} />
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

export default GetEstimate;
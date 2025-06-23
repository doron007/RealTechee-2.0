import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';

const Affiliate: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.AFFILIATE];

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
          formPlaceholder={content.formPlaceholder}
        />
        <ContactMapSection />
      </main>
    </div>
  );
};

export default Affiliate;
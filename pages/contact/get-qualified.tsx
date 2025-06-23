import Head from 'next/head';
import type { NextPage } from 'next';
import { ContactHeroSection, ContactContentSection, ContactMapSection, ContactType } from '../../components/contact';
import { CONTACT_CONTENT } from '../../constants/contactContent';

const GetQualified: NextPage = () => {
  const content = CONTACT_CONTENT[ContactType.QUALIFIED];

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
          formPlaceholder={content.formPlaceholder}
        />
        <ContactMapSection />
      </main>
    </div>
  );
};

export default GetQualified;
import Head from 'next/head';
import type { NextPage } from 'next';
import { 
  HeroSection,
  HistorySection,
  MissionSection,
  OperationsSection,
  ExpertiseSection,
  ValuesSection,
  PartnersSection,
  IndustryExpertiseSection
} from '../components/about';
import { CtaSection } from '../components/common/sections';

const About: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>About RealTechee - Our History, Mission & Values</title>
        <meta name="description" content="Learn about RealTechee's mission, history, and values. Discover how we're transforming the real estate industry with innovative technology solutions." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Our History Section */}
        <HistorySection />
        
        {/* Our Mission Section */}
        <MissionSection />
        
        {/* Operations Section */}
        <OperationsSection />
        
        {/* Industry Expertise Section */}
        <IndustryExpertiseSection />
        
        {/* Values Section */}
        <ValuesSection />
        
        {/* Partners Section */}
        <PartnersSection />
        
        {/* CTA Section */}
        <CtaSection
          title="Ready to transform your real estate business?"
          subtitle="Join thousands of professionals who trust RealTechee"
          buttonText="Get Started Today"
          buttonLink="/get-estimate"
        />
      </main>
    </div>
  );
};

export default About;

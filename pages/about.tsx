import type { NextPage } from 'next';
import SEOHead from '../components/seo/SEOHead';
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
    <>
      <SEOHead
        pageKey="about"
        customTitle="About RealTechee - Our History, Mission & Values"
        customDescription="Learn about RealTechee's mission, history, and values. Discover how we're transforming the real estate industry with innovative technology solutions."
      />
      <div>
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
          buttonLink="/contact/get-estimate"
        />
      </div>
    </>
  );
};

export default About;

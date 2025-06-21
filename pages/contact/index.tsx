import React from 'react';
import Layout from '../../components/common/layout/Layout';
import Section from '../../components/common/layout/Section';
import { PageHeader, BodyContent, SectionTitle, SubContent } from '../../components/Typography';
import ContactScenarioSelector from '../../components/contact/ContactScenarioSelector';

export default function ContactPage() {
  return (
    <Layout 
      title="Contact Us" 
      description="Get in touch with the RealTechee team. Choose from our contact options: Get an Estimate, General Inquiry, Get Qualified, or Affiliate Inquiry."
    >
      {/* Hero Section with Background Image */}
      <Section
        id="hero"
        className="flex flex-col justify-center items-center overflow-hidden"
        backgroundImage="/assets/images/hero-bg.png"
        background="none"
        spacing="none"
        constrained={false}
        withOverlay={false}
        marginTop={50}
        marginBottom={50}
        paddingTop={{ default: 50, md: 80, '2xl': 100 }}
        paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
      >
        <div className="flex flex-col sm:items-center text-left sm:text-center">
          <SectionTitle spacing="medium">
            Contact
          </SectionTitle>
          <SubContent spacing="small">
            Please choose the best inquiry category below so we can help you best.
          </SubContent>
          
          {/* Button Row */}
          <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
            <ContactScenarioSelector currentPage="main" />
          </div>
        </div>
      </Section>
    </Layout>
  );
}
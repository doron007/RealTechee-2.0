import React from 'react';
import Layout from '../../components/common/layout/Layout';
import Section from '../../components/common/layout/Section';
import H1 from '../../components/typography/H1';
import P2 from '../../components/typography/P2';
import ContactScenarioSelector from '../../components/contact/ContactScenarioSelector';
import SEOHead from '../../components/seo/SEOHead';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        pageKey="contact"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          '@id': 'https://realtechee.com/contact#webpage',
          name: 'Contact RealTechee - Real Estate Technology Experts',
          description: 'Get in touch with RealTechee for property valuation, renovation estimates, and real estate technology services.',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://realtechee.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Contact',
                item: 'https://realtechee.com/contact'
              }
            ]
          },
          mainEntity: {
            '@type': 'Organization',
            name: 'RealTechee',
            contactPoint: [
              {
                '@type': 'ContactPoint',
                contactType: 'Property Estimates',
                url: 'https://realtechee.com/contact/get-estimate'
              },
              {
                '@type': 'ContactPoint',
                contactType: 'Agent Training',
                url: 'https://realtechee.com/contact/get-qualified'
              },
              {
                '@type': 'ContactPoint',
                contactType: 'Partnership',
                url: 'https://realtechee.com/contact/affiliate'
              }
            ]
          }
        }}
      />
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
        <div className="flex flex-col items-center text-center gap-4 md:gap-6">
          <H1 className="text-center">
            Contact
          </H1>
          <P2 className="text-center">
            Please choose the best inquiry category below so we can help you best.
          </P2>
          
          {/* Button Row */}
          <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
            <ContactScenarioSelector currentPage="main" />
          </div>
        </div>
      </Section>
    </Layout>
    </div>
  );
}
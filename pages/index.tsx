import Header from '../components/common/layout/Header';
import { 
  Hero, 
  Features, 
  HowItWorks, 
  Partners, 
  Stats, 
  Portfolio, 
  Testimonials,
  AboutSection,
  DealBreakers,
  ClientSection,
  WhoWeAre
} from '../components/home';
// These components don't exist yet
// import PartnerSection from '../components/PartnerSection';
// import ClientSection from '../components/ClientSection';
import Footer from '../components/common/layout/Footer';
import type { NextPage } from 'next';
// Import the CtaSection directly from common/sections
import { CtaSection } from '../components/common/sections';
import SEOHead from '../components/seo/SEOHead';

const Home: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead 
        pageKey="home"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://realtechee.com/#homepage',
          name: 'RealTechee - Real Estate Technology Platform',
          description: 'Advanced property valuation, renovation estimates, and real estate preparation services',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://realtechee.com'
              }
            ]
          },
          mainEntity: {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What services does RealTechee provide?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'RealTechee provides property valuation, renovation estimates, property qualification, and comprehensive real estate preparation services for agents, buyers, and sellers.'
                }
              },
              {
                '@type': 'Question',
                name: 'How quickly can I get a property estimate?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We provide professional property renovation estimates within 24 hours of submission, including detailed analysis and cost breakdowns.'
                }
              },
              {
                '@type': 'Question',
                name: 'Who can use RealTechee services?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Our services are designed for real estate agents, property buyers, sellers, investors, architects, designers, and commercial real estate professionals.'
                }
              }
            ]
          }
        }}
      />
      
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Testimonials />
        <Portfolio />
        <Features />
        <DealBreakers />
        <AboutSection />
        <ClientSection />
        <HowItWorks />
        <Partners />
        <WhoWeAre />
        <CtaSection 
          title="Ready to win more big deals faster?"
          subtitle="Get a Renovation Estimate Today"
          buttonText="Get an Estimate"
          buttonLink="/contact/get-estimate"
        />
      </main>
    </div>
  );
};

export default Home;
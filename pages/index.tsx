import Head from 'next/head';
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

const Home: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Home Preparation Partner for Real Estate Professionals</title>
        <meta name="description" content="Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
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
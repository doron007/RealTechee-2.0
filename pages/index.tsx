import Head from 'next/head';
import Header from '../components/common/layout/Header';
import Hero from '../components/home/Hero';
// These components don't exist yet
// import PartnerSection from '../components/PartnerSection';
import HowItWorks from '../components/home/HowItWorks';
// import ClientSection from '../components/ClientSection';
import AboutSection from '../components/about/AboutSection';
// import DealBreakers from '../components/DealBreakers';
import Features from '../components/home/Features';
import Portfolio from '../components/about/Portfolio';
import Testimonials from '../components/home/Testimonials';
import Stats from '../components/home/Stats';
import CtaSection from '../components/home/CtaSection';
import Partners from '../components/home/Partners';
import Footer from '../components/common/layout/Footer';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Home Preparation Partner for Real Estate Professionals</title>
        <meta name="description" content="Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Testimonials />
        <Portfolio />
        <Features />
        {/* <DealBreakers /> */}
        <AboutSection />
        {/* <ClientSection /> */}
        <HowItWorks />
        <Partners />
        {/* <PartnerSection /> */}
        <CtaSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
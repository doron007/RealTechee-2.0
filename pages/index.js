import Head from 'next/head';
import Header from '../components/Header';
import Hero from '../components/Hero';
import PartnerSection from '../components/PartnerSection';
import HowItWorks from '../components/HowItWorks';
import ClientSection from '../components/ClientSection';
import AboutSection from '../components/AboutSection';
import DealBreakers from '../components/DealBreakers';
import Features from '../components/Features';
import Portfolio from '../components/Portfolio';
import Testimonials from '../components/Testimonials';
import Stats from '../components/Stats';
import CtaSection from '../components/CtaSection';
import Partners from '../components/Partners';
import Footer from '../components/Footer';

export default function Home() {
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
        <DealBreakers />
        <AboutSection />
        <ClientSection />
        <HowItWorks />
        <Partners />
        <PartnerSection />
        <CtaSection />
      </main>
      
      <Footer />
    </div>
  );
}
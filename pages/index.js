import Head from 'next/head';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Process from '../components/Process';
import VideoSection from '../components/VideoSection';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>RealTechee – Add Value To Your Property</title>
        <meta 
          name="description" 
          content="RealTechee helps you add value to your property through expert renovations and real estate services." 
        />
        <link rel="icon" href="/logo/realtechee for AppIcon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Header />
      <main>
        <Hero />
        <Stats />
        <Process />
        <VideoSection />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
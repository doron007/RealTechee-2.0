import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, FeaturesSection, BenefitsSection, TestimonialsSection } from '../../components/products';
import { ProductType } from '../../components/products/HeroSection';
import { CtaSection } from '../../components/common/sections';

const Buyers: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Buyers</title>
        <meta name="description" content="Empower your buyer clients with our seamless renovation solutions, turning ordinary properties into their dream homes." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection productType={ProductType.BUYER} />
        <FeaturesSection productType={ProductType.BUYER} />
        <BenefitsSection productType={ProductType.BUYER} />
        <TestimonialsSection productType={ProductType.BUYER} />
        <CtaSection 
          title="Get Started"
          subtitle="You'll receive a free estimate within 48 hours."
          buttonText="Get an Estimate"
          buttonLink="/get-estimate"
        />
      </main>
    </div>
  );
};

export default Buyers;
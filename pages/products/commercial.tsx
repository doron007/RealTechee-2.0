import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, FeaturesSection, BenefitsSection, TestimonialsSection } from '../../components/products';
import { ProductType } from '../../components/products/HeroSection';

const Commercial: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Commercial Real Estate</title>
        <meta name="description" content="Support Commercial Real Estate Owners and Tenants with enhanced renovation services for better ROI." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection productType={ProductType.COMMERCIAL} />
        <FeaturesSection productType={ProductType.COMMERCIAL} />
        <BenefitsSection productType={ProductType.COMMERCIAL} />
        <TestimonialsSection productType={ProductType.COMMERCIAL} />
      </main>
    </div>
  );
};

export default Commercial;
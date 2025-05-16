import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, FeaturesSection, BenefitsSection } from '../../components/products';
import { ProductType } from '../../components/products/HeroSection';

const KitchenAndBath: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Kitchen and Bath</title>
        <meta name="description" content="Partner with RealTechee to enhance your showroom offerings with premium remodeling services and technology-based solutions." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection productType={ProductType.KITCHEN_BATH} />
        <FeaturesSection productType={ProductType.KITCHEN_BATH} />
        <BenefitsSection productType={ProductType.KITCHEN_BATH} />
      </main>
    </div>
  );
};

export default KitchenAndBath;
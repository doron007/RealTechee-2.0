import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, FeaturesSection, BenefitsSection, TestimonialsSection } from '../../components/products';
import { ProductType } from '../../components/products/HeroSection';
import { CtaSection } from '../../components/common/sections';

const Sellers: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Sellers</title>
        <meta name="description" content="We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, payment is made with the escrow proceeds." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <HeroSection productType={ProductType.SELLER} />
        <FeaturesSection productType={ProductType.SELLER} />
        <BenefitsSection productType={ProductType.SELLER} />
        <TestimonialsSection productType={ProductType.SELLER} />
        <CtaSection
          title="Get Started"
          subtitle="Receive a free estimate within 48 hours."
          buttonText="Get an Estimate"
          buttonLink="/get-estimate"
        />
      </main>
    </div>
  );
};

export default Sellers;
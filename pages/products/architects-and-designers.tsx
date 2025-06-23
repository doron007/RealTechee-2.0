import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, FeaturesSection, BenefitsSection, TestimonialsSection, FinancingSolutionsSection } from '../../components/products';
import { ProductType } from '../../components/products/HeroSection';
import { CtaSection } from '../../components/common/sections';

const ArchitectsAndDesigners: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Architects & Designers</title>
        <meta name="description" content="Focus on creating exceptional designs and provide a seamless experience for your clients- from design to build." />
        <link rel="icon" href="/favicon_white.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="flex-grow">
        <HeroSection productType={ProductType.ARCHITECT_DESIGNER} />
        <FeaturesSection productType={ProductType.ARCHITECT_DESIGNER} />
        <BenefitsSection productType={ProductType.ARCHITECT_DESIGNER} />
        <TestimonialsSection productType={ProductType.ARCHITECT_DESIGNER} />
        <FinancingSolutionsSection productType={ProductType.ARCHITECT_DESIGNER} />
        <CtaSection
          title="Get Started"
          subtitle="Grow Your Business Today."
          buttonText="Get Qualified"
          buttonLink="/contact/get-qualified"
        />
      </main>
    </div>
  );
};

export default ArchitectsAndDesigners;
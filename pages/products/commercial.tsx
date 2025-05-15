import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection, ProductType } from '../../components/products';

const Commercial: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Commercial Real Estate Program</title>
        <meta name="description" content="Support Commercial Real Estate Owners and Tenants. Enhance renovation services and support for a better ROI." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection productType={ProductType.COMMERCIAL} />
      </main>
    </div>
  );
};

export default Commercial;
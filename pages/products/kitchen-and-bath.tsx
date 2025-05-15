import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection } from '../../components/products';

const KitchenAndBath: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Kitchen and Bath Showroom Program</title>
        <meta name="description" content="Offer premium remodeling services while partnering with a top technology-based provider, ensuring exceptional execution and increasing showroom profits." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection isKitchenBath={true} />
      </main>
    </div>
  );
};

export default KitchenAndBath;
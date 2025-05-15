import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection } from '../../components/products';

const Buyers: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee - Buyers</title>
        <meta name="description" content="Enhance home renovation opportunities and experience for your buyer clients with our next generation of real estate buyer services." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex-grow">
        <HeroSection isBuyer={true} />
      </main>
    </div>
  );
};

export default Buyers;
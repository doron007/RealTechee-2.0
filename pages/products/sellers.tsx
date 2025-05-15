import Head from 'next/head';
import type { NextPage } from 'next';
import { HeroSection } from '../../components/products';

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
        <HeroSection isSeller={true} />
      </main>
    </div>
  );
};

export default Sellers;
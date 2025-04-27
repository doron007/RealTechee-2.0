import BrandGuidelines from '../components/style-guide/BrandGuidelines';
import Head from 'next/head';
import Header from '../components/common/layout/Header';
import Footer from '../components/common/layout/Footer';

export default function StyleGuide(props: any) {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Brand Guidelines - RealTechee</title>
        <meta name="description" content="RealTechee brand guidelines and style guide" />
      </Head>
      
      <Header />
      
      <main className="flex-grow">
        <div className="pt-20 w-full max-w-full">
          <BrandGuidelines />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
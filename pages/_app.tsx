import Layout from '../components/common/layout/Layout';
import '../styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import '../styles/image-gallery-custom.css';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

// Define types for pages with custom layouts
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};

// Define extended AppProps that include the custom layout component
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Get layout from page or use default Layout
  const getLayout = Component.getLayout || ((page) => 
    <Layout
      title={pageProps.title}
      description={pageProps.description}
    >
      {page}
    </Layout>
  );

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;
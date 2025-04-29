import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/common/layout/Layout';
import '../styles/globals.css';
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
  const router = useRouter();

  // Analytics page view tracking
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Send pageview to analytics service if needed
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

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
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/common/layout/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Analytics page view tracking
  useEffect(() => {
    const handleRouteChange = (url) => {
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
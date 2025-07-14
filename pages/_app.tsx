import Layout from '../components/common/layout/Layout';
import '../styles/globals.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import '../styles/image-gallery-custom.css';
import '../styles/amplify-custom.css';
import { allFonts } from '../lib/fonts';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationContainer from '../components/common/notifications/NotificationContainer';
import { UnsavedChangesProvider } from '../contexts/UnsavedChangesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/queryClient';

// Define types for pages with custom layouts
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};

// Define extended AppProps that include the custom layout component
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Configure Amplify
Amplify.configure(outputs);

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

  return (
    <div className={allFonts}>
      <QueryClientProvider client={queryClient}>
        <Authenticator.Provider>
          <NotificationProvider>
            <UnsavedChangesProvider>
              {getLayout(<Component {...pageProps} />)}
              <NotificationContainer />
            </UnsavedChangesProvider>
          </NotificationProvider>
        </Authenticator.Provider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
}

export default MyApp;
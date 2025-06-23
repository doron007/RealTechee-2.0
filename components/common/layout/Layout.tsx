import { useEffect, ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  // Get authentication state with route
  const { user, signOut } = useAuthenticator((context) => [context.user, context.route]);

  // Remove debug logs - authentication working

  // Handle scroll restoration and smooth scrolling to hash links
  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: offsetTop - 100, // Offset for header height
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    };

    // Handle initial hash on page load
    if (window.location.hash) {
      handleHashChange();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Page title and metadata
  const pageTitle = title 
    ? `${title} | RealTechee - Home Preparation Partner` 
    : 'RealTechee - Home Preparation Partner for Real Estate Professionals';
  
  const pageDescription = description || 'Supercharge your agents\' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://realtechee.com/" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="/assets/images/shared_realtechee-social-share.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://realtechee.com/" />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content="/assets/images/shared_realtechee-social-share.jpg" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon_white.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_white-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_white-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header 
          userLoggedIn={!!user}
          user={user}
          onSignOut={signOut}
        />
        {/* Add pt-[70px] sm:pt-[80px] md:pt-[85px] lg:pt-[90px] to account for the fixed header height */}
        <main className="flex-grow pt-[70px] sm:pt-[80px] md:pt-[85px] lg:pt-[90px]">{children}</main>
        <Footer />
      </div>
      
      {/* Cookie consent banner, if needed */}
      {/* Chat widget, if needed */}
    </>
  );
}
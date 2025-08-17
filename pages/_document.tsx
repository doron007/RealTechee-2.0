import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import { SITE_CONFIG } from '../config/seo';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Character set and viewport */}
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          {/* DNS prefetch for performance */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          
          {/* Favicons and app icons */}
          <link rel="icon" href="/favicon_white.ico" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon_white-16x16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon_white-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="apple-touch-icon" sizes="57x57" href="/assets/logos/favicon_white-192x192.png" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Theme and app metadata */}
          <meta name="theme-color" content="#1a365d" />
          <meta name="msapplication-TileColor" content="#1a365d" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* Security and performance headers */}
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
          
          {/* Performance optimization */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Organization structured data - Global */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': `${SITE_CONFIG.domain}/#organization`,
                name: SITE_CONFIG.name,
                url: SITE_CONFIG.domain,
                logo: {
                  '@type': 'ImageObject',
                  url: SITE_CONFIG.logo,
                  width: 512,
                  height: 512
                },
                description: SITE_CONFIG.description,
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: SITE_CONFIG.contact.phone,
                  email: SITE_CONFIG.contact.email,
                  contactType: 'customer service',
                  areaServed: 'US',
                  availableLanguage: 'English'
                },
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: SITE_CONFIG.contact.address.street,
                  addressLocality: SITE_CONFIG.contact.address.city,
                  addressRegion: SITE_CONFIG.contact.address.state,
                  postalCode: SITE_CONFIG.contact.address.zipCode,
                  addressCountry: SITE_CONFIG.contact.address.country
                },
                sameAs: Object.values(SITE_CONFIG.social),
                foundingDate: '2020',
                industry: 'Real Estate Technology',
                serviceArea: {
                  '@type': 'Country',
                  name: 'United States'
                }
              })
            }}
          />
          
          {/* Website structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                '@id': `${SITE_CONFIG.domain}/#website`,
                url: SITE_CONFIG.domain,
                name: SITE_CONFIG.name,
                description: SITE_CONFIG.description,
                publisher: {
                  '@id': `${SITE_CONFIG.domain}/#organization`
                },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${SITE_CONFIG.domain}/search?q={search_term_string}`
                  },
                  'query-input': 'required name=search_term_string'
                }
              })
            }}
          />
          
          {/* Professional Service structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ProfessionalService',
                '@id': `${SITE_CONFIG.domain}/#service`,
                name: 'RealTechee Property Services',
                description: 'Professional property valuation, renovation estimates, and real estate preparation services',
                provider: {
                  '@id': `${SITE_CONFIG.domain}/#organization`
                },
                serviceType: [
                  'Property Valuation',
                  'Real Estate Consultation', 
                  'Renovation Planning',
                  'Property Preparation'
                ],
                areaServed: {
                  '@type': 'Country',
                  name: 'United States'
                },
                hasOfferCatalog: {
                  '@type': 'OfferCatalog',
                  name: 'RealTechee Services',
                  itemListElement: [
                    {
                      '@type': 'Offer',
                      itemOffered: {
                        '@type': 'Service',
                        name: 'Property Renovation Estimate',
                        description: 'Professional property renovation cost estimation and planning'
                      }
                    },
                    {
                      '@type': 'Offer',
                      itemOffered: {
                        '@type': 'Service',
                        name: 'Property Qualification',
                        description: 'Comprehensive property qualification and assessment services'
                      }
                    }
                  ]
                }
              })
            }}
          />
          
          {/* Google Analytics moved to next/script component in _app.tsx */}
        </Head>
        <body className="antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
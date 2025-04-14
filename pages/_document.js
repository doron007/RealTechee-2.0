import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Character set */}
          <meta charSet="utf-8" />
          
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Google Analytics, if needed */}
          {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX');
              `,
            }}
          /> */}
          
          {/* Structured data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'RealTechee',
                url: 'https://realtechee.com',
                logo: 'https://realtechee.com/logo/realtechee_horizontal_no_border.png',
                sameAs: [
                  'https://www.facebook.com/realtechee',
                  'https://www.linkedin.com/company/realtechee',
                  'https://www.instagram.com/realtechee'
                ],
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+1-000-000-0000',
                  contactType: 'customer service'
                }
              })
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
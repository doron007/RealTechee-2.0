import { GetStaticProps } from 'next';
import SEOHead from '../components/seo/SEOHead';
import { PAGE_SEO } from '../config/seo';

export default function TestSEO() {
  return (
    <>
      <SEOHead
        pageKey="home"
        customTitle="RealTechee SEO Test Page"
        customDescription="Testing SEO implementation with Google Analytics, structured data, and meta tags"
      />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>SEO Test Page</h1>
        <p>This page is for testing SEO implementation.</p>
        
        <h2>Checklist:</h2>
        <ul>
          <li>✅ Google Analytics 4 configured (add your GA ID to .env.local)</li>
          <li>✅ Google Tag Manager ready (optional, add GTM ID to .env.local)</li>
          <li>✅ Sitemap available at /sitemap.xml</li>
          <li>✅ Robots.txt configured at /robots.txt</li>
          <li>✅ Structured data (JSON-LD) implemented</li>
          <li>✅ Open Graph tags for social sharing</li>
          <li>✅ Twitter Card tags</li>
          <li>✅ Mobile-optimized meta tags</li>
        </ul>

        <h2>Test Tools:</h2>
        <ul>
          <li>
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">
              Google Rich Results Test
            </a>
          </li>
          <li>
            <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer">
              Facebook Sharing Debugger
            </a>
          </li>
          <li>
            <a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer">
              Twitter Card Validator
            </a>
          </li>
          <li>
            <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer">
              PageSpeed Insights
            </a>
          </li>
          <li>
            <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer">
              Schema Markup Validator
            </a>
          </li>
        </ul>

        <h2>View Source to Check:</h2>
        <ul>
          <li>Meta tags in head</li>
          <li>JSON-LD structured data scripts</li>
          <li>Google Analytics script</li>
          <li>Canonical URL</li>
        </ul>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};
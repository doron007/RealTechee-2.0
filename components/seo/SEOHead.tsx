import Head from 'next/head';
import { generateMetaTags, generateStructuredData, SITE_CONFIG, SEOPageConfig } from '../../config/seo';

interface SEOHeadProps {
  pageKey: string;
  customTitle?: string;
  customDescription?: string;
  customMeta?: Partial<SEOPageConfig>;
  structuredData?: Record<string, any>;
  noIndex?: boolean;
}

/**
 * SEO Head Component
 * Centralized SEO meta tags and structured data management
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  pageKey,
  customTitle,
  customDescription,
  customMeta,
  structuredData,
  noIndex = false
}) => {
  // Generate meta tags for the page
  const metaTags = generateMetaTags(pageKey, {
    ...customMeta,
    ...(customTitle && { title: customTitle }),
    ...(customDescription && { description: customDescription })
  });

  // Generate structured data
  const pageStructuredData = generateStructuredData(pageKey, structuredData);

  // Get page config for title
  const pageConfig = customMeta || {};
  const title = customTitle || pageConfig.title || `${SITE_CONFIG.name} - Real Estate Technology Platform`;

  return (
    <Head>
      {/* Primary meta tags */}
      <title>{title}</title>
      
      {/* Dynamic meta tags */}
      {metaTags.map((tag, index) => {
        if (tag.name) {
          return <meta key={index} name={tag.name} content={tag.content} />;
        }
        if (tag.property) {
          return <meta key={index} property={tag.property} content={tag.content} />;
        }
        if (tag.rel === 'canonical') {
          return <link key={index} rel="canonical" href={tag.href} />;
        }
        return null;
      })}

      {/* No-index directive if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Structured data */}
      {pageStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(pageStructuredData)
          }}
        />
      )}

      {/* Additional SEO optimizations */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </Head>
  );
};

export default SEOHead;
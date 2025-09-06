import { GetServerSideProps } from 'next';
import { SITE_CONFIG } from '../config/seo';

interface SitemapEntry {
  path: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
  images?: string[];
}

// Define static pages with their priorities and change frequencies
const STATIC_PAGES: SitemapEntry[] = [
  {
    path: '',
    priority: '1.0',
    changefreq: 'daily',
    images: ['/assets/logos/realtechee_horizontal_no_border.png']
  },
  {
    path: 'contact/get-estimate',
    priority: '0.95',
    changefreq: 'weekly'
  },
  {
    path: 'contact/get-qualified',
    priority: '0.95',
    changefreq: 'weekly'
  },
  {
    path: 'contact',
    priority: '0.9',
    changefreq: 'weekly'
  },
  {
    path: 'contact/affiliate',
    priority: '0.8',
    changefreq: 'monthly'
  },
  {
    path: 'products',
    priority: '0.85',
    changefreq: 'weekly'
  },
  {
    path: 'products/sellers',
    priority: '0.85',
    changefreq: 'weekly'
  },
  {
    path: 'products/buyers',
    priority: '0.85',
    changefreq: 'weekly'
  },
  {
    path: 'products/architects-and-designers',
    priority: '0.8',
    changefreq: 'weekly'
  },
  {
    path: 'products/kitchen-and-bath',
    priority: '0.8',
    changefreq: 'weekly'
  },
  {
    path: 'products/commercial',
    priority: '0.8',
    changefreq: 'weekly'
  },
  {
    path: 'about',
    priority: '0.7',
    changefreq: 'monthly'
  },
  {
    path: 'privacy',
    priority: '0.3',
    changefreq: 'yearly'
  },
  {
    path: 'terms',
    priority: '0.3',
    changefreq: 'yearly'
  }
];

// Generate sitemap XML with enhanced SEO features
function generateSiteMap(): string {
  const currentDate = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${STATIC_PAGES
  .map((page) => {
    const url = page.path === '' ? SITE_CONFIG.domain : `${SITE_CONFIG.domain}/${page.path}`;
    const lastmod = page.lastmod || currentDate;
    
    let urlEntry = `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;
    
    // Add mobile tag for all pages
    urlEntry += `\n    <mobile:mobile/>`;
    
    // Add image tags if images are specified
    if (page.images && page.images.length > 0) {
      page.images.forEach(image => {
        const imageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.domain}${image}`;
        urlEntry += `\n    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>RealTechee - Professional Real Estate Technology Platform</image:caption>
    </image:image>`;
      });
    }
    
    // Add alternate language tags for international SEO (future expansion)
    urlEntry += `\n    <xhtml:link rel="alternate" hreflang="en" href="${url}"/>`;
    urlEntry += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>`;
    
    urlEntry += `\n  </url>`;
    
    return urlEntry;
  })
  .join('\n')}
</urlset>`;
}

// This component will never be rendered, it's just for the sitemap generation
function SiteMap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Generate the XML sitemap
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  
  // Write the sitemap and end the response
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
import { GetServerSideProps } from 'next';
import { SITE_CONFIG } from '../config/seo';

// Define static pages with their priorities and change frequencies
const STATIC_PAGES = [
  {
    path: '',
    priority: '1.0',
    changefreq: 'daily'
  },
  {
    path: 'contact/get-estimate',
    priority: '0.9',
    changefreq: 'weekly'
  },
  {
    path: 'contact/get-qualified',
    priority: '0.9',
    changefreq: 'weekly'
  },
  {
    path: 'contact',
    priority: '0.8',
    changefreq: 'weekly'
  },
  {
    path: 'contact/affiliate',
    priority: '0.7',
    changefreq: 'monthly'
  },
  {
    path: 'products/sellers',
    priority: '0.8',
    changefreq: 'weekly'
  },
  {
    path: 'products/buyers',
    priority: '0.8',
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
  }
];

// Generate sitemap XML
function generateSiteMap(): string {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
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
    
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <mobile:mobile/>
  </url>`;
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

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  
  // Write the sitemap and end the response
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
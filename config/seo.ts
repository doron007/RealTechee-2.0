/**
 * Centralized SEO Configuration for RealTechee
 * Real Estate Technology Platform - Property Valuation & Preparation Services
 */

export interface SEOPageConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
    type?: string;
  };
  twitter?: {
    title?: string;
    description?: string;
    images?: string[];
  };
  structuredData?: Record<string, any>;
}

// Base domain and company information
export const SITE_CONFIG = {
  name: 'RealTechee',
  domain: 'https://realtechee.com',
  description: 'Professional real estate technology platform providing property valuation, renovation estimates, and home preparation services for agents, buyers, and sellers.',
  logo: 'https://realtechee.com/assets/logos/realtechee_horizontal_no_border.png',
  social: {
    facebook: 'https://www.facebook.com/realtechee',
    linkedin: 'https://www.linkedin.com/company/realtechee',
    instagram: 'https://www.instagram.com/realtechee',
    twitter: 'https://twitter.com/realtechee'
  },
  contact: {
    phone: '+1-805-419-3114',
    email: 'info@realtechee.com',
    address: {
      street: '123 Tech Avenue',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States'
    }
  }
};

// Real estate focused keywords
export const REAL_ESTATE_KEYWORDS = {
  primary: [
    'property valuation',
    'real estate estimate', 
    'home value assessment',
    'property qualification',
    'renovation estimate',
    'real estate preparation',
    'property improvement',
    'home staging services',
    'real estate technology',
    'property analysis'
  ],
  secondary: [
    'real estate agents',
    'home buyers',
    'property sellers',
    'house flipping',
    'investment property',
    'property management',
    'real estate investment',
    'home renovation costs',
    'property market analysis',
    'real estate consultation'
  ],
  local: [
    'real estate San Francisco',
    'property valuation California',
    'home estimate Bay Area',
    'real estate services CA',
    'property preparation services'
  ]
};

// SEO configurations for each page
export const PAGE_SEO: Record<string, SEOPageConfig> = {
  home: {
    title: 'RealTechee - Professional Real Estate Technology Platform | Property Valuation & Renovation Services',
    description: 'Transform your real estate business with RealTechee\'s advanced property valuation, renovation estimates, and preparation services. Trusted by agents, buyers, and sellers nationwide.',
    keywords: [
      ...REAL_ESTATE_KEYWORDS.primary,
      ...REAL_ESTATE_KEYWORDS.secondary.slice(0, 5)
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/`,
    openGraph: {
      title: 'RealTechee - Real Estate Technology Platform',
      description: 'Advanced property valuation and renovation services for real estate professionals',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-home.jpg`,
        width: 1200,
        height: 630,
        alt: 'RealTechee Real Estate Technology Platform'
      }]
    },
    twitter: {
      title: 'RealTechee - Real Estate Technology Platform',
      description: 'Advanced property valuation and renovation services for real estate professionals',
      images: [`${SITE_CONFIG.domain}/assets/images/twitter-home.jpg`]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.domain,
      logo: SITE_CONFIG.logo,
      description: SITE_CONFIG.description,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.contact.phone,
        contactType: 'customer service',
        email: SITE_CONFIG.contact.email,
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
      sameAs: Object.values(SITE_CONFIG.social)
    }
  },
  
  privacy: {
    title: 'Privacy Policy - RealTechee | Data Protection & Privacy Rights',
    description: 'Learn how RealTechee protects your personal information and privacy in our real estate technology platform. Comprehensive privacy policy and data handling practices.',
    keywords: [
      'privacy policy',
      'data protection',
      'privacy rights',
      'personal information',
      'data security',
      'real estate privacy'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/privacy`,
    openGraph: {
      title: 'Privacy Policy - RealTechee',
      description: 'Learn how we protect your privacy and personal information',
      type: 'website'
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      description: 'RealTechee privacy policy and data protection practices'
    }
  },
  
  terms: {
    title: 'Terms of Use - RealTechee | Service Agreement & Legal Terms',
    description: 'Terms of Use and Service Agreement for RealTechee\'s real estate technology platform and services. Legal terms and conditions for platform usage.',
    keywords: [
      'terms of use',
      'service agreement',
      'legal terms',
      'terms of service',
      'platform agreement',
      'user agreement'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/terms`,
    openGraph: {
      title: 'Terms of Use - RealTechee',
      description: 'Terms of service and legal agreements for our platform',
      type: 'website'
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Use',
      description: 'RealTechee terms of service and legal agreements'
    }
  },
  
  products: {
    title: 'Products & Services - RealTechee | Real Estate Technology Solutions',
    description: 'Explore RealTechee\'s comprehensive real estate technology solutions for sellers, buyers, professionals, and commercial clients. Advanced property services for all needs.',
    keywords: [
      'real estate products',
      'property services',
      'real estate solutions',
      'property technology',
      'real estate tools',
      'property services'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/products`,
    openGraph: {
      title: 'Products & Services - RealTechee',
      description: 'Comprehensive real estate technology solutions for all your property needs',
      type: 'website'
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Products & Services',
      description: 'RealTechee comprehensive real estate technology solutions'
    }
  },
  
  'get-estimate': {
    title: 'Get Property Renovation Estimate | Free Real Estate Valuation - RealTechee',
    description: 'Get a free, professional property renovation estimate in 24 hours. Our expert team provides detailed valuations for real estate agents, buyers, and sellers.',
    keywords: [
      'property renovation estimate',
      'free real estate valuation',
      'property value assessment',
      'renovation cost calculator',
      'home improvement estimate',
      'real estate appraisal',
      'property consultation',
      'renovation planning'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/contact/get-estimate`,
    openGraph: {
      title: 'Get Free Property Renovation Estimate - RealTechee',
      description: 'Professional property renovation estimates in 24 hours. Detailed valuations for informed real estate decisions.',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-estimate.jpg`,
        width: 1200,
        height: 630,
        alt: 'Get Property Renovation Estimate - RealTechee'
      }]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Property Renovation Estimate',
      provider: {
        '@type': 'Organization',
        name: SITE_CONFIG.name
      },
      description: 'Professional property renovation estimates and valuations',
      serviceType: 'Real Estate Valuation',
      areaServed: 'United States',
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: `${SITE_CONFIG.domain}/contact/get-estimate`,
        servicePhone: SITE_CONFIG.contact.phone
      }
    }
  },

  'get-qualified': {
    title: 'Property Qualification Services | Real Estate Pre-Approval - RealTechee',
    description: 'Get qualified for property investments and purchases. Our comprehensive qualification process helps buyers and investors make informed real estate decisions.',
    keywords: [
      'property qualification',
      'real estate pre-approval',
      'investment property qualification',
      'buyer qualification',
      'property financing assessment',
      'real estate eligibility',
      'investment analysis',
      'property readiness'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/contact/get-qualified`,
    openGraph: {
      title: 'Property Qualification Services - RealTechee',
      description: 'Comprehensive property qualification and pre-approval services for buyers and investors.',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-qualified.jpg`,
        width: 1200,
        height: 630,
        alt: 'Property Qualification Services - RealTechee'
      }]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Property Qualification Service',
      provider: {
        '@type': 'Organization',
        name: SITE_CONFIG.name
      },
      description: 'Comprehensive property qualification and pre-approval services',
      serviceType: 'Real Estate Consultation',
      areaServed: 'United States'
    }
  },

  'contact': {
    title: 'Contact RealTechee | Real Estate Technology Experts | Get Started Today',
    description: 'Contact RealTechee for property valuation, renovation estimates, and real estate technology services. Our experts are ready to help with your real estate needs.',
    keywords: [
      'contact real estate experts',
      'property consultation',
      'real estate support',
      'property valuation contact',
      'renovation estimate contact',
      'real estate technology support'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/contact`,
    openGraph: {
      title: 'Contact RealTechee - Real Estate Technology Experts',
      description: 'Get in touch with our property valuation and real estate technology experts.',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-contact.jpg`,
        width: 1200,
        height: 630,
        alt: 'Contact RealTechee Real Estate Experts'
      }]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact RealTechee',
      description: 'Contact information for RealTechee real estate technology services',
      mainEntity: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: SITE_CONFIG.contact.phone,
          email: SITE_CONFIG.contact.email,
          contactType: 'customer service'
        }
      }
    }
  },

  'affiliate': {
    title: 'RealTechee Affiliate Program | Partner with Real Estate Technology Leaders',
    description: 'Join the RealTechee affiliate program and earn commissions promoting our property valuation and real estate technology services. Exclusive partner benefits available.',
    keywords: [
      'real estate affiliate program',
      'property technology partners',
      'real estate referral program',
      'affiliate marketing real estate',
      'property valuation partners',
      'real estate commission program'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/contact/affiliate`,
    openGraph: {
      title: 'RealTechee Affiliate Program - Partner with Industry Leaders',
      description: 'Join our affiliate program and earn commissions promoting cutting-edge real estate technology.',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-affiliate.jpg`,
        width: 1200,
        height: 630,
        alt: 'RealTechee Affiliate Partnership Program'
      }]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'RealTechee Affiliate Program',
      description: 'Partnership and affiliate opportunities with RealTechee',
      mainEntity: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        offers: {
          '@type': 'Offer',
          description: 'Affiliate partnership program for real estate technology services'
        }
      }
    }
  },

  'about': {
    title: 'About RealTechee - Our History, Mission & Values | Real Estate Technology Leaders',
    description: 'Learn about RealTechee\'s mission, history, and values. Discover how we\'re transforming the real estate industry with innovative technology solutions for agents, buyers, and sellers.',
    keywords: [
      'about realtechee',
      'real estate technology company',
      'property valuation experts',
      'real estate innovation',
      'company history',
      'real estate mission',
      'property technology leaders',
      'renovation estimate experts'
    ],
    canonicalUrl: `${SITE_CONFIG.domain}/about`,
    openGraph: {
      title: 'About RealTechee - Real Estate Technology Leaders',
      description: 'Learn about our mission to transform the real estate industry with innovative property technology solutions.',
      type: 'website',
      images: [{
        url: `${SITE_CONFIG.domain}/assets/images/og-about.jpg`,
        width: 1200,
        height: 630,
        alt: 'About RealTechee - Real Estate Technology Company'
      }]
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About RealTechee',
      description: 'Company information, mission, and values of RealTechee',
      mainEntity: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.domain,
        description: SITE_CONFIG.description,
        foundingDate: '2020',
        industry: 'Real Estate Technology',
        address: {
          '@type': 'PostalAddress',
          streetAddress: SITE_CONFIG.contact.address.street,
          addressLocality: SITE_CONFIG.contact.address.city,
          addressRegion: SITE_CONFIG.contact.address.state,
          postalCode: SITE_CONFIG.contact.address.zipCode,
          addressCountry: SITE_CONFIG.contact.address.country
        }
      }
    }
  }
};;

// Generate meta tags for a specific page
export const generateMetaTags = (pageKey: string, customMeta?: Partial<SEOPageConfig>) => {
  const pageConfig = PAGE_SEO[pageKey];
  if (!pageConfig) {
    console.warn(`SEO configuration not found for page: ${pageKey}`);
    return [];
  }

  const config = { ...pageConfig, ...customMeta };
  const metaTags = [];

  // Basic meta tags
  metaTags.push(
    { name: 'description', content: config.description },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' }
  );

  // Keywords
  if (config.keywords && config.keywords.length > 0) {
    metaTags.push({ name: 'keywords', content: config.keywords.join(', ') });
  }

  // Canonical URL
  if (config.canonicalUrl) {
    metaTags.push({ rel: 'canonical', href: config.canonicalUrl });
  }

  // OpenGraph tags
  if (config.openGraph) {
    const og = config.openGraph;
    metaTags.push(
      { property: 'og:type', content: og.type || 'website' },
      { property: 'og:title', content: og.title || config.title },
      { property: 'og:description', content: og.description || config.description },
      { property: 'og:url', content: config.canonicalUrl || SITE_CONFIG.domain },
      { property: 'og:site_name', content: SITE_CONFIG.name }
    );

    if (og.images && og.images.length > 0) {
      og.images.forEach(image => {
        metaTags.push(
          { property: 'og:image', content: image.url },
          { property: 'og:image:width', content: image.width.toString() },
          { property: 'og:image:height', content: image.height.toString() },
          { property: 'og:image:alt', content: image.alt }
        );
      });
    }
  }

  // Twitter Card tags
  if (config.twitter) {
    const twitter = config.twitter;
    metaTags.push(
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@realtechee' },
      { name: 'twitter:creator', content: '@realtechee' },
      { name: 'twitter:title', content: twitter.title || config.title },
      { name: 'twitter:description', content: twitter.description || config.description }
    );

    if (twitter.images && twitter.images.length > 0) {
      metaTags.push({ name: 'twitter:image', content: twitter.images[0] });
    }
  }

  return metaTags;
};

// Generate JSON-LD structured data
export const generateStructuredData = (pageKey: string, customData?: Record<string, any>) => {
  const pageConfig = PAGE_SEO[pageKey];
  if (!pageConfig || !pageConfig.structuredData) {
    return null;
  }

  return {
    ...pageConfig.structuredData,
    ...customData
  };
};
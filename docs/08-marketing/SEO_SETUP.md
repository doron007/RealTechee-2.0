# RealTechee SEO & Analytics Setup Guide

## Google Analytics 4 (GA4) Setup

### 1. Create a GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Admin" (gear icon) → "Create Property"
3. Enter property name: "RealTechee Production"
4. Select your time zone and currency
5. Fill in business information:
   - Industry: Real Estate
   - Business size: Small
6. Choose business objectives (select all that apply):
   - Generate leads
   - Raise brand awareness
   - Examine user behavior

### 2. Get Your Measurement ID
1. In GA4, go to Admin → Data Streams
2. Click "Add stream" → "Web"
3. Enter:
   - Website URL: https://www.realtechee.com
   - Stream name: RealTechee Web
4. Copy the Measurement ID (starts with G-)

### 3. Configure Environment Variables
Add to your `.env.local` and deployment environment variables:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Google Tag Manager (Optional)
For advanced tracking:
1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create new account/container
3. Copy GTM ID (starts with GTM-)
4. Add to environment:
```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## SEO Implementation Status

### ✅ Completed Features

1. **Google Analytics 4 Integration**
   - Page view tracking
   - Event tracking system
   - Form submission tracking
   - Conversion tracking
   - Scroll depth tracking

2. **Sitemap Configuration**
   - Dynamic XML sitemap at `/sitemap.xml`
   - Sitemap index at `/sitemap-index.xml`
   - Mobile-friendly tags
   - Image sitemap support
   - Hreflang tags for future internationalization

3. **Robots.txt Optimization**
   - Comprehensive crawler directives
   - Separate rules for major search engines
   - Social media crawler allowances
   - AI bot policies
   - Multiple sitemap references

4. **Structured Data (JSON-LD)**
   - LocalBusiness schema
   - Service schema
   - BreadcrumbList schema
   - Organization schema
   - AggregateRating schema

5. **Meta Tags & Open Graph**
   - Dynamic meta tag generation
   - Open Graph tags for social sharing
   - Twitter Card tags
   - Mobile-specific meta tags
   - Canonical URLs

## Analytics Events Reference

### Form Events
```javascript
import { trackFormSubmission, trackFormError } from '@/lib/analytics';

// On successful submission
trackFormSubmission('get-estimate', formData);

// On error
trackFormError('get-estimate', error.message);
```

### CTA Click Tracking
```javascript
import { trackCTAClick } from '@/lib/analytics';

// Track button clicks
trackCTAClick('Get Free Estimate', 'homepage-hero');
```

### Custom Events
```javascript
import { trackEvent, AnalyticsEvent, AnalyticsCategory } from '@/lib/analytics';

// Track custom events
trackEvent(
  AnalyticsEvent.VIDEO_PLAY,
  AnalyticsCategory.ENGAGEMENT,
  'intro-video'
);
```

## Google Search Console Setup

### 1. Verify Website Ownership
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: https://www.realtechee.com
3. Choose verification method:
   - **Recommended**: HTML tag (add to SEOHead component)
   - Alternative: DNS verification
   - Alternative: Google Analytics (if already set up)

### 2. Submit Sitemaps
1. In Search Console, go to "Sitemaps"
2. Submit:
   - https://www.realtechee.com/sitemap.xml
   - https://www.realtechee.com/sitemap-index.xml

### 3. Monitor Performance
- Check "Performance" tab for:
  - Search queries
  - Click-through rates
  - Average position
  - Impressions

## Local SEO Optimization

### Google My Business
1. Claim your business at [Google My Business](https://business.google.com)
2. Complete all information:
   - Business name: RealTechee
   - Category: Real Estate Technology Company
   - Service areas
   - Business hours
   - Photos
   - Services offered

### Bing Places for Business
1. Sign up at [Bing Places](https://www.bingplaces.com)
2. Verify business
3. Complete profile similar to Google My Business

## Competitive Analysis Tools

### Recommended Tools
1. **Google PageSpeed Insights** - Performance analysis
2. **GTmetrix** - Detailed performance metrics
3. **Screaming Frog SEO Spider** - Technical SEO audit
4. **Ahrefs/SEMrush** - Competitor analysis (paid)
5. **Google Rich Results Test** - Validate structured data

## Monitoring & Maintenance

### Weekly Tasks
- Check Google Analytics for traffic trends
- Monitor Search Console for errors
- Review form submission rates
- Check page load speeds

### Monthly Tasks
- Update sitemap if new pages added
- Review and update meta descriptions
- Check for broken links
- Analyze competitor changes
- Review keyword rankings

### Quarterly Tasks
- Full SEO audit
- Update structured data
- Review and refresh content
- Analyze conversion funnels
- Competitor analysis

## Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 3 seconds
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.8s
- **Cumulative Layout Shift**: < 0.1
- **SEO Score**: > 90/100

### Current Competition (HouseAmp)
- GA4 ID: G-WTNNTP1VJ1
- GTM ID: GTM-5XCSDFD8
- Focus: Content marketing, local SEO
- Strengths: Blog content, state coverage

## Next Steps

1. **Content Strategy**
   - Create blog section
   - Add case studies
   - Customer testimonials
   - Market insights

2. **Technical SEO**
   - Implement AMP pages (optional)
   - Add FAQ schema
   - Implement review schema
   - Video sitemap (if applicable)

3. **Link Building**
   - Industry partnerships
   - Guest blogging
   - Local directories
   - Press releases

## Support

For SEO questions or updates, consider:
- Google Search Central Documentation
- Analytics Academy by Google
- SEO communities (r/SEO, Moz Community)
- Professional SEO consultants for advanced strategies

---

*Last Updated: January 2025*
*Next Review: Q2 2025*
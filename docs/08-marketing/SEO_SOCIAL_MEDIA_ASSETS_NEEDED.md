# Social Media Assets Needed for SEO Optimization

## 🖼️ Open Graph Images Required

The following images should be created and added to `/public/assets/images/` for optimal social media sharing:

### Primary Pages
1. **`og-home.jpg`** (1200x630px)
   - RealTechee logo with tagline "Real Estate Technology Platform"
   - Professional property background
   - Used for: Home page social shares

2. **`og-estimate.jpg`** (1200x630px)
   - "Get Free Property Estimate" text
   - Before/after renovation images
   - Used for: Get Estimate page

3. **`og-qualified.jpg`** (1200x630px)  
   - "Real Estate Agent Training" text
   - Professional real estate imagery
   - Used for: Get Qualified page

4. **`og-contact.jpg`** (1200x630px)
   - "Contact RealTechee Experts" text
   - Team or office imagery
   - Used for: Contact pages

5. **`og-affiliate.jpg`** (1200x630px)
   - "Partnership Opportunities" text
   - Handshake or collaboration imagery
   - Used for: Affiliate program page

### Twitter Images  
1. **`twitter-home.jpg`** (1200x675px)
   - Similar to og-home but optimized for Twitter's aspect ratio

2. **`twitter-estimate.jpg`** (1200x675px)
   - Property renovation focused imagery

3. **`twitter-services.jpg`** (1200x675px)
   - General services overview

## 🎨 Design Guidelines

### Brand Colors
- Primary: #1a365d (Dark Blue)
- Secondary: #22C55E (Green)
- Accent: #F8E9E6 (Light Pink)

### Typography
- Primary: Nunito Sans (Bold/SemiBold for headers)
- Secondary: Roboto (for body text)

### Image Requirements
- **Resolution**: High-resolution (minimum 1200px wide)
- **Format**: JPG or PNG (JPG preferred for photos)
- **File Size**: Under 1MB for optimal loading
- **Alt Text**: Descriptive for SEO and accessibility

### Content Elements
- **Logo Placement**: Top-left or center
- **Text Overlay**: High contrast, readable fonts
- **Background**: Professional real estate imagery
- **Call-to-Action**: Clear and compelling

## 📱 Additional Assets for Mobile

### Apple Touch Icons
- **180x180px**: Primary size for modern devices
- **152x152px**: iPad compatibility
- **120x120px**: iPhone compatibility

### Favicon Updates
- **32x32px**: Standard favicon
- **16x16px**: Small size compatibility
- **192x192px**: Android home screen
- **512x512px**: High-resolution displays

## 🔍 SEO Image Best Practices

### File Naming Convention
```
og-[page-name].jpg
twitter-[page-name].jpg
favicon-[size].png
icon-[purpose]-[size].png
```

### Image Optimization
- Use Next.js Image component for automatic optimization
- Implement lazy loading for non-critical images
- Compress images using modern formats (WebP, AVIF)
- Include proper alt text for all images

### Structured Data for Images
```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://realtechee.com/assets/images/og-home.jpg",
  "description": "RealTechee real estate technology platform",
  "name": "RealTechee Platform Overview",
  "author": {
    "@type": "Organization",
    "name": "RealTechee"
  }
}
```

## 📊 Social Media Platform Specifications

### Facebook/Open Graph
- **Recommended**: 1200x630px (1.91:1 ratio)
- **Minimum**: 600x315px
- **Maximum File Size**: 8MB
- **Formats**: JPG, PNG, GIF

### Twitter Cards
- **Summary Large Image**: 1200x675px (16:9 ratio)
- **Summary**: 1200x1200px (1:1 ratio)
- **Maximum File Size**: 5MB
- **Formats**: JPG, PNG, WebP, GIF

### LinkedIn
- **Recommended**: 1200x627px (1.91:1 ratio)
- **Minimum**: 520x272px
- **Maximum File Size**: 5MB
- **Formats**: JPG, PNG, GIF

## 🛠️ Implementation Steps

1. **Create Images**: Design according to specifications above
2. **Optimize Files**: Compress and convert to optimal formats
3. **Upload Assets**: Place in `/public/assets/images/` directory
4. **Update Meta Tags**: Verify Open Graph URLs are correct
5. **Test Sharing**: Use Facebook Debugger and Twitter Card Validator

### Testing Tools
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## 🎯 Priority Order

### High Priority (Immediate)
1. og-home.jpg - Most shared page
2. og-estimate.jpg - Primary conversion page
3. favicon updates - Brand consistency

### Medium Priority (Next Week)
1. og-contact.jpg - Support pages
2. og-qualified.jpg - Training program
3. Twitter-specific images

### Low Priority (Future)
1. og-affiliate.jpg - Partnership page
2. Additional service-specific images
3. Seasonal/campaign-specific images

---

**Note**: Once these images are created and implemented, social media sharing will display professional, branded visuals that enhance click-through rates and brand recognition.
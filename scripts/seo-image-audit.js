#!/usr/bin/env node

/**
 * SEO Image Audit Script
 * Scans the codebase for images and checks for proper SEO optimization
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const scanDirectories = [
  'pages',
  'components',
  'public/assets/images'
];

// Image extensions to look for
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];

// Results storage
const results = {
  images: [],
  missingAlt: [],
  recommendations: [],
  publicImages: []
};

// Real estate focused alt text suggestions
const altTextSuggestions = {
  'portfolio': {
    'before': 'Property before renovation - RealTechee transformation project',
    'after': 'Property after renovation - RealTechee completed project',
    'kitchen': 'Kitchen renovation project by RealTechee - modern design and functionality',
    'bathroom': 'Bathroom renovation project by RealTechee - contemporary styling',
    'living': 'Living room renovation by RealTechee - enhanced space and lighting'
  },
  'home': {
    'hero': 'RealTechee real estate technology platform - property valuation and renovation services',
    'stats': 'RealTechee success statistics - proven results in real estate preparation',
    'features': 'RealTechee platform features - comprehensive property management tools'
  },
  'products': {
    'seller': 'RealTechee services for property sellers - maximize home value and appeal',
    'buyer': 'RealTechee services for property buyers - informed investment decisions',
    'commercial': 'RealTechee commercial real estate services - professional property solutions'
  },
  'logos': {
    'realtechee': 'RealTechee logo - real estate technology platform',
    'social': 'RealTechee social media profile image'
  },
  'icons': {
    'general': 'Feature icon representing RealTechee service capabilities'
  }
};

// Scan for images in code files
function scanCodeFiles(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanCodeFiles(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.jsx') || file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
      analyzeCodeFile(fullPath);
    }
  }
}

// Analyze individual code file for images
function analyzeCodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Look for Image components
    const imageRegex = /<Image[^>]*>/g;
    const imgRegex = /<img[^>]*>/g;
    
    let match;
    
    // Check Next.js Image components
    while ((match = imageRegex.exec(content)) !== null) {
      const imageTag = match[0];
      const altMatch = imageTag.match(/alt=["']([^"']*)["']/);
      const srcMatch = imageTag.match(/src=["']([^"']*)["']/);
      
      if (srcMatch) {
        const imageInfo = {
          file: relativePath,
          line: content.substring(0, match.index).split('\n').length,
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : null,
          tag: imageTag.substring(0, 100) + '...',
          type: 'Image'
        };
        
        results.images.push(imageInfo);
        
        if (!altMatch || !altMatch[1] || altMatch[1].trim() === '') {
          results.missingAlt.push(imageInfo);
        }
      }
    }
    
    // Check HTML img tags
    while ((match = imgRegex.exec(content)) !== null) {
      const imageTag = match[0];
      const altMatch = imageTag.match(/alt=["']([^"']*)["']/);
      const srcMatch = imageTag.match(/src=["']([^"']*)["']/);
      
      if (srcMatch) {
        const imageInfo = {
          file: relativePath,
          line: content.substring(0, match.index).split('\n').length,
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : null,
          tag: imageTag.substring(0, 100) + '...',
          type: 'img'
        };
        
        results.images.push(imageInfo);
        
        if (!altMatch || !altMatch[1] || altMatch[1].trim() === '') {
          results.missingAlt.push(imageInfo);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
  }
}

// Scan public images directory
function scanPublicImages(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  function scanDir(currentPath) {
    const files = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file.name);
      
      if (file.isDirectory()) {
        scanDir(fullPath);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath);
          const stats = fs.statSync(fullPath);
          
          results.publicImages.push({
            path: `/${relativePath.replace(/\\/g, '/')}`,
            name: file.name,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            extension: ext,
            suggestion: generateAltTextSuggestion(relativePath)
          });
        }
      }
    }
  }
  
  scanDir(dirPath);
}

// Generate alt text suggestions based on file path and name
function generateAltTextSuggestion(imagePath) {
  const pathLower = imagePath.toLowerCase();
  
  // Portfolio images
  if (pathLower.includes('portfolio')) {
    if (pathLower.includes('before')) {
      return altTextSuggestions.portfolio.before;
    } else if (pathLower.includes('after')) {
      return altTextSuggestions.portfolio.after;
    } else if (pathLower.includes('kitchen')) {
      return altTextSuggestions.portfolio.kitchen;
    } else if (pathLower.includes('bathroom') || pathLower.includes('bath')) {
      return altTextSuggestions.portfolio.bathroom;
    } else if (pathLower.includes('living')) {
      return altTextSuggestions.portfolio.living;
    }
  }
  
  // Home page images
  if (pathLower.includes('pages_home') || pathLower.includes('hero')) {
    return altTextSuggestions.home.hero;
  }
  
  // Product images
  if (pathLower.includes('seller')) {
    return altTextSuggestions.products.seller;
  } else if (pathLower.includes('buyer')) {
    return altTextSuggestions.products.buyer;
  } else if (pathLower.includes('commercial')) {
    return altTextSuggestions.products.commercial;
  }
  
  // Logo images
  if (pathLower.includes('logo') || pathLower.includes('realtechee')) {
    return altTextSuggestions.logos.realtechee;
  }
  
  // Icons
  if (pathLower.includes('icon') || pathLower.includes('ic-')) {
    return altTextSuggestions.icons.general;
  }
  
  return `RealTechee real estate image - ${path.basename(imagePath, path.extname(imagePath)).replace(/[-_]/g, ' ')}`;
}

// Generate recommendations
function generateRecommendations() {
  // Missing alt tags
  if (results.missingAlt.length > 0) {
    results.recommendations.push({
      type: 'critical',
      title: 'Missing Alt Text',
      description: `${results.missingAlt.length} images are missing alt text, which is crucial for SEO and accessibility.`,
      action: 'Add descriptive alt text to all images'
    });
  }
  
  // Large image files
  const largeImages = results.publicImages.filter(img => {
    const sizeKB = parseFloat(img.size);
    return sizeKB > 500;
  });
  
  if (largeImages.length > 0) {
    results.recommendations.push({
      type: 'performance',
      title: 'Large Image Files',
      description: `${largeImages.length} images are larger than 500KB, which may impact page load speed.`,
      action: 'Optimize images using Next.js Image component or compress files'
    });
  }
  
  // Non-modern formats
  const oldFormats = results.publicImages.filter(img => 
    img.extension === '.jpg' || img.extension === '.jpeg' || img.extension === '.png'
  );
  
  if (oldFormats.length > 0) {
    results.recommendations.push({
      type: 'optimization',
      title: 'Image Format Optimization',
      description: `${oldFormats.length} images use older formats (JPG/PNG). Consider WebP or AVIF for better compression.`,
      action: 'Convert images to modern formats like WebP or AVIF'
    });
  }
  
  // Generic alt text
  const genericAlt = results.images.filter(img => 
    img.alt && (
      img.alt.toLowerCase().includes('image') ||
      img.alt.toLowerCase().includes('picture') ||
      img.alt.toLowerCase() === 'photo'
    )
  );
  
  if (genericAlt.length > 0) {
    results.recommendations.push({
      type: 'seo',
      title: 'Generic Alt Text',
      description: `${genericAlt.length} images have generic alt text that could be more descriptive.`,
      action: 'Replace generic alt text with specific, keyword-rich descriptions'
    });
  }
}

// Generate report
function generateReport() {
  console.log('\n=== RealTechee SEO Image Audit Report ===\n');
  
  console.log(`📊 Summary:`);
  console.log(`   Total images found: ${results.images.length}`);
  console.log(`   Public images: ${results.publicImages.length}`);
  console.log(`   Missing alt text: ${results.missingAlt.length}`);
  console.log(`   Recommendations: ${results.recommendations.length}\n`);
  
  if (results.missingAlt.length > 0) {
    console.log('❌ Images Missing Alt Text:');
    results.missingAlt.forEach(img => {
      console.log(`   ${img.file}:${img.line} - ${img.src}`);
      console.log(`      Suggested: "${generateAltTextSuggestion(img.src)}"`);
    });
    console.log();
  }
  
  console.log('📋 Recommendations:');
  results.recommendations.forEach((rec, index) => {
    const icon = rec.type === 'critical' ? '🚨' : 
                 rec.type === 'performance' ? '⚡' :
                 rec.type === 'seo' ? '🔍' : '💡';
    console.log(`${index + 1}. ${icon} ${rec.title}`);
    console.log(`   ${rec.description}`);
    console.log(`   Action: ${rec.action}\n`);
  });
  
  // Generate code examples
  console.log('💻 SEO-Optimized Image Examples:');
  console.log(`
// Using OptimizedImage component
import OptimizedImage from '../components/seo/OptimizedImage';

<OptimizedImage 
  src="/assets/images/portfolio/before-1.jpg"
  alt="Property before renovation - RealTechee kitchen transformation project"
  width={600}
  height={400}
  priority={true} // for above-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Standard Next.js Image with SEO optimization
<Image 
  src="/assets/images/hero-bg.png"
  alt="RealTechee real estate technology platform - property valuation services"
  width={1200}
  height={600}
  priority={true}
  quality={85}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
`);
  
  console.log('\n✅ Next Steps:');
  console.log('1. Add alt text to images missing it');
  console.log('2. Replace generic alt text with keyword-rich descriptions');
  console.log('3. Use OptimizedImage component for automatic SEO optimization');
  console.log('4. Compress large image files');
  console.log('5. Consider converting to WebP/AVIF formats');
  console.log('6. Add structured data for portfolio/showcase images\n');
}

// Main execution
function main() {
  console.log('🔍 Scanning RealTechee codebase for images...\n');
  
  // Scan code files
  scanDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanCodeFiles(dir);
    }
  });
  
  // Scan public images
  scanPublicImages('public/assets/images');
  
  // Generate recommendations
  generateRecommendations();
  
  // Generate and display report
  generateReport();
  
  // Write detailed results to file
  fs.writeFileSync('seo-image-audit-results.json', JSON.stringify(results, null, 2));
  console.log('📄 Detailed results written to: seo-image-audit-results.json');
}

// Run the audit
if (require.main === module) {
  main();
}

module.exports = { main, results };
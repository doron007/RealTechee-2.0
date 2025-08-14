const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Fix 504 Gateway Timeout issues on Amplify
    imgOptTimeoutInSeconds: 30, // Increased from 7s default to handle large S3 images
    imgOptConcurrency: 1, // Reduce concurrent optimizations to prevent memory pressure
    imgOptMaxInputPixels: 50000000, // Limit max input pixels to reduce memory usage
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co'
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'amplify-realtecheeclone-d-realtecheeuseruploadsbuc-p7hml7cayg9g.s3.us-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'amplify-realtecheeclone-d-realtecheeuseruploadsbuc-hrccg1lkyuvu.s3.us-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'amplify-realtecheeclone-p-realtecheeuseruploadsbuc-mwrkzxdvttii.s3.us-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'amplify-d200k2wsaf8th3-st-realtecheeuseruploadsbuc-lollpnfn8hd5.s3.us-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj.s3.us-west-1.amazonaws.com'
      }
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [],
    minimumCacheTTL: 86400, // 24 hours to reduce repeated processing and prevent 504 timeouts
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  // Turbopack handles Fast Refresh and development optimizations automatically
  // Removed webpack polling configuration as it conflicts with Turbopack
};

module.exports = withBundleAnalyzer(nextConfig);

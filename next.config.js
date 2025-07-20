const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
      }
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Turbopack handles Fast Refresh and development optimizations automatically
  // Removed webpack polling configuration as it conflicts with Turbopack
};

module.exports = withBundleAnalyzer(nextConfig);

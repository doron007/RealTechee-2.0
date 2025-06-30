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
    ]
  },
  // Improve Fast Refresh and development experience
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve Fast Refresh behavior
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

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
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'source-map';
    }
    
    // Ensure proper handling of source maps for server code
    if (isServer) {
      config.optimization.minimize = false;
    }
    
    return config;
  }
};

module.exports = nextConfig;

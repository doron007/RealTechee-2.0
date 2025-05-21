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
      }
    ]
  },
  // Adding webpack configuration for improved hot module replacement
  webpack: (config, { dev, isServer }) => {
    // Optimization for hot module replacement (HMR)
    if (dev && !isServer) {
      // Add HMR specific optimizations
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all'
        }
      }
      // Improve webpack performance during development
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
      }
    }
    return config
  }
};

module.exports = nextConfig;

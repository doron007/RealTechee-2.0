/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['res.cloudinary.com', 'unsplash.com'], // Add external image domains if needed
    },
  };
  
  module.exports = nextConfig;
  
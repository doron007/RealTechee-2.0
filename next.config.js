/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['res.cloudinary.com', 'unsplash.com', 'placehold.co'], // Added placehold.co to fix build error
    },
  };
  
  module.exports = nextConfig;

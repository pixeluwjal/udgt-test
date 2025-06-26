/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "img.clerk.com"], // Add Clerk domain here
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

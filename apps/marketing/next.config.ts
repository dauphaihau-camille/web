import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    externalDir: true,
  },
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;

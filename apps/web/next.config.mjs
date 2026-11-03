/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nis/brand-tokens', '@nis/ui', '@nis/razorpay-sdk'],
  experimental: {
    typedRoutes: false,
  },
  // Static pages in public/ that live at a clean URL (public/diwali/index.html -> /diwali).
  async rewrites() {
    return [{ source: '/diwali', destination: '/diwali/index.html' }];
  },
};

export default nextConfig;

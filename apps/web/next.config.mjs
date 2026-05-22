/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nis/brand-tokens', '@nis/ui', '@nis/razorpay-sdk'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;

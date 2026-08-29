/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['geist'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.simpleicons.org', pathname: '/**' }],
  },
};

module.exports = nextConfig;

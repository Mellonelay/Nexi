const { withSentryConfig } = require('@sentry/nextjs/config');

/** @type {import('next').NextConfig} */
const releaseBuildId = process.env.NEXI_BUILD_ID?.trim();

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: { root: process.env.NEXT_TURBOPACK_ROOT?.trim() || __dirname },
  ...(releaseBuildId ? { generateBuildId: async () => releaseBuildId } : {}),
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [{ key: 'Document-Policy', value: 'js-profiling' }],
    }];
  },
  transpilePackages: ['geist'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.simpleicons.org', pathname: '/**' }],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: {
    name: process.env.SENTRY_RELEASE,
    create: false,
    finalize: false,
  },
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

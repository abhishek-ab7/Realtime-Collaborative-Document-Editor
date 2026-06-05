import type { NextConfig } from 'next';
import { codecovNextJSWebpackPlugin } from '@codecov/nextjs-webpack-plugin';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@collabdoc/database', '@collabdoc/shared', '@collabdoc/yjs-utils'],
  turbopack: {
    resolveAlias: {
      'y-prosemirror': '@tiptap/y-tiptap',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
  },
  webpack: (config, options) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'y-prosemirror': '@tiptap/y-tiptap',
    };
    config.plugins.push(
      codecovNextJSWebpackPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'collabdoc-web',
        uploadToken: process.env.CODECOV_TOKEN,
        webpack: options.webpack,
      }),
    );
    return config;
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'collabdoc',
  project: 'web',

  // Only print logs when triaging tunnels
  silent: !process.env.CI,

  // Forwards the error to Sentry if the build fails to upload source maps
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',

  // Hides source maps from visitors
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});

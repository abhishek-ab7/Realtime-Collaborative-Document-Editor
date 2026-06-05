import type { NextConfig } from 'next';
import { codecovNextJSWebpackPlugin } from '@codecov/nextjs-webpack-plugin';

const nextConfig: NextConfig = {
  transpilePackages: ['@collabdoc/database', '@collabdoc/shared', '@collabdoc/yjs-utils'],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
  },
  webpack: (config, options) => {
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

export default nextConfig;

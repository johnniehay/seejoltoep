import type { NextConfig } from "next";
import { withPayload } from '@payloadcms/next/withPayload'
import { withPuckCSS } from '@delmaredigital/payload-puck/next'

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {},
  images: {
    remotePatterns: [
      ...[process.env['NEXT_PUBLIC_SERVER_URL']].map((item) => {
        const url = new URL(item)
        return {
          hostname: url.hostname,
          protocol: "https" as const,
        }
      }),
    ],
    qualities: [100, 75]
  },
  reactStrictMode: true,
  output: "standalone",
  logging: { fetches: { fullUrl: true, hmrRefreshes: true }, incomingRequests: true },
  typescript:{ignoreBuildErrors: true}
};

export default withPuckCSS({
  cssInput: 'src/app/(frontend)/globals.css',
})(withPayload(nextConfig, { devBundleServerPackages: false }))

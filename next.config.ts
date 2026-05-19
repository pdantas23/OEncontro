import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/encontro',

  env: {
    NEXT_PUBLIC_BASE_PATH: '/encontro',
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.flexofertas.shop',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)

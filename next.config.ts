import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cfhktespanskzabbbpck.supabase.co',
      },
    ],
  },
}

export default nextConfig

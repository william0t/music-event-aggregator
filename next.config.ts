import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's1.ticketm.net' },
      { protocol: 'https', hostname: 'assets.bandsintown.com' },
      { protocol: 'https', hostname: '*.scdn.co' },
      { protocol: 'https', hostname: 'i.ticketweb.com' },
      { protocol: 'https', hostname: '*.bandsintown.com' },
    ],
  },
}

export default nextConfig

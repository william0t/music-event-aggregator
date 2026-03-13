/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig

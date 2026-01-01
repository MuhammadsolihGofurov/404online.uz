/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'uz'],
  },
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  images: {
    remotePatterns: [],
  },
  env: {
    API: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
    // like ['domen.uz']
    domains: [],
  },
  env: {
    // like base url
    API: '',
  },
}

module.exports = nextConfig

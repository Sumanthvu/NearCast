/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["gateway.pinata.cloud", "ipfs.io"],
    unoptimized: true,
  },
}

module.exports = nextConfig

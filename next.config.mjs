/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '0.0.0.0',
        port: '8000',
        pathname: '/static/**',
      },
    ],
  },
}

export default nextConfig

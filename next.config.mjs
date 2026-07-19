/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Safari and other clients request these icons from the site root,
      // ignoring the <link> tags in <head>.
      { source: "/favicon.ico", destination: "/favicon_io/favicon.ico" },
      { source: "/apple-touch-icon.png", destination: "/favicon_io/apple-touch-icon.png" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/favicon_io/apple-touch-icon.png" },
    ]
  },
}

export default nextConfig

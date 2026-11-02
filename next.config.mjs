/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep fixture-based review builds separate from the regular app build.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
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

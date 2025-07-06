/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev || isServer) {
      return config
    }

    // Add service worker to the build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
    unoptimized: true,
  },
  // Force correct MIME types for PWA files
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://apis.google.com https://accounts.google.com; frame-src 'self' https://accounts.google.com;",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  // Enable experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },
  // Environment variables
  env: {
    CUSTOM_KEY: "life-os-pwa",
  },
  // Redirects for PWA
  async redirects() {
    return [
      // Add any necessary redirects here
    ]
  },
  // Rewrites for API routes
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ]
  },
  // Output configuration
  output: "standalone",
  // Compression
  compress: true,
  // Power by header
  poweredByHeader: false,
  // React strict mode
  reactStrictMode: true,
  // SWC minification
  swcMinify: true,
  // Trailing slash
  trailingSlash: false,
}

module.exports = nextConfig

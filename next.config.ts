import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler
  reactCompiler: false,

  // Image optimization configuration
  images: {
    remotePatterns: [
      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // Crypto logos
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/**",
      },

      // Stock logos
      {
        protocol: "https",
        hostname: "assets.parqet.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
        pathname: "/**",
      },

      // General images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/**",
      },

      // Wallet logos
      {
        protocol: "https",
        hostname: "altcoinsbox.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cryptologos.cc",
        pathname: "/**",
      },

      // Google favicon service
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
    ],
  },

  // Environment variables exposed to browser
  env: {
    APP_NAME: "RFM TradePro",
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

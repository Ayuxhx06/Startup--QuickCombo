import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/admin/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || ""}/admin/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || ""}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;

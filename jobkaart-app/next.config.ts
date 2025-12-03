import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Remove 'output: export' - we need a Node.js server for API routes and auth
  // Images will be optimized by Next.js built-in optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allow Supabase storage images
      },
    ],
  },
}

export default nextConfig
import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Force le file tracer à inclure les TTF Nunito dans le bundle de la
  // route /api/admin/affiche (lue via path.join(process.cwd(), ...) qui est
  // calculé à runtime et donc invisible pour la détection statique).
  outputFileTracingIncludes: {
    '/api/admin/affiche/**/*': ['./public/fonts/**/*'],
  },
}

export default nextConfig

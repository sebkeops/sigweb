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
  experimental: {
    // Le upload de logo/photos maquette accepte jusqu'à 4 Mo (validation côté
    // server action via processLogoBuffer). La valeur par défaut Next.js 15
    // est 1 Mo → tout fichier > 1 Mo était rejeté avec un 413 avant même
    // d'atteindre notre code, ce qui faisait remonter une erreur générique.
    //
    // Le cap est à 4 Mo (et pas 5 Mo) pour rester sous la limite serverless
    // Vercel Hobby de 4.5 Mo : un 5 Mo passerait Next mais serait rejeté
    // par l'infra Vercel avec un 413.
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig

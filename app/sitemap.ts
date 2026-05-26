import type { MetadataRoute } from 'next'
import { getAllPublishedSimulationSlugs } from '@/lib/data/simulations/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Récupère les slugs des simulations publiées depuis Supabase (au lieu
  // des JSON locaux supprimés en Phase 3). Lecture publique RLS, pas de
  // round-trip coûteux : la requête est cachée par Next.js au niveau du
  // build et revalidée selon la stratégie de Next pour le sitemap.
  const slugs = await getAllPublishedSimulationSlugs()
  const simulationRoutes = slugs.map((slug) => ({
    url: `${BASE_URL}/simulations/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/simulations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...simulationRoutes,
    {
      url: `${BASE_URL}/realisations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/methode`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/simulateur`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/politique-confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}

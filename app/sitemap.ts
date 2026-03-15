import type { MetadataRoute } from 'next'
import { getAllSimulationSlugs } from '@/lib/data/simulations'

const BASE_URL = 'https://sigweb.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const simulationRoutes = getAllSimulationSlugs().map((slug) => ({
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
  ]
}

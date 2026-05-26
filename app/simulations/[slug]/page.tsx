import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllPublishedSimulationSlugs, getSimulationFromDb } from '@/lib/data/simulations/db'
import SimulationPage from '@/components/simulations/SimulationPage'

/**
 * ISR : la page est statique mais revalidée toutes les heures.
 *
 * Compromis volontaire : un changement éditorial fait via l'admin
 * (publication, dépublication, retouche d'une simulation) apparaît
 * au plus tard 1 h plus tard côté front. À l'échelle du contenu
 * statique d'un site vitrine, c'est largement acceptable et ça évite
 * de payer un round-trip BDD à chaque requête anonyme.
 *
 * Pour forcer un rafraîchissement immédiat après édition admin :
 * faire un déploiement (qui purge le cache ISR).
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllPublishedSimulationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getSimulationFromDb(slug)
  if (!data) return {}
  const title = data.seoTitle ?? `Exemple de site internet pour ${data.name} | SIGWEB`
  const description =
    data.seoDescription ??
    `Découvrez un exemple de site internet pour ${data.name}. Réalisable pour votre commerce entre Toulouse et le Gers, en Occitanie.`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/simulations/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: data.heroImage }],
    },
  }
}

export default async function SimulationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getSimulationFromDb(slug)
  if (!data) notFound()
  return <SimulationPage data={data} />
}

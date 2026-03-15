import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllSimulationSlugs, getSimulationBySlug } from '@/lib/data/simulations'
import SimulationPage from '@/components/simulations/SimulationPage'

export function generateStaticParams() {
  return getAllSimulationSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = getSimulationBySlug(slug)
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
  const data = getSimulationBySlug(slug)
  if (!data) notFound()
  return <SimulationPage data={data} />
}

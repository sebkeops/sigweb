import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllPublishedSimulationSlugs, getSimulationFromDb } from '@/lib/data/simulations/db'
import { getTemplate } from '@/lib/maquette'
import { getEffectivePalette, paletteToCssVars } from '@/lib/maquette/render/palette'
import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { simulationPayloadToRenderProps } from '@/lib/data/simulations/render-adapter'
import demoStyles from '@/app/demos/[slug]/styles.module.css'
import Header from '@/app/demos/[slug]/components/Header'
import Hero from '@/app/demos/[slug]/components/Hero'
import Histoire from '@/app/demos/[slug]/components/Histoire'
import Univers from '@/app/demos/[slug]/components/Univers'
import CtaBanner from '@/app/demos/[slug]/components/CtaBanner'
import Avis from '@/app/demos/[slug]/components/Avis'
import Infos from '@/app/demos/[slug]/components/Infos'
import Footer from '@/app/demos/[slug]/components/Footer'
import FictiveDataDisclaimer from '@/components/simulations/FictiveDataDisclaimer'

/**
 * Rendu unifié des simulations publiques /simulations/[slug].
 *
 * Réutilise stricte des sous-composants de `app/demos/[slug]/components/*`
 * pour garantir que ce qu'un prospect voit en navigant la galerie publique
 * correspond exactement au format de présentation qu'il aurait en RDV.
 *
 * Source des données : `projects.simulation_data` (JSONB) — chaque ligne
 * porte un payload `{ maquette, prospect }` (cf. `lib/maquette/data-schema.ts`).
 * L'adaptateur `simulationPayloadToRenderProps()` construit les objets
 * `Maquette` et `Prospect` complets attendus par les composants.
 */

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
  const payload = await getSimulationFromDb(slug)
  if (!payload) {
    return { title: 'Simulation introuvable', robots: { index: false, follow: false } }
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'
  const name = stripItalicMarkers(payload.prospect.nom_commerce)
  return {
    title: `Exemple de site internet pour ${name} | SIGWEB`,
    description: `Découvrez un exemple de site internet pour ${name}. Réalisable pour votre commerce entre Toulouse et le Gers, en Occitanie.`,
    alternates: {
      canonical: `${siteUrl}/simulations/${slug}`,
    },
  }
}

export default async function SimulationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getSimulationFromDb(slug)
  if (!payload) notFound()

  const { maquette, prospect } = simulationPayloadToRenderProps(payload, slug)

  const template = getTemplate(maquette.template_variant)
  const palette = getEffectivePalette(maquette, template.palette)
  const cssVars = paletteToCssVars(palette)

  return (
    <div className={demoStyles.demoRoot} style={cssVars}>
      <Header
        maquette={maquette}
        prospect={prospect}
        brandTagline={template.defaults.brandTagline}
        defaultNavHistoireLabel={template.defaults.navHistoireLabel}
        defaultNavUniversLabel={template.defaults.navUniversLabel}
        cssVars={cssVars}
      />
      <Hero
        maquette={maquette}
        prospect={prospect}
        defaultCtaPrimaire={template.defaults.heroCtaPrimaire}
      />
      <Histoire
        maquette={maquette}
        prospect={prospect}
        defaultValeurs={template.valeursItems}
        defaultSuptitle={template.defaults.histoireSuptitle}
      />
      <Univers
        maquette={maquette}
        defaultItems={template.universItems}
        defaultSuptitle={template.defaults.universSectionSuptitle}
        defaultTitle={template.defaults.universSectionTitle}
        defaultIntro={template.defaults.universSectionIntro}
      />
      <CtaBanner maquette={maquette} prospect={prospect} />
      <Avis
        prospect={prospect}
        maquette={maquette}
        customAvis={maquette.avis_items}
        defaultSectionTitre={template.defaults.avisSectionTitre}
      />
      <Infos prospect={prospect} overrides={maquette.infos_overrides} />
      <Footer
        prospect={prospect}
        maquette={maquette}
        defaultBrandTagline={template.defaults.brandTagline}
        defaultNavHistoireLabel={template.defaults.navHistoireLabel}
        defaultNavUniversLabel={template.defaults.navUniversLabel}
        defaultFooterColonneLabel={template.defaults.footerColonneLabel}
        overrides={maquette.infos_overrides}
      />
      {/* Bandeau légal/éthique : uniquement sur /simulations/[slug], pas
          sur /demos/[slug] (vrais commerces — pas de disclaimer là-bas). */}
      <FictiveDataDisclaimer />
    </div>
  )
}

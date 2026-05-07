import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/maquette'
import { getEffectivePalette, paletteToCssVars } from '@/lib/maquette/render/palette'
import type { Maquette, Prospect } from '@/types'
import styles from '@/app/demos/[slug]/styles.module.css'
import Header from '@/app/demos/[slug]/components/Header'
import Hero from '@/app/demos/[slug]/components/Hero'
import Histoire from '@/app/demos/[slug]/components/Histoire'
import Univers from '@/app/demos/[slug]/components/Univers'
import CtaBanner from '@/app/demos/[slug]/components/CtaBanner'
import Avis from '@/app/demos/[slug]/components/Avis'
import Infos from '@/app/demos/[slug]/components/Infos'
import Footer from '@/app/demos/[slug]/components/Footer'
import PreviewHeightReporter from './PreviewHeightReporter'

/**
 * Preview admin d'une maquette — même rendu visuel que `/demos/[slug]`,
 * mais ouvre la maquette MÊME NON PUBLIÉE (lecture par prospect_id, pas
 * par slug+published).
 *
 * Sécurité : auth admin obligatoire via `auth.getUser` (la route est hors
 * de `(protected)` pour éviter le layout admin avec sa barre de navigation).
 *
 * Consommée par l'iframe de l'éditeur `/admin/crm/[id]/maquette`.
 */

interface Props {
  params: Promise<{ prospectId: string }>
}

export default async function MaquettePreviewPage({ params }: Props) {
  const { prospectId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: maquette } = await supabase
    .from('maquettes')
    .select('*')
    .eq('prospect_id', prospectId)
    .maybeSingle()

  if (!maquette) notFound()

  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()

  if (!prospect) notFound()

  const m = maquette as Maquette
  const p = prospect as Prospect

  const template = getTemplate(m.template_variant)
  const palette = getEffectivePalette(m, template.palette)
  const cssVars = paletteToCssVars(palette)

  return (
    <div className={styles.demoRoot} style={cssVars}>
      <PreviewHeightReporter />
      <Header
        maquette={m}
        prospect={p}
        brandTagline={template.defaults.brandTagline}
        cssVars={cssVars}
      />
      <Hero maquette={m} prospect={p} />
      <Histoire maquette={m} prospect={p} defaultValeurs={template.valeursItems} />
      <Univers
        maquette={m}
        defaultItems={template.universItems}
        sectionTitle={template.defaults.universSectionTitle}
        sectionIntro={template.defaults.universSectionIntro}
      />
      <CtaBanner maquette={m} prospect={p} />
      <Avis prospect={p} customAvis={m.avis_items} />
      <Infos prospect={p} overrides={m.infos_overrides} />
      <Footer
        prospect={p}
        brandTagline={template.defaults.brandTagline}
        overrides={m.infos_overrides}
      />
    </div>
  )
}

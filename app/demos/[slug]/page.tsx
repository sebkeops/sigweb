import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplate } from '@/lib/maquette'
import { getEffectivePalette, paletteToCssVars } from '@/lib/maquette/render/palette'
import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import type { Maquette, Prospect } from '@/types'
import styles from './styles.module.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Histoire from './components/Histoire'
import Univers from './components/Univers'
import CtaBanner from './components/CtaBanner'
import Avis from './components/Avis'
import Infos from './components/Infos'
import Footer from './components/Footer'

interface Props {
  params: Promise<{ slug: string }>
}

async function getPublishedMaquette(slug: string): Promise<Maquette | null> {
  const supabase = await createClient()
  // RLS publique sur les maquettes published=true → pas besoin d'auth.
  // Une maquette `published=false` renverra `data=null` ici, ce qui
  // déclenche un 404 (et pas une fuite de la maquette en brouillon).
  const { data, error } = await supabase
    .from('maquettes')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('[demos/page] fetch maquette', error)
    return null
  }
  return (data as Maquette | null) ?? null
}

async function getProspectFor(maquette: Maquette): Promise<Prospect | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', maquette.prospect_id)
    .maybeSingle()

  if (error) {
    console.error('[demos/page] fetch prospect', error)
    return null
  }
  return (data as Prospect | null) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const maquette = await getPublishedMaquette(slug)
  if (!maquette) {
    return { title: 'Maquette introuvable', robots: { index: false, follow: false } }
  }
  const prospect = await getProspectFor(maquette)
  const name = stripItalicMarkers(prospect?.nom_commerce ?? 'Maquette')
  return {
    title: `${name} — Maquette par Sigweb`,
    description: `Maquette de démonstration pour ${name}, conçue par Sigweb.`,
    // Critique : ces pages ne doivent jamais être indexées (pollue le SEO
    // de sigweb.fr et du commerce concerné). Cf. brief — règle absolue.
    robots: { index: false, follow: false },
  }
}

export default async function MaquettePage({ params }: Props) {
  const { slug } = await params
  const maquette = await getPublishedMaquette(slug)
  if (!maquette) notFound()

  const prospect = await getProspectFor(maquette)
  if (!prospect) notFound()

  const template = getTemplate(maquette.template_variant)
  const palette = getEffectivePalette(maquette, template.palette)
  const cssVars = paletteToCssVars(palette)

  return (
    <div className={styles.demoRoot} style={cssVars}>
      <Header
        maquette={maquette}
        prospect={prospect}
        brandTagline={template.defaults.brandTagline}
        cssVars={cssVars}
      />
      <Hero maquette={maquette} prospect={prospect} />
      <Histoire
        maquette={maquette}
        prospect={prospect}
        defaultValeurs={template.valeursItems}
      />
      <Univers
        maquette={maquette}
        defaultItems={template.universItems}
        sectionTitle={template.defaults.universSectionTitle}
        sectionIntro={template.defaults.universSectionIntro}
      />
      <CtaBanner maquette={maquette} prospect={prospect} />
      <Avis prospect={prospect} customAvis={maquette.avis_items} />
      <Infos prospect={prospect} />
      <Footer prospect={prospect} brandTagline={template.defaults.brandTagline} />
    </div>
  )
}

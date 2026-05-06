import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Accordion, AccordionItem } from '@/components/ui/Accordion'
import type { Maquette, Prospect } from '@/types'
import { EditorProvider } from './editor/EditorContext'
import EditorHeader from './EditorHeader'
import LockBodyScroll from './LockBodyScroll'
import PreviewPane from './PreviewPane'
import styles from './styles.module.css'
import { getTemplate } from '@/lib/maquette'
import IdentitySection from './sections/IdentitySection'
import PhotosSection from './sections/PhotosSection'
import HeroSection from './sections/HeroSection'
import HistoireSection from './sections/HistoireSection'
import UniversSection from './sections/UniversSection'
import CtaSection from './sections/CtaSection'
import AvisSection from './sections/AvisSection'
import InfosSection from './sections/InfosSection'
import AdvancedSection from './sections/AdvancedSection'

export const metadata: Metadata = { title: 'Éditeur maquette | Admin Sigweb' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaquetteEditorPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()

  const { data: maquette } = await supabase
    .from('maquettes')
    .select('*')
    .eq('prospect_id', id)
    .maybeSingle()

  if (!maquette) notFound()

  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!prospect) notFound()

  const m = maquette as Maquette
  const p = prospect as Prospect

  const previewUrl = `/admin/maquette-preview/${id}`
  const template = getTemplate(m.template_variant)
  const universItems = m.univers_items ?? template.universItems

  return (
    <EditorProvider maquetteId={m.id} initialUpdatedAt={m.updated_at}>
      <LockBodyScroll />
      <EditorHeader maquette={m} prospectId={id} prospectName={p.nom_commerce} />

      <div className={styles.editorLayout}>
        <div className={styles.formColumn}>
          <Accordion
            storageKey={`editor-${m.id}`}
            defaultOpen={['identity', 'hero']}
          >
            <AccordionItem id="identity" title="1. Identité & branding">
              <IdentitySection maquette={m} />
            </AccordionItem>
            <AccordionItem id="photos" title="2. Photos">
              <PhotosSection maquette={m} universItems={universItems} />
            </AccordionItem>
            <AccordionItem id="hero" title="3. Hero">
              <HeroSection maquette={m} />
            </AccordionItem>
            <AccordionItem id="histoire" title="4. Histoire">
              <HistoireSection maquette={m} />
            </AccordionItem>
            <AccordionItem id="univers" title="5. Univers produits">
              <UniversSection maquette={m} />
            </AccordionItem>
            <AccordionItem id="cta" title="6. CTA banner">
              <CtaSection maquette={m} />
            </AccordionItem>
            <AccordionItem id="avis" title="7. Avis Google">
              <AvisSection prospect={p} />
            </AccordionItem>
            <AccordionItem id="infos" title="8. Infos pratiques">
              <InfosSection prospect={p} />
            </AccordionItem>
            <AccordionItem id="advanced" title="9. Avancé">
              <AdvancedSection maquette={m} prospectId={id} />
            </AccordionItem>
          </Accordion>
        </div>

        <div className={styles.previewColumn}>
          <PreviewPane previewUrl={previewUrl} />
        </div>
      </div>
    </EditorProvider>
  )
}

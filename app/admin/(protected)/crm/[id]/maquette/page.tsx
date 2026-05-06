import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublishToggleButton from './PublishToggleButton'

export const metadata: Metadata = { title: 'Maquette | Admin Sigweb' }

/**
 * Placeholder éditeur de maquette — Session 3 livrera l'UI complète.
 *
 * On vérifie quand même que la maquette existe (sinon 404) pour ne pas
 * proposer un placeholder sur une URL invalide. Si la maquette existe,
 * on affiche un message clair + un retour vers la fiche prospect.
 */

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaquetteEditorPlaceholder({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: maquette } = await supabase
    .from('maquettes')
    .select('id, slug, published, prospect_id')
    .eq('prospect_id', id)
    .maybeSingle()

  if (!maquette) notFound()

  const { data: prospect } = await supabase
    .from('prospects')
    .select('nom_commerce')
    .eq('id', id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <Link
        href={`/admin/crm/${id}`}
        className="font-body text-sm text-muted hover:text-primary"
      >
        ← Retour à la fiche prospect
      </Link>

      <div className="mt-8 rounded-md border border-border bg-surface p-10 shadow-sm">
        <h1 className="mb-3 font-heading text-2xl font-bold text-ink">
          Éditeur de maquette
        </h1>
        <p className="mb-6 font-body text-base text-text">
          Maquette générée pour <strong>{prospect?.nom_commerce ?? 'ce prospect'}</strong>.
          L&apos;éditeur sera disponible prochainement (Session 3).
        </p>
        <p className="mb-8 font-body text-sm text-muted">
          Slug : <code className="rounded bg-surface-strong px-2 py-1">{maquette.slug}</code>
          <br />
          Statut : {maquette.published ? 'publiée' : 'brouillon'}
        </p>

        <div className="flex flex-col items-center gap-4">
          <PublishToggleButton maquetteId={maquette.id} published={maquette.published} />

          <div className="flex flex-wrap justify-center gap-3">
            {maquette.published && (
              <a
                href={`/demos/${maquette.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-5 py-2.5 font-heading text-sm font-bold text-text transition-opacity hover:bg-surface-strong"
              >
                Voir la page publiée ↗
              </a>
            )}
            <Link
              href={`/admin/crm/${id}`}
              className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-5 py-2.5 font-heading text-sm font-bold text-text transition-opacity hover:bg-surface-strong"
            >
              Retour à la fiche
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

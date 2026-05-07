'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishMaquette, unpublishMaquette } from '@/lib/actions/maquette'
import type { Maquette } from '@/types'
import SaveStatus from './editor/SaveStatus'

interface Props {
  maquette: Maquette
  prospectId: string
  prospectName: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'

/**
 * Header sticky de l'éditeur : breadcrumb + statut + boutons.
 *
 * Bouton "Sauvegardé" en placeholder désactivé en Phase 3.2 (rien à
 * sauvegarder tant que les sections d'édition ne sont pas implémentées).
 * Sera activé en 3.3+ avec un debounce 500ms et indicateur live.
 */
export default function EditorHeader({ maquette, prospectId, prospectName }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePublishToggle() {
    setError(null)
    startTransition(async () => {
      const r = maquette.published
        ? await unpublishMaquette(maquette.id)
        : await publishMaquette(maquette.id)
      if (!r.success) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 font-body text-sm">
          <Link href="/admin/crm" className="text-muted hover:text-primary">
            ← Prospects
          </Link>
          <span className="text-muted">/</span>
          <Link href={`/admin/crm/${prospectId}`} className="text-muted hover:text-primary">
            {prospectName}
          </Link>
          <span className="text-muted">/</span>
          <span className="font-heading font-bold text-ink">Maquette</span>
          <span
            className={
              maquette.published
                ? 'rounded-full bg-green-100 px-3 py-1 font-body text-xs font-semibold text-green-800'
                : 'rounded-full bg-yellow-100 px-3 py-1 font-body text-xs font-semibold text-yellow-800'
            }
          >
            {maquette.published ? 'Publiée' : 'Brouillon'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus />

          {maquette.published && (
            <a
              href={`${SITE_URL}/demos/${maquette.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-xs text-primary hover:underline"
            >
              Ouvrir la page publiée ↗
            </a>
          )}

          <button
            type="button"
            onClick={handlePublishToggle}
            disabled={pending}
            className={
              maquette.published
                ? 'rounded-md border border-border bg-transparent px-4 py-2 font-body text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:opacity-50'
                : 'rounded-md border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50'
            }
          >
            {pending
              ? '…'
              : maquette.published
                ? 'Dépublier'
                : 'Publier la maquette'}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 font-body text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

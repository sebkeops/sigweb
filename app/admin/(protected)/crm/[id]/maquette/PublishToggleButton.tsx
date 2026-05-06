'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishMaquette, unpublishMaquette } from '@/lib/actions/maquette'

interface Props {
  maquetteId: string
  published: boolean
}

/**
 * Bouton temporaire pour basculer publish / unpublish d'une maquette.
 * À retirer / fusionner dans l'éditeur complet (Session 3).
 */
export default function PublishToggleButton({ maquetteId, published }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      if (published) {
        const r = await unpublishMaquette(maquetteId)
        if (!r.success) { setError(r.error); return }
        setPublicUrl(null)
      } else {
        const r = await publishMaquette(maquetteId)
        if (!r.success) { setError(r.error); return }
        setPublicUrl(r.data.url)
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          published
            ? 'inline-flex items-center justify-center rounded-md border border-border bg-transparent px-5 py-2.5 font-heading text-sm font-bold text-text transition-opacity hover:bg-surface-strong disabled:opacity-50'
            : 'inline-flex items-center justify-center rounded-md border border-primary bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50'
        }
      >
        {pending ? '…' : (published ? 'Dépublier' : 'Publier la maquette')}
      </button>
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-xs text-primary hover:underline"
        >
          Ouvrir : {publicUrl} ↗
        </a>
      )}
      {error && <span className="font-body text-xs text-red-600">{error}</span>}
    </div>
  )
}

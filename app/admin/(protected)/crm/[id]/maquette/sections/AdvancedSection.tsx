'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { deleteMaquette } from '@/lib/actions/maquette'
import type { Maquette } from '@/types'
import SlugEditor from '../advanced/SlugEditor'

interface Props {
  maquette: Maquette
  /** Pour rediriger après suppression. */
  prospectId: string
}

/**
 * Section "Avancé" — édition du slug + zone destructive (suppression).
 */
export default function AdvancedSection({ maquette, prospectId }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const r = await deleteMaquette(maquette.id)
      if (!r.success) {
        setError(r.error)
        return
      }
      setConfirmOpen(false)
      router.push(`/admin/crm/${prospectId}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <SlugEditor maquette={maquette} />

      <div className="border-t border-border pt-6">
        <div className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-red-700">
          Zone destructive
        </div>
        <p className="mb-3 font-body text-sm text-text">
          La suppression de la maquette est irréversible. La fiche prospect ne sera pas affectée.
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-md border border-red-600 bg-transparent px-4 py-2 font-body text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Supprimer la maquette
        </button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        title="Supprimer cette maquette ?"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-text">
            Action irréversible. La fiche prospect ne sera pas affectée.
          </p>
          {error && <p className="font-body text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className="font-body text-sm text-muted hover:text-ink disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-md bg-red-600 px-4 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

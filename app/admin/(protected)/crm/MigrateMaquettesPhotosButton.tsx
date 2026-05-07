'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  /** Nombre de maquettes restant à migrer, calculé côté serveur. */
  pendingCount: number
}

interface MigrateResponse {
  ok: boolean
  total: number
  migrated: number
  failures: { id: string; error: string }[]
}

/**
 * Bouton ONE-SHOT pour migrer les maquettes existantes vers le nouveau modèle
 * photos pool + assignations. Idempotent : disparaît visuellement quand
 * `pendingCount === 0` (toutes les maquettes sont à jour).
 *
 * À retirer après usage (cf. CLEANUP-TODO.md).
 */
export default function MigrateMaquettesPhotosButton({ pendingCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (pendingCount === 0 && !result) return null

  async function handleClick() {
    if (!confirm(
      `Migrer ${pendingCount} maquette${pendingCount > 1 ? 's' : ''} vers le nouveau modèle photos ?\n\n` +
      `L'opération reconstruit available_photos + photo_assignments depuis ` +
      `les anciens champs. Idempotente.`
    )) {
      return
    }

    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/migrate-maquettes-photos', { method: 'POST' })
      const json = (await res.json()) as MigrateResponse
      if (!res.ok || !json.ok) {
        setError('Erreur lors de la migration.')
        return
      }
      setResult(
        `✓ ${json.migrated}/${json.total} maquette${json.total > 1 ? 's' : ''} migrée${json.migrated > 1 ? 's' : ''}` +
        (json.failures.length > 0 ? ` (${json.failures.length} échec${json.failures.length > 1 ? 's' : ''} — voir console)` : '')
      )
      if (json.failures.length > 0) {
        console.error('[migrate-maquettes-photos] failures:', json.failures)
      }
      router.refresh()
    } catch (e) {
      setError(`Erreur réseau : ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || pendingCount === 0}
        className="font-body text-xs text-muted hover:text-primary disabled:opacity-50"
      >
        {loading
          ? 'Migration…'
          : pendingCount > 0
            ? `Migrer photos (${pendingCount})`
            : 'Migration photos OK'}
      </button>
      {result && <span className="font-body text-xs text-primary-dark">{result}</span>}
      {error && <span className="font-body text-xs text-red-600">{error}</span>}
    </div>
  )
}

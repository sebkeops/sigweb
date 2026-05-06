'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

interface Props {
  /** Nombre de prospects ayant un google_place_id, calculé côté serveur. */
  eligibleCount: number
}

interface ProgressState {
  current: number
  total: number
  name: string | null
}

interface DoneState {
  updated: number
  failures: { id: string; nom: string; error: string }[]
}

interface ProgressEvent { type: 'progress'; current: number; total: number; name: string; ok: boolean }
interface StartEvent    { type: 'start'; total: number }
interface DoneEvent     { type: 'done'; updated: number; failures: { id: string; nom: string; error: string }[] }
type StreamEvent = ProgressEvent | StartEvent | DoneEvent

/**
 * Bouton header `/admin/crm` pour rafraîchir les avis Google de tous les
 * prospects ayant un google_place_id. Stream NDJSON depuis le route handler
 * pour afficher une progression en temps réel.
 */
export default function BackfillGoogleReviewsButton({ eligibleCount }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [done, setDone] = useState<DoneState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const running = progress !== null && done === null

  function reset() {
    setProgress(null)
    setDone(null)
    setError(null)
  }

  async function handleConfirm() {
    setConfirmOpen(false)
    reset()
    setProgress({ current: 0, total: eligibleCount, name: null })

    try {
      const res = await fetch('/api/admin/prospects/backfill-google-reviews', {
        method: 'POST',
      })
      if (!res.ok || !res.body) {
        setError(`Erreur ${res.status} lors du démarrage du backfill.`)
        setProgress(null)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })

        let nlIndex: number
        while ((nlIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nlIndex).trim()
          buffer = buffer.slice(nlIndex + 1)
          if (!line) continue

          let evt: StreamEvent
          try {
            evt = JSON.parse(line) as StreamEvent
          } catch {
            console.error('[backfill] malformed line', line)
            continue
          }

          if (evt.type === 'start') {
            setProgress({ current: 0, total: evt.total, name: null })
          } else if (evt.type === 'progress') {
            setProgress({ current: evt.current, total: evt.total, name: evt.name })
          } else if (evt.type === 'done') {
            setDone({ updated: evt.updated, failures: evt.failures })
            router.refresh()
          }
        }
      }
    } catch (e) {
      setError(`Erreur réseau : ${(e as Error).message}`)
      setProgress(null)
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={running || eligibleCount === 0}
          className="font-body text-xs text-muted hover:text-primary disabled:opacity-50"
        >
          {running
            ? `Avis Google… ${progress?.current ?? 0}/${progress?.total ?? eligibleCount}`
            : 'Recharger avis Google'}
        </button>
        {running && progress?.name && (
          <span className="font-body text-xs text-muted">{progress.name}</span>
        )}
        {done && !error && (
          <span className="font-body text-xs text-primary-dark">
            ✓ {done.updated}/{progress?.total ?? eligibleCount} mis à jour
            {done.failures.length > 0 && ` (${done.failures.length} échec${done.failures.length > 1 ? 's' : ''})`}
          </span>
        )}
        {error && <span className="font-body text-xs text-red-600">{error}</span>}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Recharger les avis Google ?"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-text">
            Cette action va rafraîchir les données Google (avis détaillés, note,
            photos, horaires) pour <strong>{eligibleCount} prospect{eligibleCount > 1 ? 's' : ''}</strong>{' '}
            ayant un identifiant Google. Cela va consommer environ {eligibleCount} appels à
            l&apos;API Google Places.
          </p>
          <p className="font-body text-xs text-muted">
            Les champs vitrine (adresse, téléphone, site web) que tu as pu modifier
            manuellement <strong>ne seront pas écrasés</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="font-body text-sm text-muted hover:text-ink"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-primary px-4 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Lancer le backfill
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

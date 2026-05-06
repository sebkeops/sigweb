'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

interface Props {
  /** Nombre de prospects ayant un google_place_id (calculé côté serveur). */
  eligibleCount: number
}

interface ProgressState {
  current: number
  total: number
  name: string | null
}

interface DoneState {
  prospects_processed: number
  prospects_with_maquette: number
  prospects_without_maquette: number
  total_photos_added: number
  total_photos_removed: number
  failures: { id: string; nom: string; error: string }[]
}

interface StartEvent { type: 'start'; total: number }
interface ProgressEvent { type: 'progress'; current: number; total: number; name: string; ok: boolean }
interface DoneEvent {
  type: 'done'
  prospects_processed: number
  prospects_with_maquette: number
  prospects_without_maquette: number
  total_photos_added: number
  total_photos_removed: number
  failures: { id: string; nom: string; error: string }[]
}
type StreamEvent = StartEvent | ProgressEvent | DoneEvent

/**
 * Bouton header `/admin/crm` pour rafraîchir les photos Google :
 *   - re-fetch Google Places (jusqu'à 10 photos par prospect)
 *   - met à jour prospects.google_photo_refs
 *   - merge intelligent dans maquettes.available_photos (sans casser les
 *     assignations en cours)
 *
 * Modale de confirmation explicite avec les garanties (cf. brief 3.6).
 * Stream NDJSON pour la progression en temps réel.
 */
export default function BackfillGooglePhotosButton({ eligibleCount }: Props) {
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
      const res = await fetch('/api/admin/prospects/backfill-google-photos', { method: 'POST' })
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

        let nl: number
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (!line) continue
          let evt: StreamEvent
          try {
            evt = JSON.parse(line) as StreamEvent
          } catch {
            console.error('[backfill-photos] malformed line', line)
            continue
          }
          if (evt.type === 'start') {
            setProgress({ current: 0, total: evt.total, name: null })
          } else if (evt.type === 'progress') {
            setProgress({ current: evt.current, total: evt.total, name: evt.name })
          } else if (evt.type === 'done') {
            setDone({
              prospects_processed: evt.prospects_processed,
              prospects_with_maquette: evt.prospects_with_maquette,
              prospects_without_maquette: evt.prospects_without_maquette,
              total_photos_added: evt.total_photos_added,
              total_photos_removed: evt.total_photos_removed,
              failures: evt.failures,
            })
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
            ? `Photos Google… ${progress?.current ?? 0}/${progress?.total ?? eligibleCount}`
            : 'Recharger photos Google'}
        </button>
        {running && progress?.name && (
          <span className="font-body text-xs text-muted">{progress.name}</span>
        )}
        {done && !error && (
          <span className="font-body text-xs text-primary-dark">
            ✓ {done.prospects_processed} prospects · +{done.total_photos_added} ajoutées
            {done.total_photos_removed > 0 && ` · -${done.total_photos_removed} retirées`}
            {done.failures.length > 0 && ` · ${done.failures.length} échec${done.failures.length > 1 ? 's' : ''}`}
          </span>
        )}
        {error && <span className="font-body text-xs text-red-600">{error}</span>}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Recharger les photos Google ?"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-text">
            Cette action va re-fetcher Google Places pour <strong>{eligibleCount} prospect{eligibleCount > 1 ? 's' : ''}</strong>{' '}
            (~{eligibleCount} appels API Google) et propager les photos vers les pools des maquettes.
          </p>
          <ul className="list-disc space-y-1 pl-5 font-body text-xs text-muted">
            <li>Les nouvelles photos Google sont ajoutées au pool de chaque maquette.</li>
            <li>Les photos déjà assignées à un slot sont préservées, même si Google ne les renvoie plus.</li>
            <li>Les photos Google non assignées et plus renvoyées par Google sont retirées du pool.</li>
            <li>Les uploads manuels ne sont jamais touchés.</li>
          </ul>
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

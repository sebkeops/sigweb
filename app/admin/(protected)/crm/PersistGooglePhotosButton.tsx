'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

interface Props {
  /** Nombre de maquettes ayant au moins une entrée `source: 'google'` dans leur pool. */
  eligibleCount: number
}

interface ProgressState {
  current: number
  total: number
  slug: string | null
}

interface DoneState {
  dryRun: boolean
  maquettes_total: number
  maquettes_updated: number
  maquettes_unchanged: number
  maquettes_stale: number
  photos_persisted: number
  photos_failed: number
  failures: {
    maquette_id: string
    slug: string | null
    reason: string
    failed_entries: number
  }[]
}

interface StartEvent { type: 'start'; total: number; dryRun: boolean }
interface ProgressEvent {
  type: 'progress'
  current: number
  total: number
  slug: string | null
  ok: boolean
}
interface DoneEvent extends DoneState { type: 'done' }
type StreamEvent = StartEvent | ProgressEvent | DoneEvent

/**
 * Bouton header `/admin/crm` : reprise des maquettes existantes — télécharge
 * les photos Google encore dans le pool et les persiste dans Supabase Storage.
 *
 * Pourquoi : les refs Google Places expirent, les anciennes maquettes ont
 * des photos qui finissent par tomber en 502. Ce bouton répare le passif
 * (les nouvelles maquettes sont déjà OK depuis fix(maquette) #43).
 *
 * Dry-run par défaut dans la modale (sécurité) : on tente les fetch Google
 * (coût identique) mais aucune écriture BDD ni Storage. Permet de prévoir
 * combien de photos passeront vs échoueront avant de lancer pour de vrai.
 */
export default function PersistGooglePhotosButton({ eligibleCount }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dryRun, setDryRun] = useState(true)
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
    setProgress({ current: 0, total: eligibleCount, slug: null })

    try {
      const qs = dryRun ? '?dryRun=1' : ''
      const res = await fetch(`/api/admin/maquettes/persist-google-photos${qs}`, {
        method: 'POST',
      })
      if (!res.ok || !res.body) {
        setError(`Erreur ${res.status} lors du démarrage.`)
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
            console.error('[persist-google-photos] malformed line', line)
            continue
          }
          if (evt.type === 'start') {
            setProgress({ current: 0, total: evt.total, slug: null })
          } else if (evt.type === 'progress') {
            setProgress({ current: evt.current, total: evt.total, slug: evt.slug })
          } else if (evt.type === 'done') {
            setDone({
              dryRun: evt.dryRun,
              maquettes_total: evt.maquettes_total,
              maquettes_updated: evt.maquettes_updated,
              maquettes_unchanged: evt.maquettes_unchanged,
              maquettes_stale: evt.maquettes_stale,
              photos_persisted: evt.photos_persisted,
              photos_failed: evt.photos_failed,
              failures: evt.failures,
            })
            if (!evt.dryRun) router.refresh()
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
          onClick={() => {
            setDryRun(true)
            setConfirmOpen(true)
          }}
          disabled={running || eligibleCount === 0}
          className="font-body text-xs text-muted hover:text-primary disabled:opacity-50"
        >
          {running
            ? `Persistance… ${progress?.current ?? 0}/${progress?.total ?? eligibleCount}`
            : `Persister photos Google (${eligibleCount})`}
        </button>
        {running && progress?.slug && (
          <span className="font-body text-xs text-muted">{progress.slug}</span>
        )}
        {done && !error && (
          <span className="font-body text-xs text-primary-dark">
            {done.dryRun ? '↳ Dry-run · ' : '✓ '}
            {done.maquettes_updated} maquette{done.maquettes_updated > 1 ? 's' : ''}
            {' '}· {done.photos_persisted} photos persistées
            {done.photos_failed > 0 && ` · ${done.photos_failed} échec${done.photos_failed > 1 ? 's' : ''}`}
            {done.maquettes_stale > 0 && ` · ${done.maquettes_stale} stale`}
          </span>
        )}
        {error && <span className="font-body text-xs text-red-600">{error}</span>}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Persister les photos Google ?"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-text">
            <strong>{eligibleCount} maquette{eligibleCount > 1 ? 's' : ''}</strong> contient
            encore des photos Google volatiles. Cette action télécharge chaque photo
            et l&apos;upload dans Supabase Storage pour la rendre permanente.
          </p>
          <ul className="list-disc space-y-1 pl-5 font-body text-xs text-muted">
            <li>Idempotent : les photos déjà persistées (source upload) sont ignorées.</li>
            <li>Si une ref Google a expiré et que le prospect a un google_place_id, on tente avec une ref fraîche.</li>
            <li>Les échecs irréversibles laissent l&apos;entrée Google d&apos;origine — la maquette reste créée.</li>
            <li>Coût : un appel Google par photo (+ un getPlaceDetails par maquette ayant des échecs).</li>
          </ul>

          <label className="flex items-center gap-2 rounded-md border border-border bg-surface p-3 font-body text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4"
            />
            <span>
              <strong>Dry-run</strong> — simule (fetch Google effectués, aucune
              écriture BDD/Storage). Utile pour estimer le taux de succès.
            </span>
          </label>

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
              {dryRun ? 'Lancer le dry-run' : 'Persister pour de vrai'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

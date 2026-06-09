'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

interface Props {
  /** Nombre de maquettes ayant au moins une entrée `source: 'google'` dans leur pool. */
  eligibleCount: number
}

interface ProgressState {
  current: number          // index courant dans le lot
  total: number            // taille du lot courant
  slug: string | null
  batchIndex: number       // n° de lot (1, 2, …)
  cumulativeCurrent: number // maquettes terminées depuis le début (tous lots)
  cumulativeTotal: number  // eligibleCount au moment du démarrage
}

interface FailureRecord {
  maquette_id: string
  prospect_id: string
  slug: string | null
  reason: string
  failed_entries: number
}

interface RunTotals {
  dryRun: boolean
  maquettes_updated: number
  maquettes_unchanged: number
  maquettes_stale: number
  photos_persisted: number
  photos_failed: number
  failures: FailureRecord[]
  batches: number
}

interface StartEvent {
  type: 'start'
  total: number
  eligibleTotal: number
  remainingAfter: number
  dryRun: boolean
}
interface ProgressEvent {
  type: 'progress'
  current: number
  total: number
  slug: string | null
  ok: boolean
}
interface DoneEvent {
  type: 'done'
  dryRun: boolean
  maquettes_total: number
  maquettes_updated: number
  maquettes_unchanged: number
  maquettes_stale: number
  photos_persisted: number
  photos_failed: number
  eligibleTotal: number
  remainingAfter: number
  failures: FailureRecord[]
}
type StreamEvent = StartEvent | ProgressEvent | DoneEvent

const BATCH_SIZE = 8  // ~5 s/maquette × 8 = ~40 s < 60 s maxDuration Hobby

/**
 * Bouton header `/admin/crm` : reprise des maquettes existantes — télécharge
 * les photos Google encore dans le pool et les persiste dans Supabase Storage.
 *
 * Auto-batching : Vercel Hobby a un timeout de 60 s par fonction. La route
 * accepte `?limit=8` et on boucle côté UI tant qu'il reste des éligibles.
 * Le user clique UNE fois, l'UI enchaîne les lots automatiquement.
 *
 * Dry-run par défaut dans la modale (sécurité) : on tente les fetch Google
 * (coût identique) mais aucune écriture BDD ni Storage.
 */
export default function PersistGooglePhotosButton({ eligibleCount }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dryRun, setDryRun] = useState(true)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [done, setDone] = useState<RunTotals | null>(null)
  const [error, setError] = useState<string | null>(null)

  const running = progress !== null && done === null

  function reset() {
    setProgress(null)
    setDone(null)
    setError(null)
  }

  /**
   * Lance un seul lot. Renvoie le résumé `done` ou throw en cas d'erreur.
   * La progression côté `setProgress` est mise à jour au fil de l'eau.
   */
  async function runOneBatch(
    dryRunFlag: boolean,
    batchIndex: number,
    cumulativeBefore: number,
    cumulativeTotal: number
  ): Promise<DoneEvent> {
    const params = new URLSearchParams()
    if (dryRunFlag) params.set('dryRun', '1')
    params.set('limit', String(BATCH_SIZE))

    const res = await fetch(`/api/admin/maquettes/persist-google-photos?${params.toString()}`, {
      method: 'POST',
    })
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let lastDone: DoneEvent | null = null

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
          setProgress({
            current: 0,
            total: evt.total,
            slug: null,
            batchIndex,
            cumulativeCurrent: cumulativeBefore,
            cumulativeTotal,
          })
        } else if (evt.type === 'progress') {
          setProgress({
            current: evt.current,
            total: evt.total,
            slug: evt.slug,
            batchIndex,
            cumulativeCurrent: cumulativeBefore + evt.current,
            cumulativeTotal,
          })
        } else if (evt.type === 'done') {
          lastDone = evt
        }
      }
    }

    if (!lastDone) throw new Error('stream closed without done event')
    return lastDone
  }

  async function handleConfirm() {
    setConfirmOpen(false)
    reset()
    const dryRunFlag = dryRun
    const cumulativeTotal = eligibleCount

    setProgress({
      current: 0,
      total: 0,
      slug: null,
      batchIndex: 1,
      cumulativeCurrent: 0,
      cumulativeTotal,
    })

    const totals: RunTotals = {
      dryRun: dryRunFlag,
      maquettes_updated: 0,
      maquettes_unchanged: 0,
      maquettes_stale: 0,
      photos_persisted: 0,
      photos_failed: 0,
      failures: [],
      batches: 0,
    }

    try {
      let batchIndex = 1
      let cumulativeBefore = 0
      const maxBatches = Math.ceil(cumulativeTotal / BATCH_SIZE) + 2  // safety

      while (batchIndex <= maxBatches) {
        const result = await runOneBatch(dryRunFlag, batchIndex, cumulativeBefore, cumulativeTotal)

        totals.maquettes_updated += result.maquettes_updated
        totals.maquettes_unchanged += result.maquettes_unchanged
        totals.maquettes_stale += result.maquettes_stale
        totals.photos_persisted += result.photos_persisted
        totals.photos_failed += result.photos_failed
        totals.failures.push(...result.failures)
        totals.batches = batchIndex

        cumulativeBefore += result.maquettes_total

        // En dry-run : les maquettes ne sont pas modifiées en BDD, donc
        // re-sélectionner renverra TOUJOURS les mêmes lignes → on boucle
        // infiniment. On s'arrête après 1 lot pour le dry-run.
        if (dryRunFlag) break

        // En mode réel : si moins que BATCH_SIZE traité, c'est qu'il n'y
        // a plus d'éligibles. On peut s'arrêter.
        if (result.maquettes_total < BATCH_SIZE) break
        if (result.remainingAfter <= 0) break

        batchIndex += 1
      }

      setDone(totals)
      if (!dryRunFlag) router.refresh()
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
            ? `Persistance lot ${progress?.batchIndex ?? 1}… ${progress?.cumulativeCurrent ?? 0}/${progress?.cumulativeTotal ?? eligibleCount}`
            : `Persister photos Google (${eligibleCount})`}
        </button>
        {running && progress?.slug && (
          <span className="font-body text-xs text-muted">{progress.slug}</span>
        )}
        {done && !error && (
          <>
            <span className="font-body text-xs text-primary-dark">
              {done.dryRun ? `↳ Dry-run lot 1 · ` : `✓ ${done.batches} lot${done.batches > 1 ? 's' : ''} · `}
              {done.maquettes_updated} maquette{done.maquettes_updated > 1 ? 's' : ''}
              {' '}· {done.photos_persisted} photos persistées
              {done.photos_failed > 0 && ` · ${done.photos_failed} échec${done.photos_failed > 1 ? 's' : ''}`}
              {done.maquettes_stale > 0 && ` · ${done.maquettes_stale} stale`}
            </span>
            {done.failures.length > 0 && (
              <details className="mt-1 w-72 rounded-md border border-amber-200 bg-amber-50 p-2 text-left">
                <summary className="cursor-pointer font-body text-xs font-semibold text-amber-900">
                  ⚠ {done.failures.length} maquette{done.failures.length > 1 ? 's' : ''} à corriger manuellement
                </summary>
                <ul className="mt-2 space-y-1">
                  {done.failures.map((f) => (
                    <li key={f.maquette_id} className="font-body text-xs text-amber-900">
                      <a
                        href={`/admin/crm/${f.prospect_id}/maquette`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:text-primary"
                      >
                        {f.slug ?? f.maquette_id}
                      </a>
                      {' '}— {f.failed_entries} photo{f.failed_entries > 1 ? 's' : ''} KO
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-body text-[11px] text-amber-800">
                  Ouvre l&apos;éditeur de chaque maquette et upload une photo de remplacement
                  via le PhotoManager (les slots concernés afficheront un placeholder en attendant).
                </p>
              </details>
            )}
          </>
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
            encore des photos Google volatiles. L&apos;action télécharge chaque photo
            et l&apos;upload dans Supabase Storage pour la rendre permanente.
          </p>
          <ul className="list-disc space-y-1 pl-5 font-body text-xs text-muted">
            <li>Traitement par lots de {BATCH_SIZE} maquettes (Vercel Hobby = 60 s par fonction).</li>
            <li>L&apos;UI enchaîne les lots automatiquement — un seul clic suffit.</li>
            <li>Idempotent : les photos déjà persistées (source upload) sont ignorées.</li>
            <li>Si une ref Google a expiré et que le prospect a un google_place_id, on tente avec une ref fraîche.</li>
            <li>Les échecs irréversibles laissent l&apos;entrée Google d&apos;origine — la maquette reste créée.</li>
            <li>En dry-run : on traite UN seul lot pour estimer (sinon on boucle infiniment vu qu&apos;aucune écriture n&apos;a lieu).</li>
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
              écriture BDD/Storage). Limité à 1 lot.
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
              {dryRun ? `Lancer le dry-run (${BATCH_SIZE} max)` : 'Persister pour de vrai'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

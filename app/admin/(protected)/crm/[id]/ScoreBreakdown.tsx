'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Prospect } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  clearManualScoreOverride,
  recomputeProspectScore,
  setManualScoreOverride,
} from '@/lib/actions/score'

interface Props {
  prospect: Prospect
}

function Bar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScoreBreakdown({ prospect: p }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [overrideValue, setOverrideValue] = useState(
    String(p.score_override_manuel ?? p.score ?? 0)
  )
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const isOverride = p.score_override_manuel != null
  const displayed = p.score ?? 0
  const auto = p.score_calcule

  function handleRecompute() {
    setError(null)
    setFlash(null)
    startTransition(async () => {
      const r = await recomputeProspectScore(p.id)
      if (r.success) {
        setFlash(`✓ Score ${isOverride ? 'auto recalculé' : 'recalculé'} : ${r.score}/10`)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  function openModal() {
    setError(null)
    setFlash(null)
    setOverrideValue(String(p.score_override_manuel ?? p.score ?? 0))
    setModalOpen(true)
  }

  function handleSubmitOverride() {
    setError(null)
    const score = parseInt(overrideValue, 10)
    if (!Number.isInteger(score) || score < 0 || score > 10) {
      setError('Le score doit être un entier entre 0 et 10.')
      return
    }
    startTransition(async () => {
      const r = await setManualScoreOverride(p.id, score)
      if (r.success) {
        setModalOpen(false)
        setFlash(`✓ Score forcé à ${r.score}/10`)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  function handleClearOverride() {
    setError(null)
    setFlash(null)
    if (!confirm('Revenir au score automatique ?')) return
    startTransition(async () => {
      const r = await clearManualScoreOverride(p.id)
      if (r.success) {
        setFlash(`✓ Score auto restauré : ${r.score}/10`)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          Détail du score{' '}
          <span className="font-body text-xs font-medium text-muted">
            {isOverride ? '— ✋ manuel' : '— 🤖 auto'}
          </span>
        </h2>
        <span className="font-body text-xs text-muted">
          Calculé le {formatDateTime(p.score_calcule_at)}
        </span>
      </div>

      {/* Score total */}
      <div className="mb-6 flex items-baseline gap-2">
        <span
          className={`font-heading text-5xl font-extrabold ${
            isOverride ? 'text-accent' : 'text-primary'
          }`}
        >
          {displayed}
        </span>
        <span className="font-body text-xl text-muted">/10</span>
      </div>

      {/* Bandeau override */}
      {isOverride && (
        <div className="mb-6 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 font-body text-sm text-orange-900">
          ⚠️ Ce score a été modifié manuellement
          {p.score_override_at ? ` le ${formatDateTime(p.score_override_at)}` : ''}.
          Le score automatique serait : <strong>{auto != null ? `${auto}/10` : '—'}</strong>.{' '}
          <button
            type="button"
            onClick={handleClearOverride}
            disabled={pending}
            className="ml-1 underline hover:no-underline disabled:opacity-50"
          >
            Revenir au score auto
          </button>
        </div>
      )}

      {/* Sous-scores avec barres */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="mb-1 flex justify-between font-body text-sm">
            <span className="font-semibold text-ink">Proximité</span>
            <span className="text-muted">{p.score_proximite ?? 0} / 4</span>
          </div>
          <Bar value={p.score_proximite ?? 0} max={4} />
        </div>
        <div>
          <div className="mb-1 flex justify-between font-body text-sm">
            <span className="font-semibold text-ink">Besoin web</span>
            <span className="text-muted">{p.score_besoin_web ?? 0} / 4</span>
          </div>
          <Bar value={p.score_besoin_web ?? 0} max={4} />
        </div>
        <div>
          <div className="mb-1 flex justify-between font-body text-sm">
            <span className="font-semibold text-ink">Activité</span>
            <span className="text-muted">{p.score_activite ?? 0} / 2</span>
          </div>
          <Bar value={p.score_activite ?? 0} max={2} />
        </div>
        {p.score_malus != null && p.score_malus < 0 && (
          <div className="font-body text-sm text-red-700">
            <span className="font-semibold">Malus :</span> {p.score_malus} pt
          </div>
        )}
      </div>

      {/* Explications */}
      {p.score_explanations && p.score_explanations.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Détails du calcul
          </p>
          <ul className="space-y-1 font-body text-sm text-text">
            {p.score_explanations.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {flash && (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary-soft/40 px-4 py-2 font-body text-sm text-primary-dark">
          {flash}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-4 max-lg:flex-col">
        <Button type="button" variant="ghost" size="sm" onClick={handleRecompute} loading={pending} className="max-lg:min-h-[44px] max-lg:w-full">
          Recalculer
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={openModal} className="max-lg:min-h-[44px] max-lg:w-full">
          Forcer un score manuel
        </Button>
      </div>

      {/* Modale d'override */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Forcer un score manuel">
        <p className="mb-4 font-body text-sm text-muted">
          Entrez une valeur entre 0 et 10. Elle remplacera le score automatique tant
          que vous ne reviendrez pas au score auto.
        </p>
        <input
          type="number"
          min="0"
          max="10"
          step="1"
          value={overrideValue}
          onChange={(e) => setOverrideValue(e.target.value)}
          className="w-full rounded-sm border border-border bg-white px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        {error && (
          <p className="mt-2 font-body text-xs text-red-700">{error}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmitOverride}
            loading={pending}
          >
            Forcer ce score
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setModalOpen(false)}
          >
            Annuler
          </Button>
        </div>
      </Modal>
    </div>
  )
}

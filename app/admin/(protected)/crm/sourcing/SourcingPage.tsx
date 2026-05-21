'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CATEGORIE_OPTIONS, CATEGORIES_EXPOSED_IN_ADMIN } from '@/lib/crm/constants'
import type { ProspectCategorie } from '@/types'
import {
  importSourcingBatchAction,
  type ImportFailure,
  runSourcingAction,
} from '@/lib/actions/sourcing'
import type { SourcingResult } from '@/lib/sourcing/run'
import SourcingResults from './SourcingResults'

interface Props {
  baseCoords: { lat: number; lng: number } | null
}

type ViewState =
  | { phase: 'form' }
  | { phase: 'loading'; longRun: boolean }
  | {
      phase: 'results'
      data: SourcingResult[]
      meta: SourcingMeta
      importPending: boolean
      importError: string | null
    }
  | { phase: 'error'; message: string }
  | {
      phase: 'imported'
      imported: number
      skipped: number
      failures: ImportFailure[]
    }

interface SourcingMeta {
  categories: ProspectCategorie[]
  radiusKm: number
  count: number
}

// Sourcing exclut `autre` (pas une catégorie cible Google) ET les ids non
// exposés dans l'admin (catégories V2 dont le preset n'est pas finalisé).
const SOURCEABLE = CATEGORIE_OPTIONS.filter(
  (o) => o.value !== 'autre' && CATEGORIES_EXPOSED_IN_ADMIN.has(o.value)
)

const fieldClass =
  'rounded-sm border border-border bg-white px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export default function SourcingPage({ baseCoords }: Props) {
  const router = useRouter()
  const [state, setState] = useState<ViewState>({ phase: 'form' })

  // Form state
  const [radiusKm, setRadiusKm] = useState(15)
  const [maxResults, setMaxResults] = useState(20)
  const [excludeAlreadyInCrm, setExcludeAlreadyInCrm] = useState(true)
  const [excludeClosed, setExcludeClosed] = useState(true)
  const [excludeChains, setExcludeChains] = useState(true)
  const [selectedCats, setSelectedCats] = useState<Set<ProspectCategorie>>(new Set())

  function toggleCategory(c: ProspectCategorie) {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCats.size === 0) {
      setState({ phase: 'error', message: 'Sélectionnez au moins une catégorie.' })
      return
    }
    if (!baseCoords) {
      setState({
        phase: 'error',
        message: 'Coordonnées du centre manquantes (SIGWEB_BASE_LATITUDE / LONGITUDE).',
      })
      return
    }

    const cats = [...selectedCats]
    const longRun = maxResults >= 30
    setState({ phase: 'loading', longRun })

    const r = await runSourcingAction({
      categories: cats,
      radiusKm,
      maxResults,
      excludeAlreadyInCrm,
      excludeClosed,
      excludeChains,
    })

    if (r.success) {
      setState({
        phase: 'results',
        data: r.data,
        meta: { categories: cats, radiusKm, count: r.data.length },
        importPending: false,
        importError: null,
      })
    } else {
      setState({ phase: 'error', message: r.error })
    }
  }

  async function handleImport(selectedPlaceIds: string[]) {
    if (state.phase !== 'results') return
    const items = state.data.filter((r) => selectedPlaceIds.includes(r.placeId))
    if (items.length === 0) return

    setState({ ...state, importPending: true, importError: null })
    const r = await importSourcingBatchAction(items)
    if (!r.success) {
      setState({ ...state, importPending: false, importError: r.error })
      return
    }
    setState({
      phase: 'imported',
      imported: r.imported,
      skipped: r.skipped,
      failures: r.failures,
    })
  }

  function backToForm() {
    setState({ phase: 'form' })
  }

  if (state.phase === 'loading') {
    return <SourcingLoader longRun={state.longRun} />
  }

  if (state.phase === 'results') {
    return (
      <SourcingResults
        data={state.data}
        meta={state.meta}
        onReset={backToForm}
        onImport={handleImport}
        importPending={state.importPending}
        importError={state.importError}
      />
    )
  }

  if (state.phase === 'imported') {
    return <ImportSuccess result={state} onReset={backToForm} />
  }

  // Form (avec ou sans erreur affichée en haut)
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.phase === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section 1 — Zone géographique */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Zone géographique</h2>

        <div className="mb-6">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Centre de recherche
          </p>
          <p className="mt-1 font-body text-sm text-ink">
            {baseCoords
              ? `Domicile (${baseCoords.lat.toFixed(4)}, ${baseCoords.lng.toFixed(4)})`
              : '⚠️ Coordonnées manquantes'}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="radius" className="font-body text-sm font-semibold text-ink">
              Rayon de recherche
            </label>
            <span className="font-heading text-lg font-bold text-primary">{radiusKm} km</span>
          </div>
          <input
            id="radius"
            type="range"
            min={1}
            max={50}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between font-body text-xs text-muted">
            <span>1 km — quartier</span>
            <span>15 km — agglo proche</span>
            <span>50 km — département</span>
          </div>
        </div>
      </section>

      {/* Section 2 — Catégories */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-bold text-ink">Catégories à cibler</h2>
          <span className="font-body text-xs text-muted">
            {selectedCats.size} sélectionnée{selectedCats.size > 1 ? 's' : ''}
            {selectedCats.size === 0 && ' — au moins une obligatoire'}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SOURCEABLE.map((opt) => {
            const checked = selectedCats.has(opt.value)
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 font-body text-sm transition-colors ${
                  checked
                    ? 'border-primary bg-primary-soft text-primary-dark'
                    : 'border-border bg-surface text-ink hover:border-primary/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(opt.value)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </section>

      {/* Section 3 — Filtres */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Filtres</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={excludeAlreadyInCrm}
              onChange={(e) => setExcludeAlreadyInCrm(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-body text-sm text-ink">
              Exclure les commerces déjà dans mon CRM
              <span className="block font-body text-xs text-muted">
                Évite de re-traiter des prospects existants.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={excludeClosed}
              onChange={(e) => setExcludeClosed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-body text-sm text-ink">
              Exclure les commerces fermés
              <span className="block font-body text-xs text-muted">
                Statut Google CLOSED_TEMPORARILY ou CLOSED_PERMANENTLY.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={excludeChains}
              onChange={(e) => setExcludeChains(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-body text-sm text-ink">
              Exclure les chaînes nationales
              <span className="block font-body text-xs text-muted">
                Carrefour, Marie Blachère, McDonald&apos;s, Saint Algue, etc. Recommandé pour
                rester sur des commerces indépendants.
              </span>
            </span>
          </label>
          <div>
            <label htmlFor="maxResults" className="mb-1 block font-body text-sm font-semibold text-ink">
              Limite de résultats
            </label>
            <input
              id="maxResults"
              type="number"
              min={1}
              max={50}
              step={1}
              value={maxResults}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setMaxResults(Number.isFinite(v) ? Math.min(Math.max(v, 1), 50) : 20)
              }}
              className={`${fieldClass} w-32`}
            />
            <p className="mt-1 font-body text-xs text-muted">Entre 1 et 50.</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={selectedCats.size === 0 || !baseCoords}
        >
          Lancer le sourcing
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.push('/admin/crm')}>
          Annuler
        </Button>
      </div>
    </form>
  )
}

// ── Loader ─────────────────────────────────────────────────────────────

const LOADER_STEPS = [
  'Recherche des commerces dans la zone…',
  'Enrichissement des fiches Google…',
  'Calcul des scores et filtrage…',
]

// ── Écran de succès après import batch ────────────────────────────────

function ImportSuccess({
  result,
  onReset,
}: {
  result: { imported: number; skipped: number; failures: ImportFailure[] }
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary-soft/40 p-6">
        <p className="font-heading text-2xl font-extrabold text-primary-dark">
          ✓ {result.imported} prospect{result.imported > 1 ? 's' : ''} importé{result.imported > 1 ? 's' : ''} dans votre CRM
        </p>
        {(result.skipped > 0 || result.failures.length > 0) && (
          <ul className="mt-3 space-y-1 font-body text-sm text-ink">
            {result.skipped > 0 && (
              <li>
                {result.skipped} ignoré{result.skipped > 1 ? 's' : ''} (déjà présents en BDD ou
                données invalides).
              </li>
            )}
            {result.failures.length > 0 && (
              <li>
                {result.failures.length} échec{result.failures.length > 1 ? 's' : ''} :
                <ul className="mt-1 list-disc pl-6 text-xs text-muted">
                  {result.failures.map((f, i) => (
                    <li key={i}>
                      {f.name} — {f.reason}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/crm?source=sourcing"
          className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Voir mes prospects
        </Link>
        <Button type="button" variant="ghost" size="md" onClick={onReset}>
          Nouvelle session de sourcing
        </Button>
      </div>
    </div>
  )
}

function SourcingLoader({ longRun }: { longRun: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % LOADER_STEPS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-md border border-border bg-surface p-12 text-center shadow-sm">
      <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="font-heading text-lg font-bold text-ink">Sourcing en cours…</p>
      <p className="mt-2 font-body text-sm text-muted">{LOADER_STEPS[step]}</p>
      {longRun && (
        <p className="mt-4 font-body text-xs text-accent">
          ⏱️ Recherche élargie : peut prendre jusqu&apos;à 15 secondes.
        </p>
      )}
    </div>
  )
}

